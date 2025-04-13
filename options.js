document.addEventListener('DOMContentLoaded', () => {
    const hotkeyInput = document.getElementById('hotkey');
    const clearHotkeyButton = document.getElementById('clearHotkey');
    const statusMessage = document.getElementById('status');
    const versionSpan = document.getElementById('version');

    // Display extension version
    versionSpan.textContent = chrome.runtime.getManifest().version;

    // Load saved hotkey
    chrome.storage.sync.get(['hotkey'], (result) => {
        if (result.hotkey) {
            hotkeyInput.value = result.hotkey;
        }
    });

    // Handle hotkey input
    hotkeyInput.addEventListener('click', () => {
        hotkeyInput.value = '';
        hotkeyInput.focus();
    });

    hotkeyInput.addEventListener('keydown', (e) => {
        e.preventDefault();

        // Ignore if only modifier keys are pressed
        if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
            return;
        }

        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.metaKey) modifiers.push('Meta');

        // Get the main key
        let key = e.key.toUpperCase();
        
        // Handle special keys
        if (key === ' ') key = 'Space';
        if (key === 'ESCAPE') key = 'Esc';
        if (key === 'ARROWUP') key = '↑';
        if (key === 'ARROWDOWN') key = '↓';
        if (key === 'ARROWLEFT') key = '←';
        if (key === 'ARROWRIGHT') key = '→';

        // Create hotkey string
        const hotkey = [...modifiers, key].join('+');
        hotkeyInput.value = hotkey;

        // Save hotkey
        chrome.storage.sync.set({ hotkey }, () => {
            showStatus('Hotkey saved successfully!', 'success');
        });
    });

    // Handle clear hotkey button
    clearHotkeyButton.addEventListener('click', () => {
        hotkeyInput.value = '';
        chrome.storage.sync.remove(['hotkey'], () => {
            showStatus('Hotkey cleared successfully!', 'success');
        });
    });

    // Helper function to show status messages
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 3000);
    }
}); 