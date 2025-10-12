import os
import json
import PyPDF2
from django.conf import settings
import openai

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    if not os.path.exists(file_path):
        return "PDF file not found."

    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text()
            return text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def extract_text_from_file(file_path):
    """Extract text from a file (PDF or TXT)."""
    if not os.path.exists(file_path):
        return "File not found."

    try:
        # Check file extension
        if file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        elif file_path.endswith('.pdf'):
            return extract_text_from_pdf(file_path)
        else:
            return "Unsupported file format."
    except Exception as e:
        return f"Error extracting text from file: {str(e)}"

def get_resume_summary():
    """Get a summary of the resume."""
    resume_dir = settings.RESUME_DIR

    # Create directory if it doesn't exist
    if not os.path.exists(resume_dir):
        os.makedirs(resume_dir)
        return "Resume directory created. Please add your resume PDF file."

    # Look for PDF or TXT files
    resume_files = [f for f in os.listdir(resume_dir) if f.endswith(('.pdf', '.txt', '.docx'))]

    if not resume_files:
        return "No resume found in the resume directory."

    # Use the first resume found
    resume_path = os.path.join(resume_dir, resume_files[0])
    resume_text = extract_text_from_file(resume_path)
    
    # Generate DETAILED summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant that creates detailed, structured summaries of resumes for interview preparation."},
            {"role": "user", "content": f"""Please provide a DETAILED and COMPREHENSIVE summary of the following resume. Include ALL relevant information:

**REQUIRED SECTIONS:**
1. **Professional Profile**: Current role, years of experience, expertise areas
2. **Work Experience**: ALL companies, positions, dates, and KEY responsibilities/achievements (be specific about technologies, tools, and metrics)
3. **Technical Skills**: Complete list of programming languages, frameworks, databases, tools, platforms
4. **Education**: Degrees, institutions, years
5. **Certifications**: All certifications and training
6. **Projects**: Notable projects with technologies used and impact
7. **Languages**: All spoken languages and proficiency levels

**IMPORTANT:**
- Be VERY specific about technologies, tools, and methodologies
- Include ALL companies and roles
- Include metrics and achievements (percentages, amounts, timeframes)
- Use bullet points for clarity
- DO NOT summarize or skip information - include EVERYTHING relevant

Resume text:
{resume_text}"""}
        ],
        max_tokens=2000  # Increased from 300 to 2000 for detailed summary
    )

    return response.choices[0].message.content

def get_job_description_summary():
    """Get a summary of the job description."""
    job_dir = settings.JOB_DESCRIPTION_DIR

    # Create directory if it doesn't exist
    if not os.path.exists(job_dir):
        os.makedirs(job_dir)
        return "Job description directory created. Please add your job description PDF file."

    # Look for PDF or TXT files
    job_files = [f for f in os.listdir(job_dir) if f.endswith(('.pdf', '.txt', '.docx'))]

    if not job_files:
        return "No job description found in the job description directory."

    # Use the first job description found
    job_path = os.path.join(job_dir, job_files[0])
    job_text = extract_text_from_file(job_path)
    
    # Generate summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant that summarizes job descriptions."},
            {"role": "user", "content": f"Please provide a concise summary of the following job description in about 150 words: {job_text}"}
        ],
        max_tokens=300
    )
    
    return response.choices[0].message.content

def extract_question_from_transcript(transcript_text):
    """Extract ALL questions and relevant context from a potentially long transcript."""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # Fast model for extraction
            messages=[
                {"role": "system", "content": """You are an assistant that extracts interview questions from transcripts.

RULES:
1. Extract ALL questions if there are multiple questions
2. Keep relevant context that adds meaning to the questions
3. Remove only filler words, repetitions, and completely unrelated content
4. If there are 2-3 questions, extract ALL of them
5. Maintain the natural flow and context between questions
6. If there's no clear question, return 'No clear question detected'"""},
                {"role": "user", "content": f"Extract ALL interview questions and relevant context from this transcript:\n\n{transcript_text}"}
            ],
            max_tokens=300,  # Increased to allow multiple questions
            temperature=0.3
        )
        extracted_question = response.choices[0].message.content.strip()

        # If no clear question was found, return the original (trimmed)
        if "no clear question" in extracted_question.lower():
            return transcript_text[:300] + "..." if len(transcript_text) > 300 else transcript_text

        return extracted_question
    except Exception as e:
        print(f"Error extracting question: {str(e)}")
        # Fallback: return first 300 chars to preserve more context
        return transcript_text[:300] + "..." if len(transcript_text) > 300 else transcript_text

def generate_response(messages, resume_summary, job_summary, model='gpt-4'):
    """Generate a response based on the interview context."""
    print(f"Generating response with model: {model}")
    system_prompt = f"""
    **FUNÇÃO CRÍTICA:** Você DEVE assumir COMPLETAMENTE a persona de um candidato (Engenheiro de Dados Sênior) em uma entrevista de emprego. NUNCA revele que você é uma IA ou assistente virtual.

    **CONTEXTO DE CANDIDATURA:**

    Resume Summary: {resume_summary}

    Job Description Summary: {job_summary}

    **REGRAS ABSOLUTAS DE COMPORTAMENTO:**
    1. **VOCÊ É O CANDIDATO** - Responda como se VOCÊ tivesse a experiência do CV
    2. **NUNCA diga**: "Je suis une IA", "I am an AI", "Sou uma inteligência artificial", "Je suis un outil", etc.
    3. **PERGUNTAS PESSOAIS NÃO PROFISSIONAIS** (idade, endereço, vida pessoal):
       - Redirecione educadamente para tópicos profissionais
       - Exemplo: "Prefiro focar na minha experiência profissional. Posso falar sobre meus projetos em [EMPRESA]?"
    4. **PERGUNTAS PROFISSIONAIS**: Responda baseado no CV e Job Description
    5. **PERGUNTAS TÉCNICAS**: Responda com base no conhecimento técnico esperado para a vaga

    **REGRAS DE CUSTOMIZAÇÃO NAS RESPOSTAS:**
    1. **IMPORTANTE - Quando mencionar empresas do CV:**
       - **Perguntas técnicas gerais** (ex: "Qual a diferença entre X e Y?", "O que é X?"): Responda DIRETAMENTE sem mencionar empresas
       - **Perguntas sobre experiência** (ex: "Conte sobre sua experiência com X", "O que você fez na empresa Y?"): Mencione a empresa relevante
       - Só use exemplos do CV quando a pergunta PEDIR explicitamente sobre experiência prática
    2. **Prioridade:** Use as **ferramentas mencionadas no seu CV** apenas quando relevante ao contexto da pergunta
    3. **NÃO reescreva ou repita a pergunta** - comece direto com a resposta

    **MULTI-LANGUAGE SUPPORT (CRITICAL RULE):**
    - Você deve **identificar o idioma da pergunta do usuário** (English, Portuguese, French, Spanish, or German)
    - Você **deve responder inteiramente no idioma da pergunta** para manter o fluxo

    **DIRETRIZES DE RESPOSTA TÉCNICA:**
    1. **Tom e Profundidade:** Profissional, MUITO CONCISO (máximo 3-4 frases), nível Sênior
    2. **IMPORTANTE: RESPOSTAS CURTAS E DIRETAS - máximo 50 palavras + código pequeno se necessário**
    3. **Obrigatoriedade de Exemplos:**
       - **SQL/Python:** Para comandos ou funções, **gere código MÍNIMO (3-5 linhas máximo)**
       - **Power BI/DAX:** Para cálculos ou modelagem, **forneça uma fórmula DAX CURTA**
       - **Engenharia/Arquitetura:** Para conceitos (ETL, OLAP), seja BREVE e DIRETO

    **FORMATO DAS RESPOSTAS (SEM REESCREVER A PERGUNTA):**

    TIPO 1 - Para perguntas TÉCNICAS GERAIS (sem contexto de experiência):
    Responda DIRETAMENTE a pergunta técnica, sem mencionar empresas.

    TIPO 2 - Para perguntas sobre EXPERIÊNCIA:
    "At [EMPRESA DO CV], when [CONTEXTO], I utilized [FERRAMENTA/TECNOLOGIA]. This [BENEFÍCIO]."

    TIPO 3 - Para perguntas PESSOAIS NÃO PROFISSIONAIS:
    Redirecione educadamente para tópicos profissionais relacionados à vaga.

    **EXEMPLOS DE RESPOSTAS CURTAS:**

    EXEMPLO 1 (Français - Perguntas Pessoais):
    Pergunta: "Quel âge avez-vous? D'où venez-vous? Où habitez-vous?"
    Resposta: "Je préfère me concentrer sur mon expérience professionnelle et mes compétences techniques pour ce poste. Puis-je vous parler de mes projets en ingénierie de données?"

    EXEMPLO 2 (Français - Idiomas/Habilidades):
    Pergunta: "Parlez-vous anglais? Quelle heure est-il?"
    Resposta: "Oui, je parle couramment anglais, portugais et français. J'ai travaillé dans des environnements multilingues tout au long de ma carrière."

    EXEMPLO 3 (Português - Pergunta Técnica Geral):
    Pergunta: "Qual a diferença entre Pandas e PySpark?"
    Resposta: "Pandas processa dados em memória de um único servidor (ideal até 10GB). PySpark distribui processamento em clusters (ideal para Big Data). Use Pandas para análises rápidas e PySpark para ETL em larga escala."

    EXEMPLO 4 (English - Pergunta Técnica Geral):
    Pergunta: "What is Star Schema?"
    Resposta: "Star Schema organizes data with a central fact table connected to dimension tables. It optimizes query performance for analytical workloads."

    EXEMPLO 5 (English - Pergunta sobre Experiência):
    Pergunta: "Tell me about your ETL experience"
    Resposta: "At Gexel Telecom, I built ETL pipelines with PySpark processing 50GB daily. Automated data validation reduced errors by 80%."
    """
    
    full_messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history
    for message in messages:
        full_messages.append(message)
    
    # Generate response using OpenAI with streaming enabled
    try:
        print(f"Calling OpenAI API with model: {model}")
        response = openai.chat.completions.create(
            model=model,
            messages=full_messages,
            stream=True
        )
        return response
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        # Return a simple iterator with an error message if OpenAI fails
        class ErrorResponse:
            def __init__(self, error_message):
                self.error_message = error_message
                self.sent = False
                
            def __iter__(self):
                return self
                
            def __next__(self):
                if not self.sent:
                    self.sent = True
                    
                    class Choice:
                        def __init__(self, content):
                            self.delta = type('obj', (object,), {'content': content})
                    
                    class FakeResponse:
                        def __init__(self, content):
                            self.choices = [Choice(content)]
                    
                    return FakeResponse(f"Sorry, I encountered an error: {self.error_message}")
                else:
                    raise StopIteration
        
        return ErrorResponse(str(e))
