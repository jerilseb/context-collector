document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('enableLLMProcessing');
    const aiSettings = document.getElementById('aiSettings');
    const apiKey = document.getElementById('apiKey');
    const model = document.getElementById('modelSelect');
    const fetchTimeoutInput = document.getElementById('fetchTimeout');
    const systemPromptTextarea = document.getElementById('systemPrompt');
    const maxParallelRequestsInput = document.getElementById('maxParallelRequests');
    const saveBtn = document.getElementById('saveSettings');
    const status = document.getElementById('status');
    const version = document.getElementById('version');

    version.textContent = chrome.runtime.getManifest().version;

    async function loadSettings() {
        const {
            enableLLMProcessing,
            openaiApiKey,
            openaiModel,
            fetchTimeout,
            systemPrompt,
            maxParallelRequests
        } = await chrome.storage.local.get([
            'enableLLMProcessing',
            'openaiApiKey',
            'openaiModel',
            'fetchTimeout',
            'systemPrompt',
            'maxParallelRequests'
        ]);

        checkbox.checked = enableLLMProcessing;
        apiKey.value = openaiApiKey;
        model.value = openaiModel;
        fetchTimeoutInput.value = fetchTimeout;
        systemPromptTextarea.value = systemPrompt;
        maxParallelRequestsInput.value = maxParallelRequests;
        updateUI();
    }

    async function saveSettings() {
        if (checkbox.checked && !apiKey.value.trim()) {
            showMessage('API key required when AI processing is enabled', 'error');
            return;
        }

        try {
            await chrome.storage.local.set({
                enableLLMProcessing: checkbox.checked,
                openaiApiKey: apiKey.value.trim(),
                openaiModel: model.value,
                fetchTimeout: parseInt(fetchTimeoutInput.value, 10) || 10,
                systemPrompt: systemPromptTextarea.value.trim() || DEFAULT_SYSTEM_PROMPT,
                maxParallelRequests: parseInt(maxParallelRequestsInput.value, 10) || 5
            });
            showMessage('Settings saved', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('Error saving settings', 'error');
        }
    }

    // Load settings on DOMContentLoaded
    loadSettings();

    // Toggle AI settings visibility
    checkbox.addEventListener('change', updateUI);

    // Save settings
    saveBtn.addEventListener('click', saveSettings);

    function updateUI() {
        aiSettings.style.display = checkbox.checked ? 'block' : 'none';
    }

    function showMessage(text, type) {
        status.textContent = text;
        status.className = `status-message ${type}`;
        setTimeout(() => status.className = 'status-message', 3000);
    }
});
