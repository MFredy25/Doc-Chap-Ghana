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
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
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

function isValidGhanaPhone(value: string) {
  return /^\+233\d{9}$/.test(normalizeGhanaPhone(value));
}

function isStrongPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    value
  );
}

function friendlySignupMessage(code?: string) {
  const normalized = safeString(code)
    .replace(/^auth\//, "")
    .toLowerCase();

  if (normalized === "email-already-in-use") {
    return "An account already exists with this email address.";
  }

  if (normalized === "invalid-email") {
    return "Please enter a valid email address.";
  }

  if (normalized === "weak-password") {
    return "Your password is not strong enough.";
  }

  if (normalized === "operation-not-allowed") {
    return "Email and password registration is not enabled.";
  }

  if (normalized === "network-request-failed") {
    return "Unable to connect. Please check your internet connection.";
  }

  if (normalized === "too-many-requests") {
    return "Too many attempts. Please try again later.";
  }

  return "Unable to create your account. Please try again.";
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function InfoPill({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-slate-950/80 dark:text-emerald-200">
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}

/* ============================================================
   PAGE CONTENT
============================================================ */

function PatientSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = cleanNextUrl(searchParams.get("next") || "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [firebaseReady, setFirebaseReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     FIREBASE STATUS
  ============================================================ */

  useEffect(() => {
    let alive = true;

    async function initializeFirebase() {
      try {
        const { auth } = await getFirebaseClients();

        if (!alive) return;

        setFirebaseReady(Boolean(auth));
      } catch (firebaseError) {
        console.error(
          "[PatientSignup][Firebase] Initialization error:",
          firebaseError
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
     SUBMIT AVAILABILITY
  ============================================================ */

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().includes("@") &&
      isValidGhanaPhone(phone) &&
      isStrongPassword(password) &&
      acceptedTerms &&
      acceptedPrivacy &&
      !loading
    );
  }, [
    firstName,
    lastName,
    email,
    phone,
    password,
    acceptedTerms,
    acceptedPrivacy,
    loading,
  ]);

  /* ============================================================
     CREATE ACCOUNT
  ============================================================ */

  async function createAccount() {
    if (loading) return;

    setError(null);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizeGhanaPhone(phone);

    if (!cleanFirstName) {
      setError("Please enter your first name.");
      return;
    }

    if (!cleanLastName) {
      setError("Please enter your last name.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isValidGhanaPhone(cleanPhone)) {
      setError(
        "Please enter a valid Ghanaian phone number, for example +233 24 123 4567."
      );
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Your password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number and one special character."
      );
      return;
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setError(
        "Please accept the Privacy Policy and Terms of Use to continue."
      );
      return;
    }

    setLoading(true);

    try {
      const { auth, db } = await getFirebaseClients();

      if (!auth || !db) {
        throw new Error("Firebase is not initialized.");
      }

      const {
        createUserWithEmailAndPassword,
        updateProfile,
      } = await import("firebase/auth");

      const {
        doc,
        serverTimestamp,
        setDoc,
      } = await import("firebase/firestore");

      /* --------------------------------------------------------
         FIREBASE AUTH
      -------------------------------------------------------- */

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const uid = credential.user.uid;

      if (!uid) {
        throw new Error(
          "Unable to retrieve the patient ID after registration."
        );
      }

      const fullName =
        `${cleanFirstName} ${cleanLastName}`.trim();

      /* --------------------------------------------------------
         FIREBASE AUTH PROFILE
      -------------------------------------------------------- */

      try {
        await updateProfile(credential.user, {
          displayName: fullName,
        });
      } catch (profileError) {
        console.error(
          "[PatientSignup] Unable to update auth profile:",
          profileError
        );
      }

      /* --------------------------------------------------------
         FIRESTORE PATIENT
      -------------------------------------------------------- */

      await setDoc(
        doc(db, "patients", uid),
        {
          uid,

          role: "patient",
          accountType: "patient",

          profile: {
            firstName: cleanFirstName,
            lastName: cleanLastName,
            fullName,
            displayName: fullName,

            email: cleanEmail,
            phone: cleanPhone,

            dob: null,
            gender: null,

            photoUrl: null,

            address: null,
            city: null,
            region: null,
            postalCode: null,

            country: "Ghana",
            countryIso2: "GH",
          },

          security: {
            emailVerified: credential.user.emailVerified,
            phoneVerified: false,

            consentTerms: true,
            consentPrivacy: true,

            consentAll: null,
            consentHealthInformation: null,
            consentInsurance: null,
            consentAllergies: null,
            consentMedications: null,
            consentPrescriptions: null,
            consentMedicalReports: null,
            consentMedicalExaminations: null,
            consentValidUntil: null,
          },

          meta: {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            locale: "en-GH",
            country: "GH",

            platform: "web",
            application: "doc_chap_ghana",

            profileCompleted: false,
          },

          locks: {
            dobLocked: false,
            lastNameLocked: false,
          },
        },
        {
          merge: true,
        }
      );

      console.log("[PatientSignup] Patient account created:", {
        uid,
        email: cleanEmail,
        phone: cleanPhone,
      });

      /* --------------------------------------------------------
         OPTIONAL WELCOME EMAIL

         If you later create the Ghana API:
         /api/send-welcome-email-patient

         you can keep this block.
      -------------------------------------------------------- */

      try {
        await fetch("/api/send-welcome-email-patient", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            country: "GH",
            locale: "en-GH",
          }),
        });
      } catch (emailError) {
        console.error(
          "[PatientSignup] Welcome email error:",
          emailError
        );
      }

      /* --------------------------------------------------------
         REDIRECTION
      -------------------------------------------------------- */

      if (nextUrl) {
        router.replace(nextUrl);
        return;
      }

      router.replace("/patients/dashboard");
    } catch (signupError: any) {
      console.error(
        "[PatientSignup] Registration error:",
        signupError
      );

      const code = safeString(signupError?.code);

      setError(friendlySignupMessage(code));
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
      <Header />

      <main className="w-full overflow-hidden">
        <section className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30">
          {/* BACKGROUND */}
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />

          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/10" />

          <div className="grid w-full grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)] lg:px-10 lg:py-14 xl:gap-12 xl:px-12 2xl:px-16">
            {/* ===================================================
                LEFT
            =================================================== */}

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-slate-900/80 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Doc Chap Ghana patient registration
              </div>

              <h1 className="mt-6 max-w-5xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Create your patient account{" "}
                <span className="text-emerald-700 dark:text-emerald-300">
                  in a few steps
                </span>
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                Create your Doc Chap Ghana account to book appointments,
                access your healthcare services and manage your patient
                information from one secure space.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <InfoPill
                  icon={ShieldCheck}
                  text="Secure account"
                />

                <InfoPill
                  icon={CalendarCheck2}
                  text="Online appointments"
                />

                <InfoPill
                  icon={HeartPulse}
                  text="Patient space"
                />
              </div>

              <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />

                  <div className="mt-3 text-sm font-black">
                    Protected data
                  </div>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                    Your personal and healthcare information stays
                    protected.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <Sparkles className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />

                  <div className="mt-3 text-sm font-black">
                    Quick registration
                  </div>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                    Only a few details are required to create your
                    account.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                  <BadgeCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />

                  <div className="mt-3 text-sm font-black">
                    Doc Chap Ghana
                  </div>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                    Access doctors and healthcare services from your
                    patient account.
                  </p>
                </div>
              </div>
            </div>

            {/* ===================================================
                RIGHT
            =================================================== */}

            <div className="relative z-10">
              <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-100/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {/* FORM HEADER */}
                <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-slate-800 dark:from-emerald-950/30 dark:to-slate-950">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <Lock className="h-3.5 w-3.5" />
                        Secure registration
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        Sign up
                      </h2>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                        Create your patient account to continue.
                      </p>
                    </div>

                    <div className="hidden items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          firebaseReady
                            ? "bg-emerald-600"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      />

                      {firebaseReady
                        ? "Ready"
                        : "Initializing"}
                    </div>
                  </div>
                </div>

                {/* FORM */}
                <div className="p-5 sm:p-6">
                  {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />

                        <div className="text-sm font-semibold text-red-700 dark:text-red-200">
                          {error}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* NAME */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          First name
                        </label>

                        <div className="relative mt-2">
                          <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            value={firstName}
                            onChange={(event) =>
                              setFirstName(event.target.value)
                            }
                            placeholder="e.g. Ama"
                            autoComplete="given-name"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Last name
                        </label>

                        <div className="relative mt-2">
                          <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            value={lastName}
                            onChange={(event) =>
                              setLastName(event.target.value)
                            }
                            placeholder="e.g. Mensah"
                            autoComplete="family-name"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Email address
                      </label>

                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          type="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* PHONE */}
                    <div>
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Phone number
                      </label>

                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          value={phone}
                          onChange={(event) =>
                            setPhone(event.target.value)
                          }
                          type="tel"
                          inputMode="tel"
                          placeholder="+233 24 123 4567"
                          autoComplete="tel"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                        />
                      </div>

                      <p className="mt-2 text-xs font-medium text-slate-500">
                        Ghanaian phone number required. Country code
                        +233 will be applied automatically.
                      </p>
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Password
                      </label>

                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Create a strong password"
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (current) => !current
                            )
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                        Minimum 8 characters with uppercase,
                        lowercase, number and special character.
                      </p>
                    </div>

                    {/* PRIVACY */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPrivacy}
                        onChange={(event) =>
                          setAcceptedPrivacy(
                            event.target.checked
                          )
                        }
                        className="mt-0.5 h-4 w-4 accent-emerald-600"
                      />

                      <span className="text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                        I have read and accept the{" "}
                        <Link
                          href="/privacy"
                          className="font-bold text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>

                    {/* TERMS */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) =>
                          setAcceptedTerms(
                            event.target.checked
                          )
                        }
                        className="mt-0.5 h-4 w-4 accent-emerald-600"
                      />

                      <span className="text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                        I agree to the{" "}
                        <Link
                          href="/terms-of-use"
                          className="font-bold text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                        >
                          Terms of Use
                        </Link>
                        .
                      </span>
                    </label>

                    {/* CREATE */}
                    <button
                      type="button"
                      onClick={() => void createAccount()}
                      disabled={!canSubmit}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-md transition ${
                        canSubmit
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create my patient account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* LOGIN */}
                    <Link
                      href={`/patients/login${
                        nextUrl
                          ? `?next=${encodeURIComponent(
                              nextUrl
                            )}`
                          : ""
                      }`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    >
                      Already have an account? Log in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PatientSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-black">
          <Header />

          <main className="w-full px-4 py-10 sm:px-6 md:px-10 lg:px-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Loading...
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Preparing patient registration.
              </p>
            </div>
          </main>

          <Footer />
        </div>
      }
    >
      <PatientSignupContent />
    </Suspense>
  );
}