// lib/firebase/admin.ts

import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";

import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";

import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

import {
  getStorage,
  type Storage,
} from "firebase-admin/storage";

/* ============================================================
   ENV
============================================================ */

const FIREBASE_ADMIN_BASE64_ENV_NAME =
  "FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64" as const;

/* ============================================================
   TYPES
============================================================ */

type FirebaseServiceAccountJson = {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
};

/* ============================================================
   CACHE
============================================================ */

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: Storage | null = null;

/* ============================================================
   ENVIRONMENT HELPERS
============================================================ */

function cleanEnvironmentValue(value: string): string {
  const trimmedValue = value.trim();

  const wrappedInDoubleQuotes =
    trimmedValue.startsWith('"') &&
    trimmedValue.endsWith('"');

  const wrappedInSingleQuotes =
    trimmedValue.startsWith("'") &&
    trimmedValue.endsWith("'");

  if (
    wrappedInDoubleQuotes ||
    wrappedInSingleQuotes
  ) {
    return trimmedValue
      .slice(1, -1)
      .trim();
  }

  return trimmedValue;
}

function getRequiredServerEnvironmentVariable(
  name: typeof FIREBASE_ADMIN_BASE64_ENV_NAME
): string {
  const rawValue = process.env[name];

  if (!rawValue?.trim()) {
    throw new Error(
      `[Firebase Admin] Missing environment variable: ${name}`
    );
  }

  return cleanEnvironmentValue(
    rawValue
  );
}

/* ============================================================
   BASE64
============================================================ */

function normalizeBase64Value(
  value: string
): string {
  return value
    .replace(
      /^data:application\/json;base64,/i,
      ""
    )
    .replace(/\s+/g, "")
    .trim();
}

function isValidBase64(
  value: string
): boolean {
  if (!value) {
    return false;
  }

  /*
   * Standard Base64:
   * A-Z
   * a-z
   * 0-9
   * +
   * /
   * and optionally = padding
   */
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(
      value
    )
  ) {
    return false;
  }

  return value.length % 4 === 0;
}

function decodeServiceAccountBase64(
  encodedServiceAccount: string
): FirebaseServiceAccountJson {
  const normalizedBase64 =
    normalizeBase64Value(
      encodedServiceAccount
    );

  if (
    !isValidBase64(
      normalizedBase64
    )
  ) {
    throw new Error(
      `${FIREBASE_ADMIN_BASE64_ENV_NAME} does not contain a valid Base64 value.`
    );
  }

  try {
    const decodedJson = Buffer.from(
      normalizedBase64,
      "base64"
    ).toString("utf8");

    if (
      !decodedJson
        .trim()
        .startsWith("{")
    ) {
      throw new Error(
        "Decoded content is not a JSON object."
      );
    }

    const parsedServiceAccount =
      JSON.parse(
        decodedJson
      ) as FirebaseServiceAccountJson;

    if (
      !parsedServiceAccount ||
      typeof parsedServiceAccount !==
        "object"
    ) {
      throw new Error(
        "Decoded Firebase service account is invalid."
      );
    }

    return parsedServiceAccount;
  } catch (error) {
    console.error(
      "[Firebase Admin] Unable to decode Firebase service account:",
      error
    );

    throw new Error(
      `${FIREBASE_ADMIN_BASE64_ENV_NAME} must contain the Firebase service account JSON encoded in Base64.`
    );
  }
}

/* ============================================================
   PRIVATE KEY
============================================================ */

function normalizePrivateKey(
  privateKey: string
): string {
  return privateKey
    /*
     * Handles private keys where line breaks
     * have been stored as literal "\n".
     */
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/* ============================================================
   SERVICE ACCOUNT
============================================================ */

function getFirebaseServiceAccount(): ServiceAccount {
  const encodedServiceAccount =
    getRequiredServerEnvironmentVariable(
      FIREBASE_ADMIN_BASE64_ENV_NAME
    );

  const serviceAccount =
    decodeServiceAccountBase64(
      encodedServiceAccount
    );

  const projectId =
    serviceAccount.project_id?.trim();

  const clientEmail =
    serviceAccount.client_email?.trim();

  const privateKey =
    serviceAccount.private_key
      ? normalizePrivateKey(
          serviceAccount.private_key
        )
      : "";

  if (!projectId) {
    throw new Error(
      "[Firebase Admin] project_id is missing from the Firebase service account."
    );
  }

  if (!clientEmail) {
    throw new Error(
      "[Firebase Admin] client_email is missing from the Firebase service account."
    );
  }

  if (!privateKey) {
    throw new Error(
      "[Firebase Admin] private_key is missing from the Firebase service account."
    );
  }

  if (
    !privateKey.includes(
      "-----BEGIN PRIVATE KEY-----"
    ) ||
    !privateKey.includes(
      "-----END PRIVATE KEY-----"
    )
  ) {
    throw new Error(
      "[Firebase Admin] Firebase private key does not have a valid PEM format."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

/* ============================================================
   STORAGE BUCKET
============================================================ */

function getStorageBucket():
  | string
  | undefined {
  /*
   * IMPORTANT:
   *
   * No Côte d'Ivoire Firebase bucket is hard-coded here.
   * Doc Chap Ghana must use its own Ghana Firebase bucket.
   */

  const adminBucket =
    process.env
      .FIREBASE_STORAGE_BUCKET
      ?.trim();

  if (adminBucket) {
    return adminBucket;
  }

  const publicBucket =
    process.env
      .NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      ?.trim();

  return (
    publicBucket ||
    undefined
  );
}

/* ============================================================
   FIREBASE ADMIN APP
============================================================ */

function getAdminAppInternal(): App {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApps =
    getApps();

  if (
    existingApps.length > 0
  ) {
    cachedApp = getApp();

    return cachedApp;
  }

  const serviceAccount =
    getFirebaseServiceAccount();

  const storageBucket =
    getStorageBucket();

  cachedApp = initializeApp({
    credential: cert(
      serviceAccount
    ),

    ...(storageBucket
      ? {
          storageBucket,
        }
      : {}),
  });

  console.log(
    "[Firebase Admin] Doc Chap Ghana initialized",
    {
      projectId:
        cachedApp.options
          .projectId ?? null,

      storageBucket:
        cachedApp.options
          .storageBucket ?? null,
    }
  );

  return cachedApp;
}

/* ============================================================
   FIRESTORE
============================================================ */

function getAdminDbInternal(): Firestore {
  if (cachedDb) {
    return cachedDb;
  }

  cachedDb =
    getFirestore(
      getAdminAppInternal()
    );

  try {
    cachedDb.settings({
      ignoreUndefinedProperties:
        true,
    });
  } catch {
    /*
     * Firestore may already have been
     * initialized during Next.js hot reload.
     */
  }

  return cachedDb;
}

/* ============================================================
   AUTH
============================================================ */

function getAdminAuthInternal(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  cachedAuth =
    getAuth(
      getAdminAppInternal()
    );

  return cachedAuth;
}

/* ============================================================
   STORAGE
============================================================ */

function getAdminStorageInternal(): Storage {
  if (cachedStorage) {
    return cachedStorage;
  }

  cachedStorage =
    getStorage(
      getAdminAppInternal()
    );

  return cachedStorage;
}

/* ============================================================
   MAIN EXPORTS
============================================================ */

export const adminApp: App =
  getAdminAppInternal();

export const adminAuth: Auth =
  getAdminAuthInternal();

export const adminDb: Firestore =
  getAdminDbInternal();

export const adminStorage: Storage =
  getAdminStorageInternal();

/* ============================================================
   FUNCTION EXPORTS
============================================================ */

export function getAdminApp(): App {
  return getAdminAppInternal();
}

export function getAdminAuth(): Auth {
  return getAdminAuthInternal();
}

export function getAdminDb(): Firestore {
  return getAdminDbInternal();
}

export function getAdminStorage(): Storage {
  return getAdminStorageInternal();
}

/* ============================================================
   HISTORICAL ALIASES
============================================================ */

/*
 * Useful if future Doc Chap Ghana APIs reuse
 * imports from the existing Doc Chap project.
 */

export const adminAppRef =
  adminApp;

export const adminAuthRef =
  adminAuth;

export const adminDbRef =
  adminDb;

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default adminApp;