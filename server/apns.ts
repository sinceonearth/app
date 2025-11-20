import apn from '@parse/node-apn';

let apnProvider: apn.Provider | null = null;

export function initializeAPNs() {
  const apnsKeyId = process.env.APNS_KEY_ID;
  const apnsTeamId = process.env.APNS_TEAM_ID;
  const apnsKey = process.env.APNS_AUTH_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID || 'com.sinceonearth.app';
  const production = process.env.NODE_ENV === 'production';

  if (!apnsKeyId || !apnsTeamId || !apnsKey) {
    console.warn('⚠️ APNs credentials not configured - push notifications disabled');
    console.log('📝 To enable push notifications, set these environment variables:');
    console.log('   - APNS_KEY_ID: Your APNs Key ID from Apple Developer');
    console.log('   - APNS_TEAM_ID: Your Apple Team ID');
    console.log('   - APNS_AUTH_KEY: Your APNs .p8 key content (base64 encoded)');
    console.log('   - APNS_BUNDLE_ID: Your app bundle ID (default: com.sinceonearth.app)');
    return null;
  }

  try {
    const decodedKey = Buffer.from(apnsKey, 'base64').toString('utf-8');

    apnProvider = new apn.Provider({
      token: {
        key: decodedKey,
        keyId: apnsKeyId,
        teamId: apnsTeamId
      },
      production
    });

    console.log(`✅ APNs initialized (${production ? 'Production' : 'Development'})`);
    return apnProvider;
  } catch (error) {
    console.error('❌ Failed to initialize APNs:', error);
    return null;
  }
}

export async function sendAPNsPushNotification(
  deviceToken: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }
): Promise<boolean> {
  if (!apnProvider) {
    apnProvider = initializeAPNs();
  }

  if (!apnProvider) {
    console.log('APNs not configured, skipping notification');
    return false;
  }

  try {
    const notification = new apn.Notification();
    notification.alert = {
      title: payload.title,
      body: payload.body
    };
    notification.sound = 'default';
    notification.badge = 1;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.sinceonearth.app';
    
    if (payload.data) {
      notification.payload = payload.data;
    }

    const result = await apnProvider.send(notification, deviceToken);
    
    if (result.failed && result.failed.length > 0) {
      console.error('❌ APNs failed:', result.failed[0].response);
      return false;
    }

    console.log('✅ APNs notification sent:', payload.title);
    return true;
  } catch (error) {
    console.error('❌ Failed to send APNs notification:', error);
    return false;
  }
}

export function getAPNsProvider() {
  return apnProvider;
}
