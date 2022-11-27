
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("<str:usernm>/following", views.following, name="following"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("post/<int:post_id>/comments", views.comments, name="comments"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register")
]
