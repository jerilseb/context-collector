const singleBtn = document.getElementById('singleCapture');
const startBtn = document.getElementById('startCollecting');
const stopBtn = document.getElementById('stopCollecting');
const optionsBtn = document.getElementById('openOptions');
const textStatus = document.getElementById('text-status');
const processingStatus = document.getElementById('processing-status');
const processedCountEl = document.getElementById('processed-count');
const processingCountEl = document.getElementById('processing-count');
const queuedCountEl = document.getElementById('queued-count');
const processingSpinner = document.getElementById('processing-spinner');
const processingTitle = document.getElementById('processing-title');

function isRestrictedPage(tab) {
    const restricted = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
    return restricted.some(protocol => tab?.url?.startsWith(protocol));
}

function updateStatus(message = '', showProcessingDetails = false, processed = 0, processing = 0, queued = 0, isActive = true) {
    if (showProcessingDetails) {
        processedCountEl.textContent = processed;
        processingCountEl.textContent = processing;
        queuedCountEl.textContent = queued;

        // Show/hide spinner and update title based on active state
        if (isActive) {
            processingSpinner.style.display = 'block';
            processingTitle.textContent = 'Processing';
        } else {
            processingSpinner.style.display = 'none';
            processingTitle.textContent = 'Completed';
        }

        textStatus.style.display = 'none';
        processingStatus.style.display = 'block';
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

    // Reset processed count when starting a new collection session
    await chrome.storage.local.set({
        isCollecting: true,
        collectedContent: '',
        processedCount: 0
    });

    // Notify background script to reset its counter
    chrome.runtime.sendMessage({ type: 'RESET_PROCESSED_COUNT' });
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
    const { isCollecting, isProcessing, processedCount, processingCount, itemsRemaining } = await chrome.storage.local.get(['isCollecting', 'isProcessing', 'processedCount', 'processingCount', 'itemsRemaining']);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (isRestrictedPage(tab)) {
        updateStatus('Cannot run on this page');
        singleBtn.disabled = startBtn.disabled = true;
        return;
    }

    updateUI(isCollecting ?? false, isProcessing ?? false);

    // Show processing details if currently processing OR if we have completed items to display
    if (isProcessing || processedCount > 0) {
        updateStatus('', true, processedCount ?? 0, processingCount ?? 0, itemsRemaining ?? 0, isProcessing ?? false);
    }

    // Listen for processing state changes
    chrome.storage.onChanged.addListener(async (changes) => {
        const {
            isCollecting: currentIsCollecting,
            processedCount: currentProcessed,
            processingCount: currentProcessing,
            itemsRemaining: currentQueued,
            isProcessing: currentIsProcessing
        } = await chrome.storage.local.get(['isCollecting', 'processedCount', 'processingCount', 'itemsRemaining', 'isProcessing']);

        if (changes.isProcessing || changes.processedCount || changes.processingCount || changes.itemsRemaining) {
            updateUI(currentIsCollecting ?? false, currentIsProcessing ?? false);

            // Show processing details if currently processing OR if we have completed items
            if (currentIsProcessing || currentProcessed > 0) {
                updateStatus('', true, currentProcessed ?? 0, currentProcessing ?? 0, currentQueued ?? 0, currentIsProcessing ?? false);
            }
        }
    });
});
