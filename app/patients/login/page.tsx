"use client";

import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";

/* ============================================================
   FIREBASE
============================================================ */

async function getFirebaseClients() {
  const mod = await import("@/lib/firebase/client");

  return {
    auth: mod.auth,
    db: mod.db,
  };
}

/* ============================================================
   HELPERS
============================================================ */

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function cleanNextUrl(value: string) {
  const next = safeString(value);

  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";

  return next;
}

function looksLikeEmail(value: string) {
  return value.includes("@");
}

function normalizeGhanaPhone(value: string) {
  const raw = safeString(value);

  if (!raw) return "";

  const compact = raw.replace(/[^\d+]/g, "");

  if (compact.startsWith("+233")) {
    return `+233${compact.slice(4).replace(/\D/g, "")}`;
  }

  if (compact.startsWith("00233")) {
    return `+233${compact.slice(5).replace(/\D/g, "")}`;
  }

  let digits = compact.replace(/\D/g, "");

  if (digits.startsWith("233")) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return `+233${digits}`;
}

function friendlyAuthMessage(firebaseCode?: string) {
  const code = safeString(firebaseCode)
    .replace(/^auth\//, "")
    .toLowerCase();

  if (
    code === "invalid-credential" ||
    code === "wrong-password" ||
    code === "user-not-found" ||
    code === "invalid_login_credentials" ||
    code === "invalid-login-credentials"
  ) {
    return "Please check your email, phone number or password.";
  }

  if (code === "invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "user-disabled") {
    return "This account has been disabled.";
  }

  if (code === "too-many-requests") {
    return "Too many login attempts. Please try again later.";
  }

  if (code === "network-request-failed") {
    return "Unable to connect. Please check your internet connection.";
  }

  if (code === "operation-not-allowed") {
    return "Email and password login is not enabled.";
  }

  return "Unable to log in. Please try again.";
}

/* ============================================================
   PATIENT GUARD
============================================================ */

async function guardOnlyPatient(uid: string) {
  const { db } = await getFirebaseClients();

  if (!db) {
    return "Unable to verify your patient account.";
  }

  const {
    collectionGroup,
    doc,
    documentId,
    getDoc,
    getDocs,
    limit,
    query,
    where,
  } = await import("firebase/firestore");

  /* -----------------------------------------------------------
     PROFESSIONAL
  ----------------------------------------------------------- */

  try {
    const professionalSnapshot = await getDoc(
      doc(db, "professionals", uid)
    );

    if (professionalSnapshot.exists()) {
      return "This login page is reserved for patients. Please use the healthcare professional login area.";
    }
  } catch (error) {
    console.log(
      "[PatientLogin][Guard] professionals check:",
      error
    );
  }

  /* -----------------------------------------------------------
     CLINIC MEMBER
  ----------------------------------------------------------- */

  try {
    const membersQuery = query(
      collectionGroup(db, "members"),
      where(documentId(), "==", uid),
      limit(1)
    );

    const membersSnapshot = await getDocs(membersQuery);

    if (!membersSnapshot.empty) {
      return "This login page is reserved for patients. Please use the clinic login area.";
    }
  } catch (error) {
    console.log(
      "[PatientLogin][Guard] clinic members check:",
      error
    );
  }

  /* -----------------------------------------------------------
     PATIENT
  ----------------------------------------------------------- */

  try {
    const patientSnapshot = await getDoc(
      doc(db, "patients", uid)
    );

    if (!patientSnapshot.exists()) {
      return "Access denied. This area is reserved for Doc Chap Ghana patients.";
    }
  } catch (error) {
    console.error(
      "[PatientLogin][Guard] patient verification:",
      error
    );

    return "Unable to verify your patient profile.";
  }

  return null;
}

/* ============================================================
   FIND EMAIL FROM PHONE
============================================================ */

async function findEmailByPhone(rawPhone: string) {
  const { db } = await getFirebaseClients();

  if (!db) return null;

  const {
    collection,
    getDocs,
    limit,
    query,
    where,
  } = await import("firebase/firestore");

  const patientsRef = collection(db, "patients");

  const normalizedPhone = normalizeGhanaPhone(rawPhone);

  const possibleValues = Array.from(
    new Set([
      rawPhone.trim(),
      rawPhone.trim().replace(/\s+/g, ""),
      normalizedPhone,
      normalizedPhone.replace("+233", "0"),
      normalizedPhone.replace("+", ""),
    ])
  ).filter(Boolean);

  for (const value of possibleValues) {
    try {
      const patientQuery = query(
        patientsRef,
        where("profile.phone", "==", value),
        limit(1)
      );

      const snapshot = await getDocs(patientQuery);

      if (snapshot.empty) continue;

      const data = snapshot.docs[0].data() as {
        profile?: {
          email?: string;
        };
      };

      const patientEmail = safeString(
        data?.profile?.email
      ).toLowerCase();

      if (patientEmail) {
        return patientEmail;
      }
    } catch (error) {
      console.error(
        "[PatientLogin] Phone lookup error:",
        error
      );
    }
  }

  return null;
}

/* ============================================================
   PILL
============================================================ */

function Pill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      {children}
    </span>
  );
}

/* ============================================================
   LOGIN CONTENT
============================================================ */

function PatientLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = cleanNextUrl(
    searchParams.get("next") || ""
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [firebaseReady, setFirebaseReady] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /* ============================================================
     FIREBASE READY
  ============================================================ */

  useEffect(() => {
    let alive = true;

    async function initializeFirebase() {
      try {
        const { auth } = await getFirebaseClients();

        if (!alive) return;

        setFirebaseReady(Boolean(auth));
      } catch (error) {
        console.error(
          "[PatientLogin] Firebase initialization error:",
          error
        );

        if (!alive) return;

        setFirebaseReady(false);
      }
    }

    void initializeFirebase();

    return () => {
      alive = false;
    };
  }, []);

  /* ============================================================
     CAN SUBMIT
  ============================================================ */

  const canSubmit = useMemo(() => {
    return (
      identifier.trim().length > 0 &&
      password.length >= 6 &&
      !loading
    );
  }, [identifier, password, loading]);

  /* ============================================================
     RESOLVE EMAIL
  ============================================================ */

  async function resolveEmailFromIdentifier() {
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      return null;
    }

    if (looksLikeEmail(cleanIdentifier)) {
      return cleanIdentifier.toLowerCase();
    }

    return await findEmailByPhone(cleanIdentifier);
  }

  /* ============================================================
     SIGN IN
  ============================================================ */

  async function signIn() {
    if (loading) return;

    setError(null);
    setSuccessMessage(null);

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setError(
        "Please enter your email address or phone number."
      );
      return;
    }

    if (!password || password.length < 6) {
      setError(
        "Please enter a valid password of at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const { auth } = await getFirebaseClients();

      if (!auth) {
        setError(
          "Firebase authentication is not initialized."
        );
        return;
      }

      const {
        signInWithEmailAndPassword,
        signOut,
      } = await import("firebase/auth");

      /* --------------------------------------------------------
         EMAIL OR PHONE
      -------------------------------------------------------- */

      const emailToUse =
        await resolveEmailFromIdentifier();

      if (!emailToUse) {
        setError(
          "Please check your email, phone number or password."
        );
        return;
      }

      /* --------------------------------------------------------
         FIREBASE LOGIN
      -------------------------------------------------------- */

      const credential =
        await signInWithEmailAndPassword(
          auth,
          emailToUse,
          password
        );

      const uid = credential.user?.uid;

      if (!uid) {
        await signOut(auth);

        setError(
          "Unable to open your session. Please try again."
        );

        return;
      }

      /* --------------------------------------------------------
         VERIFY PATIENT
      -------------------------------------------------------- */

      const guardMessage =
        await guardOnlyPatient(uid);

      if (guardMessage) {
        await signOut(auth);

        setError(guardMessage);

        return;
      }

      console.log(
        "[PatientLogin] Authentication successful:",
        {
          uid,
        }
      );

      /* --------------------------------------------------------
         REDIRECT
      -------------------------------------------------------- */

      if (nextUrl) {
        router.replace(nextUrl);
        return;
      }

      router.replace("/patients/dashboard");
    } catch (loginError: any) {
      console.error(
        "[PatientLogin] Authentication error:",
        loginError
      );

      setError(
        friendlyAuthMessage(loginError?.code)
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     PASSWORD RESET
  ============================================================ */

  async function resetPassword() {
    if (resetLoading || loading) return;

    setError(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setError(
        "Enter your email address or phone number first."
      );
      return;
    }

    setResetLoading(true);

    try {
      const { auth } = await getFirebaseClients();

      if (!auth) {
        setError(
          "Firebase authentication is not initialized."
        );
        return;
      }

      const emailToUse =
        await resolveEmailFromIdentifier();

      if (!emailToUse) {
        setError(
          "We could not find an email address associated with this account."
        );
        return;
      }

      const {
        sendPasswordResetEmail,
      } = await import("firebase/auth");

      await sendPasswordResetEmail(
        auth,
        emailToUse
      );

      setSuccessMessage(
        `A password reset email has been sent to ${emailToUse}.`
      );
    } catch (resetError: any) {
      console.error(
        "[PatientLogin] Password reset error:",
        resetError
      );

      const code = safeString(
        resetError?.code
      ).replace(/^auth\//, "");

      if (
        code === "user-not-found" ||
        code === "invalid-email"
      ) {
        setError(
          "We could not find an account with this information."
        );
      } else {
        setError(
          "Unable to send the password reset email. Please try again."
        );
      }
    } finally {
      setResetLoading(false);
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <main className="w-full px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* =================================================
                LEFT
            ================================================= */}

            <div className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 via-zinc-50 to-cyan-50 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10 dark:border-zinc-800 dark:from-emerald-950/30 dark:via-zinc-900/40 dark:to-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <HeartPulse className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <div className="text-lg font-bold text-black dark:text-white">
                    Patient space
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Log in to access Doc Chap Ghana.
                  </div>
                </div>
              </div>

              <h1 className="mt-8 max-w-xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                Your healthcare,{" "}
                <span className="text-emerald-700 dark:text-emerald-400">
                  in one secure space.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-zinc-600 sm:text-base dark:text-zinc-300">
                Access your appointments, consultations and
                patient information securely through your Doc
                Chap Ghana account.
              </p>

              {/* PILLS */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  Protected data
                </Pill>

                <Pill>
                  <CalendarCheck2 className="mr-1 h-4 w-4" />
                  Online appointments
                </Pill>

                <Pill>
                  <Lock className="mr-1 h-4 w-4" />
                  Secure access
                </Pill>
              </div>

              {/* FEATURES */}
              <div className="mt-8 space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">
                      Email
                    </div>

                    <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Use the email address associated with your
                      Doc Chap Ghana account.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">
                      Ghana phone number
                    </div>

                    <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      You can also enter the Ghanaian phone
                      number registered on your patient account.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <Fingerprint className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">
                      Secure authentication
                    </div>

                    <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Your account is protected through Firebase
                      Authentication.
                    </div>
                  </div>
                </div>
              </div>

              {/* PRIVACY */}
              <div className="mt-8 rounded-2xl border border-emerald-100 bg-white/80 p-4 dark:border-emerald-900/40 dark:bg-zinc-950">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Privacy & security
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Your patient information is protected and
                  accessible only through authorized services
                  and healthcare professionals.
                </p>
              </div>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <Lock className="h-3.5 w-3.5" />
                    Secure patient login
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-black sm:text-3xl dark:text-white">
                    Log in
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Access your Doc Chap Ghana patient account.
                  </p>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      firebaseReady
                        ? "bg-emerald-600"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />

                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {firebaseReady
                      ? "Ready"
                      : "Initializing..."}
                  </div>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />

                    <div className="text-sm font-semibold text-red-700 dark:text-red-200">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {successMessage && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />

                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                      {successMessage}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-5">
                {/* IDENTIFIER */}
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Email or phone number
                  </label>

                  <div className="relative mt-2">
                    <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={identifier}
                      onChange={(event) =>
                        setIdentifier(event.target.value)
                      }
                      placeholder="name@example.com or +233..."
                      autoComplete="username"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Password
                  </label>

                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="••••••••"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          canSubmit
                        ) {
                          void signIn();
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-12 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* LOGIN */}
                <button
                  type="button"
                  onClick={() => void signIn()}
                  disabled={!canSubmit}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow transition ${
                    canSubmit
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>

                {/* FORGOT PASSWORD */}
                <button
                  type="button"
                  onClick={() =>
                    void resetPassword()
                  }
                  disabled={
                    loading || resetLoading
                  }
                  className="w-full text-center text-sm font-semibold text-zinc-600 transition hover:text-emerald-700 disabled:opacity-50 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  {resetLoading
                    ? "Sending reset email..."
                    : "Forgot your password?"}
                </button>

                {/* SEPARATOR */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />

                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    New to Doc Chap?
                  </span>

                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* SIGNUP */}
                <Link
                  href={`/patients/signup${
                    nextUrl
                      ? `?next=${encodeURIComponent(
                          nextUrl
                        )}`
                      : ""
                  }`}
                  className="flex w-full items-center justify-center rounded-xl border border-emerald-600 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:bg-zinc-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  Create a patient account
                </Link>

                {nextUrl && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      After logging in, you will automatically
                      return to the page you were visiting so
                      you can continue your appointment or
                      booking.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PatientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
          <Header />

          <main className="w-full px-4 py-10 sm:px-6 md:px-10 lg:px-16">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Loading...
              </div>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Initializing patient login.
              </p>
            </div>
          </main>

          <Footer />
        </div>
      }
    >
      <PatientLoginContent />
    </Suspense>
  );
}