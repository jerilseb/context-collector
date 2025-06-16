import { processWithOpenAI, processWithGemini, isRestrictedPage } from "./util.js";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that cleans and improves markdown content that is scraped from web pages.  Clean up any formatting issues, fix broken markdown syntax, remove non-meaning full content, and improve readability while preserving all the original information and meaning. Return only the cleaned markdown without any additional commentary";
const DEFAULT_FETCH_TIMEOUT_SECS = 120;
const DEFAULT_MAX_PARALLEL_REQUESTS = 4;

let contentQueue = [];
let isQueueManagerActive = false;

// Helper function to process a single markdown item
async function handleSingleItemProcessing(markdown, aiProcessingEnabled, selectedAiProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt) {
  let finalContent = markdown;
  if (aiProcessingEnabled && markdown.trim()) {
    try {
      if (selectedAiProvider === 'openai' && openaiApiKey) {
        console.log("Processing item with OpenAI...");
        finalContent = await processWithOpenAI(markdown, openaiApiKey, openaiModel, fetchTimeout, systemPrompt);
      } else if (selectedAiProvider === 'gemini' && geminiApiKey) {
        console.log("Processing item with Gemini...");
        finalContent = await processWithGemini(markdown, geminiApiKey, geminiModel, fetchTimeout, systemPrompt);
      }
    } catch (error) {
      console.error(`AI processing failed for provider '${selectedAiProvider}', using original content:`, error);
    }
  }
  return finalContent;
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.local.set({
      isCollecting: false,
      collectedContent: '',
      isSingleCapture: false,
      itemsRemaining: 0,
      aiProcessingEnabled: false,
      selectedAiProvider: 'openai',
      openaiApiKey: '',
      openaiModel: 'gpt-4o-mini',
      geminiApiKey: '',
      geminiModel: 'gemini-2.0-flash',
      isProcessing: false,
      fetchTimeout: DEFAULT_FETCH_TIMEOUT_SECS,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      maxParallelRequests: DEFAULT_MAX_PARALLEL_REQUESTS
    });
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "collect-content") {
    try {
      if (isRestrictedPage(tab)) {
        console.log("Cannot collect content on this page");
        return;
      }
      const { isCollecting } = await chrome.storage.local.get('isCollecting');
      if (isCollecting) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log("Content script injected successfully");
      } else {
        console.log("Collecting is not active. Hotkey press ignored");
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

  const {
    aiProcessingEnabled,
    selectedAiProvider,
    openaiApiKey,
    openaiModel,
    geminiApiKey,
    geminiModel,
    fetchTimeout,
    systemPrompt,
    maxParallelRequests
  } = await chrome.storage.local.get([
    'aiProcessingEnabled',
    'selectedAiProvider',
    'openaiApiKey',
    'openaiModel',
    'geminiApiKey',
    'geminiModel',
    'fetchTimeout',
    'systemPrompt',
    'maxParallelRequests'
  ]);

  while (contentQueue.length > 0) {
    await chrome.storage.local.set({ itemsRemaining: contentQueue.length });
    const batchToProcess = contentQueue.splice(0, maxParallelRequests);
    console.log(`Processing a batch of ${batchToProcess.length} items`);

    const processingPromises = batchToProcess.map(markdown =>
      handleSingleItemProcessing(markdown, aiProcessingEnabled, selectedAiProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt)
    );

    try {
      const processedContents = await Promise.all(processingPromises);
      console.log(`Batch of ${processedContents.length} items processed by AI`);

      for (const finalContent of processedContents) {
        await appendToStorage(finalContent);
      }
      console.log(`Batch of ${processedContents.length} items appended to storage`);
    } catch (error) {
      // This catch is for errors from Promise.all itself, though handleSingleItemProcessing should catch its own errors.
      console.error("Error processing a batch:", error);
      // Decide on error handling: e.g., retry, skip batch, or halt.
      // For now, we'll log and continue to the next batch if possible,
      // but individual item errors are handled within handleSingleItemProcessing.
    }
  }

  await chrome.storage.local.set({ isProcessing: false, itemsRemaining: 0 });
  isQueueManagerActive = false;
  console.log("All items processed. Queue manager stopped. isProcessing set to false.");
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
