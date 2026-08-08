"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  BriefcaseMedical,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import { auth, db } from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type DoctorForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  registrationNumber: string;
  address: string;
  city: string;
  region: string;
  bio: string;
};

type DoctorData = {
  uid?: string;
  role?: string;
  accountType?: string;
  professionalType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    countryIso2?: string;
    photoUrl?: string | null;
    bio?: string;
  };

  professional?: {
    type?: string;
    specialty?: string;
    licenseNumber?: string | null;
    registrationNumber?: string | null;
    verified?: boolean;
    verificationStatus?: string;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };

  meta?: {
    profileCompleted?: boolean;
  };
};

type PopupState =
  | {
      type: "success" | "error";
      title: string;
      message: string;
    }
  | null;

/* ============================================================
   HELPERS
============================================================ */

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function safeObject(value: unknown): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, any>;
  }

  return {};
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
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function doctorFormFromData(
  data: DoctorData | null,
  user: User | null
): DoctorForm {
  const root = safeObject(data);
  const profile = safeObject(root.profile);
  const professional = safeObject(root.professional);

  return {
    firstName: safeString(profile.firstName),
    lastName: safeString(profile.lastName),
    email:
      safeString(profile.email) ||
      safeString(user?.email),
    phone: safeString(profile.phone),
    specialty:
      safeString(professional.specialty) ||
      safeString(profile.specialty),
    licenseNumber: safeString(professional.licenseNumber),
    registrationNumber: safeString(
      professional.registrationNumber
    ),
    address: safeString(profile.address),
    city: safeString(profile.city),
    region: safeString(profile.region),
    bio: safeString(profile.bio),
  };
}

function getVerificationStatus(
  data: DoctorData | null
): string {
  const professional = safeObject(data?.professional);

  return (
    safeString(
      professional.verificationStatus
    ).toLowerCase() || "pending"
  );
}

function isVerifiedDoctor(
  data: DoctorData | null
): boolean {
  const professional = safeObject(data?.professional);
  const status = getVerificationStatus(data);

  return (
    professional.verified === true ||
    status === "verified" ||
    status === "approved"
  );
}

/* ============================================================
   REUSABLE UI
============================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  hint,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon: React.ElementType;
  iconClass?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {label}
      </span>

      <div
        className={`mt-2 flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 transition ${
          disabled
            ? "border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900"
            : "border-zinc-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950"
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <input
          value={value}
          onChange={(event) =>
            onChange?.(event.target.value)
          }
          disabled={disabled}
          type={type}
          placeholder={placeholder}
          className="h-12 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-white"
        />
      </div>

      {hint && (
        <p className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  iconClass,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-base font-bold text-zinc-950 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function NavigationCard({
  href,
  title,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-900/50"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-zinc-950 dark:text-white">
          {title}
        </div>

        <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </Link>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function MyAccountClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [
    sendingVerification,
    setSendingVerification,
  ] = useState(false);

  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState<User | null>(null);

  const [
    doctorData,
    setDoctorData,
  ] = useState<DoctorData | null>(null);

  const [form, setForm] =
    useState<DoctorForm>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      registrationNumber: "",
      address: "",
      city: "",
      region: "",
      bio: "",
    });

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);

  const [
    popup,
    setPopup,
  ] = useState<PopupState>(null);

  /* ============================================================
     AUTHENTICATION + REALTIME PROFILE
  ============================================================ */

  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;

    if (!firebaseAuth || !firestore) {
      setError(
        "Firebase is not initialized. Check your Firebase environment variables."
      );
      setLoading(false);
      return;
    }

    const firebaseAuthInstance = firebaseAuth;
    const firestoreInstance = firestore;

    let unsubscribeProfile:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        async (user) => {
          if (!user?.uid) {
            setFirebaseUser(null);
            router.replace("/doctors/login");
            return;
          }

          setFirebaseUser(user);

          const professionalRef = doc(
            firestoreInstance,
            "professionals",
            user.uid
          );

          unsubscribeProfile?.();

          unsubscribeProfile = onSnapshot(
            professionalRef,
            async (snapshot) => {
              if (!snapshot.exists()) {
                try {
                  await signOut(firebaseAuthInstance);
                } catch {
                  // Non-blocking.
                }

                router.replace("/doctors/login");
                return;
              }

              const data =
                snapshot.data() as DoctorData;

              const professional =
                safeObject(data.professional);

              const professionalType =
                safeString(
                  data.professionalType ||
                    professional.type ||
                    data.role
                ).toLowerCase();

              if (
                professionalType &&
                professionalType !== "doctor"
              ) {
                try {
                  await signOut(firebaseAuthInstance);
                } catch {
                  // Non-blocking.
                }

                router.replace("/doctors/login");
                return;
              }

              if (
                data.active === false ||
                safeString(
                  data.status
                ).toLowerCase() === "disabled"
              ) {
                try {
                  await signOut(firebaseAuthInstance);
                } catch {
                  // Non-blocking.
                }

                router.replace("/doctors/login");
                return;
              }

              setDoctorData(data);
              setForm(
                doctorFormFromData(
                  data,
                  user
                )
              );
              setError(null);
              setLoading(false);
            },
            (snapshotError) => {
              console.error(
                "[DoctorAccount] Profile realtime error:",
                snapshotError
              );

              setError(
                "Unable to load your professional profile."
              );
              setLoading(false);
            }
          );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, [router]);

  /* ============================================================
     REFRESH EMAIL VERIFIED STATUS ON WINDOW FOCUS
  ============================================================ */

  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;

    if (!firebaseAuth || !firestore) {
      return;
    }

    const firebaseAuthInstance = firebaseAuth;
    const firestoreInstance = firestore;

    async function refreshEmailVerification() {
      const user = firebaseAuthInstance.currentUser;

      if (!user) {
        return;
      }

      try {
        await user.reload();

        const refreshedUser =
          firebaseAuthInstance.currentUser;

        if (!refreshedUser) {
          return;
        }

        setFirebaseUser(refreshedUser);

        if (refreshedUser.emailVerified) {
          await setDoc(
            doc(
              firestoreInstance,
              "professionals",
              refreshedUser.uid
            ),
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
      } catch (refreshError) {
        console.error(
          "[DoctorAccount] Email verification refresh error:",
          refreshError
        );
      }
    }

    window.addEventListener(
      "focus",
      refreshEmailVerification
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshEmailVerification
      );
    };
  }, []);

  /* ============================================================
     FORM
  ============================================================ */

  function setField(
    key: keyof DoctorForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  /* ============================================================
     EMAIL VERIFICATION
  ============================================================ */

  async function handleSendVerificationEmail() {
    if (
      sendingVerification ||
      firebaseUser?.emailVerified
    ) {
      return;
    }

    const firebaseAuth = auth;
    const user =
      firebaseAuth?.currentUser ||
      firebaseUser;

    if (!firebaseAuth || !user) {
      setPopup({
        type: "error",
        title: "Session expired",
        message:
          "Please log in again before requesting a verification email.",
      });
      return;
    }

    const currentUser = user;

    setSendingVerification(true);

    try {
      await sendEmailVerification(currentUser);

      setPopup({
        type: "success",
        title: "Verification email sent",
        message:
          "A verification email has been sent to your email address. Please open your inbox and click the verification link to verify your account.",
      });
    } catch (verificationError: any) {
      console.error(
        "[DoctorAccount] Verification email error:",
        verificationError
      );

      const code =
        safeString(
          verificationError?.code
        ).toLowerCase();

      let message =
        "Unable to send the verification email. Please try again.";

      if (
        code.includes(
          "too-many-requests"
        )
      ) {
        message =
          "Too many verification emails have been requested. Please wait a little before trying again.";
      }

      if (
        code.includes(
          "network-request-failed"
        )
      ) {
        message =
          "Unable to connect. Please check your internet connection and try again.";
      }

      setPopup({
        type: "error",
        title:
          "Verification email not sent",
        message,
      });
    } finally {
      setSendingVerification(false);
    }
  }

  /* ============================================================
     SAVE PROFILE
  ============================================================ */

  async function saveProfile() {
    if (saving) {
      return;
    }

    setError(null);
    setSuccess(null);

    const firebaseAuth = auth;
    const firestore = db;

    const user =
      firebaseAuth?.currentUser ||
      firebaseUser;

    if (
      !firebaseAuth ||
      !firestore ||
      !user?.uid
    ) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    const firestoreInstance = firestore;
    const currentUser = user;

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const phone =
      normalizeInternationalPhone(
        form.phone
      );

    const specialty =
      form.specialty.trim();

    const licenseNumber =
      form.licenseNumber.trim();

    const registrationNumber =
      form.registrationNumber.trim();

    const address =
      form.address.trim();

    const city =
      form.city.trim();

    const region =
      form.region.trim();

    const bio =
      form.bio.trim();

    if (!firstName) {
      setError(
        "Please enter your first name."
      );
      return;
    }

    if (!lastName) {
      setError(
        "Please enter your last name."
      );
      return;
    }

    if (
      phone &&
      !isValidInternationalPhone(phone)
    ) {
      setError(
        "Please enter a valid international WhatsApp number with the country code, for example +233 24 123 4567, +33 6 12 34 56 78 or +44 7911 123456."
      );
      return;
    }

    const fullName =
      `${firstName} ${lastName}`.trim();

    setSaving(true);

    try {
      if (
        currentUser.displayName !== fullName
      ) {
        try {
          await updateProfile(currentUser, {
            displayName: fullName,
          });
        } catch (authProfileError) {
          console.error(
            "[DoctorAccount] Auth profile update error:",
            authProfileError
          );
        }
      }

      const professionalRef = doc(
        firestoreInstance,
        "professionals",
        currentUser.uid
      );

      const profileCompleted = Boolean(
        firstName &&
          lastName &&
          phone &&
          specialty &&
          city
      );

      await setDoc(
        professionalRef,
        {
          uid: currentUser.uid,
          role: "doctor",
          accountType:
            "professional",
          professionalType:
            "doctor",

          profile: {
            firstName,
            lastName,
            fullName,
            displayName: fullName,
            email:
              email ||
              currentUser.email ||
              "",
            phone,
            specialty:
              specialty || null,
            address:
              address || null,
            city: city || null,
            region:
              region || null,
            country: "Ghana",
            countryIso2: "GH",
            bio: bio || null,
          },

          professional: {
            type: "doctor",
            specialty:
              specialty || null,
            licenseNumber:
              licenseNumber || null,
            registrationNumber:
              registrationNumber ||
              null,
          },

          security: {
            emailVerified:
              currentUser.emailVerified,
          },

          settings: {
            language: "en",
            locale: "en-GH",
            timezone:
              "Africa/Accra",
            currency: "GHS",
          },

          meta: {
            updatedAt:
              serverTimestamp(),
            country: "GH",
            application:
              "doc_chap_ghana",
            platform: "web",
            profileCompleted,
          },
        },
        {
          merge: true,
        }
      );

      try {
        await currentUser.getIdToken(true);
      } catch {
        // Non-blocking.
      }

      setSuccess(
        "Your professional profile has been updated successfully."
      );

      setPopup({
        type: "success",
        title: "Profile updated",
        message:
          "Your professional information has been saved successfully.",
      });
    } catch (saveError) {
      console.error(
        "[DoctorAccount] Save error:",
        saveError
      );

      setError(
        "Unable to save your professional profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     COMPUTED
  ============================================================ */

  const fullName =
    useMemo(
      () =>
        `${form.firstName} ${form.lastName}`.trim() ||
        firebaseUser
          ?.displayName ||
        "Doctor",
      [
        form.firstName,
        form.lastName,
        firebaseUser,
      ]
    );

  const verified =
    useMemo(
      () =>
        isVerifiedDoctor(
          doctorData
        ),
      [doctorData]
    );

  const verificationStatus =
    useMemo(
      () =>
        getVerificationStatus(
          doctorData
        ),
      [doctorData]
    );

  const profileCompleted =
    doctorData?.meta
      ?.profileCompleted === true;

  const emailVerified =
    firebaseUser
      ?.emailVerified === true;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>

              <div className="mt-5 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading your professional account...
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Retrieving your Doc Chap Ghana doctor information.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                      <Stethoscope className="h-4 w-4" />
                      My account
                    </span>

                    {verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <BadgeCheck className="h-4 w-4" />
                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                        <ShieldCheck className="h-4 w-4" />
                        Verification{" "}
                        {verificationStatus}
                      </span>
                    )}

                    {profileCompleted && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Profile completed
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                    {fullName}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base dark:text-zinc-300">
                    Manage your professional identity, medical credentials and practice information on Doc Chap Ghana.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {form.specialty && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300">
                        <GraduationCap className="h-4 w-4" />
                        {form.specialty}
                      </span>
                    )}

                    {form.city && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <MapPin className="h-4 w-4" />
                        {form.city}, Ghana
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                  <Link
                    href="/doctors/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/doctors/dashboard/configuration"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-100 hover:shadow-md dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50"
                  >
                    <BriefcaseMedical className="h-4 w-4" />
                    Professional configuration
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      void saveProfile()
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  {success}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* PERSONAL INFORMATION */}

                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl" />

                  <div className="relative">
                    <SectionHeader
                      icon={UserRound}
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                      title="Personal information"
                      subtitle="Your identity and contact details."
                    />

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label="First name"
                        value={
                          form.firstName
                        }
                        onChange={(value) =>
                          setField(
                            "firstName",
                            value
                          )
                        }
                        placeholder="e.g. Ama"
                        icon={UserRound}
                        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                      />

                      <Field
                        label="Last name"
                        value={
                          form.lastName
                        }
                        onChange={(value) =>
                          setField(
                            "lastName",
                            value
                          )
                        }
                        placeholder="e.g. Mensah"
                        icon={CircleUserRound}
                        iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
                      />

                      <Field
                        label="Email address"
                        value={form.email}
                        disabled
                        icon={Mail}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                        hint="Your sign-in email is managed by Firebase Authentication."
                      />

                      <Field
                        label="WhatsApp number"
                        value={form.phone}
                        onChange={(value) =>
                          setField(
                            "phone",
                            value
                          )
                        }
                        placeholder="+233..., +33..., +44..."
                        type="tel"
                        icon={Phone}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                        hint="Use your international WhatsApp number with the country code."
                      />
                    </div>
                  </div>
                </section>

                {/* PROFESSIONAL INFORMATION */}

                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />
                  <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />

                  <div className="relative">
                    <SectionHeader
                      icon={Stethoscope}
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                      title="Professional information"
                      subtitle="Your medical speciality, credentials and practice location."
                    />

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label="Medical speciality"
                        value={
                          form.specialty
                        }
                        onChange={(value) =>
                          setField(
                            "specialty",
                            value
                          )
                        }
                        placeholder="e.g. Cardiology"
                        icon={GraduationCap}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                      />

                      <Field
                        label="Medical licence number"
                        value={
                          form.licenseNumber
                        }
                        onChange={(value) =>
                          setField(
                            "licenseNumber",
                            value
                          )
                        }
                        placeholder="Licence number"
                        icon={BadgeCheck}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                      />

                      <Field
                        label="Registration number"
                        value={
                          form.registrationNumber
                        }
                        onChange={(value) =>
                          setField(
                            "registrationNumber",
                            value
                          )
                        }
                        placeholder="Registration number"
                        icon={ShieldCheck}
                        iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                      />

                      <Field
                        label="City"
                        value={form.city}
                        onChange={(value) =>
                          setField(
                            "city",
                            value
                          )
                        }
                        placeholder="e.g. Accra"
                        icon={MapPin}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                      />

                      <Field
                        label="Region"
                        value={form.region}
                        onChange={(value) =>
                          setField(
                            "region",
                            value
                          )
                        }
                        placeholder="e.g. Greater Accra"
                        icon={MapPin}
                        iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
                      />

                      <div className="sm:col-span-2">
                        <Field
                          label="Practice address"
                          value={
                            form.address
                          }
                          onChange={(value) =>
                            setField(
                              "address",
                              value
                            )
                          }
                          placeholder="Your professional practice address"
                          icon={MapPin}
                          iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* BIO */}

                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />

                  <div className="relative">
                    <SectionHeader
                      icon={Sparkles}
                      iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                      title="Professional presentation"
                      subtitle="Introduce your experience and approach to patient care."
                    />

                    <label className="mt-6 block">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Biography
                      </span>

                      <textarea
                        value={form.bio}
                        onChange={(event) =>
                          setField(
                            "bio",
                            event.target
                              .value
                          )
                        }
                        rows={6}
                        maxLength={1200}
                        placeholder="Describe your experience, medical practice and approach to patient care..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      />

                      <div className="mt-1.5 text-right text-xs text-zinc-400">
                        {form.bio.length}/1200
                      </div>
                    </label>
                  </div>
                </section>

                <button
                  type="button"
                  onClick={() =>
                    void saveProfile()
                  }
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save my professional profile
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT SIDE */}

              <aside className="space-y-6">
                {/* PROFILE SUMMARY */}

                <div className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                      <UserRound className="h-8 w-8" />
                    </div>

                    <h3 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                      {fullName}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {form.specialty ||
                        "Doctor"}
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl bg-blue-50/70 p-3 dark:bg-blue-950/20">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <span className="break-all text-sm text-zinc-700 dark:text-zinc-300">
                          {form.email || "—"}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {form.phone ||
                            "No WhatsApp number"}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-violet-50/70 p-3 dark:bg-violet-950/20">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {form.city
                            ? `${form.city}, Ghana`
                            : "Ghana"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECURITY */}

                <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <SectionHeader
                    icon={Lock}
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    title="Account security"
                    subtitle="Secure your Doc Chap account."
                  />

                  <div className="mt-5 space-y-3">
                    <div
                      className={`rounded-2xl border p-4 ${
                        emailVerified
                          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          : "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            emailVerified
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {emailVerified ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <BellRing className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                            Email verification
                          </div>

                          <div
                            className={`mt-1 text-xs font-semibold ${
                              emailVerified
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {emailVerified
                              ? "Verified"
                              : "Not verified"}
                          </div>

                          {!emailVerified && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleSendVerificationEmail()
                              }
                              disabled={
                                sendingVerification
                              }
                              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {sendingVerification ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4" />
                                  Send verification email
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Account type
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Doctor
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-600" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Country
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        Ghana
                      </span>
                    </div>
                  </div>
                </div>

                {/* NAVIGATION */}

                <div className="rounded-[28px] border border-zinc-200/80 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="px-1 pb-3">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                      Quick access
                    </div>
                  </div>

                  <div className="space-y-3">
                    <NavigationCard
                      href="/doctors/dashboard"
                      title="Doctor dashboard"
                      subtitle="Overview and activity"
                      icon={LayoutDashboard}
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    />

                    <NavigationCard
                      href="/doctors/dashboard/configuration"
                      title="Configuration"
                      subtitle="Professional preferences"
                      icon={SlidersHorizontal}
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    />

                    <NavigationCard
                      href="/doctors/dashboard/settings"
                      title="Settings"
                      subtitle="Account settings"
                      icon={Settings}
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* =========================================================
          POPUP
      ========================================================= */}

      {popup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-account-popup-title"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPopup(null);
            }
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() =>
                setPopup(null)
              }
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                popup.type ===
                "success"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {popup.type ===
              "success" ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <AlertCircle className="h-7 w-7" />
              )}
            </div>

            <h2
              id="doctor-account-popup-title"
              className="mt-5 pr-10 text-xl font-black text-zinc-950 dark:text-white"
            >
              {popup.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {popup.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setPopup(null)
              }
              className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                popup.type ===
                "success"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}