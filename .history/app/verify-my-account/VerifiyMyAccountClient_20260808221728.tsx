"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  applyActionCode,
  checkActionCode,
  onAuthStateChanged,
  reload,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type VerificationStatus =
  | "loading"
  | "ready"
  | "verifying"
  | "success"
  | "already-verified"
  | "invalid"
  | "expired"
  | "error";

type AccountDestination = {
  label: string;
  href: string;
};

type FirebaseActionData = {
  email?: string | null;
  previousEmail?: string | null;
};

/* ============================================================
   HELPERS
============================================================ */

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function getFirebaseErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return safeString(
      (error as { code?: unknown }).code
    ).toLowerCase();
  }

  return "";
}

function getVerificationErrorStatus(
  error: unknown
): {
  status: VerificationStatus;
  message: string;
} {
  const code = getFirebaseErrorCode(error);

  if (
    code.includes("expired-action-code")
  ) {
    return {
      status: "expired",
      message:
        "This verification link has expired. Please request a new verification email from your account.",
    };
  }

  if (
    code.includes("invalid-action-code")
  ) {
    return {
      status: "invalid",
      message:
        "This verification link is invalid or has already been used. You can return to your account to check your email status.",
    };
  }

  if (
    code.includes("user-disabled")
  ) {
    return {
      status: "error",
      message:
        "This account has been disabled. Please contact Doc Chap support.",
    };
  }

  if (
    code.includes("user-not-found")
  ) {
    return {
      status: "error",
      message:
        "We could not find the account linked to this verification request.",
    };
  }

  if (
    code.includes("network-request-failed")
  ) {
    return {
      status: "error",
      message:
        "We could not connect to Firebase. Please check your internet connection and try again.",
    };
  }

  return {
    status: "error",
    message:
      "We could not verify your email address. Please try again or request a new verification email.",
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function VerifiyMyAccountClient() {
  const searchParams = useSearchParams();

  const mode =
    searchParams.get("mode") || "";

  const oobCode =
    searchParams.get("oobCode") || "";

  const continueUrl =
    searchParams.get("continueUrl") || "";

  const [status, setStatus] =
    useState<VerificationStatus>(
      "loading"
    );

  const [
    message,
    setMessage,
  ] = useState(
    "Checking your verification link..."
  );

  const [
    verifiedEmail,
    setVerifiedEmail,
  ] = useState("");

  const [
    signedInUser,
    setSignedInUser,
  ] = useState<User | null>(null);

  const [
    accountDestination,
    setAccountDestination,
  ] = useState<AccountDestination>({
    label: "Go to doctor login",
    href: "/doctors/login",
  });

  const [
    synchronizing,
    setSynchronizing,
  ] = useState(false);

  const processingRef =
    useRef(false);

  const hasVerificationCode =
    Boolean(oobCode);

  /* ============================================================
     FIND ACCOUNT DESTINATION
  ============================================================ */

  const detectAccountDestination =
    useCallback(
      async (user: User | null) => {
        if (!user?.uid) {
          setAccountDestination({
            label: "Go to doctor login",
            href: "/doctors/login",
          });
          return;
        }

        const firestore = db;

        if (!firestore) {
          setAccountDestination({
            label: "Continue",
            href: "/doctors/login",
          });
          return;
        }

        const firestoreInstance =
          firestore;

        try {
          const professionalSnapshot =
            await getDoc(
              doc(
                firestoreInstance,
                "professionals",
                user.uid
              )
            );

          if (
            professionalSnapshot.exists()
          ) {
            setAccountDestination({
              label:
                "Go to my doctor account",
              href:
                "/doctors/my-account",
            });
            return;
          }
        } catch (error) {
          console.warn(
            "[VerifyMyAccount] Unable to read professional profile:",
            error
          );
        }

        try {
          const patientSnapshot =
            await getDoc(
              doc(
                firestoreInstance,
                "patients",
                user.uid
              )
            );

          if (patientSnapshot.exists()) {
            setAccountDestination({
              label:
                "Go to my patient account",
              href:
                "/patients/dashboard",
            });
            return;
          }
        } catch (error) {
          console.warn(
            "[VerifyMyAccount] Unable to read patient profile:",
            error
          );
        }

        setAccountDestination({
          label: "Continue",
          href: "/login",
        });
      },
      []
    );

  /* ============================================================
     SYNC FIRESTORE EMAIL VERIFIED FLAG
  ============================================================ */

  const syncVerifiedStatus =
    useCallback(
      async (user: User | null) => {
        if (
          !user?.uid ||
          !user.emailVerified
        ) {
          return;
        }

        const firestore = db;

        if (!firestore) {
          return;
        }

        const firestoreInstance =
          firestore;

        setSynchronizing(true);

        try {
          const professionalRef =
            doc(
              firestoreInstance,
              "professionals",
              user.uid
            );

          try {
            const professionalSnapshot =
              await getDoc(
                professionalRef
              );

            if (
              professionalSnapshot.exists()
            ) {
              await setDoc(
                professionalRef,
                {
                  security: {
                    emailVerified: true,
                  },
                  meta: {
                    updatedAt:
                      serverTimestamp(),
                  },
                },
                {
                  merge: true,
                }
              );
            }
          } catch (error) {
            console.warn(
              "[VerifyMyAccount] Professional verification sync skipped:",
              error
            );
          }

          const patientRef = doc(
            firestoreInstance,
            "patients",
            user.uid
          );

          try {
            const patientSnapshot =
              await getDoc(patientRef);

            if (
              patientSnapshot.exists()
            ) {
              await setDoc(
                patientRef,
                {
                  security: {
                    emailVerified: true,
                  },
                  meta: {
                    updatedAt:
                      serverTimestamp(),
                  },
                },
                {
                  merge: true,
                }
              );
            }
          } catch (error) {
            console.warn(
              "[VerifyMyAccount] Patient verification sync skipped:",
              error
            );
          }
        } finally {
          setSynchronizing(false);
        }
      },
      []
    );

  /* ============================================================
     AUTH STATE
  ============================================================ */

  useEffect(() => {
    const firebaseAuth = auth;

    if (!firebaseAuth) {
      setStatus("error");
      setMessage(
        "Firebase Authentication is not available. Please check the Firebase configuration."
      );
      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuthInstance,
        async (user) => {
          setSignedInUser(user);

          if (user) {
            try {
              await reload(user);
            } catch {
              // Non-blocking.
            }

            const refreshedUser =
              firebaseAuthInstance.currentUser;

            if (refreshedUser) {
              setSignedInUser(
                refreshedUser
              );

              if (
                refreshedUser.email
              ) {
                setVerifiedEmail(
                  refreshedUser.email
                );
              }

              await detectAccountDestination(
                refreshedUser
              );

              if (
                refreshedUser.emailVerified &&
                !hasVerificationCode
              ) {
                setStatus(
                  "already-verified"
                );
                setMessage(
                  "Your email address is already verified. Your Doc Chap account is ready to use."
                );

                await syncVerifiedStatus(
                  refreshedUser
                );
              }
            }
          } else {
            await detectAccountDestination(
              null
            );
          }

          if (
            !hasVerificationCode &&
            !user
          ) {
            setStatus("ready");
            setMessage(
              "Open the verification link sent to your email address. If you already verified your email, sign in again to continue."
            );
          }
        }
      );

    return () => unsubscribe();
  }, [
    detectAccountDestination,
    hasVerificationCode,
    syncVerifiedStatus,
  ]);

  /* ============================================================
     VERIFY FIREBASE ACTION CODE
  ============================================================ */

  const verifyEmail =
    useCallback(async () => {
      if (processingRef.current) {
        return;
      }

      if (!oobCode) {
        setStatus("ready");
        setMessage(
          "No verification code was found in this link. Please use the verification link sent by Doc Chap."
        );
        return;
      }

      const firebaseAuth = auth;

      if (!firebaseAuth) {
        setStatus("error");
        setMessage(
          "Firebase Authentication is not available. Please check the Firebase configuration."
        );
        return;
      }

      const firebaseAuthInstance =
        firebaseAuth;

      processingRef.current = true;
      setStatus("verifying");
      setMessage(
        "We are securely verifying your email address..."
      );

      try {
        const actionInfo =
          await checkActionCode(
            firebaseAuthInstance,
            oobCode
          );

        const actionData =
          actionInfo.data as FirebaseActionData;

        const email =
          safeString(actionData.email);

        if (email) {
          setVerifiedEmail(email);
        }

        await applyActionCode(
          firebaseAuthInstance,
          oobCode
        );

        const currentUser =
          firebaseAuthInstance.currentUser;

        if (currentUser) {
          try {
            await reload(currentUser);
          } catch {
            // Non-blocking.
          }

          const refreshedUser =
            firebaseAuthInstance.currentUser;

          if (refreshedUser) {
            setSignedInUser(
              refreshedUser
            );

            if (
              refreshedUser.email
            ) {
              setVerifiedEmail(
                refreshedUser.email
              );
            }

            await syncVerifiedStatus(
              refreshedUser
            );

            await detectAccountDestination(
              refreshedUser
            );
          }
        }

        setStatus("success");
        setMessage(
          "Your email address has been successfully verified. You can now continue to your Doc Chap account."
        );
      } catch (error) {
        console.error(
          "[VerifyMyAccount] Verification error:",
          error
        );

        const verificationError =
          getVerificationErrorStatus(
            error
          );

        setStatus(
          verificationError.status
        );

        setMessage(
          verificationError.message
        );
      } finally {
        processingRef.current = false;
      }
    }, [
      detectAccountDestination,
      oobCode,
      syncVerifiedStatus,
    ]);

  useEffect(() => {
    if (!oobCode) {
      return;
    }

    if (
      mode &&
      mode !== "verifyEmail"
    ) {
      setStatus("invalid");
      setMessage(
        "This link is not an email verification link."
      );
      return;
    }

    void verifyEmail();
  }, [
    mode,
    oobCode,
    verifyEmail,
  ]);

  /* ============================================================
     COMPUTED UI
  ============================================================ */

  const stateUi = useMemo(() => {
    if (
      status === "loading" ||
      status === "verifying"
    ) {
      return {
        icon: Loader2,
        iconClass:
          "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
        title:
          status === "loading"
            ? "Checking your account"
            : "Verifying your email",
        badge:
          status === "loading"
            ? "Secure check"
            : "Verification in progress",
        badgeClass:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
        animated: true,
      };
    }

    if (
      status === "success" ||
      status ===
        "already-verified"
    ) {
      return {
        icon: CheckCircle2,
        iconClass:
          "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
        title:
          status === "success"
            ? "Email verified"
            : "Account already verified",
        badge:
          "Verified account",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
        animated: false,
      };
    }

    if (status === "expired") {
      return {
        icon: Clock3,
        iconClass:
          "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
        title:
          "Verification link expired",
        badge:
          "New link required",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
        animated: false,
      };
    }

    if (
      status === "invalid" ||
      status === "error"
    ) {
      return {
        icon: AlertCircle,
        iconClass:
          "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300",
        title:
          status === "invalid"
            ? "Invalid verification link"
            : "Verification unavailable",
        badge:
          "Action required",
        badgeClass:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
        animated: false,
      };
    }

    return {
      icon: Mail,
      iconClass:
        "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
      title:
        "Verify your email address",
      badge:
        "Account security",
      badgeClass:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
      animated: false,
    };
  }, [status]);

  const StateIcon = stateUi.icon;

  const showSuccessActions =
    status === "success" ||
    status === "already-verified";

  const showRetry =
    status === "error";

  const showExpiredAction =
    status === "expired" ||
    status === "invalid";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-violet-500/12 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto flex min-h-[76vh] w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_470px]">
              {/* LEFT */}

              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                  <Stethoscope className="h-4 w-4" />
                  Doc Chap Ghana
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
                  Secure your Doc Chap account.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
                  Email verification helps us confirm your identity and protect access to your health or professional account.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <div className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                      Secure identity
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    <div className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                      Verified access
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                    <LockKeyhole className="h-5 w-5 text-violet-600" />
                    <div className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                      Protected account
                    </div>
                  </div>
                </div>
              </div>

              {/* VERIFICATION CARD */}

              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[36px] bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 blur-2xl" />

                <div className="relative overflow-hidden rounded-[30px] border border-zinc-200/90 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-7 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

                  <div className="relative">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${stateUi.badgeClass}`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {stateUi.badge}
                    </span>

                    <div
                      className={`mt-6 flex h-16 w-16 items-center justify-center rounded-2xl ${stateUi.iconClass}`}
                    >
                      <StateIcon
                        className={`h-8 w-8 ${
                          stateUi.animated
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </div>

                    <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                      {stateUi.title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {message}
                    </p>

                    {verifiedEmail && (
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                          <Mail className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Email address
                          </div>

                          <div className="mt-1 break-all text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {verifiedEmail}
                          </div>
                        </div>
                      </div>
                    )}

                    {synchronizing && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating your account verification status...
                      </div>
                    )}

                    <div className="mt-6 space-y-3">
                      {showSuccessActions && (
                        <>
                          <Link
                            href={
                              accountDestination.href
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
                          >
                            {
                              accountDestination.label
                            }
                            <ArrowRight className="h-4 w-4" />
                          </Link>

                          {!signedInUser && (
                            <Link
                              href="/doctors/login"
                              className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                            >
                              Sign in to Doc Chap
                            </Link>
                          )}
                        </>
                      )}

                      {showRetry && (
                        <button
                          type="button"
                          onClick={() =>
                            void verifyEmail()
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Try again
                        </button>
                      )}

                      {showExpiredAction && (
                        <>
                          {signedInUser ? (
                            <Link
                              href={
                                accountDestination.href
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                              Request a new verification email
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ) : (
                            <Link
                              href="/doctors/login"
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                              Sign in to request a new email
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </>
                      )}

                      {status === "ready" && (
                        <Link
                          href="/doctors/login"
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          Go to sign in
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>

                    {continueUrl &&
                      showSuccessActions && (
                        <a
                          href={continueUrl}
                          className="mt-4 block text-center text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-blue-600"
                        >
                          Continue to the original destination
                        </a>
                      )}

                    <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                      <div className="flex items-start gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        Doc Chap will never ask you to share your password or verification code with another person.
                      </div>
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