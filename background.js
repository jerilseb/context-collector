chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { isCollecting, collectedContent, isSingleCapture } = await chrome.storage.local.get([
      'isCollecting', 
      'collectedContent',
      'isSingleCapture'
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
