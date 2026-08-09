"use client";

import {
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
} from "firebase/auth";

import {
  doc,
  getDoc,
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
  FileBadge2,
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
  return value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
    ? (value as Record<
        string,
        any
      >)
    : {};
}

type ClinicForm = {
  clinicName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  region: string;
  address: string;
  registrationNumber: string;
  licenseNumber: string;
};

export default function MyAccountClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uid,
    setUid,
  ] =
    useState<
      string | null
    >(null);

  const [
    clinicData,
    setClinicData,
  ] =
    useState<any>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<ClinicForm>({
      clinicName: "",
      contactName: "",
      email: "",
      phone: "",
      city: "",
      region: "",
      address: "",
      registrationNumber: "",
      licenseNumber: "",
    });

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

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuth,
        async (
          user
        ) => {
          if (
            !user?.uid
          ) {
            router.replace(
              "/clinics/login"
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  "clinics",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/clinics/login"
              );

              return;
            }

            const data =
              snapshot.data();

            if (
              data.active ===
              false
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/clinics/login"
              );

              return;
            }

            setUid(
              user.uid
            );

            setClinicData(
              data
            );
          } catch (
            accountError
          ) {
            console.error(
              "[ClinicAccount] Auth error:",
              accountError
            );

            setError(
              "Unable to load your clinic account."
            );
          } finally {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [
    router,
  ]);

  useEffect(() => {
    const firestore =
      db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const unsubscribe =
      onSnapshot(
        doc(
          firestore,
          "clinics",
          uid
        ),
        (
          snapshot
        ) => {
          if (
            snapshot.exists()
          ) {
            setClinicData(
              snapshot.data()
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [
    uid,
  ]);

  useEffect(() => {
    const profile =
      safeObject(
        clinicData?.profile
      );

    const clinic =
      safeObject(
        clinicData?.clinic
      );

    setForm({
      clinicName:
        safeString(
          profile.clinicName
        ) ||
        safeString(
          profile.displayName
        ),

      contactName:
        safeString(
          profile.contactName
        ),

      email:
        safeString(
          profile.email
        ),

      phone:
        safeString(
          profile.phone
        ),

      city:
        safeString(
          profile.city
        ),

      region:
        safeString(
          profile.region
        ),

      address:
        safeString(
          profile.address
        ),

      registrationNumber:
        safeString(
          clinic.registrationNumber
        ),

      licenseNumber:
        safeString(
          clinic.licenseNumber
        ),
    });
  }, [
    clinicData,
  ]);

  const verification =
    useMemo(
      () => {
        const clinic =
          safeObject(
            clinicData?.clinic
          );

        const status =
          safeString(
            clinic.verificationStatus
          ).toLowerCase() ||
          "pending";

        return {
          status,
          verified:
            clinic.verified ===
              true ||
            status ===
              "verified" ||
            status ===
              "approved",
        };
      },
      [
        clinicData,
      ]
    );

  async function save() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      saving
    ) {
      return;
    }

    if (
      form.clinicName.trim().length <
      2
    ) {
      setError(
        "Please enter the clinic name."
      );

      return;
    }

    setSaving(
      true
    );

    setSaved(
      false
    );

    setError(
      null
    );

    try {
      await setDoc(
        doc(
          firestore,
          "clinics",
          uid
        ),
        {
          profile: {
            clinicName:
              form.clinicName.trim(),

            displayName:
              form.clinicName.trim(),

            fullName:
              form.clinicName.trim(),

            contactName:
              form.contactName.trim() ||
              null,

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            city:
              form.city.trim() ||
              null,

            region:
              form.region.trim() ||
              null,

            address:
              form.address.trim() ||
              null,

            country:
              "Ghana",

            countryIso2:
              "GH",
          },

          clinic: {
            type:
              "clinic",

            registrationNumber:
              form.registrationNumber.trim() ||
              null,

            licenseNumber:
              form.licenseNumber.trim() ||
              null,
          },

          meta: {
            updatedAt:
              serverTimestamp(),

            profileCompleted:
              Boolean(
                form.clinicName.trim() &&
                  form.contactName.trim() &&
                  form.phone.trim() &&
                  form.city.trim() &&
                  form.address.trim()
              ),
          },
        },
        {
          merge:
            true,
        }
      );

      setSaved(
        true
      );
    } catch (
      saveError
    ) {
      console.error(
        "[ClinicAccount] Save error:",
        saveError
      );

      setError(
        "Unable to save your clinic information."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    <Building2 className="h-4 w-4 text-cyan-300" />
                    My clinic account
                  </span>

                  {verification.verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      <BadgeCheck className="h-4 w-4" />
                      Verified clinic
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                      <ShieldCheck className="h-4 w-4" />
                      Verification {verification.status}
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  Clinic profile
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                  Complete and manage your clinic information.
                </p>
              </div>

              <Link
                href="/clinics/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mr-2 inline h-4 w-4" />
              {error}
            </div>
          )}

          {saved && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Clinic information saved successfully.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Clinic information
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <AccountField
                  label="Clinic name"
                  value={
                    form.clinicName
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        clinicName:
                          value,
                      })
                    )
                  }
                  icon={
                    Building2
                  }
                />

                <AccountField
                  label="Contact person"
                  value={
                    form.contactName
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        contactName:
                          value,
                      })
                    )
                  }
                  icon={
                    UserRound
                  }
                />

                <AccountField
                  label="Email"
                  value={
                    form.email
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        email:
                          value,
                      })
                    )
                  }
                  icon={
                    Mail
                  }
                  disabled
                />

                <AccountField
                  label="Phone"
                  value={
                    form.phone
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        phone:
                          value,
                      })
                    )
                  }
                  icon={
                    Phone
                  }
                />

                <AccountField
                  label="City"
                  value={
                    form.city
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        city:
                          value,
                      })
                    )
                  }
                  icon={
                    MapPin
                  }
                />

                <AccountField
                  label="Region"
                  value={
                    form.region
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        region:
                          value,
                      })
                    )
                  }
                  icon={
                    MapPin
                  }
                />

                <div className="sm:col-span-2">
                  <AccountField
                    label="Address"
                    value={
                      form.address
                    }
                    onChange={(
                      value
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          address:
                            value,
                        })
                      )
                    }
                    icon={
                      MapPin
                    }
                  />
                </div>

                <AccountField
                  label="Registration number"
                  value={
                    form.registrationNumber
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        registrationNumber:
                          value,
                      })
                    )
                  }
                  icon={
                    FileBadge2
                  }
                />

                <AccountField
                  label="Clinic licence number"
                  value={
                    form.licenseNumber
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        licenseNumber:
                          value,
                      })
                    )
                  }
                  icon={
                    FileBadge2
                  }
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  void save()
                }
                disabled={
                  saving
                }
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save clinic profile
              </button>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ShieldCheck className="h-6 w-6 text-blue-700" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Clinic verification
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Your professional registration information may be reviewed before your clinic receives verified status.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function AccountField({
  label,
  value,
  onChange,
  icon: Icon,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </span>

      <div className="relative mt-2">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

        <input
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          disabled={
            disabled
          }
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        />
      </div>
    </label>
  );
}