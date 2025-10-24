document.addEventListener('DOMContentLoaded', function() {
    // ⚡ Performance: Conditional logging (set to false in production)
    const DEBUG = false;
    const logger = {
        log: (...args) => DEBUG && console.log(...args),
        error: (...args) => console.error(...args), // Always log errors
        warn: (...args) => DEBUG && console.warn(...args)
    };

    // DOM Elements
    const dualAudioButton = document.getElementById('dualAudioButton');
    const overlayButton = document.getElementById('overlayButton');
    const statusElement = document.querySelector('.status-text'); // Fixed: use class selector
    const conversationBox = document.getElementById('conversationBox');
    const liveTranscriptBox = document.getElementById('liveTranscriptBox');
    const transcriptInput = document.getElementById('transcriptInput');
    const videoPreview = document.getElementById('videoPreview');
    const microphoneButton = document.getElementById('microphoneButton');

    // Helper function to update status indicator
    function updateStatusIndicator(isActive) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (statusDot && statusText) {
            if (isActive) {
                statusDot.style.backgroundColor = '#ef4444'; // Red when recording
                statusText.textContent = 'RECORDING';
                statusText.style.color = '#ef4444';
            } else {
                statusDot.style.backgroundColor = '#10b981'; // Green when ready
                statusText.textContent = 'READY';
                statusText.style.color = '#10b981';
            }
        }
    }

    // WebSocket connection
    let socket;
    let mediaRecorder;
    let stream;
    let deepgramSocket;
    let currentTranscript = '';
    let interimTranscript = '';
    let transcriptionTimeout;
    const TRANSCRIPTION_PAUSE_THRESHOLD = 2000; // 2 seconds
    let isMicrophoneMode = false; // Track if microphone mode is active
    let isDualAudioMode = false; // Track if dual audio mode is active
    let micStream = null; // Store microphone stream for dual mode
    let audioContext = null; // Web Audio API context
    let speakerMap = {}; // Map speaker IDs to labels (You/Interviewer)
    let sessionStartTime = null; // Interview session start time
    let sessionData = {}; // Store session data (company, position, date)
    let timerInterval = null; // Timer interval for interview duration
    let pendingQuestion = null; // Store pending question to display after answer starts
    let pendingBadge = null; // Store badge info to display when answer starts

    // Update interview info when page is opened
    function updateInterviewInfo() {
        const interviewDetails = JSON.parse(localStorage.getItem('interviewDetails') || '{}');
        const companyPositionElement = document.getElementById('interviewCompanyPosition');
        const dateElement = document.getElementById('interviewDate');

        // Update company and position (header title)
        if (companyPositionElement) {
            if (interviewDetails.company && interviewDetails.position) {
                companyPositionElement.textContent = `${interviewDetails.company}: ${interviewDetails.position}`;
            } else {
                companyPositionElement.textContent = 'No interview details set';
            }
        }

        // Update date
        if (dateElement) {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            dateElement.textContent = formattedDate;
        }

        // Update active model badge
        updateActiveModelBadge();
    }

    // Update active model badge based on Settings
    function updateActiveModelBadge() {
        const badge = document.getElementById('activeModelBadge');
        if (!badge) {
            logger.warn('activeModelBadge element not found');
            return;
        }

        const provider = window.getLLMProvider ? window.getLLMProvider() : 'openai';
        const model = window.getCurrentModel ? window.getCurrentModel() : 'gpt-4o-mini';

        const iconSpan = badge.querySelector('.model-icon');
        const textSpan = badge.querySelector('.model-text');

        if (!iconSpan || !textSpan) {
            logger.warn('Model badge icon or text span not found');
            return;
        }

        // Model display names (compact for new design)
        const modelNames = {
            // OpenAI models
            'gpt-4o-mini': 'GPT-4o Mini ⚡',
            'gpt-4o': 'GPT-4o',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5',
            // Ollama models
            'gemma3:4b': 'Gemma 4B',
            'gemma3:1b': 'Gemma 1B',
            'gemma3:12b': 'Gemma 12B',
            'llama3:8b': 'Llama 8B',
            'mistral:7b': 'Mistral 7B'
        };

        const displayName = modelNames[model] || model;
        const modelInfo = badge.closest('.model-info');

        if (provider === 'ollama') {
            iconSpan.textContent = '🦙';
            textSpan.textContent = `${displayName}`;
            if (modelInfo) {
                modelInfo.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }
        } else {
            iconSpan.textContent = '🤖';
            textSpan.textContent = displayName;
            if (modelInfo) {
                modelInfo.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            }
        }
    }

    // Export function for use by other modules
    window.updateActiveModelBadge = updateActiveModelBadge;

    // Setup clear conversation button
    function setupClearButton() {
        const clearBtn = document.getElementById('clearConversationBtn');
        if (clearBtn) {
            // Remove any existing listener first
            clearBtn.replaceWith(clearBtn.cloneNode(true));
            const newClearBtn = document.getElementById('clearConversationBtn');

            newClearBtn.addEventListener('click', () => {
                logger.log('Clear button clicked');
                // Confirm before clearing
                if (confirm('Tem certeza que deseja limpar o histórico da conversa? Esta ação não pode ser desfeita.')) {
                    // Clear conversation box except for system message
                    conversationBox.innerHTML = `
                        <div class="system-message">
                            <p>Conversa limpa. Continue sua entrevista!</p>
                        </div>
                    `;
                    logger.log('Conversation cleared by user');
                }
            });
            logger.log('Clear button listener registered');
        } else {
            logger.warn('Clear button not found in DOM');
        }
    }

    // Setup generate company questions button
    function setupGenerateQuestionsButton() {
        const generateBtn = document.getElementById('generateCompanyQuestionsBtn');
        if (generateBtn) {
            // Remove any existing listener first
            generateBtn.replaceWith(generateBtn.cloneNode(true));
            const newGenerateBtn = document.getElementById('generateCompanyQuestionsBtn');

            newGenerateBtn.addEventListener('click', async () => {
                logger.log('Generate company questions button clicked');

                // Show loading indicator
                const originalText = newGenerateBtn.innerHTML;
                newGenerateBtn.innerHTML = '⏳ Generating...';
                newGenerateBtn.disabled = true;

                try {
                    // Call backend to generate questions
                    const response = await fetch('/generate-company-questions/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to generate questions');
                    }

                    const data = await response.json();

                    if (data.questions) {
                        // Display in panel (categorized)
                        displayCompanyQuestions(data.questions, data.labels);
                        logger.log('Company questions generated and displayed');
                    }
                } catch (error) {
                    logger.error('Error generating company questions:', error);
                    alert('Erro ao gerar perguntas. Por favor, tente novamente.');
                } finally {
                    // Restore button state
                    newGenerateBtn.innerHTML = originalText;
                    newGenerateBtn.disabled = false;
                }
            });
            logger.log('Generate questions button listener registered');
        } else {
            logger.warn('Generate questions button not found in DOM');
        }
    }

    // Display company questions in panel (categorized)
    function displayCompanyQuestions(questions, labels) {
        if (!questions) {
            logger.log('No company questions to display');
            return;
        }

        logger.log('Displaying company questions:', questions);

        const companyQuestionsPanel = document.getElementById('companyQuestionsPanel');
        const companyQuestionsList = document.getElementById('companyQuestionsList');

        if (!companyQuestionsPanel || !companyQuestionsList) {
            logger.error('Company questions panel elements not found');
            return;
        }

        // Clear previous questions
        companyQuestionsList.innerHTML = '';

        // Define categories and their icons
        const categories = [
            { key: 'general', icon: '🌐', color: '#3b82f6' },
            { key: 'technical', icon: '⚙️', color: '#8b5cf6' },
            { key: 'culture', icon: '🤝', color: '#10b981' }
        ];

        let questionNumber = 1;

        // Create sections for each category
        categories.forEach(category => {
            const categoryQuestions = questions[category.key];
            if (!categoryQuestions || categoryQuestions.length === 0) return;

            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.style.cssText = `
                font-size: 14px;
                font-weight: 700;
                color: ${category.color};
                margin-top: ${questionNumber === 1 ? '0' : '15px'};
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            categoryHeader.innerHTML = `
                <span style="font-size: 16px;">${category.icon}</span>
                <span>${labels[category.key]}</span>
            `;
            companyQuestionsList.appendChild(categoryHeader);

            // Create question items for this category
            categoryQuestions.forEach((question) => {
                const questionItem = document.createElement('div');
                questionItem.className = 'prediction-item';

                questionItem.innerHTML = `
                    <div class="prediction-question" style="font-size: 15px; font-weight: 500;">
                        <strong>${questionNumber}.</strong> ${question}
                    </div>
                `;

                // Add click handler to send question automatically
                questionItem.addEventListener('click', () => {
                    logger.log('Company question clicked:', question);

                    // Visual feedback
                    questionItem.style.background = '#e8f5fd';
                    setTimeout(() => {
                        questionItem.style.background = 'white';
                    }, 300);

                    // Send the question automatically
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        logger.log('Sending company question to server...');
                        sendTranscriptionToServer(question);

                        // Hide panel after sending
                        companyQuestionsPanel.style.display = 'none';
                    } else {
                        logger.error('WebSocket is not open! Cannot send company question.');
                        alert('WebSocket não está conectado. Por favor, inicie a entrevista primeiro.');
                    }
                });

                companyQuestionsList.appendChild(questionItem);
                questionNumber++;
            });
        });

        // Show panel with animation
        companyQuestionsPanel.style.display = 'block';
    }

    // Setup close company questions button
    function setupCompanyQuestionsPanel() {
        const closeBtn = document.getElementById('closeCompanyQuestionsBtn');
        const companyQuestionsPanel = document.getElementById('companyQuestionsPanel');

        if (closeBtn && companyQuestionsPanel) {
            closeBtn.addEventListener('click', () => {
                companyQuestionsPanel.style.display = 'none';
                logger.log('Company questions panel closed');
            });
        }
    }

    // Listen for page changes to update interview info
    document.addEventListener('pageChanged', function(e) {
        if (e.detail.page === 'interview') {
            updateInterviewInfo();
            setupClearButton(); // Setup clear button when page becomes active
            setupGenerateQuestionsButton(); // Setup generate questions button when page becomes active
            setupCompanyQuestionsPanel(); // Setup company questions panel close button
        }
    });

    // Get speaker label for diarization
    function getSpeakerLabel(speakerId) {
        // If we haven't assigned a label yet, assign based on order
        if (!speakerMap[speakerId]) {
            const speakerCount = Object.keys(speakerMap).length;
            // First speaker detected is usually Interviewer (from screen sharing)
            // Second speaker is You (from microphone)
            speakerMap[speakerId] = speakerCount === 0 ? 'Interviewer' : 'You';
            logger.log(`🎯 Speaker ${speakerId} mapped to: ${speakerMap[speakerId]}`);
        }
        return speakerMap[speakerId];
    }

    // Combine system audio and microphone audio using Web Audio API
    async function combineMicrophoneAndSystemAudio(systemStream, microphoneStream) {
        try {
            logger.log('🎛️ Combining audio streams...');

            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create sources from both streams
            const systemSource = audioContext.createMediaStreamSource(systemStream);
            const micSource = audioContext.createMediaStreamSource(microphoneStream);

            // Create destination for combined audio
            const destination = audioContext.createMediaStreamDestination();

            // Connect both sources to destination (mixed mono)
            systemSource.connect(destination);
            micSource.connect(destination);

            logger.log('✅ Audio streams combined successfully');
            return destination.stream;
        } catch (error) {
            logger.error('❌ Error combining audio streams:', error);
            throw error;
        }
    }

    // Check browser support
    const checkBrowserSupport = () => {
        // Check for Safari-specific issues
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isSafari) {
            // Check Safari version for MediaRecorder support
            const safariVersion = parseInt(navigator.userAgent.match(/Version\/(\d+)/)?.[1] || '0');
            
            if (safariVersion < 14) {
                alert('Safari version 14 or later is required for this application.');
                return false;
            }
            
            // Warn about screen capture limitations in Safari
            statusElement.textContent = 'Note: In Safari, ensure you select "This Mac" when sharing screen audio';
        }
        
        return true;
    };
    
    // Initialize WebSocket connection
    function initWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/interview/`;
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            statusElement.textContent = 'Connected to server';
            logger.log('WebSocket connection established');
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch(data.type) {
                case 'initialization':
                    // Summaries removed - no longer needed
                    break;

                case 'question':
                    // Store question to display AFTER answer starts
                    pendingQuestion = { text: data.text, timestamp: data.timestamp };
                    break;

                case 'answer_chunk':
                    // Handle streaming response chunks
                    updateOrAddAnswer(data.text, data.timestamp);

                    // Add pending question after first answer chunk arrives
                    if (pendingQuestion) {
                        addMessageToConversation('question', pendingQuestion.text, pendingQuestion.timestamp);
                        pendingQuestion = null; // Clear after adding
                    }
                    break;

                case 'answer_complete':
                    // Mark the current answer as complete
                    completeCurrentAnswer();
                    break;

                case 'cache_indicator':
                    // Store badge info to display when answer starts
                    pendingBadge = {
                        cached: data.cached,
                        hitCount: data.hit_count,
                        model: data.model,
                        provider: data.provider
                    };
                    logger.log('Badge info stored:', pendingBadge);
                    break;

                case 'question_predictions':
                    // Display predicted next questions
                    displayPredictions(data.predictions);
                    break;
            }
        };
        
        socket.onclose = () => {
            statusElement.textContent = 'Disconnected from server';
            logger.log('WebSocket connection closed');
        };
        
        socket.onerror = (error) => {
            statusElement.textContent = 'Error: ' + error;
            logger.error('WebSocket error:', error);
        };
    }
    
    // Initialize Deepgram WebSocket for transcription
    function initDeepgramSocket() {
        // Configure Deepgram Nova-3 with multi-language support (English, Portuguese, French)
        // Using 'multi' language detection for automatic language identification
        const params = {
            'model': 'nova-3',           // Nova-3 model - best accuracy (54.2% WER reduction)
            'language': 'multi',         // Automatic detection: English, French, Portuguese, Spanish, German, Hindi, Russian, Japanese, Italian, Dutch
            'punctuate': 'true',         // Automatic punctuation
            'interim_results': 'true',   // Real-time streaming results
            'smart_format': 'true'       // Smart formatting for numbers, dates, etc.
        };

        // Add diarization for dual audio mode (speaker separation)
        if (isDualAudioMode) {
            params['diarize'] = 'true';  // Enable speaker diarization
            logger.log('🎙️ Dual audio mode: Diarization enabled');
        }

        const deepgramUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams(params);

        deepgramSocket = new WebSocket(deepgramUrl, [
            'token',
            DEEPGRAM_API_KEY,
        ]);
        
        deepgramSocket.onopen = () => {
            const sourceText = isMicrophoneMode ? 'Microphone Audio' : 'System Audio';
            statusElement.textContent = `Connected - Transcribing ${sourceText}`;
            logger.log('Deepgram WebSocket connection established');
            logger.log('Source type:', sourceText);

            // Enable transcript input
            transcriptInput.disabled = false;

            // Clear placeholder
            liveTranscriptBox.innerHTML = '<p class="live-transcript" style="font-style: italic; color: #888;">Listening...</p>';

            // For screen audio, add event listener here (if not already added)
            if (!isMicrophoneMode) {
                logger.log('Setting up screen audio recording...');
                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0 && deepgramSocket.readyState == 1) {
                        logger.log('Screen audio data available:', event.data.size, 'bytes');
                        deepgramSocket.send(event.data);
                    }
                });
            }

            // Safari may need smaller data chunks
            const timeslice = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 500 : 1000;
            logger.log('Starting MediaRecorder with timeslice:', timeslice, 'ms');
            mediaRecorder.start(timeslice);
        };
        
        deepgramSocket.onmessage = (message) => {
            logger.log('Deepgram message received');
            const received = JSON.parse(message.data);
            logger.log('Deepgram response:', received);

            const alternative = received.channel.alternatives[0];
            const transcript = alternative.transcript;
            logger.log('Transcript:', transcript, 'is_final:', received.is_final);

            // Process speaker information if diarization is enabled
            let speakerLabel = '';
            if (isDualAudioMode && alternative.words && alternative.words.length > 0) {
                const speakerId = alternative.words[0].speaker;
                speakerLabel = getSpeakerLabel(speakerId);
                logger.log('Speaker detected:', speakerId, '→', speakerLabel);
            }

            // Clear previous timeout to avoid early submission while still speaking
            clearTimeout(transcriptionTimeout);

            if (transcript) {
                if (received.is_final) {
                    logger.log('Final transcript received:', transcript);

                    // Add speaker label if dual audio mode with color coding
                    let labeledTranscript;
                    if (speakerLabel) {
                        const labelClass = speakerLabel === 'Interviewer' ? 'speaker-interviewer' : 'speaker-you';
                        labeledTranscript = `<span class="${labelClass}">[${speakerLabel}]:</span> ${transcript}`;
                    } else {
                        labeledTranscript = transcript;
                    }

                    // Add final transcript to current transcript with a space
                    currentTranscript += labeledTranscript + ' ';
                    interimTranscript = '';

                    // Update live transcript box (without interim)
                    liveTranscriptBox.innerHTML = `<p class="live-transcript">${currentTranscript}</p>`;
                    liveTranscriptBox.scrollTop = liveTranscriptBox.scrollHeight;

                    // Broadcast live transcript to all connected clients (including Electron)
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'live_transcript_update',
                            text: currentTranscript,
                            is_final: true
                        }));
                    }

                    // Don't auto-send anymore - user will press ENTER when ready
                } else {
                    logger.log('Interim transcript received:', transcript);
                    // Real-time interim results
                    interimTranscript = transcript;

                    // Show both final and interim transcripts for real-time streaming effect
                    const displayText = currentTranscript + '<span style="opacity: 0.6; font-style: italic;">' + interimTranscript + '</span>';
                    liveTranscriptBox.innerHTML = `<p class="live-transcript">${displayText}</p>`;
                    liveTranscriptBox.scrollTop = liveTranscriptBox.scrollHeight;

                    // Broadcast interim transcript to all connected clients (including Electron)
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'live_transcript_update',
                            text: currentTranscript + interimTranscript,
                            is_final: false
                        }));
                    }
                }
            } else {
                logger.log('Empty transcript received');
            }
        };
        
        deepgramSocket.onclose = () => {
            logger.log('Deepgram WebSocket connection closed');
            statusElement.textContent = 'Disconnected from transcription service';

            // Disable transcript input
            transcriptInput.disabled = true;
            transcriptInput.value = '';

            // Reset live transcript box
            liveTranscriptBox.innerHTML = '<p class="transcript-placeholder">Live transcription will appear here...</p>';
        };
        
        deepgramSocket.onerror = (error) => {
            logger.error('Deepgram WebSocket error:', error);
            statusElement.textContent = 'Transcription Error: ' + error;
        };
    }

    // Strip HTML tags from text
    function stripHtmlTags(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Send transcription to server
    function sendTranscriptionToServer(text) {
        logger.log('sendTranscriptionToServer called with text:', text);
        logger.log('socket exists?', !!socket);
        logger.log('socket readyState:', socket ? socket.readyState : 'N/A');
        logger.log('WebSocket.OPEN =', WebSocket.OPEN);

        // Get LLM settings from Settings page (provider + model)
        const llmProvider = window.getLLMProvider ? window.getLLMProvider() : 'openai';
        const currentModel = window.getCurrentModel ? window.getCurrentModel() : 'gpt-4o-mini';

        // Get Predictions toggle state
        const predictionsToggle = document.getElementById('predictionsToggle');
        const predictionsEnabled = predictionsToggle ? predictionsToggle.checked : true; // Default to enabled if toggle not found

        logger.log('LLM Provider:', llmProvider);
        logger.log('Current Model:', currentModel);
        logger.log('Predictions Enabled:', predictionsEnabled);

        // Strip HTML tags before sending to server
        const cleanText = stripHtmlTags(text);
        logger.log('Clean text (without HTML):', cleanText);

        if (socket && socket.readyState === WebSocket.OPEN) {
            logger.log('Sending to WebSocket...');
            socket.send(JSON.stringify({
                type: 'transcription',
                text: cleanText,
                provider: llmProvider,
                model: currentModel,
                predictions_enabled: predictionsEnabled
            }));
            logger.log('Message sent to WebSocket!');
        } else {
            logger.error('WebSocket is not open! Cannot send message.');
        }
    }
    
    // Add message to conversation
    function addMessageToConversation(type, text, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = type;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = timestamp;

        const textParagraph = document.createElement('p');
        // Use innerHTML to render HTML tags (like <strong> for speaker labels)
        textParagraph.innerHTML = text;

        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(textParagraph);

        if (type === 'answer') {
            messageDiv.id = 'current-answer';
            // Insert answer at the TOP (beginning) so it's always visible first
            conversationBox.insertBefore(messageDiv, conversationBox.firstChild);
        } else if (type === 'question') {
            // Insert question AFTER the answer (second position)
            const answerDiv = document.getElementById('current-answer');
            if (answerDiv && answerDiv.nextSibling) {
                conversationBox.insertBefore(messageDiv, answerDiv.nextSibling);
            } else if (answerDiv) {
                // If there's an answer but no next sibling, insert after answer
                conversationBox.insertBefore(messageDiv, answerDiv.nextSibling);
            } else {
                // If no answer yet, insert at top
                conversationBox.insertBefore(messageDiv, conversationBox.firstChild);
            }
        }

        // Keep scroll at top to see the answer immediately
        conversationBox.scrollTop = 0;
    }
    
    // Update or add answer
    function updateOrAddAnswer(text, timestamp) {
        let answerDiv = document.getElementById('current-answer');

        if (!answerDiv) {
            addMessageToConversation('answer', text, timestamp);

            // Add badge if we have pending badge info
            if (pendingBadge) {
                displayCacheIndicator(pendingBadge.cached, pendingBadge.hitCount, pendingBadge.model, pendingBadge.provider);
                pendingBadge = null; // Clear after adding
            }
        } else {
            const textParagraph = answerDiv.querySelector('p');
            textParagraph.textContent += text;
            // Keep scroll at top to see the answer
            conversationBox.scrollTop = 0;
        }
    }
    
    // Complete current answer and render markdown
    function completeCurrentAnswer() {
        const answerDiv = document.getElementById('current-answer');
        if (answerDiv) {
            const textParagraph = answerDiv.querySelector('p');
            const fullText = textParagraph.textContent;

            logger.log('Rendering markdown for answer:', fullText);

            // Replace the paragraph with rendered markdown
            const markdownDiv = document.createElement('div');
            markdownDiv.className = 'markdown-content';

            if (typeof marked !== 'undefined') {
                markdownDiv.innerHTML = marked.parse(fullText);
                logger.log('Markdown rendered successfully');
            } else {
                logger.error('Marked.js not loaded');
                markdownDiv.textContent = fullText;
            }

            answerDiv.replaceChild(markdownDiv, textParagraph);
            answerDiv.removeAttribute('id');
        }
    }

    // Display cache/LLM indicator badge
    function displayCacheIndicator(isCached, hitCount, model, provider) {
        const answerDiv = document.getElementById('current-answer');
        if (!answerDiv) {
            logger.warn('No current answer div found for cache indicator');
            return;
        }

        // Remove existing badge if present
        const existingBadge = answerDiv.querySelector('.response-source-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Create badge element
        const badge = document.createElement('div');
        badge.className = 'response-source-badge';

        if (isCached) {
            // Cache badge (green)
            badge.classList.add('cache-badge');
            badge.innerHTML = `<span class="badge-icon">⚡</span> <span class="badge-text">CACHE</span> <span class="badge-count">(${hitCount}x)</span>`;
        } else {
            // LLM badge (blue)
            badge.classList.add('llm-badge');
            const modelDisplay = model || 'GPT-4o Mini';
            const providerIcon = provider === 'ollama' ? '🦙' : '🤖';
            badge.innerHTML = `<span class="badge-icon">${providerIcon}</span> <span class="badge-text">${modelDisplay}</span>`;
        }

        // Insert badge at the top of the answer div
        answerDiv.insertBefore(badge, answerDiv.firstChild);

        logger.log(`Cache indicator displayed: ${isCached ? 'CACHE' : 'LLM'}`);
    }

    // Display predicted next questions
    function displayPredictions(predictions) {
        if (!predictions || predictions.length === 0) {
            logger.log('No predictions to display');
            return;
        }

        logger.log('Displaying predictions:', predictions);

        const predictionsPanel = document.getElementById('predictionsPanel');
        const predictionsList = document.getElementById('predictionsList');

        if (!predictionsPanel || !predictionsList) {
            logger.error('Predictions panel elements not found');
            return;
        }

        // Clear previous predictions
        predictionsList.innerHTML = '';

        // Create prediction items
        predictions.forEach((pred, index) => {
            const predItem = document.createElement('div');
            predItem.className = 'prediction-item';

            // Type badge
            const typeClass = pred.type === 'follow_up' ? 'follow-up' : 'related';
            const typeLabel = pred.type === 'follow_up' ? '🔍 Follow-up' : '🔗 Related';

            // Confidence percentage
            const confidencePercent = Math.round(pred.confidence * 100);

            predItem.innerHTML = `
                <div class="prediction-item-header">
                    <span class="prediction-type ${typeClass}">${typeLabel}</span>
                    <div class="prediction-confidence">
                        <span>${confidencePercent}%</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${confidencePercent}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="prediction-question">${pred.question}</div>
                <div class="prediction-reason">${pred.reason}</div>
            `;

            // Add click handler to send question automatically
            predItem.addEventListener('click', () => {
                logger.log('Prediction clicked:', pred.question);

                // Visual feedback
                predItem.style.background = '#e8f5fd';
                setTimeout(() => {
                    predItem.style.background = 'white';
                }, 300);

                // Send the question automatically
                if (socket && socket.readyState === WebSocket.OPEN) {
                    logger.log('Sending predicted question to server...');
                    sendTranscriptionToServer(pred.question);

                    // Hide predictions panel after sending
                    predictionsPanel.style.display = 'none';
                } else {
                    logger.error('WebSocket is not open! Cannot send predicted question.');
                    alert('WebSocket não está conectado. Por favor, inicie a entrevista primeiro.');
                }
            });

            predictionsList.appendChild(predItem);
        });

        // Show panel with animation
        predictionsPanel.style.display = 'block';
    }

    // Setup close predictions button
    function setupPredictionsPanel() {
        const closeBtn = document.getElementById('closePredictionsBtn');
        const predictionsPanel = document.getElementById('predictionsPanel');

        if (closeBtn && predictionsPanel) {
            closeBtn.addEventListener('click', () => {
                predictionsPanel.style.display = 'none';
                logger.log('Predictions panel closed');
            });
        }
    }

    // Initialize predictions panel on page load
    setupPredictionsPanel();

    // Initialize company questions panel on page load
    setupCompanyQuestionsPanel();

    // Get supported MIME type for recording
    function getSupportedMimeType() {
        const types = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/mp4',
            'audio/ogg;codecs=opus'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return null;
    }
    
    // Start capturing dual audio (system + microphone)
    async function startCapturingDualAudio() {
        if (!checkBrowserSupport()) {
            return;
        }

        try {
            logger.log('🎙️ Starting dual audio capture (System + Microphone)...');

            // Load interview details from localStorage (saved by Resume Builder)
            const interviewDetails = JSON.parse(localStorage.getItem('interviewDetails') || '{}');

            sessionData = {
                company: interviewDetails.company || 'Not specified',
                position: interviewDetails.position || 'Not specified',
                date: new Date().toISOString().split('T')[0],
                model: window.getCurrentModel ? window.getCurrentModel() : 'gpt-4o-mini'
            };
            sessionStartTime = Date.now();
            logger.log('📋 Session data captured:', sessionData);

            // Start timer
            startInterviewTimer();

            // Capture screen audio
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Check if audio track is available
            const systemAudioTracks = stream.getAudioTracks();
            if (systemAudioTracks.length === 0) {
                alert('No system audio track available. Make sure to select "Share audio" when sharing.');
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            // Capture microphone audio
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            const micAudioTracks = micStream.getAudioTracks();
            if (micAudioTracks.length === 0) {
                alert('No microphone available. Please check your microphone settings.');
                stream.getTracks().forEach(track => track.stop());
                micStream.getTracks().forEach(track => track.stop());
                return;
            }

            logger.log('✅ Both audio sources captured');

            // Show video preview
            videoPreview.srcObject = stream;
            videoPreview.style.display = 'block';
            document.querySelector('.preview-placeholder').style.display = 'none';

            // Combine both audio streams
            const systemStream = new MediaStream(systemAudioTracks);
            const microphoneStream = new MediaStream(micAudioTracks);
            const combinedAudioStream = await combineMicrophoneAndSystemAudio(systemStream, microphoneStream);

            // Create audio stream from combined source
            const audioStream = combinedAudioStream;

            // Add event handler to stop everything when screen sharing is stopped
            stream.getTracks()[0].onended = () => {
                stopCapturing();
            };

            // Get supported MIME type
            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                alert('Your browser does not support any of the required audio recording formats.');
                audioStream.getTracks().forEach(track => track.stop());
                stream.getTracks().forEach(track => track.stop());
                micStream.getTracks().forEach(track => track.stop());
                return;
            }

            // Set options based on supported MIME type
            const options = {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            };

            // Create MediaRecorder with supported options
            try {
                mediaRecorder = new MediaRecorder(audioStream, options);
            } catch (e) {
                // Fallback without specifying mimeType
                logger.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Set dual audio mode flag
            isDualAudioMode = true;

            // Initialize Deepgram for transcription (with multichannel)
            initDeepgramSocket();

            // Change button to stop mode
            const btnIcon = dualAudioButton.querySelector('.btn-icon');
            const btnText = dualAudioButton.querySelector('.btn-text');
            if (btnIcon) btnIcon.textContent = '⏹️';
            if (btnText) btnText.textContent = 'Parar';
            dualAudioButton.classList.add('btn-stop');
            microphoneButton.disabled = true;

            // Update status indicator to recording
            updateStatusIndicator(true);

        } catch (error) {
            logger.error('Error accessing dual audio:', error);
            statusElement.textContent = 'Error: ' + error.message;

            // Clean up streams if error occurs
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (micStream) micStream.getTracks().forEach(track => track.stop());
            if (audioContext) audioContext.close();

            isDualAudioMode = false;

            // Provide more helpful error messages
            if (error.name === 'NotAllowedError') {
                statusElement.textContent = 'Error: Permission denied. Please allow screen recording and microphone access.';
            } else if (error.name === 'NotSupportedError') {
                statusElement.textContent = 'Error: Dual audio capture is not supported in this browser. Please try Chrome, Edge, or Firefox.';
            }
        }
    }

    // Start capturing system audio (screen audio only)
    async function startCapturingSystemAudio() {
        if (!checkBrowserSupport()) {
            return;
        }

        try {
            // Capture screen audio
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Check if audio track is available
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                alert('No audio track available. Make sure to select "Share audio" when sharing.');
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            // Show video preview
            videoPreview.srcObject = stream;
            videoPreview.style.display = 'block';
            document.querySelector('.preview-placeholder').style.display = 'none';

            // Create audio stream
            const audioStream = new MediaStream(audioTracks);

            // Add event handler to stop everything when screen sharing is stopped
            stream.getTracks()[0].onended = () => {
                stopCapturing();
            };

            // Get supported MIME type
            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                alert('Your browser does not support any of the required audio recording formats.');
                audioStream.getTracks().forEach(track => track.stop());
                return;
            }

            // Set options based on supported MIME type
            const options = {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            };

            // Create MediaRecorder with supported options
            try {
                mediaRecorder = new MediaRecorder(audioStream, options);
            } catch (e) {
                // Fallback without specifying mimeType
                logger.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Initialize Deepgram for transcription
            initDeepgramSocket();

            // Disable buttons (only for microphone mode, not used anymore)
            dualAudioButton.disabled = true;
            microphoneButton.disabled = true;

        } catch (error) {
            logger.error('Error accessing screen audio:', error);
            statusElement.textContent = 'Error: ' + error.message;

            // Provide more helpful error messages for screen sharing
            if (error.name === 'NotAllowedError') {
                statusElement.textContent = 'Error: Permission denied. Please allow screen recording in your browser or system settings.';
            } else if (error.name === 'NotSupportedError') {
                statusElement.textContent = 'Error: Screen sharing with audio is not supported in this browser. Please try Chrome, Edge, or Firefox.';
            }
        }
    }
    
    // Start interview timer
    function startInterviewTimer() {
        // Stop existing timer if any
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        timerInterval = setInterval(() => {
            if (sessionStartTime) {
                const elapsed = Date.now() - sessionStartTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);

                const timerElement = document.getElementById('interviewTimer');
                if (timerElement) {
                    timerElement.textContent =
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    // Stop interview timer
    function stopInterviewTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Reset timer display
        const timerElement = document.getElementById('interviewTimer');
        if (timerElement) {
            timerElement.textContent = '00:00:00';
        }
    }

    // Stop capturing
    function stopCapturing() {
        // Stop timer
        stopInterviewTimer();

        // Save session data to localStorage
        if (sessionStartTime && sessionData.company) {
            const duration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // minutes

            // Get detected language from localStorage
            const languageData = JSON.parse(localStorage.getItem('detectedLanguage') || '{}');
            const detectedLanguage = languageData.resume_language || languageData.job_language || 'English';

            const session = {
                company: sessionData.company,
                position: sessionData.position,
                date: sessionData.date || new Date().toISOString(),
                duration: duration,
                questions: 0, // TODO: Track questions count during interview
                language: detectedLanguage,
                model: sessionData.model,
                avgResponseTime: 0 // TODO: Calculate average response time
            };

            logger.log('💾 Saving session data:', session);

            // Call global function from dashboard.js
            if (typeof window.addSessionToAnalytics === 'function') {
                window.addSessionToAnalytics(session);
                logger.log('✅ Session saved to analytics');
            } else {
                logger.error('❌ addSessionToAnalytics function not found');
            }

            // Reset session data
            sessionStartTime = null;
            sessionData = {};
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Stop microphone stream if dual audio mode
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }

        // Close audio context if it exists
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            deepgramSocket.close();
        }

        // Reset UI
        videoPreview.style.display = 'none';
        const placeholder = document.querySelector('.preview-placeholder');
        placeholder.style.display = 'flex';
        placeholder.textContent = 'Screen preview will appear here when you start sharing...';

        const sourceText = isDualAudioMode ? 'Dual Audio' : (isMicrophoneMode ? 'Microphone' : 'Screen sharing');
        statusElement.textContent = `Disconnected - ${sourceText} stopped`;

        // Disable transcript input
        transcriptInput.disabled = true;
        transcriptInput.value = '';

        // Reset live transcript box
        liveTranscriptBox.innerHTML = '<p class="transcript-placeholder">Live transcription will appear here...</p>';

        // Reset microphone mode if it was active
        if (isMicrophoneMode) {
            isMicrophoneMode = false;
            microphoneButton.classList.remove('active');
        }

        // Reset dual audio mode
        if (isDualAudioMode) {
            isDualAudioMode = false;
            speakerMap = {}; // Reset speaker map
        }

        // Reset button to start mode
        const btnIcon = dualAudioButton.querySelector('.btn-icon');
        const btnText = dualAudioButton.querySelector('.btn-text');
        if (btnIcon) btnIcon.textContent = '🎙️';
        if (btnText) btnText.textContent = 'Iniciar';
        dualAudioButton.classList.remove('btn-stop');
        microphoneButton.disabled = false;

        // Update status indicator to ready
        updateStatusIndicator(false);
    }
    
    // Event listener for ENTER key on transcript input
    transcriptInput.addEventListener('keypress', (e) => {
        logger.log('Key pressed:', e.key);
        logger.log('Input value:', transcriptInput.value);
        logger.log('Current transcript:', currentTranscript);

        if (e.key === 'Enter') {
            logger.log('ENTER pressed');

            // Check if user typed something manually
            const manualText = transcriptInput.value.trim();
            logger.log('Manual text:', manualText);

            // If there's manual text, send it; otherwise send the live transcript
            const textToSend = manualText || currentTranscript;
            logger.log('Text to send:', textToSend);

            if (textToSend) {
                logger.log('Sending text:', textToSend);
                logger.log('Source:', manualText ? 'Manual input' : 'Live transcript');
                logger.log('WebSocket state:', socket ? socket.readyState : 'socket not initialized');

                // Send to server
                sendTranscriptionToServer(textToSend);

                // Clear input field
                transcriptInput.value = '';

                // Reset live transcript box if it exists
                if (liveTranscriptBox) {
                    liveTranscriptBox.innerHTML = '<p class="live-transcript" style="font-style: italic; color: #888;">Listening...</p>';
                }

                // Clear current transcript
                currentTranscript = '';
            } else {
                logger.log('No text to send!');
            }
        }
    });

    // Event listener for microphone button toggle
    microphoneButton.addEventListener('click', async () => {
        if (!isMicrophoneMode) {
            // Activate microphone and start capturing
            isMicrophoneMode = true;
            microphoneButton.classList.add('active');
            logger.log('Starting microphone capture...');

            await startMicrophoneCapture();
        } else {
            // Deactivate microphone and stop capturing
            isMicrophoneMode = false;
            microphoneButton.classList.remove('active');
            logger.log('Stopping microphone capture...');

            stopCapturing();
        }
    });

    // Function to start microphone capture
    async function startMicrophoneCapture() {
        if (!checkBrowserSupport()) {
            isMicrophoneMode = false;
            microphoneButton.classList.remove('active');
            return;
        }

        try {
            // Capture microphone audio
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // Check if audio track is available
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                alert('No microphone available. Please check your microphone settings.');
                stream.getTracks().forEach(track => track.stop());
                isMicrophoneMode = false;
                microphoneButton.classList.remove('active');
                return;
            }

            // Hide video preview for microphone mode
            videoPreview.style.display = 'none';
            document.querySelector('.preview-placeholder').style.display = 'flex';
            document.querySelector('.preview-placeholder').textContent = '🎤 Microphone Active';

            // Create audio stream
            const audioStream = new MediaStream(audioTracks);

            logger.log('Microphone audio stream created:', audioStream);
            logger.log('Audio tracks:', audioTracks);

            // Get supported MIME type
            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                alert('Your browser does not support any of the required audio recording formats.');
                audioStream.getTracks().forEach(track => track.stop());
                isMicrophoneMode = false;
                microphoneButton.classList.remove('active');
                return;
            }

            logger.log('Using MIME type:', mimeType);

            // Set options based on supported MIME type
            const options = {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            };

            // Create MediaRecorder with supported options
            try {
                mediaRecorder = new MediaRecorder(audioStream, options);
                logger.log('MediaRecorder created successfully for microphone');
            } catch (e) {
                // Fallback without specifying mimeType
                logger.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Add event handler for MediaRecorder data
            mediaRecorder.ondataavailable = (event) => {
                logger.log('MediaRecorder data available:', event.data.size, 'bytes');
                if (event.data.size > 0 && deepgramSocket && deepgramSocket.readyState === 1) {
                    logger.log('Sending audio data to Deepgram...');
                    deepgramSocket.send(event.data);
                } else {
                    logger.warn('Cannot send data. Deepgram ready state:', deepgramSocket ? deepgramSocket.readyState : 'null');
                }
            };

            // Initialize Deepgram for transcription
            logger.log('Initializing Deepgram socket for microphone...');
            initDeepgramSocket();

            // Disable dual audio button when microphone is active
            dualAudioButton.disabled = true;

        } catch (error) {
            logger.error('Error accessing microphone:', error);
            statusElement.textContent = 'Error: ' + error.message;

            // Provide more helpful error messages
            if (error.name === 'NotAllowedError') {
                statusElement.textContent = 'Error: Microphone permission denied. Please allow microphone access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                statusElement.textContent = 'Error: No microphone found. Please connect a microphone and try again.';
            } else if (error.name === 'NotSupportedError') {
                statusElement.textContent = 'Error: Audio capture is not supported in this browser. Please try Chrome, Edge, or Firefox.';
            }

            isMicrophoneMode = false;
            microphoneButton.classList.remove('active');
        }
    }

    // Event listeners
    // Dual Audio button - Capture both system audio and microphone (toggle)
    if (dualAudioButton) {
        logger.log('✅ Dual Audio button found, adding event listener...');
        dualAudioButton.addEventListener('click', () => {
            logger.log('🎙️ Dual Audio button clicked!');

            // If interview is active, stop it
            if (isDualAudioMode) {
                logger.log('⏹️ Stopping interview...');
                stopCapturing();
            } else {
                // Otherwise, start the interview
                logger.log('▶️ Starting interview...');
                startCapturingDualAudio();
            }
        });
    } else {
        logger.error('❌ Dual Audio button NOT found in DOM!');
    }

    // Overlay button - Open Electron app
    overlayButton.addEventListener('click', async () => {
        // Disable button while launching
        overlayButton.disabled = true;
        const btnIcon = overlayButton.querySelector('.btn-icon');
        const btnText = overlayButton.querySelector('.btn-text');
        if (btnIcon) btnIcon.textContent = '🚀';
        if (btnText) btnText.textContent = 'Loading...';

        try {
            const response = await fetch('/launch-overlay/', {
                method: 'GET',
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Show success message
                alert('✅ ' + data.message);
                // Reset button after 3 seconds
                setTimeout(() => {
                    overlayButton.disabled = false;
                    if (btnIcon) btnIcon.textContent = '🖥️';
                    if (btnText) btnText.textContent = 'Overlay';
                }, 3000);
            } else {
                // Show error message
                alert('❌ Error: ' + data.message);
                overlayButton.disabled = false;
                if (btnIcon) btnIcon.textContent = '🖥️';
                if (btnText) btnText.textContent = 'Overlay';
            }
        } catch (error) {
            logger.error('Error launching overlay:', error);
            alert('❌ Failed to launch overlay. Check console for details.');
            overlayButton.disabled = false;
            if (btnIcon) btnIcon.textContent = '🖥️';
            if (btnText) btnText.textContent = 'Overlay';
        }
    });

    // Initialize clear button on initial load (if on Interview page)
    setupClearButton();

    // Initialize WebSocket connection on page load
    initWebSocket();
});