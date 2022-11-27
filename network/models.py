from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass
    color = models.CharField(max_length=20, default="red")

class Posts(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=500)
    timestamp = models.DateTimeField(auto_now_add=True) # auto now add adds time when post is created, auto now adds time when post is updated
    like_num = models.IntegerField(default=0)
    dislike_num = models.IntegerField(default=0)

class Likes(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name="likes")
    # If user likes post, like = 1, if user unlikes post, like = -1, if user has not liked post, like = 0
    like = models.IntegerField(default=0)

class Follows(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follows")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

class Comments(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name="comments")
    content = models.CharField(max_length=500)
    timestamp = models.DateTimeField(auto_now_add=True)