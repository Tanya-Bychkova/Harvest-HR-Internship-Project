from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread_only = self.request.query_params.get('unread')
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    """Mark a single notification as read."""
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': True, 'message': 'Уведомление не найдено'}, status=404)
    notification.is_read = True
    notification.save()
    return Response({'message': 'Отмечено как прочитанное'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Mark all user notifications as read."""
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'Все уведомления прочитаны'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({'unread_count': count})
