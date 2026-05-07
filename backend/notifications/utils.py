"""
Utility to create notifications from any app.
Import this in views/signals that need to notify users.
"""


def create_notification(recipient=None, recipient_id=None, title='', message='',
                        notification_type='system', object_id=None):
    """
    Create a notification record.

    Pass either `recipient` (User instance) or `recipient_id` (int).
    """
    from .models import Notification

    if recipient is None and recipient_id is None:
        return None

    kwargs = {
        'title': title,
        'message': message,
        'notification_type': notification_type,
        'object_id': object_id,
    }
    if recipient is not None:
        kwargs['recipient'] = recipient
    else:
        kwargs['recipient_id'] = recipient_id

    return Notification.objects.create(**kwargs)
