# Interview Co-pilot Electron Overlay

Uma janela transparente e sempre visível com os dois cards principais: **Live Transcript** e **Interview Conversation**.

## 🚀 Funcionalidades

- ✅ Janela transparente e sempre no topo
- ✅ Controle de opacidade (10-100%)
- ✅ Cards redimensionáveis e responsivos
- ✅ Conexão automática com o servidor Django
- ✅ Live Transcript em tempo real com Deepgram Nova-3
- ✅ Captura de áudio do microfone
- ✅ Captura de áudio do sistema (screen audio)
- ✅ Detecção automática de idioma (multi-language)
- ✅ Campo de input para enviar perguntas (ENTER)
- ✅ Interview Conversation sincronizada
- ✅ Markdown rendering nas respostas

## 📦 Instalação

1. **Navegue até a pasta do Electron:**
   ```bash
   cd electron
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

## ▶️ Executar

```bash
npm start
```

## 🎛️ Como Usar

1. **Certifique-se que o servidor Django está rodando** na porta 8004:
   ```bash
   python manage.py runserver 8004
   ```

2. **Execute o Electron overlay** conforme instruções acima ou clique no botão "🖥️ Open Overlay" na interface web

3. **Controles disponíveis:**
   - **Barra superior** (☰): Arraste para mover a janela
   - **Slider de Opacidade**: Ajuste a transparência (10-100%)
   - **Botão ✕**: Fechar a janela

4. **Captura de áudio:**
   - **Botão 🎤 (Microphone)**: Ativa/desativa captura do microfone
   - **Botão 🖥️ (Screen Audio)**: Ativa/desativa captura de áudio do sistema
   - Escolha UMA fonte de áudio por vez
   - A transcrição aparecerá em tempo real no card Live Transcript

5. **Enviar perguntas:**
   - Digite manualmente no campo de input, OU
   - Use a transcrição capturada automaticamente
   - Pressione **ENTER** para enviar para a LLM
   - A resposta aparecerá no card Interview Conversation

6. **Cards redimensionáveis:**
   - Arraste as bordas dos cards para redimensionar
   - Os cards são responsivos e se adaptam ao tamanho da janela

## 🔧 Configurações

- **Porta do servidor**: Configurada em `js/renderer.js` linha 12
- **Opacidade padrão**: 95% (ajustável via slider)
- **Tamanho inicial**: 800x600px (redimensionável)
- **Posição**: Sempre no topo de outras janelas

## 📝 Estrutura de Arquivos

```
electron/
├── package.json          # Configurações do Electron
├── main.js              # Processo principal do Electron
├── index.html           # Interface HTML
├── css/
│   └── style.css        # Estilos da interface
└── js/
    └── renderer.js      # Lógica da interface (WebSocket)
```

## 🐛 Troubleshooting

**Problema**: "Cannot find module 'electron'"
- **Solução**: Execute `npm install` na pasta `electron`

**Problema**: Janela não conecta ao servidor
- **Solução**: Verifique se o servidor Django está rodando na porta 8004

**Problema**: Opacidade não funciona
- **Solução**: Alguns sistemas operacionais têm limitações de transparência. Teste em outro SO.

## 💡 Dicas

- Use opacidade entre 70-95% para melhor visibilidade
- Posicione a janela em um canto da tela durante entrevistas
- Os cards podem ser redimensionados individualmente
- A conexão WebSocket reconecta automaticamente se cair

## 🔗 Integração com a Interface Web

Um botão "🖥️ Open Overlay" foi adicionado na interface web (http://127.0.0.1:8004/) para facilitar o acesso às instruções do Electron overlay.
