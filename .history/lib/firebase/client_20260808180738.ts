"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";

import {
  getAuth,
  type Auth,
} from "firebase/auth";

import {
  getFirestore,
  type Firestore,
} from "firebase/firestore";

import {
  getFunctions,
  type Functions,
} from "firebase/functions";

import {
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

/* ============================================================
   FIREBASE CONFIG
============================================================ */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/* ============================================================
   CONFIG VALIDATION
============================================================ */

function hasValidConfig(): boolean {
  return Object.values(firebaseConfig).every(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  );
}

function configStatus() {
  /*
   * We never log Firebase values here.
   * We only indicate whether each variable is present.
   */
  return {
    apiKey: Boolean(firebaseConfig.apiKey),
    authDomain: Boolean(firebaseConfig.authDomain),
    projectId: Boolean(firebaseConfig.projectId),
    storageBucket: Boolean(firebaseConfig.storageBucket),
    messagingSenderId: Boolean(
      firebaseConfig.messagingSenderId
    ),
    appId: Boolean(firebaseConfig.appId),
  };
}

/* ============================================================
   INSTANCES
============================================================ */

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let fn: Functions | null = null;
let storage: FirebaseStorage | null = null;

/* ============================================================
   CLIENT INITIALIZATION
============================================================ */

if (typeof window !== "undefined") {
  const configIsValid = hasValidConfig();

  console.log(
    "[Firebase][Client] initialization check",
    {
      host: window.location.host,
      configIsValid,
      status: configStatus(),
    }
  );

  if (configIsValid) {
    try {
      /*
       * Prevent Firebase from being initialized twice
       * during Next.js hot reloads.
       */
      app =
        getApps().length > 0
          ? getApp()
          : initializeApp(firebaseConfig);

      auth = getAuth(app);

      db = getFirestore(app);

      /*
       * Keep this region only if your Firebase Functions
       * are actually deployed in europe-west1.
       */
      fn = getFunctions(app, "europe-west1");

      storage = getStorage(app);

      console.log(
        "[Firebase][Client] initialized successfully",
        {
          projectId: firebaseConfig.projectId,
          auth: Boolean(auth),
          firestore: Boolean(db),
          functions: Boolean(fn),
          storage: Boolean(storage),
        }
      );
    } catch (error) {
      console.error(
        "[Firebase][Client] initialization failed",
        error
      );

      app = null;
      auth = null;
      db = null;
      fn = null;
      storage = null;
    }
  } else {
    console.error(
      "[Firebase][Client] configuration missing. Check NEXT_PUBLIC_FIREBASE_* environment variables.",
      configStatus()
    );
  }
}

/* ============================================================
   GETTERS
============================================================ */

/**
 * Returns the Firebase client app.
 */
export function getFirebaseClientApp(): FirebaseApp {
  if (!app) {
    throw new Error(
      "Firebase client app is not initialized. Check NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }

  return app;
}

/**
 * Returns Firebase Authentication.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error(
      "Firebase Auth is not initialized."
    );
  }

  return auth;
}

/**
 * Returns Firestore.
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    throw new Error(
      "Firebase Firestore is not initialized."
    );
  }

  return db;
}

/**
 * Returns Firebase Functions.
 */
export function getFirebaseFunctions(): Functions {
  if (!fn) {
    throw new Error(
      "Firebase Functions is not initialized."
    );
  }

  return fn;
}

/**
 * Returns Firebase Storage.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error(
      "Firebase Storage is not initialized."
    );
  }

  return storage;
}

/* ============================================================
   SIMPLE EXPORTS
============================================================ */

/*
 * Allows:
 *
 * import { auth, db } from "@/lib/firebase/client";
 *
 * These values can be null during SSR/build.
 */

export {
  app,
  auth,
  db,
  fn,
  storage,
};