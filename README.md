# 🎯 AI Interview Co-pilot

> Real-time AI-powered interview assistant with live transcription, intelligent question extraction, and context-aware responses.

[English](#english) | [Português](#português)

---

## English

### 🌟 Overview

AI Interview Co-pilot is an intelligent real-time assistant designed to help you ace technical interviews. It combines live speech-to-text transcription, AI-powered question extraction, and context-aware response generation to provide instant, personalized interview suggestions.

### ✨ Key Features

#### 🎨 **Modern UI & UX**
- **✨ NEW: 64px Compact Header**: Elegant gradient design with animated status indicators, model badges, and pill-style buttons
- **🎯 Enhanced Conversation UI**: Clear visual separation between questions (orange) and answers (blue) with hover effects
- **🗑️ Clear Chat Button**: One-click conversation history clearing with confirmation
- **📱 Responsive Design**: Mobile-optimized header that adapts to smaller screens
- **🎨 Modern Animations**: Smooth transitions, hover effects, and pulsing status indicators

#### 🎤 **Audio & Transcription**
- **🎤 Live Transcription**: Real-time speech-to-text using Deepgram Nova-3 API
- **🎙️ Dual Audio Capture**: Simultaneously captures system audio (screen sharing) and microphone with automatic speaker identification
- **📱 Phone Mode**: Microphone-only capture for phone interviews without screen sharing - toggle to hide preview and expand transcript
- **👥 Speaker Diarization**: Automatically distinguishes between Interviewer and Candidate voices with color-coded labels (🟥 Red for Interviewer, 🟩 Green for You)
- **🌐 Multi-language Support**: Automatic multi-language detection (English, Portuguese, French, Spanish, German, Hindi, Russian, Japanese, Italian, Dutch)

#### 🤖 **AI Models & Intelligence**
- **🤖 AI-Powered Responses**: Context-aware answers using GPT-4/GPT-4o-mini or local Ollama models
- **🏠 Local LLM Support**: Run completely offline with Ollama (Gemma, Llama, Mistral models)
- **🎮 Playground Mode**: Side-by-side model comparison (OpenAI vs Ollama) with real-time performance metrics
- **⚡ FAQ Cache System**: Instant responses (<50ms) for frequently asked questions with smart matching
- **🧠 Smart Question Extraction**: Automatically extracts clean questions from long, cluttered transcripts
- **🔄 Real-time Streaming**: WebSocket-based streaming for instant response delivery
- **🎯 Next Question Predictions**: AI predicts likely next questions based on job requirements and conversation flow
- **💼 Company Questions Generator**: Generate intelligent questions to ask the employer during interviews
- **🌐 Multilingual AI**: Predictions and responses automatically adapt to interview language (EN/FR/PT)

#### 📊 **Analytics & Management**
- **📊 Dashboard Analytics**: Interactive charts (activity, languages, questions, model performance) with 7-day history
- **📅 Google Calendar Integration**: Color-coded calendar with automatic interview detection (60-day range)
- **⚙️ Settings Management**: Browser-based configuration with visual feedback and model switching
- **📝 AI Resume Builder**: Drag & drop upload with AI-powered summaries and version history

#### 🛠️ **Developer Features**
- **🖥️ Electron Overlay**: Transparent, always-on-top overlay window for seamless interview experience
- **📄 Resume Analysis**: Detailed CV parsing and summarization for personalized responses
- **🎨 Modern UI**: Clean, responsive interface with live transcript mirroring
- **🔐 Secure Storage**: API keys stored in browser localStorage (never committed to git)

### 🆕 Recent Updates (v2.3)

**NEW: Phone Mode for Microphone-Only Interviews (v2.3):**
- 📱 **Phone Toggle**: New "📱 Telefone" toggle switch in Live Transcript section
- 🎤 **Microphone-Only Capture**: Activate phone mode to capture audio without screen sharing
- 📐 **Dynamic Layout**: Screen Preview hides and Live Transcript expands to full height automatically
- ⚡ **One-Click Activation**: Toggle ON to start microphone capture, OFF to stop
- 🔄 **Independent Mode**: Works separately from dual audio mode (screen + microphone)
- 📱 **Perfect for Phone Calls**: Ideal for traditional phone interviews without video/screen sharing
- 🎨 **Seamless Integration**: All AI features (question extraction, responses, predictions) work in phone mode

**Intelligent Question Prediction System (v2.2):**
- 🎯 **Predictions Toggle**: User-controlled toggle to enable/disable Next Question Predictions (ON by default)
- 🌐 **Multilingual Predictions**: Questions automatically generated in the same language as your interview conversation
  - Supports Portuguese, French, and English
  - Automatic language detection from transcription
  - 50+ keyword translations per language for accurate predictions
- 🧠 **Smart QuestionPredictor**: AI-powered system that analyzes job requirements and predicts next likely questions
  - Extracts technical skills from job description (Python, SQL, ETL, Spark, AWS, etc.)
  - Analyzes answer depth to determine question type (follow-up vs. related topic)
  - Confidence scoring system (60%-90%) based on relevance
  - Prioritizes uncovered job requirements
- 💼 **Company Questions Generator**: Generate intelligent questions to ask the employer
  - 2 General + 3 Technical + 2 Fit & Culture questions
  - Based on job description context
  - Click-to-send functionality for seamless use
  - Multilingual generation matching job description language

**FAQ Knowledge Base Enhancements (v2.1):**
- 🧠 **Compact FAQ Card**: Moved to bottom of dashboard, 70% smaller footprint with horizontal inline stats
- 📖 **Interactive FAQ Viewer**: Browse all FAQ questions with accordion-style expandable Q&A items
- 🔍 **Real-time Search**: Filter FAQ questions and answers as you type
- 🌐 **Bilingual Support**: 200-question bilingual FAQ (100 EN + 100 FR) for multilingual interviews
- 📊 **Extended Coverage**: 100 questions covering SQL, Data Engineering, Databricks, Snowflake, Power BI, Data Lakes
- 🎨 **Modern Design**: Purple gradient header, smooth animations, responsive mobile layout
- ⚡ **Performance**: Client-side caching for instant loading, XSS protection for security

**Major UI/UX Overhaul (v2.0):**
- ✨ **Modern 64px Compact Header**: New elegant design with gradient background, rounded corners, and soft shadows
  - Left: Animated status dot (green = ready, red = recording), model badge with gradient, date display
  - Center: Interview title/subtitle with ellipsis overflow
  - Right: Timer with icon, pill-style action buttons (Overlay, Iniciar/Parar)
  - 50% less vertical space, 100% more elegant

- 🎨 **Enhanced Conversation Interface**:
  - Clear button (🗑️) with confirmation dialog
  - Distinct color-coded borders: Questions (orange, 4px left border), Answers (blue, 4px left border)
  - Hover effects with elevation animation
  - Better spacing (20px between messages) and shadows

- 🎮 **New Playground Page**: Compare LLM responses side-by-side
  - OpenAI vs Ollama head-to-head comparison
  - Real-time response streaming
  - Performance metrics (response time, tokens)
  - Easy provider/model switching

- ⚙️ **Settings Page Enhancements**:
  - Visual feedback (green borders on save)
  - Model switching with instant badge updates
  - Ollama connection checker
  - Modern toggle design

- 📊 **Dashboard Improvements**:
  - Session tracking with localStorage persistence
  - Interview details visualization
  - Compact calendar integration
  - FAQ statistics

**Performance & Technical:**
- SPA-aware event handlers for seamless navigation
- Dynamic model badge updates (blue for OpenAI, green for Ollama)
- Status indicator state management (READY → RECORDING)
- Improved error handling and logging
- CSS organization with clear commented sections

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Interview Co-pilot                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   Web Interface  │◄────────►│  Electron Overlay│
│   (Port 8004)    │          │  (Transparent)   │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │     WebSocket (Broadcast)    │
         └──────────────┬───────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    Django Channels          │
         │    (WebSocket Consumer)     │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Question Extraction        │
         │  (GPT-3.5-turbo)           │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Response Generation        │
         │  (GPT-4/GPT-4o)            │
         └─────────────────────────────┘
```

### 🔄 Data Flow

```
1. 🎤 User speaks during interview
   ↓
2. 🔊 Browser captures audio (MediaRecorder API)
   ↓
3. 📡 Audio sent to Deepgram Nova-3 API
   ↓
4. 📝 Live transcript generated (interim + final)
   ↓
5. 🔄 Transcript broadcast via WebSocket to:
   - Web interface (display)
   - Electron overlay (mirror display)
   ↓
6. ✅ User presses ENTER to submit question
   ↓
7. 🧹 GPT-3.5-turbo extracts clean question(s)
   ↓
8. 📄 Full transcript sent to conversation history
   ↓
9. 🤖 GPT-4/GPT-4o generates context-aware response
   ↓
10. 💬 Response streamed back in real-time
```

### 📦 Technology Stack

**Backend:**
- Django 5.1.2
- Django Channels 4.1.0 (WebSocket support)
- Daphne 4.1.2 (ASGI server)
- OpenAI API (GPT-4, GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
- Ollama (Local LLM support - llama3.2, qwen2.5, deepseek-r1, etc.)
- Deepgram Nova-3 API (Speech-to-Text)
- PyPDF2 (Resume parsing)

**Frontend:**
- HTML5 / CSS3
- Vanilla JavaScript
- MediaRecorder API
- WebSocket API
- Marked.js (Markdown rendering)

**Desktop:**
- Electron (Transparent overlay window)
- IPC (Inter-Process Communication)

### 📁 Project Structure

```
ai-interview-copilot/
├── copilot/                    # Main Django app
│   ├── consumers.py           # WebSocket consumer (live transcription broadcast, language detection)
│   ├── pattern_analyzer.py    # QuestionPredictor (intelligent question prediction system)
│   ├── utils.py               # Helper functions (question extraction, response generation, FAQ cache)
│   ├── views.py               # HTTP views (summaries, calendar, FAQ upload, company questions)
│   └── urls.py                # URL routing
├── electron/                   # Electron overlay app
│   ├── main.js                # Electron main process
│   ├── index.html             # Overlay UI
│   ├── css/style.css          # Overlay styles
│   └── js/renderer.js         # Renderer process
├── static/copilot/            # Static files
│   ├── css/style.css          # Web interface styles (modern 64px header, conversation UI)
│   ├── js/
│   │   ├── interview.js       # Interview page logic (dual audio, transcription, WebSocket)
│   │   ├── dashboard.js       # Dashboard analytics (charts, metrics, session tracking)
│   │   ├── resume-builder.js  # Resume upload & AI summaries
│   │   ├── playground.js      # Model comparison (OpenAI vs Ollama)
│   │   ├── settings.js        # Settings management (API keys, model selection)
│   │   ├── calendar.js        # Google Calendar integration
│   │   └── navigation.js      # SPA navigation system
│   └── images/                # Assets
├── templates/                  # Django templates
│   └── index.html             # Main SPA (all pages in one file)
├── resume/                     # Resume PDFs (gitignored)
├── job_description/           # Job description files (gitignored)
│   └── job_description.txt    # Processed job description text
├── interview_copilot/         # Django project settings
│   ├── settings.py            # Project configuration
│   ├── asgi.py                # ASGI configuration (Daphne)
│   └── routing.py             # WebSocket routing
├── faq_data_eng.json          # Original FAQ knowledge base (20 questions)
├── faq_data_eng_extended.json # Extended FAQ (100 questions - English only)
├── faq_data_bilingual.json    # Bilingual FAQ (200 questions - EN/FR)
├── start_server.bat           # Simple Windows startup script
├── start_advanced.bat         # Advanced Windows control panel
├── .env.example               # Environment variables template
├── OLLAMA_SETUP.md           # Complete Ollama installation guide
├── TEST_OLLAMA_INTEGRATION.md # Ollama integration testing guide
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

### 🚀 Installation

#### Prerequisites

- Python 3.10+
- Node.js 16+ (for Electron)
- npm or yarn
- OpenAI API key
- Deepgram API key ($200 free credits, 750 hours of transcription)

#### Step 1: Clone the Repository

```bash
git clone https://github.com/maikonrenner/InterviewCo-pilot.git
cd InterviewCo-pilot
```

#### Step 2: Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install --upgrade openai
```

#### Step 3: Configure Environment Variables

Create a `.env` file in the `interview_copilot/` directory:

```env
# LLM Provider Configuration
LLM_PROVIDER=openai  # Options: 'openai' or 'ollama'

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Ollama Configuration (if using local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2  # Options: llama3.2, qwen2.5:14b, deepseek-r1:14b, etc.

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Django Settings
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Get API Keys:**
- OpenAI: [https://platform.openai.com/signup/](https://platform.openai.com/signup/) ([Tutorial](https://youtu.be/OB99E7Y1cMA?si=uEbJeVK5w8UYrHlw))
- Deepgram: [https://console.deepgram.com/signup](https://console.deepgram.com/signup) (Free $200 credits)
- Ollama Setup: See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for complete installation guide

#### Step 4: Set Up Resume and Job Description

1. Create directories for your documents:
```bash
mkdir resume
mkdir job_description
```

2. Add your resume PDF to `resume/` folder
3. Add job description PDF to `job_description/` folder

#### Step 5: Run Django Server

**Option A: Using Batch Script (Windows - Recommended):**

1. **Simple Startup** - Double-click `start_server.bat`:
   - Activates virtual environment automatically
   - Applies migrations
   - Prompts for port number (default: 8004)
   - Starts server

2. **Advanced Control Panel** - Double-click `start_advanced.bat`:
   - Interactive menu with 6 options:
     - 🚀 Start Server (Custom Port)
     - ⚡ Quick Start (Port 8004)
     - 🔄 Apply Migrations Only
     - 🧹 Clear Cache + Restart
     - 📦 Install/Update Dependencies
     - ❌ Exit
   - Color-coded UI with professional interface

**Option B: Manual Command Line:**

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Apply migrations
python manage.py migrate

# Run server on port 8004
python manage.py runserver 8004
```

#### Step 6: Set Up Electron Overlay (Optional)

```bash
cd electron
npm install
npm start
```

### 💻 Usage

#### Web Interface

1. Open browser: `http://localhost:8004`
2. Click **"🎙️ Iniciar Entrevista"** to begin dual audio capture
3. Allow screen sharing and microphone permissions when prompted
4. The system will capture both:
   - **System audio** (from screen sharing) → Labeled as **[Interviewer]** (red)
   - **Microphone audio** → Labeled as **[You]** (green)
5. Speak during the interview - live transcription with speaker labels appears
6. Press **ENTER** to send the transcript and get AI response
7. Click **"Open Overlay"** to launch Electron window (optional)
8. Click **"⏹️ Parar Entrevista"** to stop the interview

#### Electron Overlay

1. Launch automatically from web interface OR run manually:
```bash
cd electron
npm start
```

2. Position the overlay window on your screen
3. Adjust opacity using slider (10% - 100%)
4. Live transcript mirrors from web interface
5. Press **ENTER** to send question to AI
6. View clean question + AI response in conversation area

### 🔧 Configuration

#### Change AI Models

Edit `static/copilot/js/interview.js`:

```javascript
// Line 103: Default model for responses
model: 'gpt-4o' // Options: 'gpt-4', 'gpt-4o'
```

#### Adjust Response Length

Edit `copilot/utils.py`:

```python
# Line 290: Resume summary tokens
max_tokens=3000

# Line 567: AI response tokens (OpenAI)
max_tokens=450

# Line 626: AI response tokens (Ollama)
'num_predict': 450
```

#### Switch Between OpenAI and Ollama

Edit `interview_copilot/.env`:

```env
# Use OpenAI (cloud)
LLM_PROVIDER=openai

# OR use Ollama (local)
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

#### Customize System Prompt

Edit `copilot/utils.py` starting at line 525 to modify the AI persona and response format. The current prompt is optimized for concise, context-aware responses (2-4 sentences, 450 tokens max).

### 🧪 Key Features Explained

#### 1. Dual Audio Capture with Speaker Diarization

The system simultaneously captures audio from two sources and automatically identifies speakers:

**Audio Sources:**
- **Screen Sharing Audio**: Captures the interviewer's voice from virtual meeting platforms (Zoom, Teams, Google Meet)
- **Microphone Audio**: Captures your voice (candidate) directly from your microphone

**How It Works:**
```
1. User clicks "🎙️ Iniciar Entrevista"
   ↓
2. Browser requests two permissions:
   - Screen sharing with audio (getDisplayMedia)
   - Microphone access (getUserMedia)
   ↓
3. Web Audio API combines both streams into one
   ↓
4. Combined audio sent to Deepgram with diarization enabled
   ↓
5. Deepgram identifies speakers (Speaker 0, Speaker 1)
   ↓
6. System maps speakers to roles:
   - First speaker (usually from screen) → [Interviewer] (red label)
   - Second speaker (usually from mic) → [You] (green label)
   ↓
7. Live transcript shows color-coded speaker labels
```

**Visual Indicators:**
- 🟥 **[Interviewer]**: Red background - Questions from the interviewer
- 🟩 **[You]**: Green background - Your responses

This feature is perfect for virtual interviews where you need to capture both sides of the conversation accurately.

#### 1.5. Phone Mode (📱)

For phone-only interviews where screen sharing isn't needed:

**How It Works:**
```
1. User activates "📱 Telefone" toggle in Live Transcript section
   ↓
2. System automatically:
   - Hides Screen Preview container
   - Expands Live Transcript to full height (100%)
   - Starts microphone capture
   ↓
3. Microphone captures candidate's voice
   ↓
4. Audio sent to Deepgram for real-time transcription
   ↓
5. Transcription displayed in expanded view
   ↓
6. User deactivates toggle to stop:
   - Screen Preview reappears
   - Live Transcript returns to normal size
   - Microphone capture stops
```

**Key Benefits:**
- ✅ **Maximized Screen Space**: Full transcript view without screen preview
- ✅ **Phone Interview Optimized**: Perfect for phone calls without screen sharing
- ✅ **Independent Mode**: Separate from dual audio capture (screen + mic)
- ✅ **One-Click Toggle**: Easy activation/deactivation
- ✅ **Seamless Integration**: Works with all existing features (AI responses, question extraction, etc.)

**Visual Changes:**
- **Toggle ON**: Screen Preview hidden, Transcript expands upward to fill space
- **Toggle OFF**: Screen Preview visible, Transcript returns to normal layout

This feature is ideal for traditional phone interviews or when you only need to capture your own voice without screen content.

#### 2. Smart Question Extraction

The system uses GPT-3.5-turbo to extract clean questions from potentially long, cluttered transcripts:

**Input (Transcript):**
```
"Insert some duplicate records. Okay, as of now. Insert into EMPL one.
So I'll take a EMPL one, and I will try to insert some duplicate records.
So I will insert the duplicate records. Okay? And let us try to see,
how actually we can solve the next question..."
```

**Output (Extracted):**
```
"How do you find duplicate records in a table?"
```

#### 2. Context-Aware Responses

The AI maintains full conversation history and personalizes responses based on:
- Complete resume summary (2000 tokens)
- Job description context
- Previous conversation turns
- User's technical background

#### 3. Multi-Question Handling

When multiple questions are asked in one transcript, the system:
- Extracts ALL questions while preserving context
- Sends full transcript to LLM for comprehensive understanding
- Displays clean, formatted questions in UI

#### 4. Real-Time Broadcast

Uses Django Channels group messaging to broadcast live transcripts to:
- All connected web clients
- Electron overlay instances
- Maintains synchronization across all interfaces

#### 5. Dashboard Analytics

Track your interview performance with interactive visualizations:
- **Interview Activity Chart**: 7-day history of interview sessions
- **Language Distribution**: Pie chart of languages used in interviews
- **Questions Answered**: Bar chart tracking question count over time
- **AI Model Performance**: Compare response times across different models
- **Session Metrics**: Total interviews, average duration, questions answered, AI response time

All data is stored locally in the browser's localStorage.

#### 6. Google Calendar Integration

Automatically sync interview schedules from Google Calendar:
- **Visual Calendar**: Color-coded day blocks (🟩 green for upcoming, ⬜ gray for past interviews)
- **Smart Filtering**: Automatically detects interview-related events using multilingual keywords
- **Event Details**: Click on any day to view interview details (time, description, location)
- **60-Day Range**: Shows interviews from 60 days back to 60 days ahead

**Supported Keywords**: interview, entrevista, entretien, meeting, rencontre, discussion, échange, call, appel

#### 7. Settings Management

Configure API keys directly in the browser (no backend required):
- **OpenAI API Key**: Configure your OpenAI key for GPT models
- **Deepgram API Key**: Configure your Deepgram key for speech-to-text
- **Default AI Model**: Select preferred GPT model (GPT-4o, GPT-4o Mini, GPT-4 Turbo, etc.)
- **Auto-Language Detection**: System automatically detects and transcribes multiple languages
- **Local Storage**: All settings stored securely in browser's localStorage

**Visual Feedback**:
- Button changes to "⏳ Saving..." → "✅ Saved!"
- Fields turn green when successfully saved
- Success/error messages with animations

#### 8. AI Resume Builder

Upload and analyze documents with AI-powered summaries:
- **Resume Upload**: Drag & drop or browse for resume files (PDF, DOCX, TXT)
- **Job Description Input**: Paste text or upload file for job descriptions
- **AI Summaries**: GPT-4 generates concise summaries of both documents
- **Interview Details**: Add company name and job title for context
- **Version History**: Track multiple document versions
- **Document Management**: View, delete, and manage uploaded documents

#### 9. FAQ Knowledge Base System

Pre-load frequently asked questions for instant, cost-free responses:

**Core Features:**
- **Auto-Load**: Automatically loads FAQ from JSON files on startup
- **Instant Responses**: Cached answers returned in <50ms (no LLM call needed)
- **Hit Tracking**: Monitors which questions are most frequently asked
- **Cache Management**: Upload new FAQ files via drag-and-drop interface
- **Stats Dashboard**: View FAQ count, last update time, and usage statistics
- **Smart Matching**: Normalizes questions for fuzzy matching (case-insensitive, punctuation-agnostic)

**NEW: FAQ Viewer Interface:**
- **📖 Browse All Questions**: Click "👁️ View" button to open interactive FAQ viewer
- **Accordion UI**: Expandable/collapsible Q&A items for easy browsing
- **🔍 Real-time Search**: Filter questions and answers as you type
- **Visual Design**: Purple gradient header with smooth animations
- **Client-side Caching**: Instant loading after first fetch
- **XSS Protection**: HTML escaping for secure content display

**NEW: Bilingual Support:**
- **Extended FAQ**: 100 questions covering SQL, Data Engineering, Databricks, Snowflake, Power BI, Data Lakes
- **Bilingual FAQ**: 200 questions total (100 English + 100 French) for multilingual interviews
- **Professional Translations**: Technical accuracy maintained across languages
- **Sample Files Included**:
  - `faq_data_eng_extended.json`: 100 English questions
  - `faq_data_bilingual.json`: 200 bilingual questions (EN/FR)

**Performance Benefits:**
- ⚡ **100x-500x Faster**: Cache hit (50ms) vs LLM call (2-5 seconds)
- 💰 **Cost Savings**: No API calls for frequently asked questions
- 📊 **Efficiency Tracking**: Monitor cache hit rate to optimize FAQ coverage

#### 10. Local LLM with Ollama

Run the entire system offline with local models:
- **Privacy-First**: All data stays on your machine
- **Cost-Free**: No API costs after initial setup
- **Fast Inference**: Optimized for M-series Macs and NVIDIA GPUs
- **Model Options**: llama3.2 (fast), qwen2.5:14b (balanced), deepseek-r1:14b (quality)
- **Easy Switch**: Toggle between OpenAI and Ollama in settings
- **Complete Guide**: See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for installation

#### 11. Playground - Model Comparison

Compare different LLM responses side-by-side in real-time:
- **Dual Panel Interface**: Left panel (LLM 1) vs Right panel (LLM 2)
- **Flexible Selection**: Choose any combination:
  - OpenAI GPT-4o vs Ollama Gemma 3:4b
  - GPT-4o-mini vs GPT-4
  - Llama 3:8b vs Mistral 7b
- **Centralized Question Input**: Ask once, get answers from both models simultaneously
- **Real-time Streaming**: Watch responses generate character-by-character
- **Performance Metrics**: Compare response times and quality
- **Easy Provider Switching**: Toggle between OpenAI and Ollama per panel
- **Perfect for**: Testing prompts, evaluating models, choosing the best LLM for your needs

**How to Access**: Click "🎮 Playground" in the sidebar navigation

#### 12. Modern Header Design

The new 64px compact header provides maximum screen space while maintaining full functionality:
- **Animated Status Indicator**: Pulsing green dot (READY) → Solid red dot (RECORDING)
- **Dynamic Model Badge**:
  - Blue gradient for OpenAI models (🤖)
  - Green gradient for Ollama models (🦙)
  - Auto-updates when switching in Settings
- **Timer Display**: Gray background box with icon (⏱) and tabular numbers
- **Pill-Style Buttons**:
  - Purple gradient "Overlay" button
  - Green gradient "Iniciar" button (changes to red "Parar" when recording)
  - Smooth hover effects with elevation
- **Responsive Behavior**: On screens <1024px:
  - Date hidden
  - Button text hidden (icons only)
  - Reduced spacing
  - Maintains 64px height

#### 13. Enhanced Conversation UI

Improved visual organization for better readability:
- **Clear Button**: Red "🗑️ Clear" button in conversation header
  - Confirmation dialog before clearing
  - Preserves conversation system message
- **Color-Coded Messages**:
  - 🟧 **Questions**: Orange background (#fff3e0) with orange left border (#ff9800)
  - 🔵 **Answers**: Blue background (#e3f2fd) with blue left border (#2196F3)
- **Interactive Elements**:
  - Hover: Messages elevate with shadow increase
  - Smooth transitions (0.3s)
  - Rounded corners (10px)
- **Better Spacing**: 20px between messages (was 15px)
- **Shadows**: Subtle depth with layered shadows

#### 14. Next Question Predictions (🎯)

Intelligent prediction system that anticipates likely interview questions:

**How It Works:**
```
1. Interview question asked and answered
   ↓
2. QuestionPredictor analyzes:
   - Current topic (Python, SQL, ETL, etc.)
   - Answer depth (superficial vs. detailed)
   - Job requirements (extracted from description)
   - Covered vs. uncovered topics
   ↓
3. Language detection from transcription
   - Portuguese: "você", "qual", "como"
   - French: "vous", "quel", "comment"
   - English: "you", "what", "how"
   ↓
4. Generate 3 predictions with confidence scores
   - Follow-up questions (dig deeper, 85%-90%)
   - Related topics (move to next skill, 75%-88%)
   ↓
5. Translate predictions to detected language
   - "Can you describe" → "Pode descrever" (PT)
   - "What's your experience" → "Quelle est votre expérience" (FR)
   ↓
6. Display in predictions panel
   - Click to ask automatically
   - Toggle ON/OFF with 🎯 Predictions switch
```

**Features:**
- **Job-Aware**: Prioritizes skills mentioned in job description
- **Context-Sensitive**: Adjusts based on answer quality
- **Multilingual**: Auto-translates to interview language
- **User Control**: Toggle predictions ON/OFF at any time
- **Smart Categorization**: Follow-up vs. related topic questions

**Example (Portuguese Interview):**
```
Question: "Como você trabalha com Python?"
Answer: [Detailed response about libraries and projects]
Predictions:
  → "Quais bibliotecas Python você já utilizou?" (85%)
  → "Como você otimiza código Python?" (83%)
  → "Qual é sua experiência com SQL?" (80%)
```

#### 15. Company Questions Generator (💼)

Generate strategic questions to ask the employer during interviews:

**How It Works:**
```
1. Click "💼 Questions for Company" button
   ↓
2. System reads job description
   ↓
3. Detects language (English/French/Portuguese)
   ↓
4. GPT-4o-mini generates categorized questions:
   - 2 General (company overview, role expectations)
   - 3 Technical (tools, methodologies, challenges)
   - 2 Fit & Culture (team dynamics, growth opportunities)
   ↓
5. Display in panel with color-coded categories:
   - 🌐 General (blue)
   - ⚙️ Technical (purple)
   - 🤝 Fit & Culture (green)
   ↓
6. Click any question to send automatically
```

**Benefits:**
- Shows genuine interest in the role
- Demonstrates understanding of technical requirements
- Helps evaluate company fit
- Questions adapt to job description specifics
- Multilingual support (EN/FR/PT)

**Example Questions:**
```
🌐 General:
- What are the key success metrics for this role in the first 90 days?
- How does this position contribute to the company's strategic goals?

⚙️ Technical:
- What data stack and tools does the team currently use?
- How do you approach data quality and governance?
- What are the biggest data engineering challenges the team is facing?

🤝 Fit & Culture:
- How does the team collaborate on cross-functional projects?
- What opportunities exist for professional development and learning?
```

### 🔐 Security Notes

- **Never commit** `.env` files with API keys
- **Never commit** resume/job description PDFs (contains personal data)
- Use environment variables for all sensitive configuration
- `.gitignore` is configured to exclude sensitive files

### 🐛 Troubleshooting

#### WebSocket Connection Issues

```python
# Check if channel layer is configured in settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}
```

#### Electron Won't Launch

```bash
# Reinstall Electron dependencies
cd electron
rm -rf node_modules
npm install
npm start
```

#### Audio Capture Not Working

- Ensure browser permissions are granted
- Use HTTPS or localhost (required for MediaRecorder API)
- Check browser console for errors

### 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

### 👨‍💻 Author

**Maikon Renner**
- GitHub: [@maikonrenner](https://github.com/maikonrenner)
- Project: [InterviewCo-pilot](https://github.com/maikonrenner/InterviewCo-pilot)

### ⭐ Support

If you find this project helpful, please consider giving it a star on GitHub!

---

## Português

### 🌟 Visão Geral

AI Interview Co-pilot é um assistente inteligente em tempo real projetado para ajudá-lo a ter sucesso em entrevistas técnicas. Ele combina transcrição de fala para texto ao vivo, extração de perguntas com IA e geração de respostas conscientes do contexto para fornecer sugestões instantâneas e personalizadas.

### ✨ Recursos Principais

- **🎤 Transcrição ao Vivo**: Conversão de fala em texto em tempo real usando Deepgram Nova-3 API
- **🎙️ Captura Dupla de Áudio**: Captura simultaneamente áudio do sistema (compartilhamento de tela) e microfone com identificação automática de locutores
- **📱 Modo Telefone**: Captura apenas do microfone para entrevistas telefônicas sem compartilhamento de tela - toggle para ocultar preview e expandir transcrição
- **👥 Diarização de Locutores**: Distingue automaticamente entre Entrevistador e Candidato com etiquetas coloridas
- **🖥️ Overlay Electron**: Janela transparente sempre visível para experiência de entrevista perfeita
- **🤖 Respostas com IA**: Respostas conscientes do contexto usando modelos GPT-4/GPT-4o
- **🧠 Extração Inteligente de Perguntas**: Extrai automaticamente perguntas limpas de transcrições longas e poluídas
- **📄 Análise de Currículo**: Análise detalhada e resumo do CV para respostas personalizadas
- **🌐 Suporte Multi-idioma**: Detecção automática de múltiplos idiomas (inglês, português, francês, espanhol, alemão, etc.)
- **🔄 Streaming em Tempo Real**: Entrega instantânea de respostas via WebSocket
- **🎨 Interface Moderna**: Interface limpa e responsiva com espelhamento de transcrição ao vivo
- **📊 Dashboard Analytics**: Gráficos interativos e métricas para acompanhar desempenho em entrevistas
- **📅 Integração com Google Calendar**: Sincronize e visualize entrevistas futuras/passadas do Google Calendar
- **⚙️ Gerenciamento de Configurações**: Configuração de chaves de API (OpenAI e Deepgram) no navegador
- **📝 AI Resume Builder**: Upload e análise de currículos/descrições de vaga com resumos gerados por IA

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Interview Co-pilot                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│  Interface Web   │◄────────►│  Overlay Electron│
│   (Porta 8004)   │          │  (Transparente)  │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │     WebSocket (Broadcast)    │
         └──────────────┬───────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    Django Channels          │
         │    (WebSocket Consumer)     │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Extração de Perguntas      │
         │  (GPT-3.5-turbo)           │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Geração de Respostas       │
         │  (GPT-4/GPT-4o)            │
         └─────────────────────────────┘
```

### 🔄 Fluxo de Dados

```
1. 🎤 Usuário fala durante a entrevista
   ↓
2. 🔊 Navegador captura áudio (MediaRecorder API)
   ↓
3. 📡 Áudio enviado para Deepgram Nova-3 API
   ↓
4. 📝 Transcrição ao vivo gerada (interim + final)
   ↓
5. 🔄 Transcrição transmitida via WebSocket para:
   - Interface web (exibição)
   - Overlay Electron (exibição espelhada)
   ↓
6. ✅ Usuário pressiona ENTER para enviar pergunta
   ↓
7. 🧹 GPT-3.5-turbo extrai pergunta(s) limpa(s)
   ↓
8. 📄 Transcrição completa enviada ao histórico de conversa
   ↓
9. 🤖 GPT-4/GPT-4o gera resposta consciente do contexto
   ↓
10. 💬 Resposta transmitida de volta em tempo real
```

### 📦 Stack Tecnológico

**Backend:**
- Django 5.1.2
- Django Channels 4.1.0 (suporte WebSocket)
- Daphne 4.1.2 (servidor ASGI)
- OpenAI API (GPT-4, GPT-4o, GPT-3.5-turbo)
- Deepgram Nova-3 API (Speech-to-Text)
- PyPDF2 (análise de currículo)

**Frontend:**
- HTML5 / CSS3
- JavaScript Vanilla
- MediaRecorder API
- WebSocket API
- Marked.js (renderização Markdown)

**Desktop:**
- Electron (janela overlay transparente)
- IPC (comunicação entre processos)

### 🚀 Instalação

#### Pré-requisitos

- Python 3.10+
- Node.js 16+ (para Electron)
- npm ou yarn
- Chave API OpenAI
- Chave API Deepgram (créditos grátis de $200, 750 horas de transcrição)

#### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/maikonrenner/InterviewCo-pilot.git
cd InterviewCo-pilot
```

#### Passo 2: Configurar Ambiente Python

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
pip install --upgrade openai
```

#### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório `interview_copilot/`:

```env
# Configuração OpenAI
OPENAI_API_KEY=sua_chave_api_openai_aqui

# Configuração Deepgram
DEEPGRAM_API_KEY=sua_chave_api_deepgram_aqui

# Configurações Django
SECRET_KEY=sua_chave_secreta_django_aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Obter Chaves de API:**
- OpenAI: [https://platform.openai.com/signup/](https://platform.openai.com/signup/) ([Tutorial](https://youtu.be/OB99E7Y1cMA?si=uEbJeVK5w8UYrHlw))
- Deepgram: [https://console.deepgram.com/signup](https://console.deepgram.com/signup) (Créditos grátis de $200)

#### Passo 4: Configurar Currículo e Descrição da Vaga

1. Criar diretórios para seus documentos:
```bash
mkdir resume
mkdir job_description
```

2. Adicionar seu currículo em PDF na pasta `resume/`
3. Adicionar descrição da vaga em PDF na pasta `job_description/`

#### Passo 5: Executar Servidor Django

```bash
# Aplicar migrações
python manage.py migrate

# Executar servidor na porta 8004
python manage.py runserver 8004
```

#### Passo 6: Configurar Overlay Electron (Opcional)

```bash
cd electron
npm install
npm start
```

### 💻 Uso

#### Interface Web

1. Abrir navegador: `http://localhost:8004`
2. Clicar em **"🎙️ Iniciar Entrevista"** para iniciar captura dupla de áudio
3. Permitir permissões de compartilhamento de tela e microfone quando solicitado
4. O sistema irá capturar ambos:
   - **Áudio do sistema** (do compartilhamento de tela) → Rotulado como **[Interviewer]** (vermelho)
   - **Áudio do microfone** → Rotulado como **[You]** (verde)
5. Fale durante a entrevista - transcrição ao vivo com etiquetas de locutor aparece
6. Pressionar **ENTER** para enviar a transcrição e obter resposta da IA
7. Clicar em **"Open Overlay"** para abrir janela Electron (opcional)
8. Clicar em **"⏹️ Parar Entrevista"** para parar a entrevista

#### Overlay Electron

1. Iniciar automaticamente da interface web OU executar manualmente:
```bash
cd electron
npm start
```

2. Posicionar a janela overlay na tela
3. Ajustar opacidade usando o controle deslizante (10% - 100%)
4. Transcrição ao vivo espelhada da interface web
5. Pressionar **ENTER** para enviar pergunta à IA
6. Ver pergunta limpa + resposta da IA na área de conversa

### 🧪 Recursos Principais Explicados

#### 1. Captura Dupla de Áudio com Diarização de Locutores

O sistema captura simultaneamente áudio de duas fontes e identifica automaticamente os locutores:

**Fontes de Áudio:**
- **Áudio do Compartilhamento de Tela**: Captura a voz do entrevistador de plataformas de reunião virtual (Zoom, Teams, Google Meet)
- **Áudio do Microfone**: Captura sua voz (candidato) diretamente do seu microfone

**Como Funciona:**
```
1. Usuário clica em "🎙️ Iniciar Entrevista"
   ↓
2. Navegador solicita duas permissões:
   - Compartilhamento de tela com áudio (getDisplayMedia)
   - Acesso ao microfone (getUserMedia)
   ↓
3. Web Audio API combina ambos os streams em um
   ↓
4. Áudio combinado enviado ao Deepgram com diarização habilitada
   ↓
5. Deepgram identifica locutores (Speaker 0, Speaker 1)
   ↓
6. Sistema mapeia locutores para funções:
   - Primeiro locutor (geralmente da tela) → [Interviewer] (etiqueta vermelha)
   - Segundo locutor (geralmente do mic) → [You] (etiqueta verde)
   ↓
7. Transcrição ao vivo mostra etiquetas coloridas de locutores
```

**Indicadores Visuais:**
- 🟥 **[Interviewer]**: Fundo vermelho - Perguntas do entrevistador
- 🟩 **[You]**: Fundo verde - Suas respostas

Este recurso é perfeito para entrevistas virtuais onde você precisa capturar ambos os lados da conversa com precisão.

#### 2. Extração Inteligente de Perguntas

O sistema usa GPT-3.5-turbo para extrair perguntas limpas de transcrições potencialmente longas e confusas:

**Entrada (Transcrição):**
```
"Insert some duplicate records. Okay, as of now. Insert into EMPL one.
So I'll take a EMPL one, and I will try to insert some duplicate records.
So I will insert the duplicate records. Okay? And let us try to see,
how actually we can solve the next question..."
```

**Saída (Extraída):**
```
"Como encontrar registros duplicados em uma tabela?"
```

#### 2. Respostas Conscientes do Contexto

A IA mantém histórico completo da conversa e personaliza respostas baseadas em:
- Resumo completo do currículo (2000 tokens)
- Contexto da descrição da vaga
- Turnos anteriores da conversa
- Background técnico do usuário

#### 3. Tratamento de Múltiplas Perguntas

Quando múltiplas perguntas são feitas em uma transcrição, o sistema:
- Extrai TODAS as perguntas preservando o contexto
- Envia transcrição completa ao LLM para compreensão abrangente
- Exibe perguntas limpas e formatadas na UI

#### 4. Broadcast em Tempo Real

Usa mensagens de grupo do Django Channels para transmitir transcrições ao vivo para:
- Todos os clientes web conectados
- Instâncias do overlay Electron
- Mantém sincronização entre todas as interfaces

#### 5. Dashboard Analytics

Acompanhe seu desempenho em entrevistas com visualizações interativas:
- **Gráfico de Atividade**: Histórico de 7 dias de sessões de entrevista
- **Distribuição de Idiomas**: Gráfico de pizza dos idiomas usados
- **Perguntas Respondidas**: Gráfico de barras rastreando quantidade de perguntas ao longo do tempo
- **Desempenho dos Modelos AI**: Compare tempos de resposta entre diferentes modelos
- **Métricas de Sessão**: Total de entrevistas, duração média, perguntas respondidas, tempo de resposta da IA

Todos os dados são armazenados localmente no localStorage do navegador.

#### 6. Integração com Google Calendar

Sincronize automaticamente agendamentos de entrevistas do Google Calendar:
- **Calendário Visual**: Blocos de dias com código de cores (🟩 verde para futuras, ⬜ cinza para passadas)
- **Filtragem Inteligente**: Detecta automaticamente eventos relacionados a entrevistas usando palavras-chave multilíngues
- **Detalhes do Evento**: Clique em qualquer dia para ver detalhes da entrevista (hora, descrição, local)
- **Alcance de 60 Dias**: Mostra entrevistas de 60 dias atrás até 60 dias à frente

**Palavras-chave Suportadas**: interview, entrevista, entretien, meeting, rencontre, discussion, échange, call, appel

#### 7. Gerenciamento de Configurações

Configure chaves de API diretamente no navegador (sem necessidade de backend):
- **Chave API OpenAI**: Configure sua chave OpenAI para modelos GPT
- **Chave API Deepgram**: Configure sua chave Deepgram para conversão de fala em texto
- **Modelo AI Padrão**: Selecione o modelo GPT preferido (GPT-4o, GPT-4o Mini, GPT-4 Turbo, etc.)
- **Detecção Automática de Idioma**: Sistema detecta e transcreve automaticamente múltiplos idiomas
- **Armazenamento Local**: Todas as configurações armazenadas com segurança no localStorage do navegador

**Feedback Visual**:
- Botão muda para "⏳ Saving..." → "✅ Saved!"
- Campos ficam verdes quando salvos com sucesso
- Mensagens de sucesso/erro com animações

#### 8. AI Resume Builder

Upload e análise de documentos com resumos gerados por IA:
- **Upload de Currículo**: Arraste e solte ou navegue por arquivos de currículo (PDF, DOCX, TXT)
- **Entrada de Descrição da Vaga**: Cole texto ou faça upload de arquivo para descrições de vaga
- **Resumos AI**: GPT-4 gera resumos concisos de ambos os documentos
- **Detalhes da Entrevista**: Adicione nome da empresa e título da vaga para contexto
- **Histórico de Versões**: Rastreie múltiplas versões de documentos
- **Gerenciamento de Documentos**: Visualize, exclua e gerencie documentos enviados

### 🔐 Notas de Segurança

- **Nunca faça commit** de arquivos `.env` com chaves de API
- **Nunca faça commit** de PDFs de currículo/descrição de vaga (contém dados pessoais)
- Use variáveis de ambiente para todas as configurações sensíveis
- `.gitignore` está configurado para excluir arquivos sensíveis

### 🐛 Solução de Problemas

#### Problemas de Conexão WebSocket

```python
# Verifique se a camada de canais está configurada em settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}
```

#### Electron Não Inicia

```bash
# Reinstalar dependências do Electron
cd electron
rm -rf node_modules
npm install
npm start
```

#### Captura de Áudio Não Funciona

- Certifique-se de que as permissões do navegador foram concedidas
- Use HTTPS ou localhost (necessário para MediaRecorder API)
- Verifique o console do navegador para erros

### 📝 Licença

Licença MIT - sinta-se livre para usar este projeto para fins pessoais ou comerciais.

### 👨‍💻 Autor

**Maikon Renner**
- GitHub: [@maikonrenner](https://github.com/maikonrenner)
- Projeto: [InterviewCo-pilot](https://github.com/maikonrenner/InterviewCo-pilot)

### ⭐ Apoie

Se você achar este projeto útil, considere dar uma estrela no GitHub!
