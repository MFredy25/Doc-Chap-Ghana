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
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

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

  clinicName: string;

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

    clinicName?: string;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };

  meta?: {
    profileCompleted?: boolean;
  };
};

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
): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      any
    >;
  }

  return {};
}

function normalizeInternationalPhone(
  value: string
): string {
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

function isValidInternationalPhone(
  value: string
): boolean {
  const normalized = normalizeInternationalPhone(value);

  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function doctorFormFromData(
  data: DoctorData | null,
  user: User | null
): DoctorForm {
  const root =
    safeObject(data);

  const profile =
    safeObject(
      root.profile
    );

  const professional =
    safeObject(
      root.professional
    );

  return {
    firstName:
      safeString(
        profile.firstName
      ),

    lastName:
      safeString(
        profile.lastName
      ),

    email:
      safeString(
        profile.email
      ) ||
      safeString(
        user?.email
      ),

    phone:
      safeString(
        profile.phone
      ),

    specialty:
      safeString(
        professional.specialty
      ) ||
      safeString(
        profile.specialty
      ),

    licenseNumber:
      safeString(
        professional.licenseNumber
      ),

    registrationNumber:
      safeString(
        professional.registrationNumber
      ),

    clinicName:
      safeString(
        professional.clinicName
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
  data: DoctorData | null
): string {
  const professional =
    safeObject(
      data?.professional
    );

  return (
    safeString(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending"
  );
}

function isVerifiedDoctor(
  data: DoctorData | null
): boolean {
  const professional =
    safeObject(
      data?.professional
    );

  const status =
    getVerificationStatus(
      data
    );

  return (
    professional.verified ===
      true ||
    status === "verified" ||
    status === "approved"
  );
}

/* ============================================================
   INPUT
============================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  icon: Icon,
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
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {label}
      </span>

      <div
        className={`mt-2 flex min-h-12 items-center gap-3 rounded-xl border px-3 transition ${
          disabled
            ? "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            : "border-zinc-200 bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-blue-600" />

        <input
          value={value}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
          disabled={disabled}
          type={type}
          placeholder={
            placeholder
          }
          className="h-11 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-white"
        />
      </div>
    </label>
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
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    doctorData,
    setDoctorData,
  ] =
    useState<DoctorData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<DoctorForm>({
      firstName: "",
      lastName: "",

      email: "",
      phone: "",

      specialty: "",

      licenseNumber: "",
      registrationNumber:
        "",

      clinicName: "",

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

  /* ============================================================
     AUTHENTICATION
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

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuth,
        async (
          user
        ) => {
          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            router.replace(
              "/doctors/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          const professionalRef =
            doc(
              firestore,
              "professionals",
              user.uid
            );

          const unsubscribeProfile =
            onSnapshot(
              professionalRef,

              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {
                    // Ignore
                  }

                  router.replace(
                    "/doctors/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as DoctorData;

                const professional =
                  safeObject(
                    data.professional
                  );

                const professionalType =
                  safeString(
                    data.professionalType ||
                      professional.type ||
                      data.role
                  ).toLowerCase();

                if (
                  professionalType &&
                  professionalType !==
                    "doctor"
                ) {
                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {
                    // Ignore
                  }

                  router.replace(
                    "/doctors/login"
                  );

                  return;
                }

                if (
                  data.active ===
                    false ||
                  safeString(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {
                    // Ignore
                  }

                  router.replace(
                    "/doctors/login"
                  );

                  return;
                }

                setDoctorData(
                  data
                );

                setForm(
                  doctorFormFromData(
                    data,
                    user
                  )
                );

                setError(null);

                setLoading(
                  false
                );
              },

              (
                snapshotError
              ) => {
                console.error(
                  "[DoctorAccount] Profile realtime error:",
                  snapshotError
                );

                setError(
                  "Unable to load your professional profile."
                );

                setLoading(
                  false
                );
              }
            );

          return () =>
            unsubscribeProfile();
        }
      );

    return () =>
      unsubscribeAuth();
  }, [router]);

  /* ============================================================
     FORM
  ============================================================ */

  function setField(
    key: keyof DoctorForm,
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
     SAVE
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
      firebaseAuth
        ?.currentUser ||
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

    const clinicName =
      form.clinicName.trim();

    const address =
      form.address.trim();

    const city =
      form.city.trim();

    const region =
      form.region.trim();

    const bio =
      form.bio.trim();

    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

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
      !isValidInternationalPhone(
        phone
      )
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
      /* --------------------------------------------------------
         FIREBASE AUTH PROFILE
      -------------------------------------------------------- */

      if (
        user.displayName !==
        fullName
      ) {
        try {
          await updateProfile(
            user,
            {
              displayName:
                fullName,
            }
          );
        } catch (
          authProfileError
        ) {
          console.error(
            "[DoctorAccount] Auth profile update error:",
            authProfileError
          );
        }
      }

      /* --------------------------------------------------------
         FIRESTORE
      -------------------------------------------------------- */

      const professionalRef =
        doc(
          firestore,
          "professionals",
          user.uid
        );

      const profileCompleted =
        Boolean(
          firstName &&
            lastName &&
            phone &&
            specialty &&
            city
        );

      await setDoc(
        professionalRef,
        {
          uid:
            user.uid,

          role:
            "doctor",

          accountType:
            "professional",

          professionalType:
            "doctor",

          profile: {
            firstName,
            lastName,

            fullName,
            displayName:
              fullName,

            email:
              email ||
              user.email ||
              "",

            phone,

            specialty:
              specialty ||
              null,

            address:
              address ||
              null,

            city:
              city ||
              null,

            region:
              region ||
              null,

            country:
              "Ghana",

            countryIso2:
              "GH",

            bio:
              bio ||
              null,
          },

          professional: {
            type:
              "doctor",

            specialty:
              specialty ||
              null,

            licenseNumber:
              licenseNumber ||
              null,

            registrationNumber:
              registrationNumber ||
              null,

            clinicName:
              clinicName ||
              null,
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
        // Not blocking.
      }

      setSuccess(
        "Your professional profile has been updated successfully."
      );
    } catch (
      saveError
    ) {
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
      ?.profileCompleted ===
      true;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />

              <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Loading your
                professional account...
              </div>

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Retrieving your Doc
                Chap Ghana doctor
                information.
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                      <Stethoscope className="h-4 w-4" />

                      My account
                    </span>

                    {verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <BadgeCheck className="h-4 w-4" />

                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {verificationStatus}
                      </span>
                    )}

                    {profileCompleted && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                        <CheckCircle2 className="h-4 w-4" />

                        Profile completed
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
                    {fullName}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base dark:text-zinc-300">
                    Manage your personal
                    and professional
                    information used
                    across Doc Chap Ghana.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {form.specialty && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        <GraduationCap className="h-4 w-4 text-blue-600" />

                        {
                          form.specialty
                        }
                      </span>
                    )}

                    {form.city && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        <MapPin className="h-4 w-4 text-emerald-600" />

                        {form.city},
                        Ghana
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/doctors/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />

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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
            {/* MESSAGES */}

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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
              {/* =================================================
                  FORM
              ================================================= */}

              <div className="space-y-6">
                {/* PERSONAL */}

                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/8 via-indigo-500/4 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                        <UserRound className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-black dark:text-white">
                          Personal
                          information
                        </h2>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          Your identity and
                          contact
                          information.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label="First name"
                        value={
                          form.firstName
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "firstName",
                            value
                          )
                        }
                        placeholder="e.g. Ama"
                        icon={
                          UserRound
                        }
                      />

                      <Field
                        label="Last name"
                        value={
                          form.lastName
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "lastName",
                            value
                          )
                        }
                        placeholder="e.g. Mensah"
                        icon={
                          UserRound
                        }
                      />

                      <Field
                        label="Email address"
                        value={
                          form.email
                        }
                        disabled
                        icon={Mail}
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
                        placeholder="+233..., +33..., +44..."
                        type="tel"
                        icon={Phone}
                      />
                    </div>
                  </div>
                </div>

                {/* PROFESSIONAL */}

                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-blue-500/4 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-black dark:text-white">
                          Professional
                          information
                        </h2>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          Information about
                          your medical
                          practice.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label="Medical speciality"
                        value={
                          form.specialty
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "specialty",
                            value
                          )
                        }
                        placeholder="e.g. Cardiology"
                        icon={
                          GraduationCap
                        }
                      />

                      <Field
                        label="Clinic / facility"
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
                        placeholder="Clinic or hospital"
                        icon={
                          Building2
                        }
                      />

                      <Field
                        label="Medical licence number"
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
                          BadgeCheck
                        }
                      />

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
                      />
                    </div>
                  </div>
                </div>

                {/* LOCATION */}

                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/7 via-cyan-500/4 to-transparent" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-black dark:text-white">
                          Practice location
                        </h2>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          Where patients
                          can find you.
                        </p>
                      </div>
                    </div>

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
                        icon={MapPin}
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
                        icon={MapPin}
                      />

                      <div className="sm:col-span-2">
                        <Field
                          label="Address"
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
                          placeholder="Professional practice address"
                          icon={
                            MapPin
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BIO */}

                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600">
                        <CircleUserRound className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-black dark:text-white">
                          Professional
                          presentation
                        </h2>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          Tell patients a
                          little about your
                          practice.
                        </p>
                      </div>
                    </div>

                    <label className="mt-6 block">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Biography
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
                            event.target
                              .value
                          )
                        }
                        rows={6}
                        maxLength={1200}
                        placeholder="Describe your experience, medical practice and approach to patient care..."
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      />

                      <div className="mt-1 text-right text-xs text-zinc-400">
                        {
                          form.bio
                            .length
                        }
                        /1200
                      </div>
                    </label>
                  </div>
                </div>

                {/* SAVE MOBILE/DESKTOP */}

                <button
                  type="button"
                  onClick={() =>
                    void saveProfile()
                  }
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      Save my
                      professional
                      profile
                    </>
                  )}
                </button>
              </div>

              {/* =================================================
                  RIGHT SIDE
              ================================================= */}

              <aside className="space-y-6">
                {/* ACCOUNT */}

                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent" />

                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <UserRound className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-black dark:text-white">
                      {fullName}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {form.specialty ||
                        "Doctor"}
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                        <span className="break-all text-zinc-600 dark:text-zinc-400">
                          {form.email ||
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                        <span className="text-zinc-600 dark:text-zinc-400">
                          {form.phone ||
                            "No phone number"}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                        <span className="text-zinc-600 dark:text-zinc-400">
                          {form.city
                            ? `${form.city}, Ghana`
                            : "Ghana"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECURITY */}

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                      <Lock className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-white">
                        Account security
                      </h3>

                      <p className="text-xs text-zinc-500">
                        Firebase
                        Authentication
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Email verified
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          firebaseUser
                            ?.emailVerified
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {firebaseUser
                          ?.emailVerified
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Account type
                      </span>

                      <span className="text-xs font-semibold text-blue-600">
                        Doctor
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Country
                      </span>

                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Ghana
                      </span>
                    </div>
                  </div>
                </div>

                {/* LINKS */}

                <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <Link
                    href="/doctors/dashboard"
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Doctor dashboard

                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>

                  <Link
                    href="/doctors/dashboard/configuration"
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Configuration

                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>

                  <Link
                    href="/doctors/dashboard/settings"
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Settings

                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}