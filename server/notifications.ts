import { pool } from './storage';
import { sendAPNsPushNotification } from './apns';

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, any> }
): Promise<boolean> {
  try {
    const userResult = await pool.query(
      'SELECT push_token FROM users WHERE id = $1',
      [userId]
    );

    const pushToken = userResult.rows[0]?.push_token;
    if (!pushToken) {
      console.log(`No push token for user ${userId}`);
      return false;
    }

    const sent = await sendAPNsPushNotification(pushToken, payload);
    return sent;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

export async function sendGroupInviteNotification(
  recipientUserId: string,
  inviterName: string,
  groupName: string,
  groupId: number
) {
  await sendPushNotification(recipientUserId, {
    title: '🌍 New Radr Group Invite',
    body: `${inviterName} invited you to ${groupName}`,
    data: {
      type: 'group_invite',
      group_id: groupId.toString(),
      navigate_to: '/radr_messages'
    }
  });
}

export async function sendNewMessageNotification(
  recipientUserIds: string[],
  senderName: string,
  groupName: string,
  groupId: number
) {
  for (const userId of recipientUserIds) {
    await sendPushNotification(userId, {
      title: `💬 ${groupName}`,
      body: `${senderName}: New message`,
      data: {
        type: 'message',
        group_id: groupId.toString(),
        navigate_to: '/radr_messages'
      }
    });
  }
}

export async function sendArrivalNotification(
  recipientUserIds: string[],
  arrivedUserName: string,
  groupName: string,
  groupId: number
) {
  for (const userId of recipientUserIds) {
    await sendPushNotification(userId, {
      title: `📍 ${groupName}`,
      body: `${arrivedUserName} has arrived!`,
      data: {
        type: 'arrival',
        group_id: groupId.toString(),
        navigate_to: '/radr_messages'
      }
    });
  }
}

export async function sendAchievementNotification(
  userId: string,
  achievementTitle: string,
  achievementDescription: string
) {
  await sendPushNotification(userId, {
    title: `🏆 Achievement Unlocked!`,
    body: `${achievementTitle}: ${achievementDescription}`,
    data: {
      type: 'achievement',
      navigate_to: '/achievements'
    }
  });
}

export async function sendTripCompletedNotification(
  userId: string,
  destination: string,
  flightCount: number
) {
  await sendPushNotification(userId, {
    title: '✈️ Trip Completed',
    body: `Your trip to ${destination} has been logged! ${flightCount} flight${flightCount > 1 ? 's' : ''} added.`,
    data: {
      type: 'trip',
      navigate_to: '/trips'
    }
  });
}
