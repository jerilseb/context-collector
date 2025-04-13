// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'start-selection') {
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                console.error("Could not get current tab.");
                return;
            }

            // Check if the URL is allowed
            if (tab.url && (tab.url.startsWith('chrome://') || 
                tab.url.startsWith('edge://') || 
                tab.url.startsWith('https://chrome.google.com/webstore'))) {
                console.log('Extension cannot run on this page.');
                return;
            }

            // Inject the content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            
            console.log("Content script injected successfully via hotkey");
            
        } catch (err) {
            console.error("Failed to inject content script via hotkey:", err);
        }
    }
}); 