"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  Stethoscope,
  ArrowRight,
  Info,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  LineChart,
  LogIn,
  AlertCircle,
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

function isStrongPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    value
  );
}

function normalizeInternationalPhone(value: string): string {
  const raw = safeString(value);

  if (!raw) {
    return "";
  }

  let compact = raw.replace(/[()\s.-]/g, "");

  if (compact.startsWith("00")) {
    compact = `+${compact.slice(2)}`;
  }

  if (!compact.startsWith("+")) {
    return compact.replace(/\D/g, "");
  }

  return `+${compact.slice(1).replace(/\D/g, "")}`;
}

function isValidInternationalPhone(value: string): boolean {
  const normalized = normalizeInternationalPhone(value);

  /*
   * E.164-style international number:
   * + followed by 8 to 15 digits.
   *
   * Examples:
   * +233241234567
   * +33612345678
   * +447911123456
   */
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function friendlySignupMessage(code?: string): string {
  const normalized = safeString(code)
    .replace(/^auth\//, "")
    .toLowerCase();

  if (normalized === "email-already-in-use") {
    return "A doctor account already exists with this email address.";
  }

  if (normalized === "invalid-email") {
    return "Please enter a valid professional email address.";
  }

  if (normalized === "weak-password") {
    return "Your password is not strong enough.";
  }

  if (normalized === "operation-not-allowed") {
    return "Email and password registration is not enabled in Firebase.";
  }

  if (normalized === "network-request-failed") {
    return "Unable to connect. Please check your internet connection.";
  }

  if (normalized === "too-many-requests") {
    return "Too many attempts. Please try again later.";
  }

  return "Unable to create your doctor account. Please try again.";
}

/* ============================================================
   PAGE
============================================================ */

export default function DoctorSignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const heroStyle = useMemo(
    () => ({
      animation:
        "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 0ms both",
    }),
    []
  );

  const panelStyle = useMemo(
    () => ({
      animation:
        "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 120ms both",
    }),
    []
  );

  /* ============================================================
     SIGNUP
  ============================================================ */

  async function submit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError(null);

    const form = new FormData(e.currentTarget);

    const lastName = safeString(
      form.get("lastName")
    );

    const firstName = safeString(
      form.get("firstName")
    );

    const specialty = safeString(
      form.get("specialty")
    );

    const email = safeString(
      form.get("email")
    ).toLowerCase();

    const rawPhone = safeString(
      form.get("phone")
    );

    const phone = normalizeInternationalPhone(
      rawPhone
    );

    const password = String(
      form.get("password") || ""
    );

    const privacyAccepted =
      form.get("privacy") === "on";

    const termsAccepted =
      form.get("terms") === "on";

    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

    if (!lastName) {
      setError(
        "Please enter your last name."
      );
      return;
    }

    if (!firstName) {
      setError(
        "Please enter your first name."
      );
      return;
    }

    if (!email || !email.includes("@")) {
      setError(
        "Please enter a valid professional email address."
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!isValidInternationalPhone(phone)) {
      setError(
        "Please enter a valid international WhatsApp number with the country code, for example +233 24 123 4567, +33 6 12 34 56 78 or +44 7911 123456."
      );
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Your password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number and one special character."
      );
      return;
    }

    if (
      !privacyAccepted ||
      !termsAccepted
    ) {
      setError(
        "Please accept the Privacy Policy and Terms of Use."
      );
      return;
    }

    setLoading(true);

    try {
      const { auth, db } =
        await getFirebaseClients();

      if (!auth || !db) {
        throw new Error(
          "Firebase is not initialized. Check your Firebase environment variables."
        );
      }

      const {
        createUserWithEmailAndPassword,
        deleteUser,
        updateProfile,
      } = await import("firebase/auth");

      const {
        doc,
        serverTimestamp,
        setDoc,
      } = await import(
        "firebase/firestore"
      );

      /* --------------------------------------------------------
         CREATE FIREBASE AUTH ACCOUNT
      -------------------------------------------------------- */

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        credential.user;

      const uid =
        user.uid;

      if (!uid) {
        throw new Error(
          "Unable to retrieve the doctor account ID."
        );
      }

      const fullName =
        `${firstName} ${lastName}`.trim();

      /* --------------------------------------------------------
         UPDATE FIREBASE AUTH PROFILE
      -------------------------------------------------------- */

      try {
        await updateProfile(user, {
          displayName: fullName,
        });
      } catch (profileError) {
        console.error(
          "[DoctorSignup] updateProfile error:",
          profileError
        );
      }

      /* --------------------------------------------------------
         CREATE PROFESSIONAL DOCUMENT
      -------------------------------------------------------- */

      try {
        await setDoc(
          doc(
            db,
            "professionals",
            uid
          ),
          {
            uid,

            role: "doctor",

            accountType:
              "professional",

            professionalType:
              "doctor",

            status: "active",

            active: true,

            profile: {
              firstName,
              lastName,
              fullName,
              displayName:
                fullName,

              email,
              phone,

              specialty:
                specialty || null,

              photoUrl: null,

              country: "Ghana",
              countryIso2: "GH",

              city: null,
              region: null,
              address: null,
            },

            professional: {
              type: "doctor",

              specialty:
                specialty || null,

              licenseNumber: null,

              registrationNumber:
                null,

              verified: false,

              verificationStatus:
                "pending",
            },

            security: {
              emailVerified:
                user.emailVerified,

              phoneVerified: false,

              privacyAccepted: true,

              termsAccepted: true,
            },

            settings: {
              language: "en",

              locale: "en-GH",

              timezone:
                "Africa/Accra",

              currency: "GHS",
            },

            meta: {
              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),

              platform: "web",

              application:
                "doc_chap_ghana",

              country: "GH",

              profileCompleted:
                false,
            },
          },
          {
            merge: true,
          }
        );
      } catch (firestoreError) {
        /*
         * Avoid leaving an Auth account without its
         * professional Firestore profile.
         */
        try {
          await deleteUser(user);
        } catch (rollbackError) {
          console.error(
            "[DoctorSignup] Auth rollback failed:",
            rollbackError
          );
        }

        throw firestoreError;
      }

      /* --------------------------------------------------------
         REFRESH TOKEN
      -------------------------------------------------------- */

      try {
        await user.getIdToken(true);
      } catch {
        // Not blocking.
      }

      console.log(
        "[DoctorSignup] Doctor created successfully:",
        {
          uid,
          email,
          phone,
        }
      );

      /* ========================================================
         AFTER REGISTRATION → MY ACCOUNT
      ======================================================== */

      router.replace(
        "/doctors/mon-compte"
      );
    } catch (signupError: any) {
      console.error(
        "[DoctorSignup] Signup error:",
        signupError
      );

      const code =
        safeString(
          signupError?.code
        );

      if (
        !code &&
        signupError instanceof Error &&
        signupError.message.includes(
          "Firebase is not initialized"
        )
      ) {
        setError(
          signupError.message
        );

        return;
      }

      setError(
        friendlySignupMessage(
          code
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(32px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes softPulse {
          0% {
            transform: scale(1);
            opacity: .92;
          }

          50% {
            transform: scale(1.02);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: .92;
          }
        }
      `}</style>

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <Stethoscope className="h-4 w-4" />
                  Doctor registration
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
                  Create your doctor account
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Join Doc Chap Ghana to grow your
                  practice through appointment
                  management, teleconsultation,
                  patient follow-up and payments
                  on a modern, secure platform.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <BadgeCheck className="h-4 w-4" />
                    Secure access
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                    <Sparkles className="h-4 w-4" />
                    Teleconsultation
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                    <LineChart className="h-4 w-4" />
                    Payments & tracking
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "doctor-signup-form"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                          block: "start",
                        })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                    style={{
                      animation:
                        "softPulse 2.2s ease-in-out .9s infinite",
                    }}
                  >
                    Start registration

                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    Need help?

                    <Info className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/6 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />

                      Why create an account?
                    </div>

                    <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
                      {[
                        "Open in-person and video consultation slots.",
                        "Receive payments and manage invoices.",
                        "Centralise patient records, prescriptions and reports.",
                        "Apply patient consent and access controls.",
                      ].map(
                        (item, index) => (
                          <li
                            key={item}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle2
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                [
                                  "text-emerald-600",
                                  "text-sky-600",
                                  "text-indigo-600",
                                  "text-purple-600",
                                ][
                                  index
                                ]
                              }`}
                            />

                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold">
                      <Lock className="h-4 w-4 text-amber-700" />

                      Password security
                    </div>

                    <p className="mt-3 leading-relaxed">
                      Your password must have at
                      least{" "}
                      <b>
                        8 characters
                      </b>
                      , including{" "}
                      <b>
                        1 uppercase letter
                      </b>
                      ,{" "}
                      <b>
                        1 lowercase letter
                      </b>
                      ,{" "}
                      <b>
                        1 number
                      </b>{" "}
                      and{" "}
                      <b>
                        1 special character
                      </b>
                      .
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Already have an account?{" "}

                  <Link
                    href="/doctors/login"
                    className="underline underline-offset-4"
                  >
                    Log in to your doctor space
                  </Link>
                </p>
              </div>

              {/* =================================================
                  RIGHT
              ================================================= */}

              <div
                style={panelStyle}
                className="relative"
              >
                <div
                  id="doctor-signup-form"
                  className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/12 via-indigo-500/8 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Secure registration
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          For doctor accounts
                          only.
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col items-center text-center">
                      <Image
                        src="/images/docchap_pro.png"
                        alt="Doc Chap Pro"
                        width={72}
                        height={72}
                        priority
                        className="h-16 w-16 object-contain"
                      />

                      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                        Create your professional
                        account to manage
                        appointments and grow your
                        practice.
                      </p>
                    </div>

                    <form
                      onSubmit={submit}
                      className="mt-6 space-y-4"
                    >
                      {/* NAME */}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          Last name *

                          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <Stethoscope className="h-4 w-4 text-blue-600" />

                            <input
                              name="lastName"
                              required
                              disabled={
                                loading
                              }
                              autoComplete="family-name"
                              placeholder="e.g. Mensah"
                              className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                            />
                          </div>
                        </label>

                        <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          First name *

                          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <Stethoscope className="h-4 w-4 text-blue-600" />

                            <input
                              name="firstName"
                              required
                              disabled={
                                loading
                              }
                              autoComplete="given-name"
                              placeholder="e.g. Ama"
                              className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                            />
                          </div>
                        </label>
                      </div>

                      {/* SPECIALITY */}

                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Speciality

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Stethoscope className="h-4 w-4 text-sky-600" />

                          <input
                            name="specialty"
                            disabled={loading}
                            placeholder="e.g. Cardiology"
                            className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                          />
                        </div>
                      </label>

                      {/* EMAIL */}

                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Professional email *

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Mail className="h-4 w-4 text-blue-600" />

                          <input
                            name="email"
                            type="email"
                            required
                            disabled={loading}
                            autoComplete="email"
                            placeholder="name@example.com"
                            className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                          />
                        </div>
                      </label>

                      {/* PHONE */}

                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Phone number *

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Phone className="h-4 w-4 text-emerald-600" />

                          <input
                            name="phone"
                            type="tel"
                            required
                            disabled={loading}
                            autoComplete="tel"
                            placeholder="+233..., +33..., +44..."
                            className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                          />
                        </div>

                        <div className="text-xs text-zinc-500">
                          Enter your WhatsApp number with the international country code, for example +233, +33 or +44.
                        </div>
                      </label>

                      {/* PASSWORD */}

                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Password *

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 transition focus-within:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Lock className="h-4 w-4 text-indigo-600" />

                          <input
                            name="password"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            required
                            disabled={loading}
                            autoComplete="new-password"
                            placeholder="Create a strong password"
                            className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (
                                  current
                                ) =>
                                  !current
                              )
                            }
                            disabled={loading}
                            className="text-zinc-500 disabled:opacity-50"
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </label>

                      {/* PRIVACY */}

                      <label className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <input
                          name="privacy"
                          type="checkbox"
                          disabled={loading}
                          className="mt-0.5 accent-blue-600"
                        />

                        <span>
                          I agree to the{" "}

                          <Link
                            href="/privacy"
                            className="font-medium text-blue-600 underline"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>

                      {/* TERMS */}

                      <label className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <input
                          name="terms"
                          type="checkbox"
                          disabled={loading}
                          className="mt-0.5 accent-blue-600"
                        />

                        <span>
                          I agree to the{" "}

                          <Link
                            href="/terms-of-use"
                            className="font-medium text-blue-600 underline"
                          >
                            Terms of Use
                          </Link>
                          .
                        </span>
                      </label>

                      {/* ERROR */}

                      {error && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                            <span>
                              {error}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CREATE ACCOUNT */}

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                            Creating account...
                          </>
                        ) : (
                          <>
                            Create my doctor account

                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      {/* LOGIN */}

                      <Link
                        href="/doctors/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 dark:bg-zinc-950 dark:hover:bg-blue-950/30"
                      >
                        <LogIn className="h-4 w-4" />

                        Log in
                      </Link>

                      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Already registered? Access
                        your Doc Chap Ghana doctor
                        space.
                      </p>
                    </form>
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