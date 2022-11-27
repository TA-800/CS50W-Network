import json
import random
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator

from .models import User, Posts, Likes, Follows, Comments

paginator_pages = 10

# Helper function for index and profile views
def post_interaction(request):
    # This function handles all post interactions (like, dislike, edit, delete)

    # Get the post data
    data = json.loads(request.body)
    # If action is create/submit new post
    if data.get("action") == "submit_post":
        content = data.get("content")
        if content == "":
            return JsonResponse({"msg": "empty"}, status=201)
        post = Posts(user=request.user, content=content)
        post.save()
        return JsonResponse({"msg": "posted"}, status=201)
    
    # If action is delete post
    elif data.get("action") == "delete_post":
        post = Posts.objects.get(id=data.get("post_id"))
        if (not post):
            return JsonResponse({"msg": "undeleted"}, status=201)
        post.delete()
        return JsonResponse({"msg": "deleted"}, status=201)
    
    # If action is edit post
    elif data.get("action") == "edit_post":
        post = Posts.objects.get(id=data.get("post_id"))
        if (not post):
            return JsonResponse({"msg": "unedited"}, status=201)
        if data.get("new_content") == "":
            return JsonResponse({"msg": "empty"}, status=201)
        post.content = data.get("new_content")
        post.save()
        return JsonResponse({"msg": "edited"}, status=201)
    
    # If action is like post
    elif data.get("action") == "like_post":
        post = Posts.objects.get(id=data.get("post_id"))
        if (not post):
            return JsonResponse({"msg": "couldnt_like"}, status=201)
        # First, check if user has liked post before
        like, created = Likes.objects.get_or_create(user=request.user, post=post, defaults={"like": 1})
        # If user wants to change like from dislike to like
        if (created == False):
            if like.like == -1:
                like.like = 1
                post.dislike_num -= 1
            # If user wants to change like from default to like
            elif like.like == 0:
                like.like = 1
            # If user wants to remove their like
            else: # like.like == 1
                like.like = 0
                post.like_num -= 2 # Subtract 2 because we are adding 1 later no matter what
        like.save()
        # Once the like row is saved, update the post's like count (even if like was removed, we subtracted 2 earlier)
        post.like_num += 1
        post.save()
        print("Finished liking post")
        return JsonResponse({"msg": "liked"}, status=201)

    # If action is dislike post
    elif data.get("action") == "dislike_post":
        post = Posts.objects.get(id=data.get("post_id"))
        if (not post):
            return JsonResponse({"msg": "couldnt_dislike"}, status=201)
        # First, check if user has disliked post before
        like, created = Likes.objects.get_or_create(user=request.user, post=post, defaults={"like": -1})
        if (created == False):
            # If user wants to change like from like to dislike
            if like.like == 1:
                like.like = -1
                post.like_num -= 1
            # If user wants to change like from default to dislike
            elif like.like == 0:
                like.like = -1
            # If user wants to remove their dislike
            else: # like.like == -1
                like.like = 0
                post.dislike_num -= 2 # Subtract 2 because we are adding 1 later no matter what
        like.save()
        # Once the like row is saved, update the post's like count (even if like was removed, we subtracted 2 earlier)
        post.dislike_num += 1
        post.save()
        return JsonResponse({"msg": "disliked"}, status=201)


def index(request):
    # Run post_interaction function and capture response in a JSON response object
    if request.method == "POST":
        jsonResponse = post_interaction(request)
        return jsonResponse

    posts = Posts.objects.all().order_by("-timestamp").all()
    paginator = Paginator(posts, paginator_pages)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, "network/index.html", {
        "page_obj": page_obj,
        "posts": page_obj.object_list,
        "users": User.objects.all(),
        "user": request.user,
        "paginator": paginator,
        "page_number": int(page_number)
    })


def profile(request, username):
    user = User.objects.get(username=username)
    follow_obj_exists = Follows.objects.filter(user=request.user, following=user).exists()
    following = True if follow_obj_exists else False

    if request.method == "POST":
        data = json.loads(request.body)
        if data.get("action") == "follow":
            # following boolean = was the follow object created?
            # If it was created, then the user was not following the other user before
            if (following):
                Follows.objects.filter(user=request.user, following=user).delete()
                following = False
                return JsonResponse({"msg": "unfollowed"}, status=201)
            # If it was created, then user is not following and wants to follow
            else:
                follow = Follows(user=request.user, following=user)
                follow.save()
                following = True
                return JsonResponse({"msg": "followed"}, status=201)
        else:
            jsonResponse = post_interaction(request)
            return jsonResponse

    # Check if follow object exists after POST request
    if Follows.objects.filter(user=request.user, following=user).exists():
        following = True
    else:
        following = False

    posts = Posts.objects.filter(user=user).order_by("timestamp").all() # Posts of the profile-page user
    paginator = Paginator(posts, paginator_pages)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    return render(request, "network/profile.html", {
        "page_obj": page_obj,
        "posts": page_obj.object_list,
        "profileUser": user, # Profile-page user (the user whose profile page we are on)
        "following": "Unfollow" if following else "Follow",
        "user": request.user, # This is us, the user who is logged in, browsing the profile page
        "paginator": paginator,
        "page_number": int(page_number)
    })


def comments(request, post_id):

    if request.method == "POST":
        data = json.loads(request.body)
        if data.get("action") == "submit_comment":
            comment = Comments(user=request.user, post=Posts.objects.get(id=post_id), content=data.get("comment"))
            comment.save()
            return JsonResponse({"msg": "commented", "user": request.user.username, "comment_id": comment.id}, status=201)
        elif data.get("action") == "delete_comment":
            comment = Comments.objects.get(id=data.get("comment_id"))
            if (not comment):
                return JsonResponse({"msg": "undeleted"}, status=201)
            comment.delete()
            return JsonResponse({"msg": "deleted"}, status=201)
        else:
            jsonResponse = post_interaction(request)
            return jsonResponse

    comments = Comments.objects.filter(post=Posts.objects.get(id=post_id)).order_by("timestamp").all()
    
    return render(request, "network/comments.html", {
        "post": Posts.objects.get(id=post_id),
        "comments": comments,
        "user": request.user
    })

@login_required
def following(request, usernm):
    # usernm is the username of the user whose following list we want to get
    #  we need to get user object from that usern(a)m(e)
    user = User.objects.get(username=usernm)
    # It is also possible that the user is not the same as the logged in user

    # Get all the users that the user is following in a list
    followings = list(Follows.objects.filter(user=user).values_list("following", flat=True))
    
    posts = Posts.objects.filter(user__in=followings).order_by("-timestamp").all()
    paginator = Paginator(posts, paginator_pages)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)


    return render(request, "network/following.html", {
        "page_obj": page_obj,
        "posts": page_obj.object_list,
        "followings": followings,
        "followingUser": user, # This is the user whose following list we are looking at
        "user": request.user, # This is us, the user who is logged in, browsing the following list
        "paginator": paginator,
        "page_number": int(page_number)
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "white"]
            user = User.objects.create_user(username, email, password, color=random.choice(colors))
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
