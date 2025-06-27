import { callAIProvider, isRestrictedPage } from "./util.js";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that cleans and improves markdown content that is scraped from web pages.  Clean up any formatting issues, fix broken markdown syntax, remove non-meaning full content, and improve readability while preserving all the original information and meaning. Return only the cleaned markdown without any additional commentary";
const DEFAULT_FETCH_TIMEOUT_SECS = 120;
const DEFAULT_MAX_PARALLEL_REQUESTS = 4;

let contentQueue = [];
let isQueueManagerActive = false;
let activeProcessingCount = 0;
let processedCount = 0;

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.local.set({
      isCollecting: false,
      collectedContent: '',
      isSingleCapture: false,
      itemsRemaining: 0,
      processedCount: 0,
      processingCount: 0,
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
      await chrome.storage.local.set({
        itemsRemaining: contentQueue.length,
        processingCount: activeProcessingCount
      });
      processContentQueue(); // Trigger queue processing
    } catch (error) {
      console.error("Error handling collected content message:", error);
    }
  } else if (message.type === 'RESET_PROCESSED_COUNT') {
    processedCount = 0;
    console.log("Processed count reset for new collection session");
  }
});

chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked on tab:", tab);
});


async function processContentQueue() {
  if (contentQueue.length === 0) {
    return;
  }

  if (!isQueueManagerActive) {
    isQueueManagerActive = true;
    await chrome.storage.local.set({ isProcessing: true });
    console.log(`Queue manager started. Initial queue size: ${contentQueue.length}`);
  }

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

  // Process items immediately if under the parallel limit
  while (contentQueue.length > 0 && activeProcessingCount < maxParallelRequests) {
    const markdown = contentQueue.shift();
    activeProcessingCount++;

    await chrome.storage.local.set({
      itemsRemaining: contentQueue.length,
      processingCount: activeProcessingCount
    });
    console.log(`Processing item (${activeProcessingCount}/${maxParallelRequests} active)`);

    // Process item without blocking the queue
    processItemAsync(markdown, aiProcessingEnabled, selectedAiProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt);
  }
}

async function processItemAsync(markdown, aiProcessingEnabled, selectedAiProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt) {
  try {
    let finalContent = markdown;
    if (aiProcessingEnabled && markdown.trim()) {
      finalContent = await callAIProvider(markdown, selectedAiProvider, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt);
    }
    await appendToStorage(finalContent);
    processedCount++;
    console.log(`Item processed and appended to storage`);
  } catch (error) {
    console.error("Error processing item:", error);
  } finally {
    activeProcessingCount--;

    // Update storage with current counts
    await chrome.storage.local.set({
      processedCount: processedCount,
      processingCount: activeProcessingCount,
      itemsRemaining: contentQueue.length
    });

    // Check if more items can be processed
    if (contentQueue.length > 0) {
      processContentQueue();
    } else if (activeProcessingCount === 0) {
      // All processing complete - preserve final stats
      await chrome.storage.local.set({
        isProcessing: false,
        itemsRemaining: 0,
        processingCount: 0
        // Keep processedCount intact to show final results
      });
      isQueueManagerActive = false;
      console.log(`All items processed. Queue manager stopped. Final count: ${processedCount} items processed.`);
    }
  }
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
