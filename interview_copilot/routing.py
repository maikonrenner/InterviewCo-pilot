from django.urls import re_path
from copilot.consumers import InterviewConsumer

websocket_urlpatterns = [
    re_path(r'ws/interview/$', InterviewConsumer.as_asgi()),
]