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
  console.log(`Command received: ${command}`);
  if (command === "collect-content") {
    try {
      const data = await chrome.storage.local.get('isCollecting');
      if (data.isCollecting) {
        console.log("Collecting is active, proceeding to inject content script.");

        // Check if the URL is allowed before injecting
        if (tab?.url && (tab.url.startsWith('chrome://') ||
                         tab.url.startsWith('edge://') ||
                         tab.url.startsWith('https://chrome.google.com/webstore'))) {
          console.log('Cannot inject script on this page:', tab.url);
          return; // Stop execution for this tab
        }

        // Inject the content script into the active tab
        if (tab?.id) {
             console.log(`Injecting content script into tab ${tab.id}`);
             await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
             });
             console.log("Content script injected successfully.");
        } else {
             console.error("Could not get active tab ID for injection.");
        }
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
      const separator = `\n\n--- Content from ${sourceUrl} ---\n\n`;
      const newContent = currentContent + separator + message.text;

      await chrome.storage.local.set({ collectedContent: newContent });
      console.log("Appended content from:", sourceUrl);

      console.log("[background.js] Attempting to send 'success' response...");
      sendResponse({ status: "success" });

    } catch (error) {
      console.error("Error appending collected content:", error);
      console.log("[background.js] Attempting to send 'error' response...");
      sendResponse({ status: "error", message: error.message });
    }
    return true; // Indicates that the response is sent asynchronously
  } else if (message.action === "sendText" && !message.text) {
      console.warn("Received 'sendText' action but no text was provided.");
      console.log("[background.js] Attempting to send 'warning' response...");
      sendResponse({ status: "warning", message: "No text content received." });
       return true; // Async for consistency
  }
  // Handle other messages if needed
  console.log("[background.js] Message did not match expected structure, no response sent.")
  // Returning false or undefined implicitly closes the port if no response sent synchronously
});

// Optional: Add listener for storage changes to debug
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
}); 