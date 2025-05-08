const startButton = document.getElementById('startCollecting');
const stopButton = document.getElementById('stopCollecting');
const optionsButton = document.getElementById('openOptions');
const statusDiv = document.createElement('div');
statusDiv.className = 'status-message';
document.body.appendChild(statusDiv);

function isRestrictedPage(tab) {
    if (!tab?.url) {
        return false;
    }
    const restrictedProtocols = ['chrome://', 'edge://', 'brave://'];
    const webstoreUrl = 'https://chrome.google.com/webstore';

    return restrictedProtocols.some(protocol => tab.url.startsWith(protocol)) || tab.url.startsWith(webstoreUrl);
}

function updateUI(isCollecting) {
    if (isCollecting) {
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
        stopButton.disabled = false;
        statusDiv.textContent = '';
    } else {
        startButton.style.display = 'inline-block';
        startButton.disabled = false;
        stopButton.style.display = 'none';
    }
}

async function startCollecting() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (isRestrictedPage(currentTab)) {
            statusDiv.textContent = 'Cannot start collecting on this page.';
            startButton.disabled = true;
            return;
        }

        await chrome.storage.local.set({ isCollecting: true, collectedContent: '' });
        updateUI(true);
        window.close();
        statusDiv.textContent = 'Collecting started. Use the hotkey to add pages.';

    } catch (error) {
        statusDiv.textContent = 'Error starting collection.';
    }
}

async function stopCollecting() {
    try {
        const data = await chrome.storage.local.get('collectedContent');
        const collectedText = data.collectedContent || '';

        if (collectedText) {
            await navigator.clipboard.writeText(collectedText);
            statusDiv.textContent = 'Content copied to clipboard!';
        } else {
            statusDiv.textContent = 'No content was collected.';
        }
    } catch (error) {
        statusDiv.textContent = 'Error stopping or copying.';
    } finally {
        await chrome.storage.local.set({ isCollecting: false, collectedContent: '' });
        updateUI(false);
    }
}

// Add click event listeners
startButton.addEventListener('click', startCollecting);
stopButton.addEventListener('click', stopCollecting);
optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Check initial state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await chrome.storage.local.get('isCollecting');
        updateUI(data.isCollecting || false);

        // Also disable start button on restricted pages on load
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (isRestrictedPage(currentTab)) {
            statusDiv.textContent = 'Cannot run on this page.';
            startButton.disabled = true;
            stopButton.style.display = 'none'; // Ensure stop is hidden too
        }

    } catch (error) {
        console.error("Error initializing popup state:", error);
        statusDiv.textContent = 'Error loading status.';
        updateUI(false); // Default to non-collecting UI on error
    }
});