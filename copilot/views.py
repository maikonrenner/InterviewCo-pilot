from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
import subprocess
import os
import json
from .utils import get_resume_summary, get_job_description_summary, extract_text_from_pdf
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

        return JsonResponse({
            'success': True,
            'message': 'File uploaded successfully',
            'file_path': file_path,
            'file_name': filename
        })

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

        # Generate resume summary
        try:
            resume_summary = get_resume_summary()
            if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                resume_summary = None
        except Exception as e:
            print(f"Resume summary generation failed: {str(e)}")
            resume_summary = None

        # Generate job summary
        try:
            job_summary = get_job_description_summary()
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
            'job_summary': job_summary or 'No job description found'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Summary generation failed: {str(e)}'
        }, status=500)

@csrf_exempt
def save_job_text(request):
    """Save pasted job description text"""
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

        return JsonResponse({
            'success': True,
            'message': 'Job description saved successfully'
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

        # Get resume summary
        try:
            resume_summary = get_resume_summary()
            if "not found" in resume_summary.lower() or "created" in resume_summary.lower():
                resume_summary = 'No resume found'
        except Exception as e:
            print(f"Resume summary error: {str(e)}")
            resume_summary = 'No resume found'

        # Get job summary
        try:
            job_summary = get_job_description_summary()
            if "not found" in job_summary.lower() or "created" in job_summary.lower():
                job_summary = 'No job description found'
        except Exception as e:
            print(f"Job summary error: {str(e)}")
            job_summary = 'No job description found'

        return JsonResponse({
            'success': True,
            'resume_summary': resume_summary,
            'job_summary': job_summary
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to get summaries: {str(e)}'
        }, status=500)