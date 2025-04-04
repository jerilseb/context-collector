chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabTitle') {
    // Get the tab title
    chrome.tabs.get(sender.tab.id, (tab) => {
      const tabTitle = tab.title || 'content'; // Fallback to 'content' if title is unavailable
      sendResponse({ tabTitle: tabTitle });
    });
    return true; // Required for asynchronous sendResponse
  }

  if (request.action === 'downloadMarkdown') {
    // Download the file using the provided Blob URL and filename
    chrome.downloads.download({
      url: request.url,
      filename: request.filename
    });
  }
});