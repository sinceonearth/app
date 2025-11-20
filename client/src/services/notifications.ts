import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private isSupported = Capacitor.isNativePlatform();

  async initialize() {
    if (!this.isSupported) {
      console.log('📱 Push notifications only work on iOS/Android');
      return;
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        console.log('✅ Push notification permissions granted');
        await PushNotifications.register();
        this.setupListeners();
      } else {
        console.log('❌ Push notification permissions denied');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private setupListeners() {
    PushNotifications.addListener('registration', (token) => {
      console.log('✅ Push token registered:', token.value);
      this.sendTokenToServer(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📲 Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('📲 Notification tapped:', action);
      const data = action.notification.data;
      
      if (data.navigate_to) {
        window.location.href = data.navigate_to;
      }
    });
  }

  private async sendTokenToServer(token: string) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) return;

      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ push_token: token })
      });

      if (response.ok) {
        console.log('✅ Push token sent to server');
      }
    } catch (error) {
      console.error('Failed to send push token to server:', error);
    }
  }
}

export const notificationService = new NotificationService();
