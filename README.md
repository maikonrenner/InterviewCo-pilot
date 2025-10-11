# 🎯 AI Interview Co-pilot

> Real-time AI-powered interview assistant with live transcription, intelligent question extraction, and context-aware responses.

[English](#english) | [Português](#português)

---

## English

### 🌟 Overview

AI Interview Co-pilot is an intelligent real-time assistant designed to help you ace technical interviews. It combines live speech-to-text transcription, AI-powered question extraction, and context-aware response generation to provide instant, personalized interview suggestions.

### ✨ Key Features

- **🎤 Live Transcription**: Real-time speech-to-text using Deepgram Nova-3 API
- **🖥️ Electron Overlay**: Transparent, always-on-top overlay window for seamless interview experience
- **🤖 AI-Powered Responses**: Context-aware answers using GPT-4/GPT-4o models
- **🧠 Smart Question Extraction**: Automatically extracts clean questions from long, cluttered transcripts
- **📄 Resume Analysis**: Detailed CV parsing and summarization for personalized responses
- **🌐 Multi-language Support**: Supports English, Portuguese, French, Spanish, and German
- **🔄 Real-time Streaming**: WebSocket-based streaming for instant response delivery
- **🎨 Modern UI**: Clean, responsive interface with live transcript mirroring

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
- OpenAI API (GPT-4, GPT-4o, GPT-3.5-turbo)
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
│   ├── consumers.py           # WebSocket consumer
│   ├── utils.py               # Helper functions (question extraction, response generation)
│   ├── views.py               # HTTP views
│   └── urls.py                # URL routing
├── electron/                   # Electron overlay app
│   ├── main.js                # Electron main process
│   ├── index.html             # Overlay UI
│   ├── css/style.css          # Overlay styles
│   └── js/renderer.js         # Renderer process
├── static/copilot/            # Static files
│   ├── css/style.css          # Web interface styles
│   ├── js/interview.js        # Web interface logic
│   └── images/                # Assets
├── templates/                  # Django templates
│   └── index.html             # Main interview interface
├── resume/                     # Resume PDFs (gitignored)
├── job_description/           # Job description PDFs (gitignored)
├── interview_copilot/         # Django project settings
│   ├── settings.py            # Project configuration
│   ├── asgi.py                # ASGI configuration
│   └── routing.py             # WebSocket routing
├── manage.py                  # Django management script
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
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

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

#### Step 4: Set Up Resume and Job Description

1. Create directories for your documents:
```bash
mkdir resume
mkdir job_description
```

2. Add your resume PDF to `resume/` folder
3. Add job description PDF to `job_description/` folder

#### Step 5: Run Django Server

```bash
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
2. Click **"Start Interview"** to begin audio capture
3. Select audio input source (microphone or screen audio)
4. Allow microphone permissions
5. Speak your questions - live transcription appears in yellow box
6. Press **ENTER** or click **Send** to get AI response
7. Click **"Open Overlay"** to launch Electron window (optional)

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
# Line 70: Resume summary tokens
max_tokens=2000

# Line 122: Question extraction tokens
max_tokens=300
```

#### Customize System Prompt

Edit `copilot/utils.py` starting at line 132 to modify the AI persona and response format.

### 🧪 Key Features Explained

#### 1. Smart Question Extraction

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
- **🖥️ Overlay Electron**: Janela transparente sempre visível para experiência de entrevista perfeita
- **🤖 Respostas com IA**: Respostas conscientes do contexto usando modelos GPT-4/GPT-4o
- **🧠 Extração Inteligente de Perguntas**: Extrai automaticamente perguntas limpas de transcrições longas e poluídas
- **📄 Análise de Currículo**: Análise detalhada e resumo do CV para respostas personalizadas
- **🌐 Suporte Multi-idioma**: Suporta inglês, português, francês, espanhol e alemão
- **🔄 Streaming em Tempo Real**: Entrega instantânea de respostas via WebSocket
- **🎨 Interface Moderna**: Interface limpa e responsiva com espelhamento de transcrição ao vivo

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
2. Clicar em **"Start Interview"** para iniciar captura de áudio
3. Selecionar fonte de entrada de áudio (microfone ou áudio da tela)
4. Permitir permissões de microfone
5. Falar suas perguntas - transcrição ao vivo aparece na caixa amarela
6. Pressionar **ENTER** ou clicar em **Send** para obter resposta da IA
7. Clicar em **"Open Overlay"** para abrir janela Electron (opcional)

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

#### 1. Extração Inteligente de Perguntas

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
