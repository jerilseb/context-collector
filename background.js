const PROMPT = "You are a helpful assistant that cleans and improves markdown contet that is scraped from web pages.  Clean up any formatting issues, fix broken markdown syntax, remove non-meaning full content, and improve readability while preserving all the original information and meaning. Return only the cleaned markdown without any additional commentary"

function isRestrictedPage(tab) {
  if (!tab?.url) {
    return false;
  }
  const restrictedProtocols = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
  return restrictedProtocols.some(protocol => tab.url.startsWith(protocol));
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { isCollecting, collectedContent, isSingleCapture, enableLLMProcessing } = await chrome.storage.local.get([
      'isCollecting',
      'collectedContent',
      'isSingleCapture',
      'enableLLMProcessing'
    ]);

    if (!isCollecting) {
      await chrome.storage.local.set({ isCollecting: false });
    }
    if (!collectedContent) {
      await chrome.storage.local.set({ collectedContent: '' });
    }
    if (isSingleCapture === undefined) {
      await chrome.storage.local.set({ isSingleCapture: false });
    }
    if (enableLLMProcessing === undefined) {
      await chrome.storage.local.set({ enableLLMProcessing: false });
    }
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
      const { enableLLMProcessing, openaiApiKey, openaiModel } = await chrome.storage.local.get([
        'enableLLMProcessing',
        'openaiApiKey',
        'openaiModel'
      ]);

      let finalContent = markdown;

      if (enableLLMProcessing && openaiApiKey) {
        try {
          await chrome.storage.local.set({ isProcessing: true });
          finalContent = await processWithOpenAI(markdown, openaiApiKey, openaiModel || 'gpt-4o-mini');
        } catch (error) {
          console.error('OpenAI processing failed, using original content:', error);
          finalContent = markdown;
        } finally {
          await chrome.storage.local.set({ isProcessing: false });
        }
      }

      await appendToStorage(finalContent);
    } catch (error) {
      console.error("Error handling collected content:", error);
    }
  }
});

async function processWithOpenAI(markdown, apiKey, model) {
  if (!apiKey || !markdown.trim()) {
    return markdown;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      temperature: 0.3,
      max_tokens: 4000
    })
  });

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
