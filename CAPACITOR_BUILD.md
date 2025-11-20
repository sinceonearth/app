# Building Since On Earth for iOS/Android with Offline Support

This guide explains how to build and deploy the Since On Earth app to the Apple App Store and Google Play Store with full offline functionality.

## Prerequisites

- Node.js 18+ installed
- Xcode (for iOS builds)
- Android Studio (for Android builds)
- Capacitor CLI installed globally: `npm install -g @capacitor/cli`

## Offline Features

The app includes offline infrastructure for improved reliability:

✅ **Service Worker**: Caches all static assets including Vite bundles (JS, CSS, images, fonts)
✅ **Offline Detection**: Shows persistent badge and toast notifications when connectivity changes
✅ **Smart Caching Strategies**:
- Vite assets (`/assets/*.js`, `/assets/*.css`): Cache-first for reliable offline app loading
- Static files: Cache-first
- Images: Cache-first with lazy loading
- Fonts: Cache-first (long-term storage)
- API requests: Network-first (offline fallback infrastructure available)

⚠️ **Current Limitations**:
- App UI and navigation work offline after first visit
- Data viewing (flights, stay-ins, groups) requires initial online sync
- Creating/editing data requires internet connection
- API caching utilities are available but not yet fully integrated with all data hooks

## Build Process

### 1. Build the Web App

```bash
# Install dependencies
npm install

# Build for production with offline support
npm run build
```

This creates an optimized production build in the `dist/` folder with:
- Service worker enabled
- All assets bundled and minified
- PWA manifest configured
- Offline caching enabled

### 2. Sync with Capacitor

```bash
# Copy web build to native projects
npx cap sync
```

This command:
- Copies `dist/` to iOS and Android projects
- Updates native dependencies
- Syncs Capacitor plugins

### 3. Build for iOS

```bash
# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your team and signing certificate
2. Choose target device/simulator
3. Product → Archive
4. Upload to App Store Connect

**Important for Offline Support:**
- The app loads from bundled files (no server URL in production builds)
- Service worker caches all assets automatically on first visit
- Users can open the app and navigate UI without internet
- Data requires initial online sync to be viewable offline

### 4. Build for Android

```bash
# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Choose release keystore
3. Upload to Google Play Console

## Configuration

### Capacitor Config

The `capacitor.config.ts` is configured for offline support:

```typescript
{
  appId: 'com.sinceonearth.app',
  appName: 'Since On Earth',
  webDir: 'dist',
  // No server URL by default = offline support
  // Set CAPACITOR_SERVER_URL env var for local development
}
```

**Development Mode:**
Set `CAPACITOR_SERVER_URL=http://localhost:5000` when testing locally.

**Production Mode:**
Leave undefined for App Store builds - enables full offline app shell.

### Service Worker

Located at `public/service-worker.js`, it implements:

- **Static Cache**: Index.html, manifest, app icons
- **Dynamic Cache**: JS bundles, CSS, API responses
- **Image Cache**: All images cached on first load
- **API Cache**: Flight, stay-in, and user data

### Offline Storage

Offline storage utilities are available in `client/src/lib/offlineStorage.ts` for:

- Flight history
- Stay-in records
- User profile
- Radr groups
- Last sync timestamp

**Note:** Full integration with data-fetching hooks is planned for future updates.

## Testing Offline Mode

### Web Browser
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload the page - it should still work!

### iOS Simulator
1. Settings → Developer → Network Link Conditioner
2. Enable "100% Loss"
3. Open the app - data should still load!

### Android Emulator
1. Settings → Network & internet → Turn off WiFi
2. Open the app - should work offline!

## Deployment Checklist

Before deploying to app stores:

- [ ] Test offline mode thoroughly
- [ ] Verify service worker registration
- [ ] Check localStorage data persistence
- [ ] Test on real devices (not just simulators)
- [ ] Verify push notifications still work
- [ ] Check that data syncs when back online
- [ ] Review Privacy Policy (mentions offline data storage)
- [ ] Update app version in Capacitor config

## Troubleshooting

### App UI doesn't load offline
- Check service worker is registered: `navigator.serviceWorker.ready`
- Inspect cache in DevTools → Application → Cache Storage
- Ensure Vite assets are cached (check for `/assets/*.js` and `/assets/*.css`)
- Verify `capacitor.config.ts` has no `server.url` for production

### Data shows as unavailable offline
- This is expected behavior - data requires initial online sync
- Future updates will enable full offline data viewing
- Service worker infrastructure is in place for when hooks are updated

### Service worker not updating
- Increment `CACHE_VERSION` in `service-worker.js`
- Hard refresh in browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Call `skipWaiting()` in service worker

## Backend API Compatibility

The backend must support offline-first clients:

- **CORS**: Allow requests from app origin
- **JWT Tokens**: Long-lived tokens (7 days) for offline use
- **Idempotency**: Handle duplicate requests when back online
- **Graceful Degradation**: Return cached data when available

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa/)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
