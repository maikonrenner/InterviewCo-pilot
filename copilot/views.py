from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
import subprocess
import os
import json
import asyncio
from .utils import get_resume_summary, get_job_description_summary, extract_text_from_pdf, extract_company_and_position, extract_text_from_file, generate_response_async, reload_faq_cache, clear_faq_cache, get_faq_cache_stats, get_all_faq_data
import PyPDF2

def index(request):
    return render(request, 'index.html', {
        'deepgram_api_key': settings.DEEPGRAM_API_KEY
    })

def launch_overlay(request):
    """Launch the Electron overlay application"""
    try:
        # Get the electron directory path
        base_dir = settings.BASE_DIR
        electron_dir = os.path.join(base_dir, 'electron')

        # Check if electron directory exists
        if not os.path.exists(electron_dir):
            return JsonResponse({
                'status': 'error',
                'message': 'Electron directory not found'
            }, status=404)

        # Check if node_modules exists, if not, run npm install first
        node_modules_path = os.path.join(electron_dir, 'node_modules')
        if not os.path.exists(node_modules_path):
            # Run npm install in the background
            subprocess.Popen(
                ['cmd', '/c', 'npm install && npm start'],
                cwd=electron_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return JsonResponse({
                'status': 'success',
                'message': 'Installing dependencies and launching Electron overlay...'
            })

        # Launch Electron with npm start
        subprocess.Popen(
            ['cmd', '/c', 'npm start'],
            cwd=electron_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Electron overlay launched successfully!'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to launch Electron: {str(e)}'
        }, status=500)

@csrf_exempt
def upload_document(request):
    """Handle document upload for resume or job description"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        if 'file' not in request.FILES:
            return JsonResponse({'success': False, 'message': 'No file uploaded'}, status=400)

        uploaded_file = request.FILES['file']
        file_type = request.POST.get('type', 'resume')  # 'resume' or 'job'

        # Validate file extension
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()

        if file_ext not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'message': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
            }, status=400)

        # Determine upload directory
        if file_type == 'resume':
            upload_dir = os.path.join(settings.BASE_DIR, 'resume')
        else:
            upload_dir = os.path.join(settings.BASE_DIR, 'job_description')

        # Create directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)

        # Save file
        fs = FileSystemStorage(location=upload_dir)

        # Delete existing files in directory
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

        # Save new file
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_path = fs.path(filename)

        # Initialize variables for extraction
        company = None
        position = None
        job_summary = None
        resume_summary = None

        # If resume file, generate summary automatically
        if file_type == 'resume':
            try:
                print('Generating resume summary automatically...')
                resume_summary, resume_language, resume_language_code = get_resume_summary()
                if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                    resume_summary = None
                else:
                    # Store language info
                    response_data['language'] = resume_language
                    response_data['language_code'] = resume_language_code
            except Exception as e:
                print(f"Error generating resume summary: {str(e)}")
                resume_summary = None
                # Continue even if summary generation fails

        # If job description file, extract company and position
        if file_type == 'job':
            try:
                print('Extracting text from job description file...')
                job_text = extract_text_from_file(file_path)

                print('Extracting company and position from job description...')
                company, position = extract_company_and_position(job_text)
                print(f'Extracted: Company={company}, Position={position}')

                # Generate job description summary automatically
                print('Generating job description summary...')
                job_summary, job_language, job_language_code = get_job_description_summary()
                if "not found" in job_summary.lower() or "created" in job_summary.lower():
                    job_summary = None
                else:
                    # Store language info in response
                    if 'language' not in response_data:
                        response_data['language'] = job_language
                        response_data['language_code'] = job_language_code
            except Exception as e:
                print(f"Error processing job description: {str(e)}")
                # Continue even if extraction fails

        response_data = {
            'success': True,
            'message': 'File uploaded successfully',
            'file_path': file_path,
            'file_name': filename
        }

        # Add resume summary if it's a resume
        if file_type == 'resume' and resume_summary:
            response_data['resume_summary'] = resume_summary

        # Add extracted data if it's a job description
        if file_type == 'job' and company and position:
            response_data['company'] = company
            response_data['position'] = position
            response_data['job_summary'] = job_summary

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }, status=500)

@csrf_exempt
def generate_summaries(request):
    """Generate summaries for uploaded resume and job description"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        resume_summary = None
        job_summary = None
        resume_language = None
        resume_language_code = None
        job_language = None
        job_language_code = None

        # Generate resume summary
        try:
            resume_summary, resume_language, resume_language_code = get_resume_summary()
            if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                resume_summary = None
        except Exception as e:
            print(f"Resume summary generation failed: {str(e)}")
            resume_summary = None

        # Generate job summary
        try:
            job_summary, job_language, job_language_code = get_job_description_summary()
            if "not found" in job_summary.lower() or "created" in job_summary.lower():
                job_summary = None
        except Exception as e:
            print(f"Job summary generation failed: {str(e)}")
            job_summary = None

        if not resume_summary and not job_summary:
            return JsonResponse({
                'success': False,
                'message': 'No files found to generate summaries. Please upload documents first.'
            }, status=400)

        return JsonResponse({
            'success': True,
            'resume_summary': resume_summary or 'No resume found',
            'job_summary': job_summary or 'No job description found',
            'resume_language': resume_language,
            'resume_language_code': resume_language_code,
            'job_language': job_language,
            'job_language_code': job_language_code
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Summary generation failed: {str(e)}'
        }, status=500)

@csrf_exempt
def save_job_text(request):
    """Save pasted job description text and auto-extract company, position, and generate summary"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        data = json.loads(request.body)
        job_text = data.get('job_text', '').strip()

        if not job_text:
            return JsonResponse({'success': False, 'message': 'No text provided'}, status=400)

        # Save to job_description directory as text file
        job_dir = os.path.join(settings.BASE_DIR, 'job_description')
        os.makedirs(job_dir, exist_ok=True)

        # Delete existing files
        for filename in os.listdir(job_dir):
            file_path = os.path.join(job_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

        # Save new text file
        txt_path = os.path.join(job_dir, 'job_description.txt')
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(job_text)

        # Extract company and position using AI
        print('Extracting company and position from job description...')
        company, position = extract_company_and_position(job_text)
        print(f'Extracted: Company={company}, Position={position}')

        # Generate job description summary automatically
        print('Generating job description summary...')
        try:
            job_summary, job_language, job_language_code = get_job_description_summary()
            if "not found" in job_summary.lower() or "created" in job_summary.lower():
                job_summary = None
        except Exception as e:
            print(f"Job summary generation failed: {str(e)}")
            job_summary = None
            job_language = None
            job_language_code = None

        return JsonResponse({
            'success': True,
            'message': 'Job description saved and analyzed successfully',
            'company': company,
            'position': position,
            'job_summary': job_summary,
            'language': job_language,
            'language_code': job_language_code
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Save failed: {str(e)}'
        }, status=500)

def get_summaries(request):
    """Get existing summaries"""
    try:
        resume_summary = None
        job_summary = None
        resume_language = None
        resume_language_code = None
        job_language = None
        job_language_code = None

        # Get resume summary
        try:
            resume_summary, resume_language, resume_language_code = get_resume_summary()
            if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                resume_summary = 'No resume found'
        except Exception as e:
            print(f"Resume summary error: {str(e)}")
            resume_summary = 'No resume found'

        # Get job summary
        try:
            job_summary, job_language, job_language_code = get_job_description_summary()
            if "not found" in job_summary.lower() or "created" in job_summary.lower():
                job_summary = 'No job description found'
        except Exception as e:
            print(f"Job summary error: {str(e)}")
            job_summary = 'No job description found'

        return JsonResponse({
            'success': True,
            'resume_summary': resume_summary,
            'job_summary': job_summary,
            'resume_language': resume_language,
            'resume_language_code': resume_language_code,
            'job_language': job_language,
            'job_language_code': job_language_code
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to get summaries: {str(e)}'
        }, status=500)

@csrf_exempt
def get_calendar_interviews(request):
    """Fetch interviews from Google Calendar using MCP server"""
    try:
        import sys
        from datetime import datetime, timedelta

        # Add the MCP directory to path
        mcp_path = r'C:\Users\maikon.renner\Desktop\Claude\Synapse\interview-calendar-mcp'
        if mcp_path not in sys.path:
            sys.path.insert(0, mcp_path)

        # Import and initialize MCP
        from server import InterviewCalendarMCP

        mcp = InterviewCalendarMCP()
        mcp.authenticate()

        # Get parameters from request
        days_ahead = int(request.GET.get('days_ahead', 90))
        days_back = int(request.GET.get('days_back', 30))

        # Get upcoming interviews
        upcoming = mcp.get_upcoming_interviews(days_ahead=days_ahead)

        # Get past interviews
        past = mcp.get_past_interviews(days_back=days_back)

        # Combine and format interviews
        all_interviews = []

        for event in upcoming:
            all_interviews.append({
                'id': event['id'],
                'title': event['summary'],
                'description': event.get('description', ''),
                'start': event['start'],
                'location': event.get('location', ''),
                'status': 'upcoming',
                'link': event.get('link', '')
            })

        for event in past:
            all_interviews.append({
                'id': event['id'],
                'title': event['summary'],
                'description': event.get('description', ''),
                'start': event['start'],
                'location': event.get('location', ''),
                'status': 'past',
                'link': event.get('link', '')
            })

        return JsonResponse({
            'success': True,
            'interviews': all_interviews,
            'count': len(all_interviews)
        })

    except FileNotFoundError as e:
        return JsonResponse({
            'success': False,
            'message': 'Google Calendar credentials not found. Please configure MCP first.',
            'error': str(e)
        }, status=404)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to fetch calendar interviews: {str(e)}',
            'error': str(e)
        }, status=500)

@csrf_exempt
def compare_llms(request):
    """Compare LLMs endpoint - streams response from selected provider/model"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=400)

    try:
        data = json.loads(request.body)
        provider = data.get('provider', 'openai')
        model = data.get('model', 'gpt-4o-mini')
        question = data.get('question', '').strip()

        if not question:
            return JsonResponse({'error': 'Question is required'}, status=400)

        print(f"[Playground] Provider: {provider}, Model: {model}, Question: {question[:50]}...")

        # Get resume and job summaries for context
        resume_summary = ""
        job_summary = ""

        try:
            resume_summary, _, _ = get_resume_summary()
            if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                resume_summary = ""
        except Exception as e:
            print(f"[Playground] Resume summary error: {str(e)}")
            resume_summary = ""

        try:
            job_summary, _, _ = get_job_description_summary()
            if "not found" in job_summary.lower() or "created" in job_summary.lower():
                job_summary = ""
        except Exception as e:
            print(f"[Playground] Job summary error: {str(e)}")
            job_summary = ""

        print(f"[Playground] Context loaded - Resume: {len(resume_summary)} chars, Job: {len(job_summary)} chars")

        # Create streaming generator
        async def stream_response():
            try:
                # Create simple message history with CV/Job context
                messages = [
                    {"role": "user", "content": question}
                ]

                # Generate response using async function with context
                response_stream = await generate_response_async(
                    messages=messages,
                    resume_summary=resume_summary,
                    job_summary=job_summary,
                    model=model,
                    provider=provider
                )

                # Stream chunks
                if hasattr(response_stream, '__aiter__'):
                    # Async iterator (Ollama)
                    async for chunk in response_stream:
                        if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                            if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                                content = chunk.choices[0].delta.content
                                if content:
                                    yield content.encode('utf-8')
                else:
                    # Sync iterator (OpenAI)
                    for chunk in response_stream:
                        if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                            if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                                content = chunk.choices[0].delta.content
                                if content:
                                    yield content.encode('utf-8')

            except Exception as e:
                error_msg = f"Error generating response: {str(e)}"
                print(f"[Playground Error] {error_msg}")
                yield error_msg.encode('utf-8')

        # Convert async generator to sync generator for StreamingHttpResponse
        def sync_stream():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                async_gen = stream_response()
                while True:
                    try:
                        chunk = loop.run_until_complete(async_gen.__anext__())
                        yield chunk
                    except StopAsyncIteration:
                        break
            finally:
                loop.close()

        response = StreamingHttpResponse(
            sync_stream(),
            content_type='text/plain; charset=utf-8'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    except Exception as e:
        print(f"[Playground Error] {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def upload_faq(request):
    """Upload FAQ JSON file and reload cache"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        if 'file' not in request.FILES:
            return JsonResponse({'success': False, 'message': 'No file uploaded'}, status=400)

        uploaded_file = request.FILES['file']

        # Validate file extension
        if not uploaded_file.name.endswith('.json'):
            return JsonResponse({
                'success': False,
                'message': 'Invalid file type. Only .json files are allowed'
            }, status=400)

        # Read and validate JSON structure
        try:
            file_content = uploaded_file.read().decode('utf-8')
            faq_data = json.loads(file_content)

            # Validate structure
            if 'faqs' not in faq_data:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid JSON structure. Expected {"faqs": [{"question": "...", "answer": "..."}]}'
                }, status=400)

            faqs = faq_data.get('faqs', [])
            if not isinstance(faqs, list) or len(faqs) == 0:
                return JsonResponse({
                    'success': False,
                    'message': 'FAQ list is empty or invalid'
                }, status=400)

            # Validate each FAQ entry
            for i, faq in enumerate(faqs):
                if not isinstance(faq, dict) or 'question' not in faq or 'answer' not in faq:
                    return JsonResponse({
                        'success': False,
                        'message': f'Invalid FAQ entry at index {i}. Each entry must have "question" and "answer" fields'
                    }, status=400)

        except json.JSONDecodeError as e:
            return JsonResponse({
                'success': False,
                'message': f'Invalid JSON format: {str(e)}'
            }, status=400)

        # Save to faq_data_eng.json
        faq_file_path = os.path.join(settings.BASE_DIR, 'faq_data_eng.json')

        with open(faq_file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)

        print(f'[FAQ Upload] Saved {len(faqs)} FAQ entries to file')

        # Reload cache
        reload_result = reload_faq_cache()

        return JsonResponse({
            'success': True,
            'message': f'FAQ uploaded successfully! {reload_result["new_count"]} questions loaded into cache',
            'faq_count': reload_result['new_count'],
            'old_count': reload_result['old_count'],
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }, status=500)

@csrf_exempt
def get_faq_stats(request):
    """Get FAQ cache statistics"""
    try:
        stats = get_faq_cache_stats()

        if isinstance(stats, str):
            # Cache is empty
            return JsonResponse({
                'success': True,
                'cache_empty': True,
                'message': stats
            })

        return JsonResponse({
            'success': True,
            'cache_empty': False,
            'total_questions': stats['total_questions'],
            'total_hits': stats['total_hits'],
            'most_asked_question': stats['most_asked_question'],
            'most_asked_hits': stats['most_asked_hits']
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to get stats: {str(e)}'
        }, status=500)

@csrf_exempt
def clear_faq(request):
    """Clear FAQ cache"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        count = clear_faq_cache()

        return JsonResponse({
            'success': True,
            'message': f'FAQ cache cleared! {count} entries removed',
            'cleared_count': count
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to clear cache: {str(e)}'
        }, status=500)

@csrf_exempt
def get_faq_data(request):
    """Get all FAQ questions and answers"""
    try:
        faq_data = get_all_faq_data()

        return JsonResponse({
            'success': True,
            'faqs': faq_data,
            'count': len(faq_data)
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to get FAQ data: {str(e)}'
        }, status=500)

@csrf_exempt
def generate_company_questions(request):
    """Generate intelligent questions for the candidate to ask the company based on job description"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

    try:
        # Get job description summary and language
        job_summary, job_language, job_language_code = get_job_description_summary()

        if "not found" in job_summary.lower() or "created" in job_summary.lower():
            return JsonResponse({
                'success': False,
                'message': 'Please upload a job description first'
            }, status=400)

        # Read FULL job description text for better context
        job_dir = settings.JOB_DESCRIPTION_DIR
        job_files = sorted([f for f in os.listdir(job_dir) if f.endswith(('.pdf', '.txt', '.docx'))])

        job_full_text = ""
        company_name = ""
        position_title = ""

        if job_files:
            job_path = os.path.join(job_dir, job_files[0])
            job_full_text = extract_text_from_file(job_path)

            # Extract company name and position for more targeted questions
            company_name, position_title = extract_company_and_position(job_full_text)
            print(f"Generating questions for: {company_name} - {position_title}")

        # Use synchronous OpenAI client for simplicity
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Map language to instruction and category labels
        language_config = {
            'English': {
                'instruction': 'Generate all questions in English.',
                'general_label': 'Company & Role',
                'technical_label': 'Technical',
                'culture_label': 'Fit & Culture'
            },
            'French': {
                'instruction': 'Générez toutes les questions en français.',
                'general_label': 'Entreprise & Poste',
                'technical_label': 'Techniques',
                'culture_label': 'Fit & Culture'
            },
            'Portuguese': {
                'instruction': 'Gere todas as perguntas em português.',
                'general_label': 'Empresa & Vaga',
                'technical_label': 'Técnicas',
                'culture_label': 'Fit & Cultura'
            },
            'en': {
                'instruction': 'Generate all questions in English.',
                'general_label': 'Company & Role',
                'technical_label': 'Technical',
                'culture_label': 'Fit & Culture'
            },
            'fr': {
                'instruction': 'Générez toutes les questions en français.',
                'general_label': 'Entreprise & Poste',
                'technical_label': 'Techniques',
                'culture_label': 'Fit & Culture'
            },
            'pt': {
                'instruction': 'Gere todas as perguntas em português.',
                'general_label': 'Empresa & Vaga',
                'technical_label': 'Técnicas',
                'culture_label': 'Fit & Cultura'
            }
        }

        # Get language config (default to English if not found)
        config = language_config.get(job_language, language_config['English'])

        print(f"Detected job description language: {job_language} ({job_language_code})")
        print(f"Language instruction: {config['instruction']}")

        # Create enhanced prompt with full job description and company context
        company_context = f"Company: {company_name}\nPosition: {position_title}\n\n" if company_name and position_title else ""

        # Language-specific prompt templates
        language_prompts = {
            'en': f"""Based on the following job description, generate SHORT, direct questions that a candidate should ask {company_name if company_name else 'the company'} during an interview for the {position_title if position_title else 'role'} position.

LANGUAGE: Generate ALL questions in ENGLISH.

{company_context}CRITICAL REQUIREMENTS:
1. Questions MUST be SHORT and DIRECT (maximum 15-20 words)
2. Questions MUST reference SPECIFIC details from the job description
3. Questions MUST be conversational and natural
4. Questions MUST be in ENGLISH

Generate exactly 7 SHORT questions divided into these categories:

1. COMPANY & ROLE QUESTIONS (2 questions):
   - Short questions about the company or role specifics
   - Example: "How does this role contribute to [specific initiative]?"

2. TECHNICAL QUESTIONS (3 questions):
   - SHORT questions about specific technologies or technical challenges
   - Example: "What's the team's experience with [specific technology]?"

3. FIT & CULTURE QUESTIONS (2 questions):
   - SHORT questions about team dynamics, work culture, or growth
   - Example: "How does the hybrid work arrangement work in practice?"

REMEMBER: ALL questions in ENGLISH - Keep each question SHORT (max 15-20 words)

Full Job Description:
{job_full_text if job_full_text else job_summary}

Format your response as a JSON object with this structure:
{{
  "general": ["question 1", "question 2"],
  "technical": ["question 1", "question 2", "question 3"],
  "culture": ["question 1", "question 2"]
}}

Return ONLY the JSON object, no additional text.""",

            'fr': f"""Basé sur la description de poste suivante, générez des questions COURTES et directes qu'un candidat devrait poser à {company_name if company_name else "l'entreprise"} lors d'un entretien pour le poste de {position_title if position_title else 'ce rôle'}.

LANGUE: Générez TOUTES les questions en FRANÇAIS.

{company_context}EXIGENCES CRITIQUES:
1. Les questions DOIVENT être COURTES et DIRECTES (maximum 15-20 mots)
2. Les questions DOIVENT référencer des détails SPÉCIFIQUES de la description de poste
3. Les questions DOIVENT être conversationnelles et naturelles
4. Les questions DOIVENT être en FRANÇAIS

Générez exactement 7 questions COURTES divisées en ces catégories:

1. QUESTIONS ENTREPRISE & POSTE (2 questions):
   - Questions courtes sur l'entreprise ou les spécificités du poste
   - Exemple: "Comment ce rôle contribue-t-il à [initiative spécifique]?"

2. QUESTIONS TECHNIQUES (3 questions):
   - Questions COURTES sur des technologies ou défis techniques spécifiques
   - Exemple: "Quelle est l'expérience de l'équipe avec [technologie spécifique]?"

3. QUESTIONS FIT & CULTURE (2 questions):
   - Questions COURTES sur la dynamique d'équipe, la culture ou la croissance
   - Exemple: "Comment fonctionne le mode hybride en pratique?"

RAPPEL: TOUTES les questions en FRANÇAIS - Chaque question COURTE (max 15-20 mots)

Description de poste complète:
{job_full_text if job_full_text else job_summary}

Formatez votre réponse comme un objet JSON avec cette structure:
{{
  "general": ["question 1", "question 2"],
  "technical": ["question 1", "question 2", "question 3"],
  "culture": ["question 1", "question 2"]
}}

Retournez UNIQUEMENT l'objet JSON, pas de texte supplémentaire.""",

            'pt': f"""Baseado na seguinte descrição de vaga, gere perguntas CURTAS e diretas que um candidato deve fazer à {company_name if company_name else 'empresa'} durante uma entrevista para a vaga de {position_title if position_title else 'este cargo'}.

IDIOMA: Gere TODAS as perguntas em PORTUGUÊS.

{company_context}REQUISITOS CRÍTICOS:
1. As perguntas DEVEM ser CURTAS e DIRETAS (máximo 15-20 palavras)
2. As perguntas DEVEM referenciar detalhes ESPECÍFICOS da descrição da vaga
3. As perguntas DEVEM ser conversacionais e naturais
4. As perguntas DEVEM estar em PORTUGUÊS

Gere exatamente 7 perguntas CURTAS divididas nestas categorias:

1. PERGUNTAS EMPRESA & VAGA (2 perguntas):
   - Perguntas curtas sobre a empresa ou especificidades da vaga
   - Exemplo: "Como este cargo contribui para [iniciativa específica]?"

2. PERGUNTAS TÉCNICAS (3 perguntas):
   - Perguntas CURTAS sobre tecnologias ou desafios técnicos específicos
   - Exemplo: "Qual a experiência da equipe com [tecnologia específica]?"

3. PERGUNTAS FIT & CULTURA (2 perguntas):
   - Perguntas CURTAS sobre dinâmica de equipe, cultura ou crescimento
   - Exemplo: "Como funciona o modelo híbrido na prática?"

LEMBRE-SE: TODAS as perguntas em PORTUGUÊS - Cada pergunta CURTA (máx 15-20 palavras)

Descrição completa da vaga:
{job_full_text if job_full_text else job_summary}

Formate sua resposta como um objeto JSON com esta estrutura:
{{
  "general": ["pergunta 1", "pergunta 2"],
  "technical": ["pergunta 1", "pergunta 2", "pergunta 3"],
  "culture": ["pergunta 1", "pergunta 2"]
}}

Retorne APENAS o objeto JSON, sem texto adicional."""
        }

        # Get prompt in the correct language (default to English)
        prompt = language_prompts.get(job_language_code, language_prompts.get('en'))

        # Language-specific system messages
        system_messages = {
            'en': "You are an expert career coach specializing in helping candidates prepare highly specific, tailored questions for job interviews. You analyze job descriptions carefully and create questions that reference specific details, technologies, and company information. CRITICAL: You MUST generate ALL questions in ENGLISH only. Always return valid JSON.",
            'fr': "Vous êtes un coach de carrière expert spécialisé dans l'aide aux candidats pour préparer des questions spécifiques et adaptées pour les entretiens d'embauche. Vous analysez attentivement les descriptions de poste et créez des questions qui font référence à des détails, technologies et informations spécifiques sur l'entreprise. CRITIQUE: Vous DEVEZ générer TOUTES les questions en FRANÇAIS uniquement. Retournez toujours un JSON valide.",
            'pt': "Você é um coach de carreira especializado em ajudar candidatos a preparar perguntas específicas e personalizadas para entrevistas de emprego. Você analisa descrições de vagas cuidadosamente e cria perguntas que referenciam detalhes específicos, tecnologias e informações sobre a empresa. CRÍTICO: Você DEVE gerar TODAS as perguntas em PORTUGUÊS apenas. Sempre retorne JSON válido."
        }

        system_message = system_messages.get(job_language_code, system_messages.get('en'))

        # Call OpenAI API with enhanced parameters for better quality
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast and cost-effective
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,  # Slightly higher for more creative, specific questions
            max_tokens=1000,  # Increased to allow for more detailed questions
            response_format={"type": "json_object"}
        )

        # Extract questions from response
        questions_json = json.loads(response.choices[0].message.content.strip())

        return JsonResponse({
            'success': True,
            'questions': questions_json,
            'labels': {
                'general': config['general_label'],
                'technical': config['technical_label'],
                'culture': config['culture_label']
            },
            'language': job_language
        })

    except Exception as e:
        print(f"Error generating company questions: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Failed to generate questions: {str(e)}'
        }, status=500)