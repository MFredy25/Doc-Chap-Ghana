"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   PAGE
============================================================ */

export default function ClinicLoginPage() {
  const router =
    useRouter();

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const heroStyle =
    useMemo(
      () => ({
        animation:
          "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 0ms both",
      }),
      []
    );

  const panelStyle =
    useMemo(
      () => ({
        animation:
          "fadeUp 900ms cubic-bezier(0.22,1,0.36,1) 120ms both",
      }),
      []
    );

  /* ============================================================
     LOGIN
  ============================================================ */

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setError(
        "Firebase is not initialized."
      );

      return;
    }

    if (
      loading
    ) {
      return;
    }

    const formData =
      new FormData(
        event.currentTarget
      );

    const email =
      String(
        formData.get(
          "email"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        formData.get(
          "password"
        ) || ""
      );

    if (
      !email ||
      !email.includes(
        "@"
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    if (
      !password
    ) {
      setError(
        "Please enter your password."
      );

      return;
    }

    setLoading(
      true
    );

    setError(
      null
    );

    try {
      const credential =
        await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );

      const user =
        credential.user;

      const clinicSnapshot =
        await getDoc(
          doc(
            firestore,
            "clinics",
            user.uid
          )
        );

      if (
        !clinicSnapshot.exists()
      ) {
        await signOut(
          firebaseAuth
        );

        setError(
          "This account is not registered as a clinic."
        );

        return;
      }

      const clinicData =
        clinicSnapshot.data();

      if (
        clinicData.active ===
        false
      ) {
        await signOut(
          firebaseAuth
        );

        setError(
          "This clinic account is currently inactive."
        );

        return;
      }

      router.replace(
        "/clinics/dashboard"
      );
    } catch (
      loginError: any
    ) {
      console.error(
        "[ClinicLogin] Error:",
        loginError
      );

      const code =
        String(
          loginError?.code ||
            ""
        );

      if (
        code.includes(
          "invalid-credential"
        ) ||
        code.includes(
          "wrong-password"
        ) ||
        code.includes(
          "user-not-found"
        )
      ) {
        setError(
          "Incorrect email address or password."
        );
      } else if (
        code.includes(
          "invalid-email"
        )
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        code.includes(
          "too-many-requests"
        )
      ) {
        setError(
          "Too many login attempts. Please try again later."
        );
      } else {
        setError(
          "Unable to log in. Please try again."
        );
      }
    } finally {
      setLoading(
        false
      );
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
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div
                style={
                  heroStyle
                }
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                  <Building2 className="h-4 w-4" />

                  Clinic workspace
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Log in to your clinic account
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Access your Doc Chap Ghana clinic workspace to manage your profile, activity and professional information from one secure space.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <BadgeCheck className="h-4 w-4" />

                    Secure access
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                    <Sparkles className="h-4 w-4" />

                    Clinic verification
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    <HeartPulse className="h-4 w-4" />

                    Clinic dashboard
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "clinic-login-form"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                          block:
                            "start",
                        })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500"
                    style={{
                      animation:
                        "softPulse 2.2s ease-in-out .9s infinite",
                    }}
                  >
                    Log in now

                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href="/clinics/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-md transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    Create an account

                    <Building2 className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/6 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />

                      Secure clinic access
                    </div>

                    <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
                      {[
                        "Use the email address registered with your clinic account.",
                        "Your account must exist in the Doc Chap Ghana clinic directory.",
                        "Inactive clinic accounts cannot access the workspace.",
                        "Successful login redirects directly to your clinic dashboard.",
                      ].map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              item
                            }
                            className="flex items-start gap-2"
                          >
                            <CheckCircle2
                              className={`mt-0.5 h-4 w-4 ${
                                [
                                  "text-emerald-600",
                                  "text-teal-600",
                                  "text-blue-600",
                                  "text-purple-600",
                                ][
                                  index
                                ]
                              }`}
                            />

                            {
                              item
                            }
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

                      Protected account
                    </div>

                    <p className="mt-3 leading-relaxed">
                      Your clinic credentials are handled securely through Firebase Authentication. Never share your password with another person.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  No clinic account yet?{" "}

                  <Link
                    href="/clinics/signup"
                    className="underline underline-offset-4"
                  >
                    Create your clinic account
                  </Link>
                </p>
              </div>

              {/* =================================================
                  RIGHT / LOGIN FORM
              ================================================= */}

              <div
                style={
                  panelStyle
                }
                className="relative"
              >
                <div
                  id="clinic-login-form"
                  className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/6 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Clinic login
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          For registered clinics and authorised representatives.
                        </div>
                      </div>
                    </div>

                    <form
                      onSubmit={
                        submit
                      }
                      className="mt-6 space-y-4"
                    >
                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Email address *

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Mail className="h-4 w-4 text-teal-600" />

                          <input
                            name="email"
                            type="email"
                            required
                            placeholder="clinic@example.com"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                        </div>
                      </label>

                      <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Password *

                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
                          <Lock className="h-4 w-4 text-indigo-600" />

                          <input
                            name="password"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            required
                            placeholder="Your password"
                            className="w-full bg-transparent text-sm outline-none"
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
                            className="text-zinc-500"
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

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <Info className="mr-2 inline h-4 w-4" />

                          {
                            error
                          }
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={
                          loading
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading
                          ? "Logging in..."
                          : "Log in to my clinic"}

                        {!loading && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>

                      <div className="border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
                        Don&apos;t have a clinic account?{" "}

                        <Link
                          href="/clinics/signup"
                          className="font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300"
                        >
                          Create an account
                        </Link>
                      </div>
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