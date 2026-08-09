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
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import {
  doc,
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

function strongPassword(
  value: string
): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    value
  );
}

function normalizePhone(
  value: string
): string {
  return value
    .replace(/\s+/g, "")
    .trim();
}

/* ============================================================
   PAGE
============================================================ */

export default function ClinicSignupPage() {
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
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submitted,
    setSubmitted,
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
      submitting
    ) {
      return;
    }

    setError(
      null
    );

    const formData =
      new FormData(
        event.currentTarget
      );

    const clinicName =
      String(
        formData.get(
          "clinicName"
        ) || ""
      ).trim();

    const contactName =
      String(
        formData.get(
          "contactName"
        ) || ""
      ).trim();

    const email =
      String(
        formData.get(
          "email"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const phone =
      normalizePhone(
        String(
          formData.get(
            "phone"
          ) || ""
        )
      );

    const city =
      String(
        formData.get(
          "city"
        ) || ""
      ).trim();

    const address =
      String(
        formData.get(
          "address"
        ) || ""
      ).trim();

    const password =
      String(
        formData.get(
          "password"
        ) || ""
      );

    const privacyAccepted =
      Boolean(
        formData.get(
          "privacy"
        )
      );

    const termsAccepted =
      Boolean(
        formData.get(
          "terms"
        )
      );

    if (
      clinicName.length <
      2
    ) {
      setError(
        "Please enter the clinic name."
      );

      return;
    }

    if (
      contactName.length <
      2
    ) {
      setError(
        "Please enter the contact person's name."
      );

      return;
    }

    if (
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
      phone.length <
      8
    ) {
      setError(
        "Please enter a valid phone number."
      );

      return;
    }

    if (
      !strongPassword(
        password
      )
    ) {
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

    setSubmitting(
      true
    );

    try {
      const credential =
        await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );

      const user =
        credential.user;

      await updateProfile(
        user,
        {
          displayName:
            clinicName,
        }
      );

      await setDoc(
        doc(
          firestore,
          "clinics",
          user.uid
        ),
        {
          uid:
            user.uid,

          role:
            "clinic",

          accountType:
            "clinic",

          status:
            "active",

          active:
            true,

          profile: {
            clinicName,
            displayName:
              clinicName,
            fullName:
              clinicName,
            email,
            phone,
            contactName,
            city:
              city ||
              null,
            region:
              null,
            address:
              address ||
              null,
            country:
              "Ghana",
            countryIso2:
              "GH",
            logoUrl:
              null,
          },

          clinic: {
            type:
              "clinic",
            registrationNumber:
              null,
            licenseNumber:
              null,
            verified:
              false,
            verificationStatus:
              "pending",
          },

          security: {
            emailVerified:
              user.emailVerified,
            phoneVerified:
              false,
            privacyAccepted:
              true,
            termsAccepted:
              true,
          },

          settings: {
            language:
              "en",
            locale:
              "en-GH",
            timezone:
              "Africa/Accra",
            currency:
              "GHS",
          },

          meta: {
            createdAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp(),
            platform:
              "web",
            application:
              "doc_chap_ghana",
            country:
              "GH",
            profileCompleted:
              false,
          },
        }
      );

      try {
        await sendEmailVerification(
          user
        );
      } catch (
        verificationError
      ) {
        console.warn(
          "[ClinicSignup] Verification email error:",
          verificationError
        );
      }

      setSubmitted(
        true
      );

      router.replace(
        "/clinics/my-account"
      );
    } catch (
      signupError: any
    ) {
      console.error(
        "[ClinicSignup] Error:",
        signupError
      );

      const code =
        String(
          signupError?.code ||
            ""
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
      } else {
        setError(
          "Unable to create your clinic account. Please try again."
        );
      }
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <style jsx global>{`
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
      `}</style>

      <Header />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />

        <section className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-14">
          <div
            style={
              heroStyle
            }
            className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] p-7 text-white shadow-2xl sm:p-9 lg:p-10"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Building2 className="h-4 w-4 text-cyan-300" />
                Clinic registration
              </span>

              <h1 className="mt-6 max-w-xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Create your clinic account
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Join Doc Chap Ghana and manage your clinic profile, healthcare professionals and patient activity from one secure space.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  [
                    ShieldCheck,
                    "Secure professional space",
                  ],
                  [
                    HeartPulse,
                    "Healthcare activity management",
                  ],
                  [
                    BadgeCheck,
                    "Clinic verification workflow",
                  ],
                  [
                    Sparkles,
                    "Built for Ghana healthcare",
                  ],
                ].map(
                  (
                    [
                      Icon,
                      label,
                    ]
                  ) => {
                    const FeatureIcon =
                      Icon as React.ElementType;

                    return (
                      <div
                        key={
                          String(
                            label
                          )
                        }
                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                      >
                        <FeatureIcon className="h-5 w-5 text-cyan-300" />

                        <span className="text-sm font-semibold">
                          {
                            String(
                              label
                            )
                          }
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div
            style={
              panelStyle
            }
            className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-xl sm:p-7 lg:p-8 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                Clinic details
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Enter the information required to create your professional clinic account.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <Info className="mr-2 inline h-4 w-4" />
                {error}
              </div>
            )}

            {submitted && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                Your clinic account has been created.
              </div>
            )}

            <form
              onSubmit={
                submit
              }
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Clinic name"
                  name="clinicName"
                  placeholder="e.g. Accra Medical Centre"
                  icon={
                    Building2
                  }
                  required
                />

                <Field
                  label="Contact person"
                  name="contactName"
                  placeholder="Full name"
                  icon={
                    User
                  }
                  required
                />

                <Field
                  label="Email address"
                  name="email"
                  placeholder="clinic@example.com"
                  kind="email"
                  icon={
                    Mail
                  }
                  required
                />

                <Field
                  label="Phone number"
                  name="phone"
                  placeholder="+233 ..."
                  kind="tel"
                  icon={
                    Phone
                  }
                  required
                />

                <Field
                  label="City"
                  name="city"
                  placeholder="Accra"
                  icon={
                    MapPin
                  }
                />

                <Field
                  label="Address"
                  name="address"
                  placeholder="Clinic address"
                  icon={
                    MapPin
                  }
                />
              </div>

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
                    placeholder="Create a secure password"
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

                <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                  Minimum 8 characters with uppercase, lowercase, number and special character.
                </p>
              </label>

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  <input
                    name="privacy"
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span>
                    I accept the{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  <input
                    name="terms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span>
                    I accept the{" "}
                    <Link
                      href="/terms-of-use"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Terms of Use
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Creating account..."
                  : "Create clinic account"}

                {!submitting && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Already have a clinic account?{" "}
                <Link
                  href="/clinics/login"
                  className="font-bold text-blue-700 hover:underline"
                >
                  Log in
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
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </span>

      <div className="relative mt-2">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

        <input
          name={
            name
          }
          type={
            kind
          }
          required={
            required
          }
          placeholder={
            placeholder
          }
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        />
      </div>
    </label>
  );
}