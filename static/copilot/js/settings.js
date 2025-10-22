/**
 * Settings Management for Interview Co-pilot
 * Handles API key configuration and application preferences
 */

// Initialize settings on page load
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'settings') {
        loadSettings();
        attachSaveButtonListener();
        attachProviderToggle();
        attachOllamaCheckButton();
    }
});

// Load settings when page loads (if settings page is already active)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('settings-page')?.classList.contains('active')) {
        loadSettings();
    }
    attachSaveButtonListener();
    attachProviderToggle();
    attachOllamaCheckButton();
});

/**
 * Load settings from localStorage and populate the form
 */
function loadSettings() {
    console.log('Loading settings...');

    // Load API Keys
    const openaiApiKey = localStorage.getItem('openai_api_key') || '';
    const deepgramApiKey = localStorage.getItem('deepgram_api_key') || '';

    // Load LLM Settings
    const llmProvider = localStorage.getItem('llm_provider') || 'openai';
    const openaiModel = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    const ollamaModel = localStorage.getItem('ollama_model') || 'gemma3:4b';

    // Populate form fields
    document.getElementById('openaiApiKey').value = openaiApiKey;
    document.getElementById('deepgramApiKey').value = deepgramApiKey;

    const llmProviderSelect = document.getElementById('llmProvider');
    const openaiModelSelect = document.getElementById('openaiModel');
    const ollamaModelSelect = document.getElementById('ollamaModel');

    if (llmProviderSelect) llmProviderSelect.value = llmProvider;
    if (openaiModelSelect) openaiModelSelect.value = openaiModel;
    if (ollamaModelSelect) ollamaModelSelect.value = ollamaModel;

    // Show/hide appropriate model selection based on provider
    toggleProviderFields(llmProvider);

    // Check Ollama status if provider is ollama
    if (llmProvider === 'ollama') {
        checkOllamaStatus();
    }

    console.log('Settings loaded successfully');
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    console.log('Saving settings...');

    const saveBtn = document.getElementById('saveSettingsBtn');
    const originalText = saveBtn.innerHTML;

    try {
        // Update button to show saving state
        saveBtn.innerHTML = '⏳ Saving...';
        saveBtn.disabled = true;

        // Get form values
        const openaiApiKey = document.getElementById('openaiApiKey').value.trim();
        const deepgramApiKey = document.getElementById('deepgramApiKey').value.trim();
        const llmProvider = document.getElementById('llmProvider').value;
        const openaiModel = document.getElementById('openaiModel').value;
        const ollamaModel = document.getElementById('ollamaModel').value;

        // Validate API keys format
        if (openaiApiKey && !openaiApiKey.startsWith('sk-')) {
            showSettingsStatus('error', '❌ Invalid OpenAI API key format. It should start with "sk-"');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return;
        }

        // Save to localStorage
        if (openaiApiKey) {
            localStorage.setItem('openai_api_key', openaiApiKey);
        } else {
            localStorage.removeItem('openai_api_key');
        }

        if (deepgramApiKey) {
            localStorage.setItem('deepgram_api_key', deepgramApiKey);
        } else {
            localStorage.removeItem('deepgram_api_key');
        }

        localStorage.setItem('llm_provider', llmProvider);
        localStorage.setItem('openai_model', openaiModel);
        localStorage.setItem('ollama_model', ollamaModel);

        // Show success feedback on button
        saveBtn.innerHTML = '✅ Saved!';

        // Add visual feedback to saved fields
        const savedFields = ['openaiApiKey', 'deepgramApiKey', 'llmProvider', 'openaiModel', 'ollamaModel'];
        savedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.borderColor = '#27ae60';
                field.style.backgroundColor = '#e8f8f0';
                setTimeout(() => {
                    field.style.borderColor = '';
                    field.style.backgroundColor = '';
                }, 2000);
            }
        });

        // Show success message with provider info
        const providerName = llmProvider === 'openai' ? 'OpenAI' : 'Ollama';
        const modelName = llmProvider === 'openai' ? openaiModel : ollamaModel;
        showSettingsStatus('success', `✅ Settings saved! Using ${providerName} with model ${modelName}`);

        console.log('Settings saved successfully');

        // Update active model badge on interview page if it exists
        if (typeof updateActiveModelBadge === 'function') {
            updateActiveModelBadge();
        }

        // Reset button after 2 seconds
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsStatus('error', '❌ Error saving settings. Please try again.');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

/**
 * Show status message
 */
function showSettingsStatus(type, message) {
    console.log(`Showing status: ${type} - ${message}`);

    const statusDiv = document.getElementById('settingsStatus');
    if (!statusDiv) {
        console.error('Status div not found!');
        alert(message); // Fallback to alert
        return;
    }

    const messageDiv = statusDiv.querySelector('.status-message');
    if (!messageDiv) {
        console.error('Message div not found!');
        alert(message); // Fallback to alert
        return;
    }

    // Remove previous status classes
    statusDiv.classList.remove('success', 'error');

    // Add new status class
    statusDiv.classList.add(type);
    messageDiv.textContent = message;

    // Show the status div with animation
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.opacity = '1';
    }, 10);

    console.log('Status message displayed');

    // Hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.opacity = '0';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 300);
    }, 5000);
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = event.target;

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈 Hide';
    } else {
        input.type = 'password';
        button.textContent = '👁️ Show';
    }
}

// Export for use in other modules
window.togglePasswordVisibility = togglePasswordVisibility;

/**
 * Get OpenAI API Key (for use by other modules)
 */
function getOpenAIApiKey() {
    return localStorage.getItem('openai_api_key') || '';
}

/**
 * Get Deepgram API Key (for use by other modules)
 */
function getDeepgramApiKey() {
    return localStorage.getItem('deepgram_api_key') || '';
}

// Export functions for use in other modules
window.getOpenAIApiKey = getOpenAIApiKey;
window.getDeepgramApiKey = getDeepgramApiKey;

/**
 * Attach event listener to save button
 */
function attachSaveButtonListener() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn && !saveBtn.hasAttribute('data-listener-attached')) {
        console.log('Attaching save button listener...');
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Save button clicked!');
            saveSettings();
        });
        saveBtn.setAttribute('data-listener-attached', 'true');
        console.log('Save button listener attached successfully');
    }
}

/**
 * Toggle visibility of provider-specific fields
 */
function toggleProviderFields(provider) {
    const openaiModelGroup = document.getElementById('openaiModelGroup');
    const ollamaModelGroup = document.getElementById('ollamaModelGroup');
    const ollamaStatusGroup = document.getElementById('ollamaStatusGroup');

    if (provider === 'openai') {
        if (openaiModelGroup) openaiModelGroup.style.display = 'block';
        if (ollamaModelGroup) ollamaModelGroup.style.display = 'none';
        if (ollamaStatusGroup) ollamaStatusGroup.style.display = 'none';
    } else {
        if (openaiModelGroup) openaiModelGroup.style.display = 'none';
        if (ollamaModelGroup) ollamaModelGroup.style.display = 'block';
        if (ollamaStatusGroup) ollamaStatusGroup.style.display = 'block';
    }
}

/**
 * Attach provider toggle event listener
 */
function attachProviderToggle() {
    const llmProviderSelect = document.getElementById('llmProvider');
    if (llmProviderSelect && !llmProviderSelect.hasAttribute('data-listener-attached')) {
        llmProviderSelect.addEventListener('change', function() {
            const provider = this.value;
            toggleProviderFields(provider);

            // Check Ollama status when switching to ollama
            if (provider === 'ollama') {
                checkOllamaStatus();
            }
        });
        llmProviderSelect.setAttribute('data-listener-attached', 'true');
    }
}

/**
 * Check Ollama server status
 */
async function checkOllamaStatus() {
    const statusBox = document.getElementById('ollamaStatusBox');
    const statusText = document.getElementById('ollamaStatusText');

    if (!statusBox || !statusText) return;

    // Set checking state
    statusBox.className = 'setting-info-box checking';
    statusText.innerHTML = '<strong>⏳ Checking Ollama connection...</strong>';

    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            timeout: 3000
        });

        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];

            if (models.length === 0) {
                statusBox.className = 'setting-info-box warning';
                statusText.innerHTML = `
                    <strong>⚠️ Ollama running, but no models found</strong><br>
                    Install a model with: <code>ollama pull gemma3:4b</code>
                `;
            } else {
                const modelNames = models.map(m => m.name).join(', ');
                statusBox.className = 'setting-info-box success';
                statusText.innerHTML = `
                    <strong>✅ Ollama connected!</strong><br>
                    Server: <code>http://localhost:11434</code><br>
                    Models installed: <code>${modelNames}</code>
                `;
            }
        } else {
            throw new Error('Ollama server not responding');
        }
    } catch (error) {
        statusBox.className = 'setting-info-box error';
        statusText.innerHTML = `
            <strong>❌ Ollama not running</strong><br>
            Please start Ollama with: <code>ollama serve</code><br>
            <small>Make sure Ollama is installed from <a href="https://ollama.com" target="_blank">ollama.com</a></small>
        `;
    }
}

/**
 * Attach Ollama check button event listener
 */
function attachOllamaCheckButton() {
    const checkBtn = document.getElementById('checkOllamaBtn');
    if (checkBtn && !checkBtn.hasAttribute('data-listener-attached')) {
        checkBtn.addEventListener('click', function() {
            checkOllamaStatus();
        });
        checkBtn.setAttribute('data-listener-attached', 'true');
    }
}

/**
 * Get current LLM provider (for use by other modules)
 */
function getLLMProvider() {
    return localStorage.getItem('llm_provider') || 'openai';
}

/**
 * Get current model based on provider (for use by other modules)
 */
function getCurrentModel() {
    const provider = getLLMProvider();
    if (provider === 'openai') {
        return localStorage.getItem('openai_model') || 'gpt-4o-mini';
    } else {
        return localStorage.getItem('ollama_model') || 'gemma3:4b';
    }
}

// Export functions for use in other modules
window.getLLMProvider = getLLMProvider;
window.getCurrentModel = getCurrentModel;

console.log('Settings module loaded');
