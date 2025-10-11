from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('launch-overlay/', views.launch_overlay, name='launch_overlay'),
]