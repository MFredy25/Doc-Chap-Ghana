"use client";

import {
  useEffect,
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
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type PatientData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    dob?: string | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    countryIso2?: string;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };

  meta?: {
    profileCompleted?: boolean;
  };
};

type PatientForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeGhanaPhone(
  value: string
): string {
  const raw =
    s(value);

  if (!raw) return "";

  const compact =
    raw.replace(
      /[^\d+]/g,
      ""
    );

  if (
    compact.startsWith(
      "+233"
    )
  ) {
    return `+233${compact
      .slice(4)
      .replace(/\D/g, "")}`;
  }

  if (
    compact.startsWith(
      "00233"
    )
  ) {
    return `+233${compact
      .slice(5)
      .replace(/\D/g, "")}`;
  }

  let digits =
    compact.replace(
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

function patientFormFromData(
  data: PatientData | null,
  user: User | null
): PatientForm {
  const profile =
    o(
      data?.profile
    );

  const authName =
    s(
      user?.displayName
    )
      .split(
        /\s+/
      )
      .filter(Boolean);

  return {
    firstName:
      s(
        profile.firstName
      ) ||
      authName[0] ||
      "",

    lastName:
      s(
        profile.lastName
      ) ||
      authName
        .slice(1)
        .join(" "),

    email:
      s(
        profile.email
      ) ||
      s(
        user?.email
      ),

    phone:
      s(
        profile.phone
      ),

    dob:
      s(
        profile.dob
      ),

    gender:
      s(
        profile.gender
      ),

    address:
      s(
        profile.address
      ),

    city:
      s(
        profile.city
      ),

    region:
      s(
        profile.region
      ),

    postalCode:
      s(
        profile.postalCode
      ),
  };
}

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
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    patientData,
    setPatientData,
  ] =
    useState<PatientData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<PatientForm>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      gender: "",
      address: "",
      city: "",
      region: "",
      postalCode: "",
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
        "Firebase is not initialized."
      );

      setLoading(
        false
      );

      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribePatient:
      | (() => void)
      | null =
      null;

    const stopListener =
      () => {
        unsubscribePatient?.();
        unsubscribePatient =
          null;
      };

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          stopListener();

          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            setPatientData(
              null
            );

            router.replace(
              "/patients/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          unsubscribePatient =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                user.uid
              ),
              async (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  stopListener();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as PatientData;

                const accountType =
                  s(
                    data.accountType ||
                    data.role
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !== "patient"
                  ) ||
                  data.active === false ||
                  s(
                    data.status
                  ).toLowerCase() ===
                    "disabled"
                ) {
                  stopListener();

                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/patients/login"
                  );

                  return;
                }

                setPatientData(
                  data
                );

                setForm(
                  patientFormFromData(
                    data,
                    user
                  )
                );

                setError(
                  null
                );

                setLoading(
                  false
                );
              },
              (
                snapshotError
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientMyAccount] Profile error:",
                  snapshotError
                );

                setError(
                  "Unable to load your patient profile."
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return () => {
      stopListener();
      unsubscribeAuth();
    };
  }, [
    router,
  ]);

  function setField(
    key: keyof PatientForm,
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

    setError(
      null
    );

    setSuccess(
      null
    );
  }

  async function saveProfile() {
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
      !user?.uid ||
      saving
    ) {
      return;
    }

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const phone =
      normalizeGhanaPhone(
        form.phone
      );

    if (
      !firstName
    ) {
      setError(
        "Please enter your first name."
      );

      return;
    }

    if (
      !lastName
    ) {
      setError(
        "Please enter your last name."
      );

      return;
    }

    if (
      phone &&
      !/^\+233\d{9}$/.test(
        phone
      )
    ) {
      setError(
        "Please enter a valid Ghanaian phone number."
      );

      return;
    }

    const fullName =
      `${firstName} ${lastName}`.trim();

    const profileCompleted =
      Boolean(
        firstName &&
        lastName &&
        phone &&
        form.dob &&
        form.gender &&
        form.city
      );

    setSaving(
      true
    );

    setError(
      null
    );

    setSuccess(
      null
    );

    try {
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
          profileError
        ) {
          console.error(
            "[PatientMyAccount] Auth profile update error:",
            profileError
          );
        }
      }

      await setDoc(
        doc(
          firestore,
          "patients",
          user.uid
        ),
        {
          uid:
            user.uid,

          role:
            "patient",

          accountType:
            "patient",

          profile: {
            firstName,
            lastName,
            fullName,
            displayName:
              fullName,

            email:
              form.email
                .trim()
                .toLowerCase() ||
              user.email ||
              "",

            phone:
              phone ||
              null,

            dob:
              form.dob ||
              null,

            gender:
              form.gender ||
              null,

            address:
              form.address.trim() ||
              null,

            city:
              form.city.trim() ||
              null,

            region:
              form.region.trim() ||
              null,

            postalCode:
              form.postalCode.trim() ||
              null,

            country:
              "Ghana",

            countryIso2:
              "GH",
          },

          security: {
            emailVerified:
              user.emailVerified,
          },

          meta: {
            updatedAt:
              serverTimestamp(),

            locale:
              "en-GH",

            country:
              "GH",

            platform:
              "web",

            application:
              "doc_chap_ghana",

            profileCompleted,
          },
        },
        {
          merge:
            true,
        }
      );

      setSuccess(
        "Your patient profile has been updated successfully."
      );
    } catch (
      saveError
    ) {
      console.error(
        "[PatientMyAccount] Save error:",
        saveError
      );

      setError(
        "Unable to save your patient profile."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  const fullName =
    `${form.firstName} ${form.lastName}`.trim() ||
    "Patient";

  const profileCompleted =
    patientData
      ?.meta
      ?.profileCompleted ===
    true;

  const emailVerified =
    firebaseUser
      ?.emailVerified ===
      true ||
    patientData
      ?.security
      ?.emailVerified ===
      true;

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
          <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            <Link
              href="/patients/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />

              Dashboard
            </Link>

            <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    <UserRound className="h-4 w-4" />

                    My patient account
                  </span>

                  {profileCompleted && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" />

                      Profile completed
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  {fullName}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                  Complete and manage the information attached to your Doc Chap Ghana patient account.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void saveProfile()
                }
                disabled={
                  saving
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />

                    Save my profile
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mr-2 inline h-4 w-4" />

              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />

              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white">
                      Personal information
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Your identity and basic patient information.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      First name
                    </span>

                    <input
                      value={
                        form.firstName
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "firstName",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Last name
                    </span>

                    <input
                      value={
                        form.lastName
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "lastName",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Date of birth
                    </span>

                    <input
                      type="date"
                      value={
                        form.dob
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "dob",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Gender
                    </span>

                    <select
                      value={
                        form.gender
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "gender",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="">
                        Select
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="other">
                        Other
                      </option>

                      <option value="prefer_not_to_say">
                        Prefer not to say
                      </option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white">
                      Contact information
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Information used to contact you about your healthcare services.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Email
                    </span>

                    <div className="relative mt-2">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <input
                        value={
                          form.email
                        }
                        disabled
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-100 pl-11 pr-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Ghana phone number
                    </span>

                    <div className="relative mt-2">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                      <input
                        value={
                          form.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "phone",
                            event.target.value
                          )
                        }
                        placeholder="+233 24 123 4567"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-zinc-950 dark:text-white">
                      Location
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Your Ghana location and address information.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Address
                    </span>

                    <input
                      value={
                        form.address
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="Street and area"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      City
                    </span>

                    <input
                      value={
                        form.city
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "city",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Accra"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Region
                    </span>

                    <input
                      value={
                        form.region
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "region",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Greater Accra"
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      Postal code
                    </span>

                    <input
                      value={
                        form.postalCode
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "postalCode",
                          event.target.value
                        )
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Saving profile...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />

                    Save my patient profile
                  </>
                )}
              </button>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <HeartPulse className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                  {fullName}
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Doc Chap Ghana patient
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <span className="text-xs text-zinc-500">
                      Profile
                    </span>

                    <span className={`text-xs font-black ${
                      profileCompleted
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}>
                      {profileCompleted
                        ? "Complete"
                        : "Incomplete"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <span className="text-xs text-zinc-500">
                      Email
                    </span>

                    <span className={`text-xs font-black ${
                      emailVerified
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}>
                      {emailVerified
                        ? "Verified"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </section>

              <Link
                href="/patients/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#063b34] px-5 py-3.5 text-sm font-bold text-white"
              >
                <CalendarDays className="h-4 w-4" />

                Go to dashboard
              </Link>

              <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Patient-only account
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  This page reads and updates only the authenticated patient document under patients/{`{uid}`}.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}