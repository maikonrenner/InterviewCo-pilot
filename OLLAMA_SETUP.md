# Ollama Local LLM Setup Guide

Este guia mostra como configurar e usar o Ollama localmente como alternativa à API do OpenAI.

## Por que usar Ollama?

- **Gratuito**: Sem custos de API
- **Privacidade**: Todos os dados permanecem no seu computador
- **Offline**: Funciona sem conexão com internet (após download do modelo)
- **Rápido**: Pode ser mais rápido que chamadas de API dependendo do hardware

## Pré-requisitos

- Ollama instalado localmente ([Download](https://ollama.com))
- Modelo Gemma 3:4b (ou outro modelo de sua escolha)
- Pelo menos 8GB de RAM (recomendado: 16GB)

## Passo 1: Instalar Ollama

1. Baixe e instale Ollama: https://ollama.com
2. Verifique a instalação:
   ```bash
   ollama --version
   ```

## Passo 2: Baixar o Modelo

```bash
# Baixar Gemma 3:4b (3.3GB)
ollama pull gemma3:4b

# Verificar modelos instalados
ollama list
```

### Modelos alternativos disponíveis:

- `gemma3:1b` - Menor e mais rápido (2GB)
- `gemma3:4b` - Balanceado (3.3GB) - **Recomendado**
- `gemma3:12b` - Melhor qualidade (7GB)
- `llama3:8b` - Alternativa popular (4.7GB)
- `mistral:7b` - Outra boa opção (4.1GB)

## Passo 3: Iniciar Servidor Ollama

```bash
ollama serve
```

Deixe este terminal aberto. O servidor rodará em `http://localhost:11434`.

## Passo 4: Testar Ollama

Em outro terminal, teste o modelo:

```bash
ollama run gemma3:4b
```

Digite uma pergunta para testar. Use `Ctrl+C` para sair.

## Passo 5: Configurar o Projeto

1. Edite seu arquivo `.env`:
   ```env
   # Altere o provider para ollama
   LLM_PROVIDER=ollama

   # Configurações do Ollama (opcionais, já têm valores padrão)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma3:4b
   ```

2. Se você não tem um arquivo `.env`, copie do exemplo:
   ```bash
   cp .env.example .env
   ```

3. Edite as configurações conforme necessário.

## Passo 6: Iniciar o Projeto

```bash
python manage.py runserver
```

Agora o sistema usará o Ollama em vez da API do OpenAI!

## Alternar entre OpenAI e Ollama

Para voltar a usar OpenAI, simplesmente altere no `.env`:

```env
LLM_PROVIDER=openai
```

## Comparação de Performance

| Aspecto | OpenAI (GPT-4) | Ollama (Gemma 3:4b) |
|---------|----------------|---------------------|
| **Custo** | Pago (por token) | Gratuito |
| **Qualidade** | Excelente | Muito boa |
| **Velocidade** | Rápido | Depende do hardware |
| **Privacidade** | Dados enviados para API | Totalmente local |
| **Requer internet** | Sim | Não |
| **Recursos de hardware** | Nenhum (cloud) | GPU/CPU potente |

## Troubleshooting

### Erro: "Connection refused"

**Problema**: Ollama não está rodando.

**Solução**: Execute `ollama serve` em um terminal separado.

### Erro: "Model not found"

**Problema**: O modelo não foi baixado.

**Solução**: Execute `ollama pull gemma3:4b`.

### Performance Lenta

**Soluções**:
1. Use um modelo menor: `ollama pull gemma3:1b`
2. Feche outros programas para liberar RAM
3. Se tiver GPU NVIDIA, o Ollama usará automaticamente
4. Atualize `OLLAMA_MODEL=gemma3:1b` no `.env`

### Respostas de baixa qualidade

**Soluções**:
1. Use um modelo maior: `ollama pull gemma3:12b` ou `llama3:8b`
2. Ajuste a temperatura no código (atualmente 0.3)
3. Volte para OpenAI se precisar da melhor qualidade

## Configuração Avançada

### Usar GPU NVIDIA

O Ollama detecta automaticamente GPUs NVIDIA com CUDA. Verifique:

```bash
ollama run gemma3:4b
# Você verá "Using GPU" se estiver funcionando
```

### Ajustar Parâmetros do Modelo

Edite `copilot/utils.py`, função `generate_ollama_response`:

```python
options={
    'temperature': 0.3,  # Criatividade (0.0-1.0)
    'num_predict': 400,  # Máximo de tokens
    'top_p': 0.9,       # Nucleus sampling
    'top_k': 40         # Top-k sampling
}
```

### Usar Ollama em Rede Local

Para acessar de outro dispositivo:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

Depois atualize o `.env`:

```env
OLLAMA_BASE_URL=http://192.168.1.X:11434
```

Substitua `192.168.1.X` pelo IP do computador rodando Ollama.

## Benchmarks Locais

Para testar diferentes modelos e comparar qualidade:

1. Baixe vários modelos:
   ```bash
   ollama pull gemma3:4b
   ollama pull llama3:8b
   ollama pull mistral:7b
   ```

2. Teste cada um no terminal:
   ```bash
   ollama run gemma3:4b
   # Faça uma pergunta técnica

   ollama run llama3:8b
   # Repita a mesma pergunta
   ```

3. Escolha o melhor modelo para seu caso e atualize o `.env`.

## Recursos

- [Ollama Documentação](https://github.com/ollama/ollama)
- [Modelos Disponíveis](https://ollama.com/library)
- [Gemma 3 no Ollama](https://ollama.com/library/gemma3)

## Suporte

Se tiver problemas, verifique:
1. `ollama serve` está rodando?
2. O modelo foi baixado com `ollama list`?
3. O `.env` tem `LLM_PROVIDER=ollama`?
4. Reiniciou o servidor Django após mudar o `.env`?
