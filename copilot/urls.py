from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('launch-overlay/', views.launch_overlay, name='launch_overlay'),
    path('upload-document/', views.upload_document, name='upload_document'),
    path('generate-summaries/', views.generate_summaries, name='generate_summaries'),
    path('save-job-text/', views.save_job_text, name='save_job_text'),
    path('get-summaries/', views.get_summaries, name='get_summaries'),
    path('calendar-interviews/', views.get_calendar_interviews, name='get_calendar_interviews'),
    path('compare-llms/', views.compare_llms, name='compare_llms'),
    path('upload-faq/', views.upload_faq, name='upload_faq'),
    path('get-faq-stats/', views.get_faq_stats, name='get_faq_stats'),
    path('clear-faq/', views.clear_faq, name='clear_faq'),
]