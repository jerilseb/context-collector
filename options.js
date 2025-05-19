document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status');
    const versionSpan = document.getElementById('version');

    // Display extension version
    versionSpan.textContent = chrome.runtime.getManifest().version;

    // Helper function to show status messages (kept for potential future use)
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 3000);
    }
});