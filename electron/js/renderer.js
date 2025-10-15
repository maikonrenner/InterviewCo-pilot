const { ipcRenderer } = require('electron');

// WebSocket connection
let socket;

// State variables
let currentTranscript = '';

// DOM Elements
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const closeBtn = document.getElementById('closeBtn');
const liveTranscriptContent = document.getElementById('liveTranscriptContent');
const conversationContent = document.getElementById('conversationContent');
const transcriptInput = document.getElementById('transcriptInput');

// Initialize WebSocket connection to Django server
function initWebSocket() {
    const wsUrl = `ws://127.0.0.1:8000/ws/interview/`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('WebSocket connection established');
        updateSystemMessage('Connected to Interview Co-pilot');
        // Enable input field
        transcriptInput.disabled = false;
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Electron received message:', data.type, data);

        switch(data.type) {
            case 'initialization':
                // Summaries loaded
                console.log('✅ Initialization data received');
                break;

            case 'live_transcript_update':
                // Receive live transcript from web interface
                console.log('📝 Live transcript update:', data.text, 'is_final:', data.is_final);
                updateLiveTranscript(data.text, data.is_final);
                break;

            case 'question':
                // Display the transcribed question
                console.log('❓ Question received:', data.text);
                addMessageToConversation('question', data.text, data.timestamp);
                break;

            case 'answer_chunk':
                // Handle streaming response chunks
                console.log('💬 Answer chunk received:', data.text);
                updateOrAddAnswer(data.text, data.timestamp);
                break;

            case 'answer_complete':
                // Mark the current answer as complete
                console.log('✅ Answer complete');
                completeCurrentAnswer();
                break;

            default:
                console.log('⚠️ Unknown message type:', data.type);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
        updateSystemMessage('Disconnected from Interview Co-pilot');
        transcriptInput.disabled = true;
        // Try to reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateSystemMessage('Connection error. Retrying...');
    };
}

// Update live transcript (mirror from web)
function updateLiveTranscript(text, isFinal) {
    console.log('Live transcript received:', text, 'is_final:', isFinal);

    currentTranscript = text;

    if (isFinal) {
        // Final transcript - show in yellow box
        liveTranscriptContent.innerHTML = `<p class="live-transcript">${text}</p>`;
    } else {
        // Interim transcript - show with opacity
        const parts = text.split(' ');
        const finalPart = parts.slice(0, -3).join(' ');
        const interimPart = parts.slice(-3).join(' ');
        liveTranscriptContent.innerHTML = `<p class="live-transcript">${finalPart} <span style="opacity: 0.6; font-style: italic;">${interimPart}</span></p>`;
    }

    liveTranscriptContent.scrollTop = liveTranscriptContent.scrollHeight;
}

// Send transcription to server
function sendTranscriptionToServer(text) {
    console.log('Sending transcription to server:', text);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'transcription',
            text: text,
            model: 'gpt-4o' // Default model
        }));
        console.log('Message sent to WebSocket!');
    } else {
        console.error('WebSocket is not open! Cannot send message.');
    }
}

// Update system message
function updateSystemMessage(message) {
    const systemMsg = document.querySelector('.system-message p');
    if (systemMsg) {
        systemMsg.textContent = message;
    }
}

// Add message to conversation (only keep latest question/answer pair)
function addMessageToConversation(type, text, timestamp) {
    // If it's a new question, clear all previous conversation (except system message)
    if (type === 'question') {
        // Keep only the system message
        const systemMessage = conversationContent.querySelector('.system-message');
        conversationContent.innerHTML = '';
        if (systemMessage) {
            conversationContent.appendChild(systemMessage);
        }
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = type;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = timestamp;

    const textParagraph = document.createElement('p');
    textParagraph.textContent = text;

    messageDiv.appendChild(timeSpan);
    messageDiv.appendChild(textParagraph);

    if (type === 'answer') {
        messageDiv.id = 'current-answer';
    }

    // Append new message
    conversationContent.appendChild(messageDiv);

    // Auto-scroll to show the latest message
    conversationContent.scrollTop = conversationContent.scrollHeight;
}

// Update or add answer
function updateOrAddAnswer(text, timestamp) {
    let answerDiv = document.getElementById('current-answer');

    if (!answerDiv) {
        addMessageToConversation('answer', text, timestamp);
    } else {
        const textParagraph = answerDiv.querySelector('p');
        textParagraph.textContent += text;
        conversationContent.scrollTop = conversationContent.scrollHeight;
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

// Event listener for ENTER key on transcript input
transcriptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        console.log('ENTER pressed');

        // Check if user typed something manually
        const manualText = transcriptInput.value.trim();

        // If there's manual text, send it; otherwise send the live transcript
        const textToSend = manualText || currentTranscript;

        if (textToSend) {
            console.log('Sending text:', textToSend);

            // Send to server
            sendTranscriptionToServer(textToSend);

            // Clear input field
            transcriptInput.value = '';

            // Reset live transcript
            currentTranscript = '';
            liveTranscriptContent.innerHTML = '<p class="placeholder">Waiting for transcription from web interface...</p>';
        }
    }
});

// Opacity control
opacitySlider.addEventListener('input', (e) => {
    const opacity = e.target.value;
    opacityValue.textContent = `${opacity}%`;
    ipcRenderer.send('set-opacity', opacity);
});

// Close button
closeBtn.addEventListener('click', () => {
    if (socket) {
        socket.close();
    }
    window.close();
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initWebSocket();

    // Set initial opacity
    ipcRenderer.send('set-opacity', opacitySlider.value);
});
