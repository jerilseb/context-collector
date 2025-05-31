const PROMPT = "You are a helpful assistant that cleans and improves markdown contet that is scraped from web pages.  Clean up any formatting issues, fix broken markdown syntax, remove non-meaning full content, and improve readability while preserving all the original information and meaning. Return only the cleaned markdown without any additional commentary"
const MAX_PARALLEL_REQUESTS = 5;

let contentQueue = [];
let isQueueManagerActive = false;

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Helper function to process a single markdown item
async function handleSingleItemProcessing(markdown, enableLLMProcessing, openaiApiKey, model) {
  let finalContent = markdown;
  if (enableLLMProcessing && openaiApiKey && markdown.trim()) {
    console.log("Processing item with OpenAI...");
    try {
      finalContent = await processWithOpenAI(markdown, openaiApiKey, model || 'gpt-4o-mini');
    } catch (error) {
      console.error('OpenAI processing failed, using original content:', error);
    }
  }
  return finalContent;
}

function isRestrictedPage(tab) {
  if (!tab?.url) {
    return false;
  }
  const restrictedProtocols = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
  return restrictedProtocols.some(protocol => tab.url.startsWith(protocol));
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.local.set({
      isCollecting: false,
      collectedContent: '',
      isSingleCapture: false,
      itemsRemaining: 0,
      enableLLMProcessing: false,
      isProcessing: false
    });
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "collect-content") {
    try {
      if (isRestrictedPage(tab)) {
        console.log("Cannot collect content on this page.");
        return;
      }
      const { isCollecting } = await chrome.storage.local.get('isCollecting');
      if (isCollecting) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log("Content script injected successfully.");
      } else {
        console.log("Collecting is not active. Hotkey press ignored.");
      }
    } catch (error) {
      console.error("Error handling command:", error);
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'COLLECTED_CONTENT') {
    try {
      const { markdown } = message;
      contentQueue.push(markdown);
      const { itemsRemaining } = await chrome.storage.local.get(['itemsRemaining']);
      await chrome.storage.local.set({ itemsRemaining: itemsRemaining + 1 });
      processContentQueue(); // Trigger queue processing
    } catch (error) {
      console.error("Error handling collected content message:", error);
    }
  }
});

async function processContentQueue() {
  if (isQueueManagerActive || contentQueue.length === 0) {
    return;
  }

  isQueueManagerActive = true;
  await chrome.storage.local.set({ isProcessing: true });
  console.log(`Queue manager started. Initial queue size: ${contentQueue.length}`);

  const { enableLLMProcessing, openaiApiKey, openaiModel } = await chrome.storage.local.get([
    'enableLLMProcessing',
    'openaiApiKey',
    'openaiModel'
  ]);

  while (contentQueue.length > 0) {
    await chrome.storage.local.set({ itemsRemaining: contentQueue.length });
    const batchToProcess = contentQueue.splice(0, MAX_PARALLEL_REQUESTS);
    console.log(`Processing a batch of ${batchToProcess.length} items.`);

    const processingPromises = batchToProcess.map(markdown =>
      handleSingleItemProcessing(markdown, enableLLMProcessing, openaiApiKey, openaiModel)
    );

    try {
      const processedContents = await Promise.all(processingPromises);
      console.log(`Batch of ${processedContents.length} items processed by LLM (if enabled).`);

      for (const finalContent of processedContents) {
        await appendToStorage(finalContent);
      }
      console.log(`Batch of ${processedContents.length} items appended to storage in order.`);
    } catch (error) {
      // This catch is for errors from Promise.all itself, though handleSingleItemProcessing should catch its own errors.
      console.error("Error processing a batch with Promise.all:", error);
      // Decide on error handling: e.g., retry, skip batch, or halt.
      // For now, we'll log and continue to the next batch if possible,
      // but individual item errors are handled within handleSingleItemProcessing.
    }
  }

  await chrome.storage.local.set({ isProcessing: false, itemsRemaining: 0 });
  isQueueManagerActive = false;
  console.log("All items processed. Queue manager stopped. isProcessing set to false.");
}

async function processWithOpenAI(markdown, apiKey, model) {
  if (!apiKey || !markdown.trim()) {
    return markdown;
  }

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        role: 'system',
        content: PROMPT
      }, {
        role: 'user',
        content: markdown
      }],
    })
  }, 10_000);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const processedContent = data.choices?.[0]?.message?.content;

  if (!processedContent) {
    throw new Error('No content received from OpenAI API');
  }

  return processedContent.trim();
}

async function appendToStorage(newText) {
  try {
    const { collectedContent } = await chrome.storage.local.get('collectedContent');
    let currentContent = collectedContent || '';
    let separator = '';
    if (currentContent) {
      separator = `\n\n-----------------\n\n`;
    }
    const updatedContent = currentContent + separator + newText;
    await chrome.storage.local.set({ collectedContent: updatedContent });
  } catch (error) {
    console.error('Failed to add content to storage:', error);
  }
}
