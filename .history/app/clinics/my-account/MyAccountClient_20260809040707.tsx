"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

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
  BadgeCheck,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileBadge2,
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
  UserRound,
  Users,
  X,
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

type ClinicForm = {
  clinicName: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone: string;
  registrationNumber: string;
  licenseNumber: string;
  address: string;
  city: string;
  region: string;
  bio: string;
};

type ClinicData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
    contactName?: string;

    firstName?: string;
    lastName?: string;

    email?: string;
    phone?: string;

    address?: string;
    city?: string;
    region?: string;

    country?: string;
    countryIso2?: string;

    logoUrl?: string | null;
    bio?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };

  clinic?: {
    type?: string;
    registrationNumber?: string | null;
    licenseNumber?: string | null;
    registrationReference?: string | null;
    verified?: boolean;
    verificationStatus?: string;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    privacyAccepted?: boolean;
    termsAccepted?: boolean;
  };

  settings?: {
    language?: string;
    locale?: string;
    timezone?: string;
    currency?: string;
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

function safeString(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function safeObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function normalizeInternationalPhone(
  value: string
): string {
  const raw =
    safeString(value);

  if (!raw) {
    return "";
  }

  let compact =
    raw.replace(
      /[()\s.-]/g,
      ""
    );

  if (
    compact.startsWith(
      "00"
    )
  ) {
    compact =
      `+${compact.slice(2)}`;
  }

  if (
    !compact.startsWith(
      "+"
    )
  ) {
    return compact.replace(
      /\D/g,
      ""
    );
  }

  return `+${compact
    .slice(1)
    .replace(/\D/g, "")}`;
}

function isValidInternationalPhone(
  value: string
): boolean {
  const normalized =
    normalizeInternationalPhone(
      value
    );

  return /^\+[1-9]\d{7,14}$/.test(
    normalized
  );
}

function clinicFormFromData(
  data: ClinicData | null,
  user: User | null
): ClinicForm {
  const root =
    safeObject(data);

  const profile =
    safeObject(
      root.profile
    );

  const owner =
    safeObject(
      profile.owner
    );

  const clinic =
    safeObject(
      root.clinic
    );

  const contactName =
    safeString(
      profile.contactName
    );

  const contactParts =
    contactName
      .split(/\s+/)
      .filter(Boolean);

  return {
    clinicName:
      safeString(
        profile.clinicName
      ) ||
      safeString(
        profile.displayName
      ) ||
      safeString(
        profile.fullName
      ) ||
      safeString(
        user?.displayName
      ),

    ownerFirstName:
      safeString(
        owner.firstName
      ) ||
      safeString(
        profile.firstName
      ) ||
      contactParts[0] ||
      "",

    ownerLastName:
      safeString(
        owner.lastName
      ) ||
      safeString(
        profile.lastName
      ) ||
      (
        contactParts.length >
        1
          ? contactParts
              .slice(1)
              .join(" ")
          : ""
      ),

    email:
      safeString(
        profile.email
      ) ||
      safeString(
        owner.email
      ) ||
      safeString(
        user?.email
      ),

    phone:
      safeString(
        profile.phone
      ) ||
      safeString(
        owner.phone
      ),

    registrationNumber:
      safeString(
        clinic.registrationNumber
      ) ||
      safeString(
        clinic.registrationReference
      ),

    licenseNumber:
      safeString(
        clinic.licenseNumber
      ),

    address:
      safeString(
        profile.address
      ),

    city:
      safeString(
        profile.city
      ),

    region:
      safeString(
        profile.region
      ),

    bio:
      safeString(
        profile.bio
      ),
  };
}

function getVerificationStatus(
  data: ClinicData | null
): string {
  const clinic =
    safeObject(
      data?.clinic
    );

  return (
    safeString(
      clinic.verificationStatus
    ).toLowerCase() ||
    "pending"
  );
}

function isVerifiedClinic(
  data: ClinicData | null
): boolean {
  const clinic =
    safeObject(
      data?.clinic
    );

  const status =
    getVerificationStatus(
      data
    );

  return (
    clinic.verified === true ||
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
  iconClass =
    "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  hint,
}: {
  label: string;
  value: string;
  onChange?: (
    value: string
  ) => void;
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
          onChange={(
            event
          ) =>
            onChange?.(
              event.target.value
            )
          }
          disabled={
            disabled
          }
          type={type}
          placeholder={
            placeholder
          }
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
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    sendingVerification,
    setSendingVerification,
  ] =
    useState(false);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    clinicData,
    setClinicData,
  ] =
    useState<ClinicData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<ClinicForm>({
      clinicName: "",
      ownerFirstName: "",
      ownerLastName: "",
      email: "",
      phone: "",
      registrationNumber: "",
      licenseNumber: "",
      address: "",
      city: "",
      region: "",
      bio: "",
    });

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
    );

  const [
    popup,
    setPopup,
  ] =
    useState<PopupState>(
      null
    );

  /* ============================================================
     AUTHENTICATION + REALTIME PROFILE
  ============================================================ */

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setError(
        "Firebase is not initialized. Check your Firebase environment variables."
      );

      setLoading(false);

      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribeProfile:
      | (() => void)
      | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            router.replace(
              "/clinics/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          const clinicRef =
            doc(
              firestoreInstance,
              "clinics",
              user.uid
            );

          unsubscribeProfile?.();

          unsubscribeProfile =
            onSnapshot(
              clinicRef,
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  /*
                   * Strict separation:
                   * a user without clinics/{uid}
                   * cannot open the clinic workspace.
                   */
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

                  router.replace(
                    "/clinics/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as ClinicData;

                const clinic =
                  safeObject(
                    data.clinic
                  );

                const accountType =
                  safeString(
                    data.accountType ||
                      data.role ||
                      clinic.type
                  ).toLowerCase();

                if (
                  accountType &&
                  accountType !==
                    "clinic"
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

                  router.replace(
                    "/clinics/login"
                  );

                  return;
                }

                if (
                  data.active === false ||
                  safeString(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {
                    // Non-blocking.
                  }

                  router.replace(
                    "/clinics/login"
                  );

                  return;
                }

                setClinicData(
                  data
                );

                setForm(
                  clinicFormFromData(
                    data,
                    user
                  )
                );

                setError(null);
                setLoading(false);
              },
              (
                snapshotError
              ) => {
                console.error(
                  "[ClinicAccount] Profile realtime error:",
                  snapshotError
                );

                setError(
                  "Unable to load your clinic profile."
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
  }, [
    router,
  ]);

  /* ============================================================
     EMAIL VERIFICATION REFRESH
  ============================================================ */

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    async function refreshEmailVerification() {
      const user =
        firebaseAuthInstance.currentUser;

      if (!user) {
        return;
      }

      try {
        await user.reload();

        const refreshedUser =
          firebaseAuthInstance.currentUser;

        if (
          !refreshedUser
        ) {
          return;
        }

        setFirebaseUser(
          refreshedUser
        );

        if (
          refreshedUser.emailVerified
        ) {
          await setDoc(
            doc(
              firestoreInstance,
              "clinics",
              refreshedUser.uid
            ),
            {
              security: {
                emailVerified:
                  true,
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
      } catch (
        refreshError
      ) {
        console.error(
          "[ClinicAccount] Email verification refresh error:",
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
    key: keyof ClinicForm,
    value: string
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );

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

    const firebaseAuth =
      auth;

    const user =
      firebaseAuth?.currentUser ||
      firebaseUser;

    if (
      !firebaseAuth ||
      !user
    ) {
      setPopup({
        type: "error",
        title:
          "Session expired",
        message:
          "Please log in again before requesting a verification email.",
      });

      return;
    }

    setSendingVerification(
      true
    );

    try {
      await sendEmailVerification(
        user
      );

      setPopup({
        type: "success",
        title:
          "Verification email sent",
        message:
          "A verification email has been sent to your email address. Please open your inbox and click the verification link to verify your account.",
      });
    } catch (
      verificationError: unknown
    ) {
      console.error(
        "[ClinicAccount] Verification email error:",
        verificationError
      );

      let code = "";

      if (
        typeof verificationError ===
          "object" &&
        verificationError !==
          null &&
        "code" in
          verificationError
      ) {
        code =
          safeString(
            (
              verificationError as {
                code?: unknown;
              }
            ).code
          ).toLowerCase();
      }

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
      setSendingVerification(
        false
      );
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

    const firebaseAuth =
      auth;

    const firestore =
      db;

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

    const clinicName =
      form.clinicName.trim();

    const ownerFirstName =
      form.ownerFirstName.trim();

    const ownerLastName =
      form.ownerLastName.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const phone =
      normalizeInternationalPhone(
        form.phone
      );

    const registrationNumber =
      form.registrationNumber.trim();

    const licenseNumber =
      form.licenseNumber.trim();

    const address =
      form.address.trim();

    const city =
      form.city.trim();

    const region =
      form.region.trim();

    const bio =
      form.bio.trim();

    if (!clinicName) {
      setError(
        "Please enter the clinic name."
      );

      return;
    }

    if (!ownerFirstName) {
      setError(
        "Please enter the owner's first name."
      );

      return;
    }

    if (!ownerLastName) {
      setError(
        "Please enter the owner's last name."
      );

      return;
    }

    if (
      phone &&
      !isValidInternationalPhone(
        phone
      )
    ) {
      setError(
        "Please enter a valid international WhatsApp number with the country code, for example +233 24 123 4567."
      );

      return;
    }

    const ownerFullName =
      `${ownerFirstName} ${ownerLastName}`.trim();

    setSaving(true);

    try {
      /*
       * Firebase Auth displayName stores the clinic name,
       * consistent with the clinic signup flow.
       */
      if (
        user.displayName !==
        clinicName
      ) {
        try {
          await updateProfile(
            user,
            {
              displayName:
                clinicName,
            }
          );
        } catch (
          authProfileError
        ) {
          console.error(
            "[ClinicAccount] Auth profile update error:",
            authProfileError
          );
        }
      }

      const clinicRef =
        doc(
          firestore,
          "clinics",
          user.uid
        );

      const profileCompleted =
        Boolean(
          clinicName &&
          ownerFirstName &&
          ownerLastName &&
          phone &&
          city &&
          address
        );

      await setDoc(
        clinicRef,
        {
          uid:
            user.uid,

          role:
            "clinic",

          accountType:
            "clinic",

          status:
            clinicData?.status ||
            "active",

          active:
            clinicData?.active !==
            false,

          profile: {
            clinicName,
            displayName:
              clinicName,
            fullName:
              clinicName,

            /*
             * Backward compatibility with the
             * previous clinic My Account page.
             */
            contactName:
              ownerFullName,

            firstName:
              ownerFirstName,

            lastName:
              ownerLastName,

            email:
              email ||
              user.email ||
              "",

            phone:
              phone || null,

            address:
              address || null,

            city:
              city || null,

            region:
              region || null,

            country:
              "Ghana",

            countryIso2:
              "GH",

            bio:
              bio || null,

            owner: {
              firstName:
                ownerFirstName,

              lastName:
                ownerLastName,

              fullName:
                ownerFullName,

              email:
                email ||
                user.email ||
                "",

              phone:
                phone ||
                null,
            },
          },

          clinic: {
            type:
              "clinic",

            registrationNumber:
              registrationNumber ||
              null,

            licenseNumber:
              licenseNumber ||
              null,

            /*
             * Keep the original signup field
             * compatible with the current data model.
             */
            registrationReference:
              registrationNumber ||
              null,
          },

          security: {
            emailVerified:
              user.emailVerified,
          },

          settings: {
            language:
              clinicData?.settings
                ?.language ||
              "en",

            locale:
              clinicData?.settings
                ?.locale ||
              "en-GH",

            timezone:
              clinicData?.settings
                ?.timezone ||
              "Africa/Accra",

            currency:
              clinicData?.settings
                ?.currency ||
              "GHS",
          },

          meta: {
            updatedAt:
              serverTimestamp(),

            country:
              "GH",

            application:
              "doc_chap_ghana",

            platform:
              "web",

            profileCompleted,
          },
        },
        {
          merge: true,
        }
      );

      try {
        await user.getIdToken(
          true
        );
      } catch {
        // Non-blocking.
      }

      setSuccess(
        "Your clinic profile has been updated successfully."
      );

      setPopup({
        type: "success",
        title:
          "Clinic profile updated",
        message:
          "Your clinic information has been saved successfully.",
      });
    } catch (
      saveError
    ) {
      console.error(
        "[ClinicAccount] Save error:",
        saveError
      );

      setError(
        "Unable to save your clinic profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     COMPUTED
  ============================================================ */

  const clinicName =
    useMemo(
      () =>
        form.clinicName ||
        firebaseUser
          ?.displayName ||
        "Clinic",
      [
        form.clinicName,
        firebaseUser,
      ]
    );

  const ownerFullName =
    useMemo(
      () =>
        `${form.ownerFirstName} ${form.ownerLastName}`.trim() ||
        "Clinic owner",
      [
        form.ownerFirstName,
        form.ownerLastName,
      ]
    );

  const verified =
    useMemo(
      () =>
        isVerifiedClinic(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const verificationStatus =
    useMemo(
      () =>
        getVerificationStatus(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const profileCompleted =
    clinicData?.meta
      ?.profileCompleted ===
    true;

  const emailVerified =
    firebaseUser
      ?.emailVerified ===
    true;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>

            <div className="mt-5 text-sm font-semibold text-zinc-900 dark:text-white">
              Loading your clinic account...
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Retrieving your Doc Chap Ghana clinic information.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-black">
      <Header />

      <main>
        {/* =====================================================
            HERO / BANNER
        ===================================================== */}

        <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] text-white">
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-300/15 blur-3xl" />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
            <div className="absolute left-[8%] top-8 h-24 w-24 rounded-full border border-white" />

            <div className="absolute right-[12%] top-14 h-16 w-16 rotate-12 rounded-2xl border border-white" />

            <div className="absolute bottom-10 left-[44%] h-20 w-20 rounded-full border border-white" />
          </div>

          <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    <Building2 className="h-4 w-4 text-cyan-300" />

                    My clinic account
                  </span>

                  {verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                      <BadgeCheck className="h-4 w-4" />

                      Verified clinic
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
                      <ShieldCheck className="h-4 w-4" />

                      Verification{" "}
                      {verificationStatus}
                    </span>
                  )}

                  {profileCompleted && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur-md">
                      <CheckCircle2 className="h-4 w-4" />

                      Profile completed
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md sm:flex">
                    <Building2 className="h-8 w-8 text-cyan-200" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-100">
                      Clinic profile
                    </p>

                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                      {clinicName}
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                      Manage your clinic identity, registration details, owner information, location and presentation on Doc Chap Ghana.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                    <UserRound className="h-4 w-4 text-violet-200" />

                    {ownerFullName}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                    <MapPin className="h-4 w-4 text-emerald-200" />

                    {form.city
                      ? `${form.city}, Ghana`
                      : "Ghana"}
                  </span>

                  {form.email && (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md">
                      <Mail className="h-4 w-4 shrink-0 text-blue-200" />

                      <span className="truncate">
                        {form.email}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full xl:w-auto">
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md sm:p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <Link
                      href="/clinics/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                    >
                      <LayoutDashboard className="h-4 w-4" />

                      Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        void saveProfile()
                      }
                      disabled={
                        saving
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#071b3a] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* LEFT */}

            <div className="space-y-6">
              {/* CLINIC INFORMATION */}

              <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl" />

                <div className="relative">
                  <SectionHeader
                    icon={
                      Building2
                    }
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                    title="Clinic information"
                    subtitle="Your clinic identity and registration details."
                  />

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        label="Clinic name"
                        value={
                          form.clinicName
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "clinicName",
                            value
                          )
                        }
                        placeholder="e.g. Accra Family Clinic"
                        icon={
                          Building2
                        }
                        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                      />
                    </div>

                    <Field
                      label="Registration number"
                      value={
                        form.registrationNumber
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "registrationNumber",
                          value
                        )
                      }
                      placeholder="Registration number"
                      icon={
                        ShieldCheck
                      }
                      iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                    />

                    <Field
                      label="Clinic licence number"
                      value={
                        form.licenseNumber
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "licenseNumber",
                          value
                        )
                      }
                      placeholder="Licence number"
                      icon={
                        FileBadge2
                      }
                      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                    />
                  </div>
                </div>
              </section>

              {/* OWNER INFORMATION */}

              <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />

                <div className="relative">
                  <SectionHeader
                    icon={
                      UserRound
                    }
                    iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    title="Owner information"
                    subtitle="The clinic owner or authorised representative."
                  />

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label="Owner first name"
                      value={
                        form.ownerFirstName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "ownerFirstName",
                          value
                        )
                      }
                      placeholder="e.g. Ama"
                      icon={
                        UserRound
                      }
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                    />

                    <Field
                      label="Owner last name"
                      value={
                        form.ownerLastName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "ownerLastName",
                          value
                        )
                      }
                      placeholder="e.g. Mensah"
                      icon={
                        CircleUserRound
                      }
                      iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
                    />

                    <Field
                      label="Email address"
                      value={
                        form.email
                      }
                      disabled
                      icon={
                        Mail
                      }
                      iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                      hint="Your sign-in email is managed by Firebase Authentication."
                    />

                    <Field
                      label="WhatsApp number"
                      value={
                        form.phone
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "phone",
                          value
                        )
                      }
                      placeholder="+233 24 123 4567"
                      type="tel"
                      icon={
                        Phone
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                      hint="Use the international format with the country code."
                    />
                  </div>
                </div>
              </section>

              {/* LOCATION */}

              <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />

                <div className="relative">
                  <SectionHeader
                    icon={
                      MapPin
                    }
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    title="Clinic location"
                    subtitle="The address patients will use to locate your clinic."
                  />

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label="City"
                      value={
                        form.city
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "city",
                          value
                        )
                      }
                      placeholder="e.g. Accra"
                      icon={
                        MapPin
                      }
                      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                    />

                    <Field
                      label="Region"
                      value={
                        form.region
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "region",
                          value
                        )
                      }
                      placeholder="e.g. Greater Accra"
                      icon={
                        MapPin
                      }
                      iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
                    />

                    <div className="sm:col-span-2">
                      <Field
                        label="Clinic address"
                        value={
                          form.address
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "address",
                            value
                          )
                        }
                        placeholder="Street, area and nearby landmark"
                        icon={
                          MapPin
                        }
                        iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* PRESENTATION */}

              <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />

                <div className="relative">
                  <SectionHeader
                    icon={
                      Sparkles
                    }
                    iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"
                    title="Clinic presentation"
                    subtitle="Describe your clinic, services and approach to patient care."
                  />

                  <label className="mt-6 block">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      About the clinic
                    </span>

                    <textarea
                      value={
                        form.bio
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "bio",
                          event.target.value
                        )
                      }
                      rows={6}
                      maxLength={
                        1200
                      }
                      placeholder="Describe your clinic, its services and its approach to patient care..."
                      className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />

                    <div className="mt-1.5 text-right text-xs text-zinc-400">
                      {
                        form.bio
                          .length
                      }
                      /1200
                    </div>
                  </label>
                </div>
              </section>

              <button
                type="button"
                onClick={() =>
                  void saveProfile()
                }
                disabled={
                  saving
                }
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

                    Save my clinic profile
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
                    <Building2 className="h-8 w-8" />
                  </div>

                  <h3 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                    {clinicName}
                  </h3>

                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    Clinic
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl bg-blue-50/70 p-3 dark:bg-blue-950/20">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {ownerFullName}
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

                    <div className="flex items-start gap-3 rounded-2xl bg-cyan-50/70 p-3 dark:bg-cyan-950/20">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />

                      <span className="break-all text-sm text-zinc-700 dark:text-zinc-300">
                        {form.email ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECURITY */}

              <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                <SectionHeader
                  icon={
                    Lock
                  }
                  iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                  title="Account security"
                  subtitle="Secure your Doc Chap clinic account."
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
                      <Building2 className="h-4 w-4 text-blue-600" />

                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Account type
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Clinic
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

              {/* QUICK ACCESS */}

              <div className="rounded-[28px] border border-zinc-200/80 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                <div className="px-1 pb-3">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                    Quick access
                  </div>
                </div>

                <div className="space-y-3">
                  <NavigationCard
                    href="/clinics/dashboard"
                    title="Clinic dashboard"
                    subtitle="Overview and activity"
                    icon={
                      LayoutDashboard
                    }
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                  />

                  <NavigationCard
                    href="/clinics/dashboard"
                    title="Clinic workspace"
                    subtitle="Manage clinic activity"
                    icon={
                      Users
                    }
                    iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                  />

                  <NavigationCard
                    href="/clinics/my-account"
                    title="Account settings"
                    subtitle="Clinic profile and security"
                    icon={
                      Settings
                    }
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />

      {/* =========================================================
          POPUP
      ========================================================= */}

      {popup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clinic-account-popup-title"
          onMouseDown={(
            event
          ) => {
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
                setPopup(
                  null
                )
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
              id="clinic-account-popup-title"
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
                setPopup(
                  null
                )
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