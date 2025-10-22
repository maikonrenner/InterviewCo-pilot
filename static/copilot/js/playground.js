/**
 * Playground Module - LLM Comparison Tool
 * Allows side-by-side comparison of different LLM providers and models
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const compareBtn = document.getElementById('compareBtn');
    const questionInput = document.getElementById('playgroundQuestion');

    // LLM 1 Elements
    const llm1Provider = document.getElementById('llm1Provider');
    const llm1Model = document.getElementById('llm1Model');
    const llm1OllamaModel = document.getElementById('llm1OllamaModel');
    const llm1OllamaGroup = document.getElementById('llm1OllamaGroup');
    const llm1Response = document.getElementById('llm1Response');
    const llm1Status = document.getElementById('llm1Status');
    const llm1Time = document.getElementById('llm1Time');

    // LLM 2 Elements
    const llm2Provider = document.getElementById('llm2Provider');
    const llm2Model = document.getElementById('llm2Model');
    const llm2OllamaModel = document.getElementById('llm2OllamaModel');
    const llm2OpenaiGroup = document.getElementById('llm2OpenaiGroup');
    const llm2OllamaGroup = document.getElementById('llm2OllamaGroup');
    const llm2Response = document.getElementById('llm2Response');
    const llm2Status = document.getElementById('llm2Status');
    const llm2Time = document.getElementById('llm2Time');

    // Timing trackers
    let llm1StartTime = 0;
    let llm2StartTime = 0;

    /**
     * Toggle model selection based on provider
     */
    function toggleModelSelection(providerSelect, openaiGroup, ollamaGroup) {
        const provider = providerSelect.value;

        if (provider === 'openai') {
            if (openaiGroup) openaiGroup.style.display = 'block';
            if (ollamaGroup) ollamaGroup.style.display = 'none';
        } else {
            if (openaiGroup) openaiGroup.style.display = 'none';
            if (ollamaGroup) ollamaGroup.style.display = 'block';
        }
    }

    /**
     * Get selected model for LLM
     */
    function getSelectedModel(provider, openaiSelect, ollamaSelect) {
        if (provider === 'openai') {
            return openaiSelect.value;
        } else {
            return ollamaSelect.value;
        }
    }

    /**
     * Update status indicator
     */
    function updateStatus(statusElement, status, icon) {
        statusElement.textContent = `${icon} ${status}`;
    }

    /**
     * Update response time
     */
    function updateTime(timeElement, startTime) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        timeElement.textContent = `${elapsed}s`;
    }

    /**
     * Clear response box
     */
    function clearResponse(responseElement) {
        responseElement.innerHTML = '';
    }

    /**
     * Append chunk to response
     */
    function appendChunk(responseElement, chunk) {
        // Create or get text node
        if (responseElement.children.length === 0) {
            const textNode = document.createElement('div');
            textNode.className = 'streaming-text';
            responseElement.appendChild(textNode);
        }

        const textNode = responseElement.querySelector('.streaming-text');
        textNode.textContent += chunk;

        // Auto-scroll
        responseElement.scrollTop = responseElement.scrollHeight;
    }

    /**
     * Render markdown (final response)
     */
    function renderMarkdown(responseElement, text) {
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'markdown-content';

        if (typeof marked !== 'undefined') {
            markdownDiv.innerHTML = marked.parse(text);
        } else {
            markdownDiv.textContent = text;
        }

        responseElement.innerHTML = '';
        responseElement.appendChild(markdownDiv);
    }

    /**
     * Compare LLMs (send parallel requests)
     */
    async function compareLLMs() {
        const question = questionInput.value.trim();

        if (!question) {
            alert('Please enter a question first!');
            return;
        }

        // Disable button during comparison
        compareBtn.disabled = true;
        compareBtn.textContent = '⏳ Comparing...';

        // Get configurations
        const llm1Config = {
            provider: llm1Provider.value,
            model: getSelectedModel(llm1Provider.value, llm1Model, llm1OllamaModel),
            question: question
        };

        const llm2Config = {
            provider: llm2Provider.value,
            model: getSelectedModel(llm2Provider.value, llm2Model, llm2OllamaModel),
            question: question
        };

        // Clear previous responses
        clearResponse(llm1Response);
        clearResponse(llm2Response);

        // Reset statuses
        updateStatus(llm1Status, 'Waiting...', '⏳');
        updateStatus(llm2Status, 'Waiting...', '⏳');
        llm1Time.textContent = '0.0s';
        llm2Time.textContent = '0.0s';

        // Start timers
        llm1StartTime = Date.now();
        llm2StartTime = Date.now();

        // Update times every 100ms
        const llm1Timer = setInterval(() => updateTime(llm1Time, llm1StartTime), 100);
        const llm2Timer = setInterval(() => updateTime(llm2Time, llm2StartTime), 100);

        // Send parallel requests
        try {
            await Promise.all([
                sendLLMRequest(llm1Config, llm1Response, llm1Status, llm1Time, llm1Timer),
                sendLLMRequest(llm2Config, llm2Response, llm2Status, llm2Time, llm2Timer)
            ]);
        } catch (error) {
            console.error('Error during comparison:', error);
        } finally {
            // Re-enable button
            compareBtn.disabled = false;
            compareBtn.textContent = '⚡ Compare Models';
        }
    }

    /**
     * Send request to LLM and stream response
     */
    async function sendLLMRequest(config, responseElement, statusElement, timeElement, timer) {
        try {
            updateStatus(statusElement, 'Generating...', '⚡');

            const response = await fetch('/compare-llms/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Read streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let firstChunk = true;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                if (firstChunk) {
                    updateStatus(statusElement, 'Streaming...', '📡');
                    firstChunk = false;
                }

                appendChunk(responseElement, chunk);
            }

            // Final rendering
            clearInterval(timer);
            updateStatus(statusElement, 'Complete', '✅');
            renderMarkdown(responseElement, fullText);

        } catch (error) {
            clearInterval(timer);
            updateStatus(statusElement, 'Error', '❌');
            responseElement.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
            console.error('LLM Request Error:', error);
        }
    }

    /**
     * Event Listeners
     */

    // Provider toggles for LLM 1
    if (llm1Provider) {
        llm1Provider.addEventListener('change', function() {
            // LLM 1 has only llm1Model and llm1OllamaGroup (no separate OpenAI group)
            toggleModelSelection(llm1Provider, document.getElementById('llm1Model').parentElement, llm1OllamaGroup);
        });

        // Initialize on page load
        toggleModelSelection(llm1Provider, document.getElementById('llm1Model').parentElement, llm1OllamaGroup);
    }

    // Provider toggles for LLM 2
    if (llm2Provider) {
        llm2Provider.addEventListener('change', function() {
            toggleModelSelection(llm2Provider, llm2OpenaiGroup, llm2OllamaGroup);
        });

        // Initialize on page load
        toggleModelSelection(llm2Provider, llm2OpenaiGroup, llm2OllamaGroup);
    }

    // Compare button
    if (compareBtn) {
        compareBtn.addEventListener('click', compareLLMs);
    }

    // Enter key to compare
    if (questionInput) {
        questionInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                compareLLMs();
            }
        });
    }

    console.log('✅ Playground module loaded');
});
