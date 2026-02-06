from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
import json
from bson import ObjectId
from bson.errors import InvalidId
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render
from django.core.files.storage import default_storage
import os
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

# ✅ Import MongoDB collection SAFELY
from api.dat import collection


def home(request):
    return HttpResponse("Django Backend is Running")


def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc


def hello_view(request):
    return JsonResponse({"message": "Hello from Django!"})


@csrf_exempt
def save_form(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            data["is_deleted"] = False
            result = collection.insert_one(data)
            return JsonResponse(
                {"message": "Form data saved", "id": str(result.inserted_id)}
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "POST request expected"})


@csrf_exempt
def get_forms(request):
    if request.method == "GET":
        try:
            page_number = int(request.GET.get("page", 1))
            per_page = 10

            docs = list(
                collection.find({"is_deleted": {"$ne": True}}).sort("_id", 1)
            )
            total_count = len(docs)

            paginator = Paginator(docs, per_page)
            try:
                page_obj = paginator.page(page_number)
            except PageNotAnInteger:
                page_obj = paginator.page(1)
            except EmptyPage:
                page_obj = paginator.page(paginator.num_pages)

            records = [serialize_doc(doc) for doc in page_obj.object_list]

            return JsonResponse(
                {
                    "records": records,
                    "count": total_count,
                    "total_pages": paginator.num_pages,
                    "current_page": page_number,
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "GET request expected"})


@csrf_exempt
def update_form(request, form_id):
    if request.method == "POST":
        try:
            try:
                obj_id = ObjectId(form_id)
            except InvalidId:
                return JsonResponse({"error": "Invalid ID format"}, status=400)

            data = json.loads(request.body)

            result = collection.update_one(
                {"_id": obj_id},
                {"$set": data},
            )

            if result.matched_count:
                return JsonResponse({"message": "Form data updated"})
            else:
                return JsonResponse({"error": "Form not found"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "POST request expected"})


@csrf_exempt
def soft_delete_form(request, form_id):
    if request.method == "POST":
        try:
            result = collection.update_one(
                {"_id": ObjectId(form_id)},
                {"$set": {"is_deleted": True}},
            )
            if result.matched_count:
                return JsonResponse({"message": "Form soft-deleted"})
            else:
                return JsonResponse({"error": "Form not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "POST request expected"})


def my_paginated_view(request):
    try:
        object_list = [
            serialize_doc(doc)
            for doc in collection.find({"is_deleted": {"$ne": True}}).sort("_id", 1)
        ]
        paginator = Paginator(object_list, 10)
        page_number = request.GET.get("page")

        try:
            page_obj = paginator.get_page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.get_page(1)
        except EmptyPage:
            page_obj = paginator.get_page(paginator.num_pages)

        return render(request, "my_template.html", {"pages_obj": page_obj})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def upload_image(request):
    if request.method == "POST" and request.FILES.get("image"):
        image = request.FILES["image"]
        filename = default_storage.save(f"images/{image.name}", image)

        relative_url = os.path.join(settings.MEDIA_URL, filename)
        full_url = request.build_absolute_uri(relative_url)

        return JsonResponse(
            {
                "image_url": full_url,
                "relative_url": relative_url,
            }
        )

    return JsonResponse({"error": "Invalid request"}, status=400)


@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return JsonResponse({"token": token.key}, status=200)
            else:
                return JsonResponse({"error": "Invalid credentials"}, status=401)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Only POST method allowed"}, status=405)