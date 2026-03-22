# Walkthrough: Google Auth Fix for Android APK

I have implemented the necessary changes to resolve the "Failed to fetch" error and ensure the Google Authentication flow works correctly in your built APK.

## Changes Made

### 1. Android Connectivity
Updated [AndroidManifest.xml](file:///c:/Users/fabri/Downloads/TSP/android/app/src/main/AndroidManifest.xml) to allow HTTP traffic.
```xml
<application
    ...
    android:usesCleartextTraffic="true">
```
This allows the app to connect to your backend at `http://192.168.0.2:3001`.

### 4. Audio & UI Polishing
- **Audio Recording**: Updated [useAudioRecorder.ts](file:///c:/Users/fabri/Downloads/TSP/hooks/useAudioRecorder.ts) to use mobile-compatible MIME types (`audio/aac`/`audio/mp4`) and added debug logging.
- **UI Layout**: Optimized [FABSheet.tsx](file:///c:/Users/fabri/Downloads/TSP/components/FABSheet.tsx) to prevent the "Save" button from overlapping the text area on small screens or with the keyboard open.
- **Navigation**: Switched to `useRouter` in [Nucleo](file:///c:/Users/fabri/Downloads/TSP/app/nucleo/page.tsx) to ensure smooth transitions within the app.

### 5. New Visual Identity
Generated a premium visual suite for the app, including high-end splash screens and a matching app icon.

````carousel
![Splash Light Mode](/C:/Users/fabri/.gemini/antigravity/brain/226f526c-3fca-4e8d-b8fc-9d81ee5a9dff/splash_light_mode_1774200221432.png)
<!-- slide -->
![Splash Dark Mode](/C:/Users/fabri/.gemini/antigravity/brain/226f526c-3fca-4e8d-b8fc-9d81ee5a9dff/splash_dark_mode_1774200614072.png)
<!-- slide -->
![App Icon Logo](/C:/Users/fabri/.gemini/antigravity/brain/226f526c-3fca-4e8d-b8fc-9d81ee5a9dff/app_icon_logo_1774200719354.png)
````

---

## Final Verification Steps
...

### 1. Rebuild & Test
Run the final build and sync:
```powershell
npm run build
npx cap sync android
```
Then build the APK in Android Studio.

### 2. Verify Audio
...
...
Ensure your APK's SHA-1 is registered in the [Firebase Console](https://console.firebase.google.com/):
1. Go to **Project Settings** > **General**.
2. Scroll to **Your apps** > **Android**.
3. Check the **SHA certificate fingerprints**.
4. If you are building a **Release APK**, you MUST add the SHA-1 of your release keystore.

### 3. Run the App
Open the project in Android Studio, build the APK, and test the Google Login. It should now successfully reach the backend and complete the authentication.
