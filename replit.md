# Since On Earth

## Overview

Since On Earth is a full-stack Progressive Web App (PWA) for tracking flights, accommodations, and travel statistics. The application allows users to log their journeys, visualize travel routes on an interactive globe, collect country stamps as achievements, and share real-time location with groups via the "Radr" feature.

The app is built as a modern web application with mobile-first design and includes Capacitor integration for iOS/Android deployment. It emphasizes visual storytelling of travel experiences through interactive maps, statistics dashboards, and achievement systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and dev server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- React Query (TanStack Query) for server state management and caching

**UI & Styling:**
- Tailwind CSS with custom dark theme configuration
- Shadcn UI component library (New York style variant)
- Framer Motion for animations and transitions
- Lucide React for iconography (including custom alien icon from @lucide/lab)

**Design Decisions:**
- Mobile-first responsive design with bottom navigation for key sections
- Dark theme by default with black backgrounds and green accent colors (#22c55e)
- Progressive Web App capabilities with service worker for offline support
- Capacitor integration for native mobile features (geolocation, status bar)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- Session-based authentication using express-session with PostgreSQL session store
- JWT tokens for API authentication (7-day expiry)
- Cookie-based session management with CORS support

**API Structure:**
- RESTful endpoints under `/api/*` namespace
- Authentication routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/user`
- Resource routes: `/api/flights`, `/api/stayins`, `/api/radr/*`
- Admin routes: `/api/admin/*` for user approval and invite code management
- Public routes: `/api/public/stats` for unauthenticated access

**Authentication Flow:**
- User registration with optional invite codes (approval required without code)
- Password hashing with bcryptjs (10 salt rounds)
- JWT tokens stored in localStorage on client-side
- Authorization header: `Bearer <token>` for authenticated requests
- Middleware `requireAuth` validates tokens and attaches user data to requests

### Data Storage

**Database:**
- PostgreSQL (currently using Neon serverless PostgreSQL)
- Drizzle ORM for type-safe database queries and schema management
- Connection pooling via `pg` package with SSL enabled

**Schema Design:**
- **users**: Core user accounts with profile customization (icon, color, alien emoji), includes push_token for APNs
- **flights**: Flight records with departure/arrival airports, dates, times, coordinates
- **stayins**: Accommodation records (hotels, Airbnbs) with check-in/out dates
- **airlines**: Reference data for airline names and codes
- **airports**: Comprehensive airport data (40,000+ entries) with coordinates
- **invite_codes**: Invitation system for controlled user registration
- **sessions**: Express session storage in PostgreSQL
- **radr_groups**: Temporary location-sharing groups with target destinations and encryption_key for end-to-end encryption
- **radr_group_members**: Many-to-many relationship for group membership
- **radr_messages**: End-to-end encrypted chat messages within Radr groups
- **contact_messages**: User-submitted contact form messages

**Key Database Features:**
- UUID primary keys for all tables
- Timestamp fields (created_at, updated_at) with automatic defaults
- Foreign key relationships with cascading behavior
- Indexes on frequently queried fields (session expiry, user lookups)
- JSON/JSONB fields for flexible metadata storage

### External Dependencies

**APIs & Services:**
- **Neon Database**: Serverless PostgreSQL hosting with pooled connections
- **AviationStack API** (optional): Flight lookup for automated flight data entry
- **Capacitor Geolocation**: Native GPS access for real-time location tracking (Radr feature)
- **Capacitor Status Bar**: iOS status bar customization for native app feel
- **Capacitor Push Notifications**: Native push notification support for iOS/Android
- **Apple Push Notification Service (APNs)**: Lock screen notifications for iOS devices

**Third-Party Libraries:**
- **react-globe.gl**: WebGL-based 3D globe visualization for flight routes
- **Papa Parse**: CSV parsing for bulk flight imports
- **Sharp**: Server-side image processing for icon generation
- **Zod**: Runtime schema validation for forms and API payloads
- **React Hook Form**: Form state management with validation

**Development Tools:**
- **Drizzle Kit**: Database migration and schema push utilities
- **ESBuild**: Fast JavaScript bundling for production builds
- **tsx**: TypeScript execution for dev server
- **dotenv**: Environment variable management

**Mobile Platform Integration:**
- **Capacitor**: Bridges web app to native iOS/Android functionality
- Configured for `com.sinceonearth.app` bundle ID
- Web directory points to `dist` folder after Vite build
- Server URL: `https://sinceonearth.com` for production builds

**Environment Variables Required:**
- `DATABASE_URL` or `NEON_DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET` or `JWT_SECRET`: Secret key for session/token signing
- `ENCRYPTION_KEY`: AES-256 key for message encryption fallback
- `APNS_KEY_ID`: Apple Developer Key ID for push notifications
- `APNS_TEAM_ID`: Apple Developer Team ID
- `APNS_AUTH_KEY`: Apple Push Notification authentication key (.p8 file content, base64 encoded)
- `APNS_BUNDLE_ID`: App bundle ID (default: com.sinceonearth.app)
- `AVIATIONSTACK_API_KEY`: (Optional) API key for flight data lookups
- `NODE_ENV`: Set to `production` or `development`

**End-to-End Encryption:**
- **Web Crypto API**: Client-side encryption using AES-256-GCM
- Messages encrypted in browser before transmission
- Unique encryption key generated for each Radr group
- Keys stored in browser localStorage and server database for distribution
- Server stores encrypted messages but cannot decrypt them (keys stored for member access)
- Encryption keys distributed to group members through secure server endpoints

**Push Notifications:**
- **APNs Integration**: Direct integration with Apple Push Notification Service
- Notifications for: group invites, new messages, arrivals, achievements, trip completions
- Push tokens stored in users table
- Notifications sent via @parse/node-apn library
- Development and production environments supported

**PWA Capabilities:**
- Service worker for offline caching (`public/service-worker.js`) with multiple caching strategies
- Web manifest with app metadata and icon sizes
- Install prompt handling for "Add to Home Screen"
- Offline-first caching strategy for all resources
- **Instant Splash Screen**: Black background loads immediately (inline CSS) before React hydration
- **Offline Features**:
  - Multiple cache stores: static, dynamic, images, API responses, assets
  - Smart caching strategies: network-first for APIs, cache-first for static assets
  - localStorage persistence for user data, flights, stay-ins, and Radr groups
  - Offline indicator component shows real-time connectivity status
  - Service worker caches JS bundles, CSS, images, fonts (including Google Fonts) automatically
  - API responses cached for offline viewing
  - Capacitor config supports offline-first mobile app deployment
  - Splash screen component renders instantly on app load (online or offline)
  - Vite assets (`/assets/*.js`, `/assets/*.css`) cached with long-term strategy