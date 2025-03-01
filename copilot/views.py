from django.shortcuts import render
from django.conf import settings

def index(request):
    return render(request, 'index.html', {
        'deepgram_api_key': settings.DEEPGRAM_API_KEY
    })