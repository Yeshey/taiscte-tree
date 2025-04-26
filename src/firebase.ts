// src/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app"; // Import FirebaseApp type
import { Auth, getAuth } from "firebase/auth";
import { Database, getDatabase } from "firebase/database";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

// --- Check if essential config values are present ---
const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.databaseURL; // Database URL is crucial for RTDB

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;
let analytics: Analytics | null = null;
let firebaseInitializationError: Error | null = null;

if (isConfigValid) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase services
    auth = getAuth(app);
    database = getDatabase(app); // Initialize Realtime Database

    // Initialize Analytics if supported
    isSupported().then((supported) => {
      if (supported && app) { // Check app exists
        try {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized");
        } catch (err) {
             console.error("Firebase Analytics initialization failed:", err);
             // Don't treat analytics failure as a fatal error for the core app
        }
      } else {
        console.log("Firebase Analytics is not supported in this environment.");
      }
    }).catch(err => {
        console.error("Error checking Analytics support:", err);
    });

    console.log("Firebase initialized successfully.");

  } catch (error: any) {
    console.error("FATAL: Firebase initialization failed:", error);
    firebaseInitializationError = error;
    // Ensure services are null if initialization failed
    app = null;
    auth = null;
    database = null;
    analytics = null;
  }
} else {
  console.warn("Firebase configuration is missing or invalid in .env file. Firebase features disabled.");
  firebaseInitializationError = new Error("Firebase configuration is missing or invalid.");
}

// --- Export status and potentially null services ---
const isFirebaseAvailable = !!app && !!auth && !!database && !firebaseInitializationError;

export {
    app,
    auth,
    database,
    analytics,
    isFirebaseAvailable, // Export a boolean indicating success
    firebaseInitializationError // Export the error if any
};