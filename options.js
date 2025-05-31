document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('enableLLMProcessing');
    const aiSettings = document.getElementById('aiSettings');
    const apiKey = document.getElementById('apiKey');
    const model = document.getElementById('modelSelect');
    const saveBtn = document.getElementById('saveSettings');
    const status = document.getElementById('status');
    const version = document.getElementById('version');

    version.textContent = chrome.runtime.getManifest().version;

    // Load settings
    chrome.storage.local.get(['enableLLMProcessing', 'openaiApiKey', 'openaiModel'], (result) => {
        checkbox.checked = result.enableLLMProcessing === true;
        apiKey.value = result.openaiApiKey || '';
        model.value = result.openaiModel || 'gpt-4o-mini';
        updateUI();
    });

    // Toggle AI settings visibility
    checkbox.addEventListener('change', updateUI);

    // Save settings
    saveBtn.addEventListener('click', () => {
        if (checkbox.checked && !apiKey.value.trim()) {
            showMessage('API key required when AI processing is enabled', 'error');
            return;
        }

        chrome.storage.local.set({
            enableLLMProcessing: checkbox.checked,
            openaiApiKey: apiKey.value.trim(),
            openaiModel: model.value
        }, () => {
            showMessage('Settings saved', 'success');
        });
    });

    function updateUI() {
        aiSettings.style.display = checkbox.checked ? 'block' : 'none';
    }

    function showMessage(text, type) {
        status.textContent = text;
        status.className = `status-message ${type}`;
        setTimeout(() => status.className = 'status-message', 3000);
    }
});