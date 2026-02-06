from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.sample_api),
    path('forms/', views.get_forms),
    path('save/', views.save_form),
    path('update/<str:form_id>/', views.update_form),
    path('delete/<str:form_id>/', views.soft_delete_form),
    path('upload-image/', views.upload_image),
    path('login/', views.login_view),
]