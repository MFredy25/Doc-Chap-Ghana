"use client";

import {
  useState,
} from "react";

import Link from "next/link";

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
  AlertCircle,
  ArrowRight,
  Building2,
  Loader2,
  Lock,
  Mail,
  Pill,
  ShieldCheck,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

export default function PharmacyLoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  async function submit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      loading
    ) {
      return;
    }

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

    const cleanEmail =
      s(
        email
      ).toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      setError(
        "Please enter your email and password."
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
          cleanEmail,
          password
        );

      const user =
        credential.user;

      const snapshot =
        await getDoc(
          doc(
            firestore,
            "pharmacies",
            user.uid
          )
        );

      if (
        !snapshot.exists()
      ) {
        await signOut(
          firebaseAuth
        );

        setError(
          "This account is not registered as a pharmacy."
        );

        return;
      }

      const data =
        snapshot.data();

      const accountType =
        s(
          data.accountType ||
            data.role ||
            data.pharmacy?.type
        ).toLowerCase();

      if (
        accountType &&
        accountType !==
          "pharmacy"
      ) {
        await signOut(
          firebaseAuth
        );

        setError(
          "This account is not a pharmacy account."
        );

        return;
      }

      if (
        data.active ===
          false ||
        s(
          data.status
        ).toLowerCase() ===
          "disabled"
      ) {
        await signOut(
          firebaseAuth
        );

        setError(
          "This pharmacy account is currently unavailable."
        );

        return;
      }

      try {
        window.localStorage.setItem(
          "docchapghana:account-space",
          "pharmacy"
        );
      } catch {
        // Non-blocking.
      }

      router.replace(
        "/pharmacies/dashboard"
      );

      router.refresh();
    } catch (
      loginError
    ) {
      console.error(
        "[PharmacyLogin] Error:",
        loginError
      );

      const code =
        typeof loginError ===
          "object" &&
        loginError !==
          null &&
        "code" in
          loginError
          ? String(
              (
                loginError as {
                  code?: unknown;
                }
              ).code ??
                ""
            )
          : "";

      if (
        code ===
          "auth/invalid-credential" ||
        code ===
          "auth/wrong-password" ||
        code ===
          "auth/user-not-found"
      ) {
        setError(
          "Incorrect email or password."
        );
      } else if (
        code ===
        "auth/too-many-requests"
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

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main className="px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl lg:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
          <section className="relative overflow-hidden bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-8 text-white sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Pill className="h-7 w-7" />
              </div>

              <h1 className="mt-6 text-3xl font-black">
                Pharmacy login
              </h1>

              <p className="mt-3 text-sm leading-7 text-emerald-50">
                Access your Doc Chap Ghana pharmacy dashboard and manage your pharmacy account.
              </p>

              <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5">
                <ShieldCheck className="h-5 w-5" />

                <div className="mt-3 text-sm font-bold">
                  Secure pharmacy access
                </div>

                <p className="mt-2 text-xs leading-5 text-emerald-50">
                  Only the authenticated owner of the pharmacy account can access its private dashboard and profile.
                </p>
              </div>
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Building2 className="h-4 w-4" />

              Pharmacy space
            </span>

            <h2 className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Log in with your pharmacy account.
            </p>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            <form
              onSubmit={
                submit
              }
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Email
                </span>

                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Password
                </span>

                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    type="password"
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Logging in...
                  </>
                ) : (
                  <>
                    Log in

                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                No pharmacy account yet?{" "}
                <Link
                  href="/pharmacies/signup"
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}