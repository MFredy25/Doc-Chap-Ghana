"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
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
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   HELPERS
============================================================ */

function strong(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    value
  );
}

function safeString(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  name,
  placeholder,
  kind = "text",
  icon: Icon = Building2,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  kind?: string;
  icon?: React.ElementType;
  required?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
      {label}

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
        <Icon className="h-4 w-4 text-teal-600" />

        <input
          name={name}
          type={kind}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ClinicSignupPage() {
  const router = useRouter();

  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);

    const firebaseAuth = auth;
    const firestore = db;

    if (!firebaseAuth || !firestore) {
      setError(
        "Firebase is not initialized. Please check your Firebase configuration."
      );

      return;
    }

    const formData = new FormData(event.currentTarget);

    const clinicName = safeString(
      formData.get("clinicName")
    );

    const location = safeString(
      formData.get("location")
    );

    const registrationReference = safeString(
      formData.get("registrationReference")
    );

    const firstName = safeString(
      formData.get("firstName")
    );

    const lastName = safeString(
      formData.get("lastName")
    );

    const email = safeString(
      formData.get("email")
    ).toLowerCase();

    const phone = safeString(
      formData.get("phone")
    );

    const password = String(
      formData.get("password") || ""
    );

    const privacyAccepted =
      formData.get("privacy") === "on";

    const termsAccepted =
      formData.get("terms") === "on";

    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

    if (!clinicName) {
      setError(
        "Please enter the clinic name."
      );

      return;
    }

    if (!location) {
      setError(
        "Please enter the clinic city or area."
      );

      return;
    }

    if (!firstName) {
      setError(
        "Please enter the owner's first name."
      );

      return;
    }

    if (!lastName) {
      setError(
        "Please enter the owner's last name."
      );

      return;
    }

    if (!email || !email.includes("@")) {
      setError(
        "Please enter a valid owner email address."
      );

      return;
    }

    if (!strong(password)) {
      setError(
        "Your password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number and one special character."
      );

      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      setError(
        "Please accept the Privacy Policy and Terms of Use."
      );

      return;
    }

    setLoading(true);

    let createdUser: FirebaseUser | null = null;

    try {
      /* --------------------------------------------------------
         FIREBASE AUTH
      -------------------------------------------------------- */

      const credential =
        await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );

      const user = credential.user;

      createdUser = user;

      const ownerFullName =
        `${firstName} ${lastName}`.trim();

      await updateProfile(user, {
        displayName: clinicName,
      });

      /* --------------------------------------------------------
         FIRESTORE CLINIC DOCUMENT
      -------------------------------------------------------- */

      await setDoc(
        doc(
          firestore,
          "clinics",
          user.uid
        ),
        {
          uid: user.uid,

          role: "clinic",
          accountType: "clinic",
          status: "active",
          active: true,

          profile: {
            clinicName,
            displayName: clinicName,
            fullName: clinicName,
            email,
            phone: phone || null,
            city: location,
            region: null,
            address: null,
            country: "Ghana",
            countryIso2: "GH",
            logoUrl: null,

            owner: {
              firstName,
              lastName,
              fullName: ownerFullName,
              email,
              phone: phone || null,
            },
          },

          clinic: {
            type: "clinic",
            registrationNumber:
              registrationReference || null,
            licenseNumber:
              registrationReference || null,
            registrationReference:
              registrationReference || null,
            verified: false,
            verificationStatus: "pending",
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
            timezone: "Africa/Accra",
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
            profileCompleted: false,
          },
        }
      );

      /* --------------------------------------------------------
         EMAIL VERIFICATION
      -------------------------------------------------------- */

      try {
        await sendEmailVerification(
          user
        );
      } catch (verificationError) {
        console.warn(
          "[ClinicSignup] Verification email error:",
          verificationError
        );
      }

      /* --------------------------------------------------------
         SUCCESS + REDIRECT
      -------------------------------------------------------- */

      setSubmitted(true);

      router.replace(
        "/clinics/my-account"
      );
    } catch (signupError: any) {
      console.error(
        "[ClinicSignup] Error:",
        signupError
      );

      const code = String(
        signupError?.code || ""
      );

      if (
        code.includes(
          "email-already-in-use"
        )
      ) {
        setError(
          "An account already exists with this email address."
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
          "weak-password"
        )
      ) {
        setError(
          "Your password does not meet the required security level."
        );
      } else {
        setError(
          "Unable to create your clinic account. Please try again."
        );
      }

      /* --------------------------------------------------------
         CLEANUP AUTH IF FIRESTORE CREATION FAILED
      -------------------------------------------------------- */

      if (createdUser) {
        try {
          const snapshot =
            await getDoc(
              doc(
                firestore,
                "clinics",
                createdUser.uid
              )
            );

          if (!snapshot.exists()) {
            await deleteUser(
              createdUser
            );
          }
        } catch (cleanupError) {
          console.warn(
            "[ClinicSignup] Cleanup error:",
            cleanupError
          );
        }
      }
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
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              {/* =================================================
                  LEFT
              ================================================= */}

              <div style={heroStyle}>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                  <Building2 className="h-4 w-4" />

                  Clinic registration
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
                  Create your clinic account
                </h1>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Register your clinic with its name, location and owner details. Build a visible, organised and secure digital healthcare presence on Doc Chap Ghana.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <BadgeCheck className="h-4 w-4" />

                    Secure registration
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                    <Sparkles className="h-4 w-4" />

                    Clinic verification
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    <HeartPulse className="h-4 w-4" />

                    Clinic workspace
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(
                          "clinic-signup-form"
                        )
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500"
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/6 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />

                      How to register
                    </div>

                    <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
                      {[
                        "Enter the clinic name as it appears on your registration documents.",
                        "Add your city or area in Ghana.",
                        "Provide the clinic registration or licence reference, when available.",
                        "Add the clinic owner or authorised contact details.",
                      ].map(
                        (item, index) => (
                          <li
                            key={item}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle2
                              className={`mt-0.5 h-4 w-4 ${
                                [
                                  "text-emerald-600",
                                  "text-teal-600",
                                  "text-blue-600",
                                  "text-purple-600",
                                ][index]
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
                      Your password must have at least{" "}
                      <b>8 characters</b>, with{" "}
                      <b>1 uppercase letter</b>,{" "}
                      <b>1 lowercase letter</b>,{" "}
                      <b>1 number</b> and{" "}
                      <b>1 special character</b>.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Already have an account?{" "}

                  <Link
                    href="/clinics/login"
                    className="underline underline-offset-4"
                  >
                    Log in to your clinic workspace
                  </Link>
                </p>
              </div>

              {/* =================================================
                  RIGHT / FORM
              ================================================= */}

              <div
                style={panelStyle}
                className="relative"
              >
                <div
                  id="clinic-signup-form"
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
                          Secure registration
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          For registered clinics and authorised representatives.
                        </div>
                      </div>
                    </div>

                    {submitted ? (
                      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <b>
                          Registration received.
                        </b>

                        <p className="mt-1">
                          Your clinic account has been created successfully. You are being redirected to your clinic account.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={submit}
                        className="mt-6 space-y-4"
                      >
                        <Field
                          label="Clinic name *"
                          name="clinicName"
                          placeholder="e.g. Accra Family Clinic"
                          required
                        />

                        <Field
                          label="City / area *"
                          name="location"
                          placeholder="e.g. Accra"
                          icon={MapPin}
                          required
                        />

                        <Field
                          label="Registration or licence reference"
                          name="registrationReference"
                          placeholder="Reference number, if available"
                          icon={BadgeCheck}
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field
                            label="Owner first name *"
                            name="firstName"
                            placeholder="e.g. Ama"
                            icon={User}
                            required
                          />

                          <Field
                            label="Owner last name *"
                            name="lastName"
                            placeholder="e.g. Mensah"
                            icon={User}
                            required
                          />
                        </div>

                        <Field
                          label="Owner email *"
                          name="email"
                          placeholder="name@example.com"
                          kind="email"
                          icon={Mail}
                          required
                        />

                        <Field
                          label="Phone number"
                          name="phone"
                          placeholder="+233 ..."
                          kind="tel"
                          icon={Phone}
                        />

                        <label className="space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          Password *

                          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <Lock className="h-4 w-4 text-indigo-600" />

                            <input
                              name="password"
                              type={
                                show
                                  ? "text"
                                  : "password"
                              }
                              required
                              placeholder="Create a strong password"
                              className="w-full bg-transparent text-sm outline-none"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShow(
                                  !show
                                )
                              }
                              className="text-zinc-500"
                              aria-label={
                                show
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {show ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 text-xs text-zinc-600">
                          <input
                            name="privacy"
                            type="checkbox"
                            className="mt-0.5"
                          />

                          <span>
                            I agree to the{" "}

                            <Link
                              href="/privacy"
                              className="underline"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </span>
                        </label>

                        <label className="flex items-start gap-2 text-xs text-zinc-600">
                          <input
                            name="terms"
                            type="checkbox"
                            className="mt-0.5"
                          />

                          <span>
                            I agree to the{" "}

                            <Link
                              href="/terms-of-use"
                              className="underline"
                            >
                              Terms of Use
                            </Link>
                            .
                          </span>
                        </label>

                        {error && (
                          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading
                            ? "Creating clinic account..."
                            : "Create my clinic account"}

                          {!loading && (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </button>
                      </form>
                    )}
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