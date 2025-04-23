// Get references to the buttons and add a status element
const startButton = document.getElementById('startCollecting'); // Assuming new ID
const stopButton = document.getElementById('stopCollecting');   // Assuming new ID
const optionsButton = document.getElementById('openOptions');
const statusDiv = document.createElement('div');
statusDiv.className = 'status-message'; // Add a class for styling
document.body.appendChild(statusDiv);

// Function to update the UI based on collecting state
function updateUI(isCollecting) {
    if (isCollecting) {
        // When collecting, hide Start button, show Stop button
        startButton.style.display = 'none';       // Hide start button
        stopButton.style.display = 'inline-block'; // Show stop button
        stopButton.disabled = false;            // Ensure stop is enabled (might be disabled on restricted page load initially)
        statusDiv.textContent = ''; // Clear status on state change
    } else {
        // When not collecting, show Start button, hide Stop button
        startButton.style.display = 'inline-block'; // Show start button
        startButton.disabled = false;              // Ensure start is enabled (unless on restricted page)
        stopButton.style.display = 'none';        // Hide stop button
        // statusDiv content is handled by start/stop functions
    }
}

// Function to handle starting the collection
async function startCollecting() {
    try {
        // Check for restricted pages (like before)
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (currentTab?.url && (currentTab.url.startsWith('chrome://') ||
                                 currentTab.url.startsWith('edge://') ||
                                 currentTab.url.startsWith('https://chrome.google.com/webstore'))) {
            statusDiv.textContent = 'Cannot start collecting on this page.';
            startButton.disabled = true;
            return;
        }

        // Set collecting state and clear previous content
        await chrome.storage.local.set({ isCollecting: true, collectedContent: '' });
        console.log("Collection started.");
        updateUI(true);
        // Close popup automatically after starting? Optional.
        // window.close();
        statusDiv.textContent = 'Collecting started. Use the hotkey to add pages.';

    } catch (error) {
        console.error("Error starting collection:", error);
        statusDiv.textContent = 'Error starting collection.';
    }
}

// Function to handle stopping the collection and copying to clipboard
async function stopCollecting() {
    try {
        const data = await chrome.storage.local.get('collectedContent');
        const collectedText = data.collectedContent || '';

        if (collectedText) {
            await navigator.clipboard.writeText(collectedText);
            console.log("Collected content copied to clipboard.");
            statusDiv.textContent = 'Content copied to clipboard!';
        } else {
            console.log("No content collected.");
            statusDiv.textContent = 'No content was collected.';
        }

        // Clear collecting state and content
        await chrome.storage.local.set({ isCollecting: false, collectedContent: '' });
        console.log("Collection stopped.");
        updateUI(false);

    } catch (error) {
        console.error("Error stopping collection or copying:", error);
        statusDiv.textContent = 'Error stopping or copying.';
        // Attempt to clear state even if copy failed
        try {
            await chrome.storage.local.set({ isCollecting: false, collectedContent: '' });
            updateUI(false);
        } catch (clearError) {
            console.error("Error clearing state after failed stop:", clearError);
        }
    }
}

// --- Initialization ---

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
         if (currentTab?.url && (currentTab.url.startsWith('chrome://') ||
                                 currentTab.url.startsWith('edge://') ||
                                 currentTab.url.startsWith('https://chrome.google.com/webstore'))) {
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