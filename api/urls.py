from django.urls import path
from project_backend import views
from project_backend.views import login_view
from .api_views import sample_api 


urlpatterns = [
    path('hello/', sample_api, name='hello'),
    path('forms/', views.get_forms, name='get_forms'),
    path('save/', views.save_form, name='save_form'),
    path('update/<str:form_id>/', views.update_form, name='update_form'),
    path('delete/<str:form_id>/', views.soft_delete_form, name='soft_delete_form'),
    path('upload-image/', views.upload_image, name='upload_image'),
    path('login/', login_view, name='login'),
]
