// Function to start selection mode
async function startSelection() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (!currentTab) {
            console.error("Could not get current tab.");
            return;
        }
        if (!currentTab.id) {
            console.error("Current tab has no ID.");
            return;
        }

        // Check if the URL is allowed
        if (currentTab.url && (currentTab.url.startsWith('chrome://') || 
            currentTab.url.startsWith('edge://') || 
            currentTab.url.startsWith('https://chrome.google.com/webstore'))) {
            console.log('Extension cannot run on this page.');
            const status = document.createElement('p');
            status.textContent = 'Cannot run on this page.';
            status.style.color = 'red';
            status.style.fontSize = '12px';
            document.body.appendChild(status);
            document.getElementById('startSelection').disabled = true;
            return;
        }

        // Inject the content script
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        });
        
        console.log("Content script injected successfully.");
        window.close(); // Close the popup after injecting
        
    } catch (err) {
        console.error("Failed to inject content script:", err);
        // Display error in popup
        const status = document.createElement('p');
        status.textContent = 'Injection failed. Reload page?';
        status.style.color = 'red';
        status.style.fontSize = '12px';
        document.body.appendChild(status);
    }
}

// Add click event listener to the start selection button
document.getElementById('startSelection').addEventListener('click', startSelection);

// Add click event listener to the options link
document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});