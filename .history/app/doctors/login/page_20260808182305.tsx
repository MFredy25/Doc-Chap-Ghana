"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  LineChart,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

/* ============================================================
   FIREBASE
============================================================ */

async function getFirebaseClients() {
  const mod = await import(
    "@/lib/firebase/client"
  );

  return {
    auth: mod.auth,
    db: mod.db,
  };
}

/* ============================================================
   HELPERS
============================================================ */

function safeString(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function friendlyLoginMessage(
  code?: string
): string {
  const normalized =
    safeString(code)
      .replace(/^auth\//, "")
      .toLowerCase();

  if (
    normalized ===
      "invalid-credential" ||
    normalized ===
      "wrong-password" ||
    normalized ===
      "user-not-found" ||
    normalized ===
      "invalid-login-credentials"
  ) {
    return "Please check your professional email address or password.";
  }

  if (
    normalized === "invalid-email"
  ) {
    return "Please enter a valid professional email address.";
  }

  if (
    normalized === "user-disabled"
  ) {
    return "This doctor account has been disabled.";
  }

  if (
    normalized ===
    "too-many-requests"
  ) {
    return "Too many login attempts. Please try again later.";
  }

  if (
    normalized ===
    "network-request-failed"
  ) {
    return "Unable to connect. Please check your internet connection.";
  }

  if (
    normalized ===
    "operation-not-allowed"
  ) {
    return "Email and password login is not enabled in Firebase.";
  }

  return "Unable to log in. Please try again.";
}

/* ============================================================
   PAGE
============================================================ */

export default function DoctorLoginPage() {
  const router =
    useRouter();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const heroStyle =
    useMemo(
      () => ({
        animation:
          "fadeUp 900ms cubic-bezier(0.22, 1, 0.36, 1) 0ms both",
      }),
      []
    );

  const panelStyle =
    useMemo(
      () => ({
        animation:
          "fadeUp 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both",
      }),
      []
    );

  /* ============================================================
     LOGIN
  ============================================================ */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError(null);

    const form =
      new FormData(
        e.currentTarget
      );

    const email =
      safeString(
        form.get("email")
      ).toLowerCase();

    const password =
      String(
        form.get(
          "password"
        ) || ""
      );

    const remember =
      form.get(
        "remember"
      ) === "on";

    if (!email) {
      setError(
        "Please enter your professional email address."
      );
      return;
    }

    if (
      !email.includes("@")
    ) {
      setError(
        "Please enter a valid professional email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        auth,
        db,
      } =
        await getFirebaseClients();

      if (
        !auth ||
        !db
      ) {
        throw new Error(
          "Firebase is not initialized. Check your Firebase environment variables."
        );
      }

      const {
        browserLocalPersistence,
        browserSessionPersistence,
        setPersistence,
        signInWithEmailAndPassword,
        signOut,
      } = await import(
        "firebase/auth"
      );

      const {
        doc,
        getDoc,
      } = await import(
        "firebase/firestore"
      );

      /* --------------------------------------------------------
         PERSISTENCE
      -------------------------------------------------------- */

      await setPersistence(
        auth,
        remember
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      /* --------------------------------------------------------
         FIREBASE AUTH
      -------------------------------------------------------- */

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const uid =
        credential.user
          ?.uid;

      if (!uid) {
        await signOut(
          auth
        );

        setError(
          "Unable to open your doctor session."
        );

        return;
      }

      /* --------------------------------------------------------
         DOCTOR GUARD

         Only users with:
         professionals/{uid}
         can access this doctor login.
      -------------------------------------------------------- */

      let professionalSnapshot;

      try {
        professionalSnapshot =
          await getDoc(
            doc(
              db,
              "professionals",
              uid
            )
          );
      } catch (
        firestoreError
      ) {
        console.error(
          "[DoctorLogin] Professional profile read error:",
          firestoreError
        );

        await signOut(
          auth
        );

        setError(
          "Unable to verify your professional account. Please try again."
        );

        return;
      }

      if (
        !professionalSnapshot.exists()
      ) {
        await signOut(
          auth
        );

        setError(
          "Access denied. This area is reserved for registered Doc Chap Ghana doctors."
        );

        return;
      }

      const professionalData =
        professionalSnapshot.data() as {
          role?: unknown;
          professionalType?: unknown;
          accountType?: unknown;
          status?: unknown;
          active?: unknown;
          professional?: {
            type?: unknown;
          };
        };

      const role =
        safeString(
          professionalData
            ?.role
        ).toLowerCase();

      const professionalType =
        safeString(
          professionalData
            ?.professionalType ||
            professionalData
              ?.professional
              ?.type
        ).toLowerCase();

      /*
       * Existing professional documents may not yet contain
       * professionalType, so the existence of professionals/{uid}
       * remains the primary guard.
       *
       * But when a type is present, refuse a non-doctor account.
       */
      if (
        professionalType &&
        professionalType !==
          "doctor"
      ) {
        await signOut(
          auth
        );

        setError(
          "This account is not registered as a doctor."
        );

        return;
      }

      if (
        role &&
        role !== "doctor" &&
        professionalType !==
          "doctor"
      ) {
        await signOut(
          auth
        );

        setError(
          "This account is not registered as a doctor."
        );

        return;
      }

      if (
        professionalData
          ?.active ===
          false ||
        safeString(
          professionalData
            ?.status
        ).toLowerCase() ===
          "disabled"
      ) {
        await signOut(
          auth
        );

        setError(
          "Your doctor account is currently disabled."
        );

        return;
      }

      /* --------------------------------------------------------
         TOKEN
      -------------------------------------------------------- */

      try {
        await credential.user.getIdToken(
          true
        );
      } catch {
        // Token refresh is not blocking.
      }

      console.log(
        "[DoctorLogin] Login successful:",
        {
          uid,
          email:
            credential.user
              .email,
        }
      );

      /* ========================================================
         AFTER LOGIN → DASHBOARD
      ======================================================== */

      router.replace(
        "/doctors/dashboard"
      );
    } catch (
      loginError: any
    ) {
      console.error(
        "[DoctorLogin] Login error:",
        loginError
      );

      if (
        loginError instanceof
          Error &&
        loginError.message.includes(
          "Firebase is not initialized"
        )
      ) {
        setError(
          loginError.message
        );

        return;
      }

      setError(
        friendlyLoginMessage(
          loginError?.code
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
            opacity: 0.92;
          }

          50% {
            transform: scale(1.02);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 0.92;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <main>
        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {/* BACKGROUND */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div
                style={
                  heroStyle
                }
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <Stethoscope className="h-4 w-4" />

                  <span>
                    Doctor access
                  </span>
                </div>

                <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl dark:text-white">
                  Welcome back to
                  your doctor space
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-700 sm:text-base dark:text-zinc-300">
                  Log in to Doc Chap
                  Ghana to manage your
                  appointments,
                  consultations,
                  patient follow-up and
                  payments from one
                  secure professional
                  space.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <BadgeCheck className="h-4 w-4" />

                    Secure access
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-200">
                    <Sparkles className="h-4 w-4" />

                    Teleconsultation
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
                    <LineChart className="h-4 w-4" />

                    Payments &
                    tracking
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "doctor-login-form"
                        )
                        ?.scrollIntoView(
                          {
                            behavior:
                              "smooth",
                            block:
                              "center",
                          }
                        )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                    style={{
                      animation:
                        "softPulse 2.2s ease-in-out .9s infinite",
                    }}
                  >
                    Log in

                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                  >
                    Need help?

                    <HelpCircle className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />

                      Your Doc Chap
                      professional space
                    </div>

                    <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                        <span>
                          Manage your
                          upcoming patient
                          appointments.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />

                        <span>
                          Access in-person
                          and video
                          consultations.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                        <span>
                          Follow your
                          patients from one
                          secure dashboard.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />

                        <span>
                          Track your
                          activity,
                          payments and
                          professional
                          information.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold">
                      <Lock className="h-4 w-4 text-blue-700 dark:text-blue-300" />

                      Secure connection
                    </div>

                    <p className="mt-2 leading-relaxed">
                      Your professional
                      account is personal.
                      Never share your
                      password or access
                      credentials with
                      another person.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  Don&apos;t have a doctor
                  account yet?{" "}

                  <Link
                    href="/doctors/signup"
                    className="font-semibold text-blue-600 underline underline-offset-4 transition hover:text-blue-500 dark:text-blue-400"
                  >
                    Create your doctor
                    account
                  </Link>
                </p>
              </div>

              {/* =================================================
                  RIGHT
              ================================================= */}

              <div
                style={
                  panelStyle
                }
                className="relative"
              >
                <div
                  id="doctor-login-form"
                  className="relative mx-auto w-full max-w-md scroll-mt-24 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/40 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent" />

                  <div className="relative">
                    {/* HEADER */}

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Secure login
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          For registered
                          doctors only.
                        </div>
                      </div>
                    </div>

                    {/* LOGO */}

                    <div className="mt-5 flex flex-col items-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <Image
                          src="/images/docchap_pro.png"
                          alt="Doc Chap Pro"
                          width={72}
                          height={72}
                          priority
                          className="h-16 w-16 object-contain"
                        />
                      </div>

                      <h2 className="mt-4 text-xl font-bold text-zinc-950 dark:text-white">
                        Doctor login
                      </h2>

                      <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Enter your
                        professional
                        credentials to access
                        your Doc Chap Ghana
                        account.
                      </p>
                    </div>

                    {/* FORM */}

                    <form
                      onSubmit={
                        handleSubmit
                      }
                      className="mt-6 space-y-4"
                    >
                      {/* EMAIL */}

                      <label className="block space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        <span>
                          Professional
                          email
                        </span>

                        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950/60 dark:focus-within:border-blue-700">
                          <Mail className="h-4 w-4 shrink-0 text-blue-600" />

                          <input
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            required
                            disabled={
                              loading
                            }
                            placeholder="name@example.com"
                            className="h-11 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
                          />
                        </div>
                      </label>

                      {/* PASSWORD */}

                      <label className="block space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-center justify-between gap-3">
                          <span>
                            Password
                          </span>

                          <Link
                            href="/help"
                            className="text-xs font-medium text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
                          >
                            Forgot
                            password?
                          </Link>
                        </div>

                        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950/60 dark:focus-within:border-blue-700">
                          <Lock className="h-4 w-4 shrink-0 text-indigo-600" />

                          <input
                            name="password"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            autoComplete="current-password"
                            required
                            disabled={
                              loading
                            }
                            placeholder="Enter your password"
                            className="h-11 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (
                                  value
                                ) =>
                                  !value
                              )
                            }
                            disabled={
                              loading
                            }
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </label>

                      {/* REMEMBER */}

                      <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <input
                          name="remember"
                          type="checkbox"
                          disabled={
                            loading
                          }
                          className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-blue-600"
                        />

                        <span>
                          Keep me signed in
                          on this device
                        </span>
                      </label>

                      {/* ERROR */}

                      {error && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                            <span>
                              {error}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* SUBMIT */}

                      <button
                        type="submit"
                        disabled={
                          loading
                        }
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? (
                          <>
                            <span
                              className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                              style={{
                                animation:
                                  "spin 700ms linear infinite",
                              }}
                            />

                            Signing in...
                          </>
                        ) : (
                          <>
                            Log in to my
                            doctor space

                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* SEPARATOR */}

                    <div className="my-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />

                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Doc Chap Ghana
                      </span>

                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    {/* REGISTER */}

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Are you a doctor
                        and not registered
                        yet?
                      </p>

                      <Link
                        href="/doctors/signup"
                        className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
                      >
                        Create a doctor
                        account

                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* SECURITY */}

                    <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                      <span>
                        Your connection and
                        professional
                        information are
                        protected within the
                        Doc Chap Ghana
                        environment.
                      </span>
                    </div>

                    <div className="mt-5 text-center text-[11px] leading-relaxed text-zinc-400">
                      By logging in, you
                      agree to our{" "}

                      <Link
                        href="/terms-of-use"
                        className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        Terms of Use
                      </Link>{" "}

                      and{" "}

                      <Link
                        href="/privacy"
                        className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </div>
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