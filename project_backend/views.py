from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from bson import ObjectId
from api.dat import collection
from bson.errors import InvalidId
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from django.conf import settings
from django.http import HttpResponse
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

def home(request):
    return HttpResponse("Django Backend is Running")

def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

def hello_view(request):
    return JsonResponse({'message': 'Hello from Django!'})

@csrf_exempt
def save_form(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            data['is_deleted']=False
            result = collection.insert_one(data)
            return JsonResponse({'message': 'Form data saved', 'id': str(result.inserted_id)})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'message': 'POST request expected'})

@csrf_exempt
def get_forms(request):
    if request.method == 'GET':
        try:
            # Get page number from query parameter, default to 1
            page_number = int(request.GET.get('page', 1))
            per_page = 10

            # Filter and sort documents
            docs = list(collection.find({'is_deleted': {"$ne": True}}).sort('_id', 1))
            total_count = len(docs)

            # Apply pagination manually
            paginator = Paginator(docs, per_page)
            try:
                page_obj = paginator.page(page_number)
            except PageNotAnInteger:
                page_obj = paginator.page(1)
            except EmptyPage:
                page_obj = paginator.page(paginator.num_pages)

            # Serialize documents
            records = [serialize_doc(doc) for doc in page_obj.object_list]

            return JsonResponse({
                'records': records,
                'count': total_count,
                'total_pages': paginator.num_pages,
                'current_page': page_number
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'message': 'GET request expected'})


@csrf_exempt
def update_form(request,form_id):
    if request.method =='POST':
        try:
            try:
                obj_id=ObjectId(form_id)
            except InvalidId:
                print("Invalid form ID")
                return JsonResponse({'error':'Invalid ID format'},status=400)

            data=json.loads(request.body)
            print(f"Received form_id: {form_id}")
            print(f"Received data: {data}")
            result=collection.update_one(
                {'_id':obj_id},
                {'$set': data}
            )
            if result.matched_count:
                return JsonResponse({'message':'Form Data updated'})
            else:
                return JsonResponse({'error':'Form not found'},status=404)
        except Exception as e:
            return JsonResponse({'error':str(e)},status=500) 
        return JsonResponse({'message':'POST request expected'}) 

@csrf_exempt
def soft_delete_form(request,form_id):
    if request.method=='POST':
        try:
            result=collection.update_one(
                {'_id':ObjectId(form_id)},
                {'$set':{'is_deleted':True}}
            )
            if result.matched_count:
                return JsonResponse({'message':'Form-soft-deleted'}) 
            else:
                return JsonResponse({'error':'Form not found'},status=404)
        except Exception as e:
            return JsonResponse({'error':str(e)},status=500)
    return JsonResponse({'message':'POST request expected'})  

def hello(request):
    return JsonResponse({'message': 'Hello from Django!'})  
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render

def my_paginated_view(request):
    try:
        object_list = [serialize_doc(doc) for doc in collection.find({'is_deleted': {"$ne": True}}).sort('_id', 1)]
        paginator = Paginator(object_list, 10)
        page_number = request.GET.get('page')
        try:
            page_obj = paginator.get_page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.get_page(1)
        except EmptyPage:
            page_obj = paginator.get_page(paginator.num_pages)
        return render(request, 'my_template.html', {'pages_obj': page_obj})  
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def upload_image(request):
    if request.method == 'POST' and request.FILES.get('image'):
        image = request.FILES['image']
        filename = default_storage.save(f"images/{image.name}", image)
        
        # Relative and absolute URLs
        relative_url = os.path.join(settings.MEDIA_URL, filename)
        full_url = request.build_absolute_uri(relative_url)

        return JsonResponse({
            'image_url': full_url,
            'relative_url': relative_url
        })
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                # Dummy token for demo purposes; replace with JWT or DRF Token later
                token,created=Token.objects.get_or_create(user=user)
                return JsonResponse({'token': 'token.key'}, status=200)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)


