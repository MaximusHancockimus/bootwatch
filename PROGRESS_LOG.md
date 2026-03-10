# BootWatch — Progress Log

A running log of what was built at each step, what was installed, and why. Reference this to understand what's in the project and how the pieces fit together.

---

## Step 1.1 — Initialize Expo Project

**What we did**: Created a new React Native app using Expo's TypeScript template.

**What is Expo?** Expo is a framework on top of React Native that handles the hard parts of mobile development for you — building for iOS/Android, managing native APIs (camera, notifications, location), and deploying to app stores. Without Expo, you'd need Xcode and Android Studio set up locally, which is a nightmare. With Expo, you write TypeScript and it handles the rest.

**What is React Native?** A framework that lets you write mobile apps using JavaScript/TypeScript instead of Swift (iOS) or Kotlin (Android). Your code compiles to real native components, not a webview — so it feels like a real app because it is one.

**What got created**:

| File/Folder | What It Is |
|---|---|
| `App.tsx` | The root component — everything in the app starts here |
| `index.ts` | Entry point that registers `App.tsx` with Expo |
| `app.json` | Expo config — app name ("BootWatch"), icons, splash screen, platform settings |
| `tsconfig.json` | TypeScript configuration — strict mode enabled |
| `package.json` | Dependency manifest — lists every library the app uses |
| `assets/` | Placeholder icons and splash screen images (we'll replace these later) |
| `node_modules/` | Installed dependencies (git-ignored, never edit this) |

**Key versions**:
- Expo SDK 55
- React 19.2
- React Native 0.83
- TypeScript 5.9

---

## Step 1.2 — Install Core Dependencies

**What we did**: Installed every library the app needs for its core features. Here's what each one does and why we need it:

### Navigation
| Package | What It Does |
|---|---|
| `@react-navigation/native` | The core navigation library for React Native — handles moving between screens, managing screen history (like a browser's back button), and passing data between screens |
| `@react-navigation/bottom-tabs` | Adds the bottom tab bar (Map / Timer / Feed / Profile). This is the primary way users move around the app |
| `react-native-screens` | Native screen optimization — makes navigation transitions faster and more memory-efficient by using real native screen containers instead of JavaScript views |
| `react-native-safe-area-context` | Handles the "safe area" on modern phones (notches, rounded corners, home indicators). Without this, your UI would render behind the notch on an iPhone |

### Maps
| Package | What It Does |
|---|---|
| `react-native-maps` | Renders Google Maps (Android) or Apple Maps (iOS) in the app. We use this for the complex directory map, spotter pins, and eventually the heat map |

### Notifications & Device
| Package | What It Does |
|---|---|
| `expo-notifications` | Handles push notifications — both local (parking timer alerts) and remote (boot spotter alerts from other users). Abstracts away APNs (Apple) and FCM (Google) |
| `expo-device` | Detects device info — needed to check if we're on a physical device (push notifications don't work on simulators) |
| `expo-constants` | Provides app constants like the Expo project ID, which is needed to register for push notifications |

### Location & Camera
| Package | What It Does |
|---|---|
| `expo-location` | Accesses the phone's GPS to auto-detect which apartment complex the user is near |
| `expo-image-picker` | Lets users take or select a photo when reporting a boot truck sighting |

### Backend (Supabase)
| Package | What It Does |
|---|---|
| `@supabase/supabase-js` | The Supabase client library — talks to our database, handles auth, file uploads, and real-time subscriptions. This is our entire backend connection |
| `@react-native-async-storage/async-storage` | Persistent key-value storage on the device. Supabase uses this to store the user's auth session so they don't have to log in every time they open the app |
| `react-native-url-polyfill` | Polyfill that makes URL parsing work correctly in React Native. Required by the Supabase client |

### UI
| Package | What It Does |
|---|---|
| `@expo/vector-icons` | Icon library with thousands of icons (MaterialIcons, Ionicons, FontAwesome, etc.). Used for the tab bar icons and throughout the UI |
| `expo-status-bar` | Controls the status bar appearance (the bar at the top of the phone with time, battery, signal). Came with the template |

---

## .env File

**We don't have one yet — and that's intentional.** The `.env` file will hold secret keys for Supabase (API URL and anon key). We create it in **Step 4** when we set up the Supabase project. It's listed in `.gitignore` so it will never be committed to GitHub.

When we get there, it will look like:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

The `EXPO_PUBLIC_` prefix is an Expo convention that makes these values accessible in your app code. The anon key is safe to include in the app — it only grants access that your Row Level Security policies allow.

---

## Steps Not Yet Completed

| Step | Status |
|---|---|
| 1.3 — Bottom tab navigation | Up next |
| 1.4 — Placeholder screens | Up next |
| 1.5 — Theme constants | Up next |
| 1.6 — Verify app runs | Up next |
| 2.x — Complex directory & map | Not started |
| 3.x — Parking timer | Not started |
| 4.x — Supabase backend & auth | Not started |
| 5.x — Boot spotter feed | Not started |
| 6.x — Spotter push notifications | Not started |
| 7.x — Heat map | Not started |
| 8.x — Polish & launch | Not started |

---

*This file will be updated as we complete each step.*
