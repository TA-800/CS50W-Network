from django import template

from ..models import Likes, User

register = template.Library()

@register.filter
def accessLikes(postobject, userobject):
    if userobject.is_authenticated:
        obj, _ = Likes.objects.get_or_create(user=userobject, post=postobject, defaults={"like": 0})
        return obj.like
    else:
        return 0


@register.filter
def accessUserFromID(userid):
    return User.objects.get(id=userid) if User.objects.filter(id=userid).exists() else None

@register.filter
def getLikeCount(post):
    return post.like_num - post.dislike_num