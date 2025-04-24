// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isCollecting', 'collectedContent'], (result) => {
    if (result.isCollecting === undefined) {
      chrome.storage.local.set({ isCollecting: false });
      console.log('Initialized isCollecting state to false.');
    }
    if (result.collectedContent === undefined) {
      chrome.storage.local.set({ collectedContent: '' });
      console.log('Initialized collectedContent to empty string.');
    }
  });
});

// Listen for the command (hotkey)
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "collect-content") {
    try {
      const data = await chrome.storage.local.get('isCollecting');
      if (data.isCollecting) {
        if (tab?.url && (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('https://chrome.google.com/webstore'))) {
          return;
        }

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
  if (message.action === "sendText" && message.text) {
    try {
      const data = await chrome.storage.local.get('collectedContent');
      let currentContent = data.collectedContent || '';

      // Append new content with separators and maybe the URL
      const sourceUrl = sender.tab?.url || 'Unknown page';
      const separator = `\n\n----- Content from ${sourceUrl} -----\n\n`;
      const newContent = currentContent + separator + message.text;

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