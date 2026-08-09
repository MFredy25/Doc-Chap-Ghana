"use client";

import Link from "next/link";
import {
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
  Building2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

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

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <Header />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />

        <section className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] p-8 text-white shadow-2xl sm:p-10">
            <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Building2 className="h-4 w-4 text-cyan-300" />
                Clinic space
              </span>

              <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Welcome back
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Log in to manage your clinic account and access your Doc Chap Ghana clinic dashboard.
              </p>

              <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />

                  <p className="text-sm leading-6 text-blue-100">
                    This access is reserved for clinic accounts registered on Doc Chap Ghana.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
              Clinic login
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Enter the credentials associated with your clinic account.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <Info className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            <form
              onSubmit={
                submit
              }
              className="mt-6 space-y-5"
            >
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Email address
                </span>

                <div className="relative mt-2">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="clinic@example.com"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Password
                </span>

                <div className="relative mt-2">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    placeholder="Your password"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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

              <button
                type="submit"
                disabled={
                  loading
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Log in"}

                {!loading && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                No clinic account yet?{" "}
                <Link
                  href="/clinics/signup"
                  className="font-bold text-blue-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}