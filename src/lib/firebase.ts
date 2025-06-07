// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app"; // Added getApp, getApps
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
  // Check if all required Firebase config keys are present
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.storageBucket ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
  ) {
    console.error("Firebase configuration is missing or incomplete. Check your NEXT_PUBLIC_FIREBASE_ environment variables. Some Firebase features may not work.");
    // Removed: throw new Error("Firebase configuration environment variables are not fully set.");
  }
  // We still attempt to initialize even if some vars are missing,
  // Firebase SDK will handle specific errors if calls are made with bad config.
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

// Get a Firestore instance
const db = getFirestore(app);

// Get an Authentication instance
const auth = getAuth(app);

// Export Firestore and Auth instances
export { db, auth, app };