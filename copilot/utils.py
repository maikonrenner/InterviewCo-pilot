import os
import json
import PyPDF2
from django.conf import settings
import openai
from openai import AsyncOpenAI
import hashlib
from datetime import datetime, timedelta

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else None

# Create async client for better performance
async_openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

# Cache for summaries to improve performance
_resume_cache = {
    'hash': None,
    'summary': None,
    'language': None,
    'language_code': None,
    'timestamp': None
}

_job_cache = {
    'hash': None,
    'summary': None,
    'language': None,
    'language_code': None,
    'timestamp': None
}

# FAQ Cache: Store frequently asked questions and their answers for instant responses
_faq_cache = {}  # Key: normalized question hash, Value: {'question': str, 'answer': str, 'timestamp': datetime, 'hit_count': int}

def normalize_question(question):
    """Normalize a question for cache lookup (remove punctuation, lowercase, trim)."""
    import re
    # Convert to lowercase
    normalized = question.lower()
    # Remove punctuation except spaces
    normalized = re.sub(r'[^\w\s]', '', normalized)
    # Remove extra whitespace
    normalized = ' '.join(normalized.split())
    return normalized

def get_question_hash(question):
    """Get a hash for a normalized question."""
    normalized = normalize_question(question)
    return hashlib.md5(normalized.encode()).hexdigest()

def get_cached_answer(question):
    """
    Get cached answer for a question if it exists.
    Returns dict with 'answer' and 'cached' flag, or None if not found.
    """
    question_hash = get_question_hash(question)

    if question_hash in _faq_cache:
        cached_entry = _faq_cache[question_hash]
        # Update hit count
        cached_entry['hit_count'] += 1
        print(f"[FAQ Cache HIT] Question: '{question[:50]}...' (hits: {cached_entry['hit_count']})")
        return {
            'answer': cached_entry['answer'],
            'cached': True,
            'hit_count': cached_entry['hit_count']
        }

    print(f"[FAQ Cache MISS] Question: '{question[:50]}...'")
    return None

def cache_answer(question, answer):
    """Cache an answer for future use."""
    question_hash = get_question_hash(question)

    _faq_cache[question_hash] = {
        'question': question,
        'answer': answer,
        'timestamp': datetime.now(),
        'hit_count': 0
    }

    print(f"[FAQ Cache SAVED] Question: '{question[:50]}...' (Total cached: {len(_faq_cache)})")

def get_faq_cache_stats():
    """Get statistics about the FAQ cache."""
    if not _faq_cache:
        return "FAQ Cache is empty"

    total_questions = len(_faq_cache)
    total_hits = sum(entry['hit_count'] for entry in _faq_cache.values())
    most_asked = max(_faq_cache.values(), key=lambda x: x['hit_count'])

    return {
        'total_questions': total_questions,
        'total_hits': total_hits,
        'most_asked_question': most_asked['question'],
        'most_asked_hits': most_asked['hit_count']
    }

def load_faq_from_file():
    """Load FAQ questions and answers from faq_data_eng.json file into cache."""
    faq_file_path = os.path.join(settings.BASE_DIR, 'faq_data_eng.json')

    if not os.path.exists(faq_file_path):
        print('[FAQ Loader] faq_data_eng.json not found - skipping preload')
        return 0

    try:
        with open(faq_file_path, 'r', encoding='utf-8') as f:
            faq_data = json.load(f)

        faqs = faq_data.get('faqs', [])
        loaded_count = 0

        for faq in faqs:
            question = faq.get('question', '').strip()
            answer = faq.get('answer', '').strip()

            if question and answer:
                # Use cache_answer to populate the cache
                cache_answer(question, answer)
                loaded_count += 1

        print(f'[FAQ Loader] Successfully loaded {loaded_count} FAQ entries into cache')
        return loaded_count

    except Exception as e:
        print(f'[FAQ Loader] Error loading FAQ file: {str(e)}')
        return 0

def reload_faq_cache():
    """Reload FAQ cache from file - clears existing cache and reloads."""
    global _faq_cache

    # Clear existing cache
    old_count = len(_faq_cache)
    _faq_cache.clear()
    print(f'[FAQ Reload] Cleared {old_count} entries from cache')

    # Reload from file
    new_count = load_faq_from_file()

    # Reset the consumer flag to force reload on next connection
    try:
        from copilot.consumers import InterviewConsumer
        InterviewConsumer._faq_loaded = False
        print(f'[FAQ Reload] Reset consumer flag for next connection')
    except Exception as e:
        print(f'[FAQ Reload] Warning: Could not reset consumer flag: {str(e)}')

    return {
        'old_count': old_count,
        'new_count': new_count,
        'success': True
    }

def clear_faq_cache():
    """Clear all FAQ cache entries."""
    global _faq_cache
    count = len(_faq_cache)
    _faq_cache.clear()
    print(f'[FAQ Clear] Cleared {count} entries from cache')
    return count

def get_all_faq_data():
    """Get all FAQ questions and answers from cache."""
    if not _faq_cache:
        return []

    # Convert cache to list of Q&A pairs, sorted by question
    faq_list = []
    for entry in _faq_cache.values():
        faq_list.append({
            'question': entry['question'],
            'answer': entry['answer'],
            'hit_count': entry['hit_count'],
            'timestamp': entry['timestamp'].isoformat() if entry['timestamp'] else None
        })

    # Sort by question alphabetically
    faq_list.sort(key=lambda x: x['question'].lower())

    return faq_list

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
    """Get a summary of ALL resume documents with language detection and caching."""
    resume_dir = settings.RESUME_DIR

    # Create directory if it doesn't exist
    if not os.path.exists(resume_dir):
        os.makedirs(resume_dir)
        return "Resume directory created. Please add your resume PDF file.", "English", "en"

    # Look for ALL PDF, TXT, and DOCX files (including versions)
    resume_files = sorted([f for f in os.listdir(resume_dir) if f.endswith(('.pdf', '.txt', '.docx'))])

    if not resume_files:
        return "No resume found in the resume directory.", "English", "en"

    # Calculate hash of all files to detect changes
    file_hashes = []
    for resume_file in resume_files:
        resume_path = os.path.join(resume_dir, resume_file)
        # Use file modification time + name as hash
        mtime = os.path.getmtime(resume_path)
        file_hashes.append(f"{resume_file}:{mtime}")

    # Extract text from ALL documents and combine them FIRST to detect language
    print(f'Found {len(resume_files)} resume document(s): {resume_files}')
    combined_resume_text = ""

    for i, resume_file in enumerate(resume_files, 1):
        resume_path = os.path.join(resume_dir, resume_file)
        text = extract_text_from_file(resume_path)

        # Add document separator for clarity
        combined_resume_text += f"\n\n=== DOCUMENT {i}: {resume_file} ===\n\n{text}"
        print(f'Extracted {len(text)} characters from {resume_file}')

    resume_text = combined_resume_text

    # Detect language BEFORE checking cache
    print('Detecting resume language...')
    language, language_code = detect_language(resume_text)
    print(f'Detected language: {language} ({language_code})')

    # Include language code in hash to ensure cache invalidation when language changes
    current_hash = hashlib.md5(f"{'_'.join(file_hashes)}_{language_code}".encode()).hexdigest()

    # Check cache with language-aware hash
    if _resume_cache['hash'] == current_hash and _resume_cache['summary']:
        print(f'[Resume Cache HIT] Using cached resume summary (hash: {current_hash[:8]}..., lang: {language_code})')
        return _resume_cache['summary'], _resume_cache['language'], _resume_cache['language_code']

    print(f'[Resume Cache MISS] Generating summaries... (hash: {current_hash[:8]}..., lang: {language_code})')

    # Language-specific instructions
    language_instructions = {
        'en': 'Write the summary in English.',
        'pt': 'Escreva o resumo em Português.',
        'fr': 'Rédigez le résumé en Français.',
        'es': 'Escribe el resumen en Español.',
        'de': 'Schreiben Sie die Zusammenfassung auf Deutsch.'
    }

    # Language-specific prompts for resume summary
    resume_prompts_by_language = {
        'en': f"""Please provide a DETAILED and COMPREHENSIVE summary of the following resume documents. Include ALL relevant information from ALL documents.

IMPORTANT: Write the ENTIRE summary in ENGLISH.

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
- Include ALL companies and roles from ALL documents
- Include metrics and achievements (percentages, amounts, timeframes)
- Use bullet points for clarity
- DO NOT summarize or skip information - include EVERYTHING relevant from ALL documents
- If documents have overlapping information, consolidate intelligently

Resume documents:
{resume_text}""",

        'fr': f"""Veuillez fournir un résumé DÉTAILLÉ et COMPLET des documents de CV suivants. Incluez TOUTES les informations pertinentes de TOUS les documents.

IMPORTANT: Rédigez l'INTÉGRALITÉ du résumé en FRANÇAIS.

**SECTIONS REQUISES:**
1. **Profil Professionnel**: Rôle actuel, années d'expérience, domaines d'expertise
2. **Expérience Professionnelle**: TOUTES les entreprises, postes, dates et responsabilités/réalisations PRINCIPALES (soyez précis concernant les technologies, outils et métriques)
3. **Compétences Techniques**: Liste complète des langages de programmation, frameworks, bases de données, outils, plateformes
4. **Formation**: Diplômes, institutions, années
5. **Certifications**: Toutes les certifications et formations
6. **Projets**: Projets notables avec les technologies utilisées et l'impact
7. **Langues**: Toutes les langues parlées et niveaux de compétence

**IMPORTANT:**
- Soyez TRÈS spécifique concernant les technologies, outils et méthodologies
- Incluez TOUTES les entreprises et rôles de TOUS les documents
- Incluez les métriques et réalisations (pourcentages, montants, délais)
- Utilisez des puces pour plus de clarté
- NE résumez PAS et ne sautez AUCUNE information - incluez TOUT ce qui est pertinent de TOUS les documents
- Si les documents contiennent des informations qui se recoupent, consolidez intelligemment

Documents de CV:
{resume_text}""",

        'pt': f"""Por favor, forneça um resumo DETALHADO e ABRANGENTE dos seguintes documentos de currículo. Inclua TODAS as informações relevantes de TODOS os documentos.

IMPORTANTE: Escreva o resumo INTEIRO em PORTUGUÊS.

**SEÇÕES OBRIGATÓRIAS:**
1. **Perfil Profissional**: Cargo atual, anos de experiência, áreas de especialização
2. **Experiência Profissional**: TODAS as empresas, cargos, datas e PRINCIPAIS responsabilidades/conquistas (seja específico sobre tecnologias, ferramentas e métricas)
3. **Habilidades Técnicas**: Lista completa de linguagens de programação, frameworks, bancos de dados, ferramentas, plataformas
4. **Formação**: Diplomas, instituições, anos
5. **Certificações**: Todas as certificações e treinamentos
6. **Projetos**: Projetos notáveis com tecnologias utilizadas e impacto
7. **Idiomas**: Todos os idiomas falados e níveis de proficiência

**IMPORTANTE:**
- Seja MUITO específico sobre tecnologias, ferramentas e metodologias
- Inclua TODAS as empresas e funções de TODOS os documentos
- Inclua métricas e conquistas (porcentagens, valores, prazos)
- Use marcadores para clareza
- NÃO resuma ou pule informações - inclua TUDO que for relevante de TODOS os documentos
- Se os documentos tiverem informações sobrepostas, consolide de forma inteligente

Documentos de currículo:
{resume_text}"""
    }

    # System messages by language
    resume_system_messages = {
        'en': "You are an assistant that creates detailed, structured summaries of resumes for interview preparation. You MUST write the entire summary in ENGLISH only.",
        'fr': "Vous êtes un assistant qui crée des résumés détaillés et structurés de CV pour la préparation aux entretiens. Vous DEVEZ rédiger l'intégralité du résumé en FRANÇAIS uniquement.",
        'pt': "Você é um assistente que cria resumos detalhados e estruturados de currículos para preparação de entrevistas. Você DEVE escrever o resumo inteiro em PORTUGUÊS apenas."
    }

    # Get prompt and system message in correct language (default to English)
    resume_prompt = resume_prompts_by_language.get(language_code, resume_prompts_by_language['en'])
    resume_system_message = resume_system_messages.get(language_code, resume_system_messages['en'])

    # Generate DETAILED summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": resume_system_message},
            {"role": "user", "content": resume_prompt}
        ],
        max_tokens=3000  # Increased to 3000 for multiple documents
    )

    summary = response.choices[0].message.content

    # Update cache
    _resume_cache['hash'] = current_hash
    _resume_cache['summary'] = summary
    _resume_cache['language'] = language
    _resume_cache['language_code'] = language_code
    _resume_cache['timestamp'] = datetime.now()

    print(f'[Resume Cache SAVED] Resume summary generated and cached')

    return summary, language, language_code

def get_job_description_summary():
    """Get a summary of the job description with language detection and caching."""
    job_dir = settings.JOB_DESCRIPTION_DIR

    # Create directory if it doesn't exist
    if not os.path.exists(job_dir):
        os.makedirs(job_dir)
        return "Job description directory created. Please add your job description PDF file.", "English", "en"

    # Look for PDF or TXT files
    job_files = sorted([f for f in os.listdir(job_dir) if f.endswith(('.pdf', '.txt', '.docx'))])

    if not job_files:
        return "No job description found in the job description directory.", "English", "en"

    # Calculate hash of all files to detect changes
    file_hashes = []
    for job_file in job_files:
        job_path = os.path.join(job_dir, job_file)
        # Use file modification time + name as hash
        mtime = os.path.getmtime(job_path)
        file_hashes.append(f"{job_file}:{mtime}")

    # Use the first job description found - extract text FIRST to detect language
    job_path = os.path.join(job_dir, job_files[0])
    job_text = extract_text_from_file(job_path)

    # Detect language BEFORE checking cache
    print('Detecting job description language...')
    language, language_code = detect_language(job_text)
    print(f'Detected language: {language} ({language_code})')

    # Include language code in hash to ensure cache invalidation when language changes
    current_hash = hashlib.md5(f"{'_'.join(file_hashes)}_{language_code}".encode()).hexdigest()

    # Check cache with language-aware hash
    if _job_cache['hash'] == current_hash and _job_cache['summary']:
        print(f'[Job Cache HIT] Using cached job description summary (hash: {current_hash[:8]}..., lang: {language_code})')
        return _job_cache['summary'], _job_cache['language'], _job_cache['language_code']

    print(f'[Job Cache MISS] Generating job description summary... (hash: {current_hash[:8]}..., lang: {language_code})')

    # Language-specific instructions
    language_instructions = {
        'en': 'Write the summary in English.',
        'pt': 'Escreva o resumo em Português.',
        'fr': 'Rédigez le résumé en Français.',
        'es': 'Escribe el resumen en Español.',
        'de': 'Schreiben Sie die Zusammenfassung auf Deutsch.'
    }

    # Language-specific prompts for job description summary
    prompts_by_language = {
        'en': f"""Please provide a DETAILED and COMPREHENSIVE summary of the following job description. Include ALL relevant information.

IMPORTANT: Write the ENTIRE summary in ENGLISH.

**REQUIRED SECTIONS:**
1. **Position Overview**: Job title, level (Junior/Mid/Senior), employment type, location/remote
2. **Company Information**: Company name, industry, size, culture (if mentioned)
3. **Key Responsibilities**: ALL main duties and tasks (be specific and detailed)
4. **Required Qualifications**:
   - Education requirements
   - Years of experience required
   - Technical skills (programming languages, frameworks, tools, platforms)
   - Soft skills (communication, leadership, teamwork, etc.)
5. **Preferred Qualifications**: Nice-to-have skills, certifications, additional experience
6. **Technical Stack**: Complete list of technologies, tools, databases, cloud platforms mentioned
7. **Benefits & Compensation**: Salary range (if mentioned), benefits, perks, work arrangements
8. **Interview Process**: If mentioned, describe the hiring process steps

**IMPORTANT:**
- Be VERY specific about technologies, tools, and methodologies
- Include ALL required and preferred qualifications
- Include metrics and expectations (percentages, amounts, timeframes) if mentioned
- Use bullet points for clarity
- DO NOT summarize or skip information - include EVERYTHING relevant
- If some sections are not mentioned in the job description, note that clearly

Job description text:
{job_text}""",

        'fr': f"""Veuillez fournir un résumé DÉTAILLÉ et COMPLET de la description de poste suivante. Incluez TOUTES les informations pertinentes.

IMPORTANT: Rédigez l'INTÉGRALITÉ du résumé en FRANÇAIS.

**SECTIONS REQUISES:**
1. **Aperçu du Poste**: Titre du poste, niveau (Junior/Intermédiaire/Senior), type d'emploi, lieu/télétravail
2. **Informations sur l'Entreprise**: Nom de l'entreprise, secteur, taille, culture (si mentionné)
3. **Responsabilités Principales**: TOUTES les tâches et responsabilités principales (soyez précis et détaillé)
4. **Qualifications Requises**:
   - Exigences de formation
   - Années d'expérience requises
   - Compétences techniques (langages de programmation, frameworks, outils, plateformes)
   - Compétences relationnelles (communication, leadership, travail d'équipe, etc.)
5. **Qualifications Préférées**: Compétences souhaitées, certifications, expérience supplémentaire
6. **Stack Technique**: Liste complète des technologies, outils, bases de données, plateformes cloud mentionnés
7. **Avantages et Rémunération**: Fourchette salariale (si mentionnée), avantages, bénéfices, modalités de travail
8. **Processus d'Entretien**: Si mentionné, décrivez les étapes du processus de recrutement

**IMPORTANT:**
- Soyez TRÈS spécifique concernant les technologies, outils et méthodologies
- Incluez TOUTES les qualifications requises et préférées
- Incluez les métriques et attentes (pourcentages, montants, délais) si mentionnés
- Utilisez des puces pour plus de clarté
- NE résumez PAS et ne sautez AUCUNE information - incluez TOUT ce qui est pertinent
- Si certaines sections ne sont pas mentionnées dans la description de poste, notez-le clairement

Texte de la description de poste:
{job_text}""",

        'pt': f"""Por favor, forneça um resumo DETALHADO e ABRANGENTE da seguinte descrição de vaga. Inclua TODAS as informações relevantes.

IMPORTANTE: Escreva o resumo INTEIRO em PORTUGUÊS.

**SEÇÕES OBRIGATÓRIAS:**
1. **Visão Geral da Posição**: Título do cargo, nível (Júnior/Pleno/Sênior), tipo de emprego, local/remoto
2. **Informações da Empresa**: Nome da empresa, setor, tamanho, cultura (se mencionado)
3. **Principais Responsabilidades**: TODAS as principais tarefas e responsabilidades (seja específico e detalhado)
4. **Qualificações Obrigatórias**:
   - Requisitos de formação
   - Anos de experiência necessários
   - Habilidades técnicas (linguagens de programação, frameworks, ferramentas, plataformas)
   - Soft skills (comunicação, liderança, trabalho em equipe, etc.)
5. **Qualificações Preferenciais**: Habilidades desejáveis, certificações, experiência adicional
6. **Stack Técnico**: Lista completa de tecnologias, ferramentas, bancos de dados, plataformas cloud mencionadas
7. **Benefícios e Remuneração**: Faixa salarial (se mencionada), benefícios, vantagens, modalidades de trabalho
8. **Processo de Entrevista**: Se mencionado, descreva as etapas do processo seletivo

**IMPORTANTE:**
- Seja MUITO específico sobre tecnologias, ferramentas e metodologias
- Inclua TODAS as qualificações obrigatórias e preferenciais
- Inclua métricas e expectativas (porcentagens, valores, prazos) se mencionados
- Use marcadores para clareza
- NÃO resuma ou pule informações - inclua TUDO que for relevante
- Se algumas seções não forem mencionadas na descrição da vaga, anote isso claramente

Texto da descrição da vaga:
{job_text}"""
    }

    # System messages by language
    system_messages = {
        'en': "You are an assistant that creates detailed, structured summaries of job descriptions for interview preparation. You MUST write the entire summary in ENGLISH only.",
        'fr': "Vous êtes un assistant qui crée des résumés détaillés et structurés de descriptions de poste pour la préparation aux entretiens. Vous DEVEZ rédiger l'intégralité du résumé en FRANÇAIS uniquement.",
        'pt': "Você é um assistente que cria resumos detalhados e estruturados de descrições de vagas para preparação de entrevistas. Você DEVE escrever o resumo inteiro em PORTUGUÊS apenas."
    }

    # Get prompt and system message in correct language (default to English)
    prompt = prompts_by_language.get(language_code, prompts_by_language['en'])
    system_message = system_messages.get(language_code, system_messages['en'])

    # Generate DETAILED summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000  # Increased from 300 to 2000 for detailed summary
    )

    summary = response.choices[0].message.content

    # Update cache
    _job_cache['hash'] = current_hash
    _job_cache['summary'] = summary
    _job_cache['language'] = language
    _job_cache['language_code'] = language_code
    _job_cache['timestamp'] = datetime.now()

    print(f'[Job Cache SAVED] Job description summary generated and cached')

    return summary, language, language_code

def detect_language(text):
    """Detect the primary language of the text using AI."""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": """You are a language detection assistant.

Detect the PRIMARY language of the text provided.

Return ONLY a JSON object in this exact format (no additional text):
{
    "language": "English",
    "language_code": "en"
}

Possible languages: English (en), Portuguese (pt), French (fr), Spanish (es), German (de)
If uncertain, use English as default."""},
                {"role": "user", "content": f"Detect the language of this text:\n\n{text[:1000]}"}
            ],
            max_tokens=50,
            temperature=0.3
        )

        result = response.choices[0].message.content.strip()

        try:
            import json
            data = json.loads(result)
            return data.get('language', 'English'), data.get('language_code', 'en')
        except:
            return 'English', 'en'

    except Exception as e:
        print(f"Error detecting language: {str(e)}")
        return 'English', 'en'

def extract_company_and_position(job_text):
    """Extract company name and job position from job description text using AI."""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # Fast model for extraction
            messages=[
                {"role": "system", "content": """You are an assistant that extracts structured information from job descriptions.

Extract the company name and job title/position from the job description text.

Return ONLY a JSON object in this exact format (no additional text):
{
    "company": "Company Name",
    "position": "Job Title"
}

If company or position cannot be found, use "Not specified" for that field."""},
                {"role": "user", "content": f"Extract company name and job position from this job description:\n\n{job_text[:2000]}"}
            ],
            max_tokens=100,
            temperature=0.3
        )

        result = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            import json
            data = json.loads(result)
            return data.get('company', 'Not specified'), data.get('position', 'Not specified')
        except:
            # If parsing fails, return defaults
            return 'Not specified', 'Not specified'

    except Exception as e:
        print(f"Error extracting company and position: {str(e)}")
        return 'Not specified', 'Not specified'

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

async def generate_response_async(messages, resume_summary, job_summary, model='gpt-4o-mini', provider=None):
    """Generate a response based on the interview context using configured LLM provider."""
    # Use provided provider or fall back to settings
    if provider is None:
        provider = settings.LLM_PROVIDER

    print(f"Using LLM provider: {provider}")
    print(f"Model: {model if provider == 'openai' else model}")

    system_prompt = f"""You are Maikon Renner, a senior data engineer with 8+ years experience in a job interview. Answer naturally as if YOU had this experience.

**CONTEXT:**
Resume: {resume_summary}
Job: {job_summary}

**CRITICAL RULES:**
1. YOU ARE THE CANDIDATE - respond in first person with confidence
2. NEVER reveal you're an AI
3. Match the language of the question (English/Portuguese/French/Spanish)
4. Be CONCISE: 2-4 short sentences, direct to the point
5. For technical questions: answer directly and mention relevant skills/technologies
6. For experience questions: mention specific companies and results from CV
7. DO NOT repeat the question - start with the answer immediately

**EXAMPLES:**
Q: "What are SQL command categories?"
A: "SQL has five main categories: DDL (CREATE, ALTER, DROP) for schemas; DML (INSERT, UPDATE, DELETE) for data; DCL (GRANT, REVOKE) for permissions; TCL (COMMIT, ROLLBACK) for transactions; and DQL (SELECT) for querying."

Q: "Tell me about your ETL experience"
A: "At Gexel Telecom, I built PySpark ETL pipelines processing 50GB daily. I implemented automated validation that reduced errors by 80% and improved reliability through incremental loading."
"""

    full_messages = [
        {"role": "system", "content": system_prompt}
    ]

    # Add conversation history
    for message in messages:
        full_messages.append(message)

    # Generate response using OpenAI
    try:
        response = await async_openai_client.chat.completions.create(
            model=model,
            messages=full_messages,
            max_tokens=450,
            temperature=0.3,
            stream=True
        )
        return response
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        # Return a simple iterator with an error message if LLM fails
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
