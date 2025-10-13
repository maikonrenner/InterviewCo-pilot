document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dualAudioButton = document.getElementById('dualAudioButton');
    const overlayButton = document.getElementById('overlayButton');
    const statusElement = document.getElementById('status');
    const conversationBox = document.getElementById('conversationBox');
    const liveTranscriptBox = document.getElementById('liveTranscriptBox');
    const transcriptInput = document.getElementById('transcriptInput');
    const videoPreview = document.getElementById('videoPreview');
    const resumeSummary = document.getElementById('resumeSummary');
    const jobSummary = document.getElementById('jobSummary');
    const modelSelector = document.getElementById('modelSelector');
    const microphoneButton = document.getElementById('microphoneButton');

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

    // Update interview info when page is opened
    function updateInterviewInfo() {
        const interviewDetails = JSON.parse(localStorage.getItem('interviewDetails') || '{}');
        const companyPositionElement = document.getElementById('interviewCompanyPosition');
        const dateElement = document.getElementById('interviewDate');

        // Update company and position
        if (companyPositionElement) {
            if (interviewDetails.company && interviewDetails.position) {
                companyPositionElement.textContent = `${interviewDetails.company}: ${interviewDetails.position}`;
            } else {
                companyPositionElement.textContent = 'No interview details set. Configure in Resume Builder.';
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
    }

    // Listen for page changes to update interview info
    document.addEventListener('pageChanged', function(e) {
        if (e.detail.page === 'interview') {
            updateInterviewInfo();
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
            console.log(`🎯 Speaker ${speakerId} mapped to: ${speakerMap[speakerId]}`);
        }
        return speakerMap[speakerId];
    }

    // Combine system audio and microphone audio using Web Audio API
    async function combineMicrophoneAndSystemAudio(systemStream, microphoneStream) {
        try {
            console.log('🎛️ Combining audio streams...');

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

            console.log('✅ Audio streams combined successfully');
            return destination.stream;
        } catch (error) {
            console.error('❌ Error combining audio streams:', error);
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
            console.log('WebSocket connection established');
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'initialization':
                    // Update summaries
                    resumeSummary.textContent = data.resume_summary;
                    jobSummary.textContent = data.job_summary;
                    break;
                    
                case 'question':
                    // Display the transcribed question
                    addMessageToConversation('question', data.text, data.timestamp);
                    break;
                    
                case 'answer_chunk':
                    // Handle streaming response chunks
                    updateOrAddAnswer(data.text, data.timestamp);
                    break;
                    
                case 'answer_complete':
                    // Mark the current answer as complete
                    completeCurrentAnswer();
                    break;
            }
        };
        
        socket.onclose = () => {
            statusElement.textContent = 'Disconnected from server';
            console.log('WebSocket connection closed');
        };
        
        socket.onerror = (error) => {
            statusElement.textContent = 'Error: ' + error;
            console.error('WebSocket error:', error);
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
            console.log('🎙️ Dual audio mode: Diarization enabled');
        }

        const deepgramUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams(params);

        deepgramSocket = new WebSocket(deepgramUrl, [
            'token',
            DEEPGRAM_API_KEY,
        ]);
        
        deepgramSocket.onopen = () => {
            const sourceText = isMicrophoneMode ? 'Microphone Audio' : 'System Audio';
            statusElement.textContent = `Connected - Transcribing ${sourceText}`;
            console.log('Deepgram WebSocket connection established');
            console.log('Source type:', sourceText);

            // Enable transcript input
            transcriptInput.disabled = false;

            // Clear placeholder
            liveTranscriptBox.innerHTML = '<p class="live-transcript" style="font-style: italic; color: #888;">Listening...</p>';

            // For screen audio, add event listener here (if not already added)
            if (!isMicrophoneMode) {
                console.log('Setting up screen audio recording...');
                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0 && deepgramSocket.readyState == 1) {
                        console.log('Screen audio data available:', event.data.size, 'bytes');
                        deepgramSocket.send(event.data);
                    }
                });
            }

            // Safari may need smaller data chunks
            const timeslice = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 500 : 1000;
            console.log('Starting MediaRecorder with timeslice:', timeslice, 'ms');
            mediaRecorder.start(timeslice);
        };
        
        deepgramSocket.onmessage = (message) => {
            console.log('Deepgram message received');
            const received = JSON.parse(message.data);
            console.log('Deepgram response:', received);

            const alternative = received.channel.alternatives[0];
            const transcript = alternative.transcript;
            console.log('Transcript:', transcript, 'is_final:', received.is_final);

            // Process speaker information if diarization is enabled
            let speakerLabel = '';
            if (isDualAudioMode && alternative.words && alternative.words.length > 0) {
                const speakerId = alternative.words[0].speaker;
                speakerLabel = getSpeakerLabel(speakerId);
                console.log('Speaker detected:', speakerId, '→', speakerLabel);
            }

            // Clear previous timeout to avoid early submission while still speaking
            clearTimeout(transcriptionTimeout);

            if (transcript) {
                if (received.is_final) {
                    console.log('Final transcript received:', transcript);

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
                    console.log('Interim transcript received:', transcript);
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
                console.log('Empty transcript received');
            }
        };
        
        deepgramSocket.onclose = () => {
            console.log('Deepgram WebSocket connection closed');
            statusElement.textContent = 'Disconnected from transcription service';

            // Disable transcript input
            transcriptInput.disabled = true;
            transcriptInput.value = '';

            // Reset live transcript box
            liveTranscriptBox.innerHTML = '<p class="transcript-placeholder">Live transcription will appear here...</p>';
        };
        
        deepgramSocket.onerror = (error) => {
            console.error('Deepgram WebSocket error:', error);
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
        console.log('sendTranscriptionToServer called with text:', text);
        console.log('socket exists?', !!socket);
        console.log('socket readyState:', socket ? socket.readyState : 'N/A');
        console.log('WebSocket.OPEN =', WebSocket.OPEN);

        const selectedModel = modelSelector.value;
        console.log('Selected model:', selectedModel);

        // Strip HTML tags before sending to server
        const cleanText = stripHtmlTags(text);
        console.log('Clean text (without HTML):', cleanText);

        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('Sending to WebSocket...');
            socket.send(JSON.stringify({
                type: 'transcription',
                text: cleanText,
                model: selectedModel
            }));
            console.log('Message sent to WebSocket!');
        } else {
            console.error('WebSocket is not open! Cannot send message.');
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
        }

        // Append new messages at the end (bottom)
        conversationBox.appendChild(messageDiv);

        // Auto-scroll to show the latest message
        conversationBox.scrollTop = conversationBox.scrollHeight;
    }
    
    // Update or add answer
    function updateOrAddAnswer(text, timestamp) {
        let answerDiv = document.getElementById('current-answer');
        
        if (!answerDiv) {
            addMessageToConversation('answer', text, timestamp);
        } else {
            const textParagraph = answerDiv.querySelector('p');
            textParagraph.textContent += text;
            conversationBox.scrollTop = conversationBox.scrollHeight;
        }
    }
    
    // Complete current answer and render markdown
    function completeCurrentAnswer() {
        const answerDiv = document.getElementById('current-answer');
        if (answerDiv) {
            const textParagraph = answerDiv.querySelector('p');
            const fullText = textParagraph.textContent;

            console.log('Rendering markdown for answer:', fullText);

            // Replace the paragraph with rendered markdown
            const markdownDiv = document.createElement('div');
            markdownDiv.className = 'markdown-content';

            if (typeof marked !== 'undefined') {
                markdownDiv.innerHTML = marked.parse(fullText);
                console.log('Markdown rendered successfully');
            } else {
                console.error('Marked.js not loaded');
                markdownDiv.textContent = fullText;
            }

            answerDiv.replaceChild(markdownDiv, textParagraph);
            answerDiv.removeAttribute('id');
        }
    }
    
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
            console.log('🎙️ Starting dual audio capture (System + Microphone)...');

            // Load interview details from localStorage (saved by Resume Builder)
            const interviewDetails = JSON.parse(localStorage.getItem('interviewDetails') || '{}');

            sessionData = {
                company: interviewDetails.company || 'Not specified',
                position: interviewDetails.position || 'Not specified',
                date: new Date().toISOString().split('T')[0],
                model: modelSelector.value
            };
            sessionStartTime = Date.now();
            console.log('📋 Session data captured:', sessionData);

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

            console.log('✅ Both audio sources captured');

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
                console.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Set dual audio mode flag
            isDualAudioMode = true;

            // Initialize Deepgram for transcription (with multichannel)
            initDeepgramSocket();

            // Change button to stop mode
            dualAudioButton.textContent = '⏹️ Parar Entrevista';
            dualAudioButton.classList.add('btn-stop');
            microphoneButton.disabled = true;

        } catch (error) {
            console.error('Error accessing dual audio:', error);
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
                console.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Initialize Deepgram for transcription
            initDeepgramSocket();

            // Disable buttons (only for microphone mode, not used anymore)
            dualAudioButton.disabled = true;
            microphoneButton.disabled = true;

        } catch (error) {
            console.error('Error accessing screen audio:', error);
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
            const session = {
                company: sessionData.company,
                position: sessionData.position,
                date: sessionData.date || new Date().toISOString(),
                duration: duration,
                questions: 0, // TODO: Track questions count during interview
                language: 'English', // TODO: Detect from transcription
                model: sessionData.model,
                avgResponseTime: 0 // TODO: Calculate average response time
            };

            console.log('💾 Saving session data:', session);

            // Call global function from dashboard.js
            if (typeof window.addSessionToAnalytics === 'function') {
                window.addSessionToAnalytics(session);
                console.log('✅ Session saved to analytics');
            } else {
                console.error('❌ addSessionToAnalytics function not found');
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
        dualAudioButton.textContent = '🎙️ Iniciar Entrevista';
        dualAudioButton.classList.remove('btn-stop');
        microphoneButton.disabled = false;
    }
    
    // Event listener for ENTER key on transcript input
    transcriptInput.addEventListener('keypress', (e) => {
        console.log('Key pressed:', e.key);
        console.log('Input value:', transcriptInput.value);
        console.log('Current transcript:', currentTranscript);

        if (e.key === 'Enter') {
            console.log('ENTER pressed');

            // Check if user typed something manually
            const manualText = transcriptInput.value.trim();
            console.log('Manual text:', manualText);

            // If there's manual text, send it; otherwise send the live transcript
            const textToSend = manualText || currentTranscript;
            console.log('Text to send:', textToSend);

            if (textToSend) {
                console.log('Sending text:', textToSend);
                console.log('Source:', manualText ? 'Manual input' : 'Live transcript');
                console.log('WebSocket state:', socket ? socket.readyState : 'socket not initialized');

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
                console.log('No text to send!');
            }
        }
    });

    // Event listener for microphone button toggle
    microphoneButton.addEventListener('click', async () => {
        if (!isMicrophoneMode) {
            // Activate microphone and start capturing
            isMicrophoneMode = true;
            microphoneButton.classList.add('active');
            console.log('Starting microphone capture...');

            await startMicrophoneCapture();
        } else {
            // Deactivate microphone and stop capturing
            isMicrophoneMode = false;
            microphoneButton.classList.remove('active');
            console.log('Stopping microphone capture...');

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

            console.log('Microphone audio stream created:', audioStream);
            console.log('Audio tracks:', audioTracks);

            // Get supported MIME type
            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                alert('Your browser does not support any of the required audio recording formats.');
                audioStream.getTracks().forEach(track => track.stop());
                isMicrophoneMode = false;
                microphoneButton.classList.remove('active');
                return;
            }

            console.log('Using MIME type:', mimeType);

            // Set options based on supported MIME type
            const options = {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            };

            // Create MediaRecorder with supported options
            try {
                mediaRecorder = new MediaRecorder(audioStream, options);
                console.log('MediaRecorder created successfully for microphone');
            } catch (e) {
                // Fallback without specifying mimeType
                console.warn('Failed to create MediaRecorder with specified options, trying with defaults', e);
                mediaRecorder = new MediaRecorder(audioStream);
            }

            // Add event handler for MediaRecorder data
            mediaRecorder.ondataavailable = (event) => {
                console.log('MediaRecorder data available:', event.data.size, 'bytes');
                if (event.data.size > 0 && deepgramSocket && deepgramSocket.readyState === 1) {
                    console.log('Sending audio data to Deepgram...');
                    deepgramSocket.send(event.data);
                } else {
                    console.warn('Cannot send data. Deepgram ready state:', deepgramSocket ? deepgramSocket.readyState : 'null');
                }
            };

            // Initialize Deepgram for transcription
            console.log('Initializing Deepgram socket for microphone...');
            initDeepgramSocket();

            // Disable dual audio button when microphone is active
            dualAudioButton.disabled = true;

        } catch (error) {
            console.error('Error accessing microphone:', error);
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
        console.log('✅ Dual Audio button found, adding event listener...');
        dualAudioButton.addEventListener('click', () => {
            console.log('🎙️ Dual Audio button clicked!');

            // If interview is active, stop it
            if (isDualAudioMode) {
                console.log('⏹️ Stopping interview...');
                stopCapturing();
            } else {
                // Otherwise, start the interview
                console.log('▶️ Starting interview...');
                startCapturingDualAudio();
            }
        });
    } else {
        console.error('❌ Dual Audio button NOT found in DOM!');
    }

    // Overlay button - Open Electron app
    overlayButton.addEventListener('click', async () => {
        // Disable button while launching
        overlayButton.disabled = true;
        overlayButton.textContent = '🚀 Launching...';

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
                    overlayButton.textContent = '🖥️ Open Overlay';
                }, 3000);
            } else {
                // Show error message
                alert('❌ Error: ' + data.message);
                overlayButton.disabled = false;
                overlayButton.textContent = '🖥️ Open Overlay';
            }
        } catch (error) {
            console.error('Error launching overlay:', error);
            alert('❌ Failed to launch overlay. Check console for details.');
            overlayButton.disabled = false;
            overlayButton.textContent = '🖥️ Open Overlay';
        }
    });

    // Initialize WebSocket connection on page load
    initWebSocket();
});