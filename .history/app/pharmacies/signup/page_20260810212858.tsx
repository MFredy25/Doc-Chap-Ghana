"use client";

import {
  useState,
} from "react";

import Link from "next/link";

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
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  UserRound,
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

function normalizeGhanaPhone(
  value: string
): string {
  const raw =
    s(value);

  if (!raw) {
    return "";
  }

  let digits =
    raw.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith(
      "233"
    )
  ) {
    digits =
      digits.slice(3);
  }

  if (
    digits.startsWith(
      "0"
    )
  ) {
    digits =
      digits.slice(1);
  }

  return `+233${digits}`;
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export default function PharmacySignupPage() {
  const router =
    useRouter();

  const [
    pharmacyName,
    setPharmacyName,
  ] =
    useState("");

  const [
    ownerFirstName,
    setOwnerFirstName,
  ] =
    useState("");

  const [
    ownerLastName,
    setOwnerLastName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    city,
    setCity,
  ] =
    useState("");

  const [
    region,
    setRegion,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] =
    useState(false);

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

    const cleanName =
      s(
        pharmacyName
      );

    const cleanFirstName =
      s(
        ownerFirstName
      );

    const cleanLastName =
      s(
        ownerLastName
      );

    const cleanEmail =
      s(
        email
      ).toLowerCase();

    const cleanPhone =
      normalizeGhanaPhone(
        phone
      );

    if (
      cleanName.length <
      2
    ) {
      setError(
        "Please enter the pharmacy name."
      );

      return;
    }

    if (
      cleanFirstName.length <
        2 ||
      cleanLastName.length <
        2
    ) {
      setError(
        "Please enter the pharmacy owner or manager name."
      );

      return;
    }

    if (
      !isValidEmail(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    if (
      !/^\+233\d{9}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "Please enter a valid Ghana phone number."
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      setError(
        "Your password must contain at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "The passwords do not match."
      );

      return;
    }

    if (
      !acceptedTerms
    ) {
      setError(
        "Please accept the terms and privacy policy."
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
        await createUserWithEmailAndPassword(
          firebaseAuth,
          cleanEmail,
          password
        );

      const user =
        credential.user;

      await updateProfile(
        user,
        {
          displayName:
            cleanName,
        }
      );

      await setDoc(
        doc(
          firestore,
          "pharmacies",
          user.uid
        ),
        {
          uid:
            user.uid,

          role:
            "pharmacy",

          accountType:
            "pharmacy",

          status:
            "active",

          active:
            true,

          profile: {
            pharmacyName:
              cleanName,

            displayName:
              cleanName,

            owner: {
              firstName:
                cleanFirstName,

              lastName:
                cleanLastName,

              fullName:
                `${cleanFirstName} ${cleanLastName}`.trim(),

              email:
                cleanEmail,

              phone:
                cleanPhone,
            },

            email:
              cleanEmail,

            phone:
              cleanPhone,

            address:
              s(
                address
              ),

            city:
              s(
                city
              ),

            region:
              s(
                region
              ),

            country:
              "Ghana",

            countryIso2:
              "GH",

            logoUrl:
              null,

            bio:
              "",
          },

          pharmacy: {
            type:
              "pharmacy",

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

            termsAccepted:
              true,

            privacyAccepted:
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
            profileCompleted:
              false,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
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
          "[PharmacySignup] Unable to send verification email:",
          verificationError
        );
      }

      /* --------------------------------------------------------
         DOC CHAP GHANA REGISTRATION EMAILS
      -------------------------------------------------------- */

      let idToken = "";

      try {
        idToken =
          await user.getIdToken(
            true
          );
      } catch (
        tokenError
      ) {
        console.warn(
          "[PharmacySignup] Token refresh error:",
          tokenError
        );
      }

      try {
        const response =
          await fetch(
            "/api/send-email-new-pharmacy-add",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...(idToken
                  ? {
                      Authorization:
                        `Bearer ${idToken}`,
                    }
                  : {}),
              },

              body:
                JSON.stringify({
                  pharmacyId:
                    user.uid,

                  pharmacyName:
                    cleanName,

                  firstName:
                    cleanFirstName,

                  lastName:
                    cleanLastName,

                  fullName:
                    `${cleanFirstName} ${cleanLastName}`.trim(),

                  email:
                    cleanEmail,

                  phone:
                    cleanPhone,

                  address:
                    s(
                      address
                    ),

                  city:
                    s(
                      city
                    ),

                  region:
                    s(
                      region
                    ),
                }),
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => null
            );

        if (
          !response.ok ||
          !payload?.ok
        ) {
          console.warn(
            "[PharmacySignup] Registration notification email failed:",
            payload
          );
        }
      } catch (
        notificationError
      ) {
        /*
         * The pharmacy account has already been created successfully.
         * Email delivery errors must not invalidate the registration.
         */
        console.warn(
          "[PharmacySignup] Registration notification error:",
          notificationError
        );
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
        "/pharmacies/my-account"
      );

      router.refresh();
    } catch (
      signupError
    ) {
      console.error(
        "[PharmacySignup] Error:",
        signupError
      );

      const code =
        typeof signupError ===
          "object" &&
        signupError !==
          null &&
        "code" in
          signupError
          ? String(
              (
                signupError as {
                  code?: unknown;
                }
              ).code ??
                ""
            )
          : "";

      if (
        code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email address."
        );
      } else if (
        code ===
        "auth/weak-password"
      ) {
        setError(
          "Please choose a stronger password."
        );
      } else {
        setError(
          "Unable to create your pharmacy account. Please try again."
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

      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr] dark:border-zinc-800 dark:bg-zinc-950">
          <section className="relative overflow-hidden bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] p-7 text-white sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Pill className="h-7 w-7" />
              </div>

              <h1 className="mt-6 text-3xl font-black">
                Create your pharmacy account
              </h1>

              <p className="mt-3 text-sm leading-7 text-emerald-50">
                Join Doc Chap Ghana and create your pharmacy profile for patients looking for verified healthcare services.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Manage your pharmacy profile",
                  "Complete your professional verification",
                  "Prepare your pharmacy for the Doc Chap Ghana directory",
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item
                      }
                      className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                      <span className="text-sm font-semibold">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />

                Pharmacy registration
              </span>

              <h2 className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
                Pharmacy information
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Enter the pharmacy and account holder information.
              </p>
            </div>

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
                  Pharmacy name
                </span>

                <div className="relative mt-2">
                  <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={
                      pharmacyName
                    }
                    onChange={(
                      event
                    ) =>
                      setPharmacyName(
                        event.target.value
                      )
                    }
                    placeholder="Pharmacy name"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Owner / manager first name
                  </span>

                  <div className="relative mt-2">
                    <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        ownerFirstName
                      }
                      onChange={(
                        event
                      ) =>
                        setOwnerFirstName(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Owner / manager last name
                  </span>

                  <div className="relative mt-2">
                    <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        ownerLastName
                      }
                      onChange={(
                        event
                      ) =>
                        setOwnerLastName(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label>
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

                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Phone
                  </span>

                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        phone
                      }
                      onChange={(
                        event
                      ) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="+233..."
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Address
                </span>

                <div className="relative mt-2">
                  <MapPin className="absolute left-4 top-4 h-4 w-4 text-zinc-400" />

                  <input
                    value={
                      address
                    }
                    onChange={(
                      event
                    ) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    City
                  </span>

                  <input
                    value={
                      city
                    }
                    onChange={(
                      event
                    ) =>
                      setCity(
                        event.target.value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Region
                  </span>

                  <input
                    value={
                      region
                    }
                    onChange={(
                      event
                    ) =>
                      setRegion(
                        event.target.value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label>
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

                <label>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Confirm password
                  </span>

                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <input
                  type="checkbox"
                  checked={
                    acceptedTerms
                  }
                  onChange={(
                    event
                  ) =>
                    setAcceptedTerms(
                      event.target.checked
                    )
                  }
                  className="mt-1"
                />

                <span className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  I accept the Doc Chap Ghana terms of use and privacy policy.
                </span>
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

                    Creating account...
                  </>
                ) : (
                  <>
                    Create pharmacy account

                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Already have a pharmacy account?{" "}
                <Link
                  href="/pharmacies/login"
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Log in
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