/**
 * Settings Management for Interview Co-pilot
 * Handles API key configuration and application preferences
 */

// Initialize settings on page load
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'settings') {
        loadSettings();
        attachSaveButtonListener();
    }
});

// Load settings when page loads (if settings page is already active)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('settings-page')?.classList.contains('active')) {
        loadSettings();
    }
    attachSaveButtonListener();
});

/**
 * Load settings from localStorage and populate the form
 */
function loadSettings() {
    console.log('Loading settings...');

    // Load API Keys
    const openaiApiKey = localStorage.getItem('openai_api_key') || '';
    const deepgramApiKey = localStorage.getItem('deepgram_api_key') || '';

    // Load Application Settings
    const defaultModel = localStorage.getItem('default_model') || 'gpt-4o';

    // Populate form fields
    document.getElementById('openaiApiKey').value = openaiApiKey;
    document.getElementById('deepgramApiKey').value = deepgramApiKey;
    document.getElementById('defaultModel').value = defaultModel;

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
        const defaultModel = document.getElementById('defaultModel').value;

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

        localStorage.setItem('default_model', defaultModel);

        // Show success feedback on button
        saveBtn.innerHTML = '✅ Saved!';

        // Add visual feedback to saved fields
        const savedFields = ['openaiApiKey', 'deepgramApiKey', 'defaultModel'];
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

        // Show success message
        showSettingsStatus('success', '✅ Settings saved successfully! Your API keys and preferences have been stored locally.');

        console.log('Settings saved successfully');

        // If the model selector exists on interview page, update it
        const modelSelector = document.getElementById('modelSelector');
        if (modelSelector) {
            modelSelector.value = defaultModel;
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

console.log('Settings module loaded');
