chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { isCollecting, collectedContent } = await chrome.storage.local.get(['isCollecting', 'collectedContent']);
    if (!isCollecting) {
      await chrome.storage.local.set({ isCollecting: false });
    }
    if (!collectedContent) {
      await chrome.storage.local.set({ collectedContent: '' });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "collect-content") {
    try {
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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  const { action, text } = message;
  if (action === "sendText" && text) {
    try {
      const { collectedContent } = await chrome.storage.local.get('collectedContent');
      let currentContent = collectedContent || '';

      // Append new content with separators and maybe the URL
      const { tab } = sender;
      const sourceUrl = tab?.url || 'Unknown page';
      const separator = `\n\n----- Content from ${sourceUrl} -----\n\n`;
      const newContent = currentContent + separator + text;

      await chrome.storage.local.set({ collectedContent: newContent });
      console.log("Appended content from:", sourceUrl);
      sendResponse({ status: "success" });

    } catch (error) {
      console.error("Error appending collected content:", error);
      sendResponse({ status: "error", message: error.message });
    }
    return true;
  }
});
