const singleBtn = document.getElementById('singleCapture');
const startBtn = document.getElementById('startCollecting');
const stopBtn = document.getElementById('stopCollecting');
const optionsBtn = document.getElementById('openOptions');
const textStatus = document.getElementById('text-status');
const processingStatus = document.getElementById('processing-status');
const processingMessageText = document.getElementById('processing-message-text');

function isRestrictedPage(tab) {
    const restricted = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
    return restricted.some(protocol => tab?.url?.startsWith(protocol));
}

function updateStatus(message = '', showSpinner = false) {
    if (showSpinner) {
        processingMessageText.textContent = message;
        textStatus.style.display = 'none';
        processingStatus.style.display = 'flex';
    } else {
        textStatus.textContent = message;
        textStatus.style.display = 'block';
        processingStatus.style.display = 'none';
    }
}

function updateUI(isCollecting, isProcessing) {
    startBtn.style.display = isCollecting ? 'none' : 'block';
    stopBtn.style.display = isCollecting ? 'block' : 'none';
    
    if (isProcessing) {
        singleBtn.disabled = true;
        startBtn.disabled = true;
        stopBtn.disabled = true;
    } else if (isCollecting) {
        singleBtn.disabled = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        singleBtn.disabled = false;
        startBtn.disabled = false;
        stopBtn.disabled = false;
    }
}

async function startCollecting() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (isRestrictedPage(tab)) {
        updateStatus('Cannot run on this page');
        return;
    }
    
    await chrome.storage.local.set({ isCollecting: true, collectedContent: '' });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['notification.js'] });
    window.close();
}

async function singleCapture() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (isRestrictedPage(tab)) {
        updateStatus('Cannot run on this page');
        return;
    }
    
    await chrome.storage.local.set({ isSingleCapture: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    window.close();
}

async function stopCollecting() {
    const { collectedContent } = await chrome.storage.local.get('collectedContent');
    
    if (collectedContent) {
        await navigator.clipboard.writeText(collectedContent);
        updateStatus('Copied to clipboard!');
    } else {
        updateStatus('No content collected');
    }
    
    await chrome.storage.local.set({ isCollecting: false, collectedContent: '' });
    updateUI(false, false);
}

// Event listeners
singleBtn.addEventListener('click', singleCapture);
startBtn.addEventListener('click', startCollecting);
stopBtn.addEventListener('click', stopCollecting);
optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    const { isCollecting, isProcessing, itemsRemaining } = await chrome.storage.local.get(['isCollecting', 'isProcessing', 'itemsRemaining']);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (isRestrictedPage(tab)) {
        updateStatus('Cannot run on this page');
        singleBtn.disabled = startBtn.disabled = true;
        return;
    }
    
    updateUI(isCollecting ?? false, isProcessing ?? false);
    
    if (isProcessing) {
        updateStatus(`Processing items (${itemsRemaining} remaining)`, true);

        // Listen for processing state changes only when processing is active
        chrome.storage.onChanged.addListener(async (changes) => {
            const { isCollecting: currentIsCollecting, itemsRemaining: currentItemsRemaining } = await chrome.storage.local.get(['isCollecting', 'itemsRemaining']);

            if (changes.isProcessing) {
                const newIsProcessing = changes.isProcessing.newValue ?? false;
                updateUI(currentIsCollecting ?? false, newIsProcessing);

                if (newIsProcessing) {
                    updateStatus(`Processing items (${currentItemsRemaining} remaining)`, true);
                } else {
                    updateStatus(); // Clear status or set to default
                }
            } else if (changes.itemsRemaining) {
                 const newItemsRemaining = changes.itemsRemaining.newValue;
                 // Ensure isProcessing is still true before updating the message
                 const { isProcessing: currentIsProcessing } = await chrome.storage.local.get('isProcessing');
                 if (currentIsProcessing) {
                    updateStatus(`Processing items (${newItemsRemaining} remaining)`, true);
                 }
            }
        });
    }
});
