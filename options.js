document.addEventListener('DOMContentLoaded', () => {
    // Main AI Processing Toggle
    const enableAiProcessingCheckbox = document.getElementById('enableAiProcessingCheckbox');
    const aiProviderOptionsContainer = document.getElementById('aiProviderOptionsContainer');

    // AI Provider selection
    const aiProviderSelect = document.getElementById('aiProviderSelect');

    // Settings sections
    const openaiProviderSettings = document.getElementById('openaiProviderSettings');
    const geminiProviderSettings = document.getElementById('geminiProviderSettings');
    const commonAiSettings = document.getElementById('commonAiSettings');

    // OpenAI specific fields
    const openaiApiKeyInput = document.getElementById('openaiApiKey');
    const openaiModelSelect = document.getElementById('openaiModelSelect');

    // Gemini specific fields
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const geminiModelSelect = document.getElementById('geminiModelSelect'); 

    // Common AI fields
    const fetchTimeoutInput = document.getElementById('fetchTimeout');
    const systemPromptTextarea = document.getElementById('systemPrompt');
    const maxParallelRequestsInput = document.getElementById('maxParallelRequests');
    
    // General elements
    const saveBtn = document.getElementById('saveSettings');
    const status = document.getElementById('status');
    const version = document.getElementById('version');

    version.textContent = chrome.runtime.getManifest().version;

    async function loadSettings() {
        const settings = await chrome.storage.local.get([
            'aiProcessingEnabled', // New key for the main toggle
            'selectedAiProvider',
            'openaiApiKey',
            'openaiModel',
            'geminiApiKey',
            'geminiModel',
            'fetchTimeout',
            'systemPrompt',
            'maxParallelRequests'
        ]);

        // Set main AI processing toggle
        enableAiProcessingCheckbox.checked = !!settings.aiProcessingEnabled;

        // Set AI Provider. Default to 'openai' if AI is enabled and no provider was previously selected.
        // If AI is disabled, this value doesn't strictly matter for UI until re-enabled.
        aiProviderSelect.value = settings.selectedAiProvider || 'openai'; 

        // Populate OpenAI settings
        openaiApiKeyInput.value = settings.openaiApiKey || '';
        openaiModelSelect.value = settings.openaiModel || 'gpt-4o-mini';

        // Populate Gemini settings
        geminiApiKeyInput.value = settings.geminiApiKey || '';
        geminiModelSelect.value = settings.geminiModel || 'gemini-2.0-flash'; 

        // Populate common AI settings
        fetchTimeoutInput.value = settings.fetchTimeout || 10;
        systemPromptTextarea.value = settings.systemPrompt || '';
        maxParallelRequestsInput.value = settings.maxParallelRequests || 5;
        
        updateUI();
    }

    async function saveSettings() {
        const aiEnabled = enableAiProcessingCheckbox.checked;
        // selectedProvider will always be 'openai' or 'gemini' as 'none' is removed from dropdown
        const selectedProvider = aiProviderSelect.value; 
        
        const settingsToSave = {
            aiProcessingEnabled: aiEnabled,
            // If AI is disabled, selectedProvider's value from dropdown is still saved.
            // If AI is enabled, this is the active provider.
            selectedAiProvider: selectedProvider, 
            openaiApiKey: openaiApiKeyInput.value.trim(),
            openaiModel: openaiModelSelect.value,
            geminiApiKey: geminiApiKeyInput.value.trim(),
            geminiModel: geminiModelSelect.value,
            fetchTimeout: parseInt(fetchTimeoutInput.value, 10) || 10,
            systemPrompt: systemPromptTextarea.value.trim(),
            maxParallelRequests: parseInt(maxParallelRequestsInput.value, 10) || 5
        };

        // API Key Validation only if AI is enabled and a specific provider is chosen
        if (aiEnabled) {
            if (selectedProvider === 'openai' && !settingsToSave.openaiApiKey) {
                showMessage('OpenAI API key required when OpenAI is selected.', 'error');
                return;
            }
            if (selectedProvider === 'gemini' && !settingsToSave.geminiApiKey) {
                showMessage('Google Gemini API key required when Google Gemini is selected.', 'error');
                return;
            }
        }

        try {
            await chrome.storage.local.set(settingsToSave);
            showMessage('Settings saved', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('Error saving settings', 'error');
        }
    }

    function updateUI() {
        const isAiEnabled = enableAiProcessingCheckbox.checked;
        aiProviderOptionsContainer.style.display = isAiEnabled ? 'block' : 'none';

        if (isAiEnabled) {
            const currentProvider = aiProviderSelect.value;
            // Since 'none' is removed from provider dropdown, one of them will always be selected.
            // The visibility is thus determined by which one is selected.
            openaiProviderSettings.style.display = (currentProvider === 'openai') ? 'block' : 'none';
            geminiProviderSettings.style.display = (currentProvider === 'gemini') ? 'block' : 'none';
            // Common settings are shown if either provider is active (which is always the case if AI is enabled)
            commonAiSettings.style.display = 'block'; 
        } else {
            // Ensure provider-specific sections are hidden if main AI toggle is off
            openaiProviderSettings.style.display = 'none';
            geminiProviderSettings.style.display = 'none';
            commonAiSettings.style.display = 'none';
        }
    }
    
    // Load settings on DOMContentLoaded
    loadSettings();

    // Add event listener to the main AI processing checkbox
    enableAiProcessingCheckbox.addEventListener('change', updateUI);
    // Add event listener to provider select to update UI
    aiProviderSelect.addEventListener('change', updateUI);

    // Save settings
    saveBtn.addEventListener('click', saveSettings);

    function showMessage(text, type) {
        status.textContent = text;
        status.className = `status-message ${type}`;
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status-message';
        }, 3000);
    }
});
