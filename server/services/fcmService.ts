/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 * Ready for LUBPY Studio Mobile App (Flutter / React Native / Android / iOS)
 */

import { initializeApp, cert, applicationDefault, getApps, App } from 'firebase-admin/app';
import { getMessaging, Message, TopicMessage } from 'firebase-admin/messaging';

let fcmApp: App | null = null;

// In-memory token storage (Map userId/uid -> FCM device token)
const userFcmTokens = new Map<string, { token: string; platform: string; updatedAt: Date }>();

/**
 * Initialize Firebase Admin SDK lazily
 */
function initFcm(): boolean {
  if (fcmApp) return true;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      fcmApp = apps[0];
      return true;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      fcmApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
      console.log('✅ Firebase Admin SDK & FCM Push Notifications Initialized.');
      return true;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      fcmApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId,
      });
      console.log('✅ Firebase Admin SDK Initialized via Application Default Credentials.');
      return true;
    } else {
      // Graceful standby mode for development or when FCM credentials are not yet populated
      return false;
    }
  } catch (err: any) {
    console.warn('⚠️ FCM Push Notification initialization skipped:', err.message);
    return false;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export const fcmService = {
  /**
   * Register or update FCM Device Token for a User (Android/iOS/Web)
   */
  registerUserToken(userId: string, token: string, platform: string = 'android') {
    if (!userId || !token) return;
    userFcmTokens.set(userId, { token, platform, updatedAt: new Date() });
    console.log(`📱 Registered FCM Token for User [${userId}] (Platform: ${platform})`);
  },

  /**
   * Get device token for a specific user ID
   */
  getUserToken(userId: string): string | undefined {
    return userFcmTokens.get(userId)?.token;
  },

  /**
   * Send push notification to a single device token (Mobile Android/iOS)
   */
  async sendToDevice(deviceToken: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!deviceToken) return false;

    const ready = initFcm();
    if (!ready || !fcmApp) {
      console.log(`[FCM_STANDBY] Push notification to device: "${payload.title}" - ${payload.body}`);
      return false;
    }

    try {
      const message: Message = {
        token: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'lubpy_alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const messaging = getMessaging(fcmApp);
      const response = await messaging.send(message);
      console.log('📲 FCM Notification sent successfully:', response);
      return true;
    } catch (err: any) {
      console.error('❌ Failed to send FCM message:', err.message);
      return false;
    }
  },

  /**
   * Send push notification to a topic (e.g. 'all_users', 'accounting_dept', 'tech_dept')
   */
  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    const ready = initFcm();
    if (!ready || !fcmApp) {
      console.log(`[FCM_STANDBY] Topic "${topic}" Push: "${payload.title}" - ${payload.body}`);
      return false;
    }

    try {
      const message: TopicMessage = {
        topic: topic.toLowerCase().replace(/[^a-z0-9-_.~%]+/g, '_'),
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      };

      const messaging = getMessaging(fcmApp);
      const response = await messaging.send(message);
      console.log(`📲 FCM Topic [${topic}] message sent:`, response);
      return true;
    } catch (err: any) {
      console.error(`❌ Failed to send FCM topic message [${topic}]:`, err.message);
      return false;
    }
  },

  /**
   * Notification Trigger: Project Status Changed
   */
  async notifyProjectStatus(fcmToken: string | undefined, projectCode: string, newStatus: string) {
    const statusLabels: Record<string, string> = {
      ASSIGNED: 'Đã phân công Lập trình viên',
      DEPOSIT_50: 'Đã xác nhận cọc 50%',
      CODING: 'Đang triển khai lập trình',
      REVIEW: 'Đã hoàn thành code - Sẵn sàng nghiệm thu',
      PAID_100: 'Đã thanh toán 100%',
      DELIVERED: 'Đã bàn giao toàn bộ Source code & Tài liệu',
    };

    const statusText = statusLabels[newStatus] || newStatus;
    const payload: PushNotificationPayload = {
      title: `Cập nhật dự án [${projectCode}]`,
      body: `Trạng thái mới: ${statusText}. Mở ứng dụng để xem chi tiết tiến độ.`,
      data: {
        type: 'PROJECT_UPDATE',
        projectId: projectCode,
        status: newStatus,
      },
    };

    if (fcmToken) {
      await this.sendToDevice(fcmToken, payload);
    }
    await this.sendToTopic('admin_alerts', payload);
  },

  /**
   * Notification Trigger: Financial Balance / Transaction
   */
  async notifyTransaction(fcmToken: string | undefined, amountVnd: number, type: string, note?: string) {
    const formattedAmount = `${amountVnd.toLocaleString('vi-VN')} VNĐ`;
    const payload: PushNotificationPayload = {
      title: 'Biến động số dư / Giao dịch mới',
      body: `Ghi nhận giao dịch ${formattedAmount} (${type}). ${note ? `Ghi chú: ${note}` : ''}`,
      data: {
        type: 'TRANSACTION_UPDATE',
        amount: String(amountVnd),
        txType: type,
      },
    };

    if (fcmToken) {
      await this.sendToDevice(fcmToken, payload);
    }
    await this.sendToTopic('accounting_alerts', payload);
  },

  /**
   * Notification Trigger: CSKH Support Ticket Reply
   */
  async notifyTicketReply(fcmToken: string | undefined, ticketCode: string, subject: string, sender: string) {
    const payload: PushNotificationPayload = {
      title: `Phản hồi Ticket [${ticketCode}]`,
      body: `${sender} vừa gửi tin nhắn mới cho yêu cầu: "${subject}"`,
      data: {
        type: 'TICKET_REPLY',
        ticketId: ticketCode,
      },
    };

    if (fcmToken) {
      await this.sendToDevice(fcmToken, payload);
    }
  },
};
