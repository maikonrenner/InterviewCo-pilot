from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
import subprocess
import os

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