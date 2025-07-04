const singleCaptureButton = document.getElementById('singleCapture');
const startButton = document.getElementById('startCollecting');
const stopButton = document.getElementById('stopCollecting');
const optionsButton = document.getElementById('openOptions');
const contentDiv = document.querySelector('.content');
const statusDiv = document.createElement('div');
statusDiv.className = 'status-message';
contentDiv.appendChild(statusDiv);

function showToast(message, duration) {
    const toast = document.createElement('div');
    toast.id = "context-collector-toast";
    toast.textContent = message;

    toast.style.position = 'fixed';
    toast.style.fontSize = '14px';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(13, 119, 151)';
    toast.style.color = 'white';
    toast.style.padding = '15px 30px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '99999';
    toast.style.opacity = '1';
    toast.style.transition = 'opacity 0.5s ease-out';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, duration);
}

function isRestrictedPage(tab) {
    if (!tab?.url) {
        return false;
    }
    const restrictedProtocols = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
    return restrictedProtocols.some(protocol => tab.url.startsWith(protocol));
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
            singleCaptureButton.disabled = true; // Also disable single capture button
            return;
        }

        await chrome.storage.local.set({ isCollecting: true, collectedContent: '' });
        // updateUI(true);

        const commands = await chrome.commands.getAll();
        const command = commands.find(c => c.name === "collect-content");

        await chrome.scripting.executeScript({
            func: showToast,
            args: [`Collection Started, use ${command.shortcut} to add content`, 5000],
            target: { tabId: currentTab.id },
        });

        window.close();
        // statusDiv.textContent = 'Collection started. Use the hotkey to add content';

    } catch (error) {
        statusDiv.textContent = 'Error starting collection.';
    }
}

async function singleCapture() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (isRestrictedPage(currentTab)) {
            statusDiv.textContent = 'Cannot capture on this page.';
            singleCaptureButton.disabled = true;
            startButton.disabled = true; // Also disable start collecting button
            return;
        }

        // Set a flag to indicate single capture mode
        await chrome.storage.local.set({ isSingleCapture: true });

        // Inject the content script immediately
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        });

        // Close the popup
        window.close();
    } catch (error) {
        statusDiv.textContent = 'Error starting capture.';
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
singleCaptureButton.addEventListener('click', singleCapture);
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
            singleCaptureButton.disabled = true; // Also disable single capture button
            stopButton.style.display = 'none'; // Ensure stop is hidden too
        }

    } catch (error) {
        console.error("Error initializing popup state:", error);
        statusDiv.textContent = 'Error loading status.';
        updateUI(false); // Default to non-collecting UI on error
    }
});
