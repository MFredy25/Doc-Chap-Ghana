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
  sendEmailVerification,
  signOut,
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
  FileBadge2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Pill,
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

type PharmacyData = {
  uid?: string;
  role?: string;
  accountType?: string;
  active?: boolean;
  status?: string;

  profile?: {
    pharmacyName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    bio?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };

  pharmacy?: {
    type?: string;
    registrationNumber?: string | null;
    licenseNumber?: string | null;
    verified?: boolean;
    verificationStatus?: string;
  };

  security?: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
};

type PharmacyForm = {
  pharmacyName: string;
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

function formFromData(
  data: PharmacyData | null,
  user: User | null
): PharmacyForm {
  const profile =
    data?.profile;

  const owner =
    profile?.owner;

  return {
    pharmacyName:
      s(
        profile?.pharmacyName
      ) ||
      s(
        profile?.displayName
      ),

    ownerFirstName:
      s(
        owner?.firstName
      ),

    ownerLastName:
      s(
        owner?.lastName
      ),

    email:
      s(
        profile?.email
      ) ||
      s(
        user?.email
      ),

    phone:
      s(
        profile?.phone
      ),

    registrationNumber:
      s(
        data?.pharmacy
          ?.registrationNumber
      ),

    licenseNumber:
      s(
        data?.pharmacy
          ?.licenseNumber
      ),

    address:
      s(
        profile?.address
      ),

    city:
      s(
        profile?.city
      ),

    region:
      s(
        profile?.region
      ),

    bio:
      s(
        profile?.bio
      ),
  };
}

const inputClass =
  "mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-emerald-950/40";

const textareaClass =
  "mt-2 min-h-32 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-emerald-950/40";

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
    pharmacyData,
    setPharmacyData,
  ] =
    useState<PharmacyData | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<PharmacyForm>({
      pharmacyName:
        "",
      ownerFirstName:
        "",
      ownerLastName:
        "",
      email:
        "",
      phone:
        "",
      registrationNumber:
        "",
      licenseNumber:
        "",
      address:
        "",
      city:
        "",
      region:
        "",
      bio:
        "",
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
    if (
      !auth ||
      !db
    ) {
      setError(
        "Firebase is not initialized."
      );

      setLoading(
        false
      );

      return;
    }

    const firebaseAuth =
      auth;

    const firestore =
      db;

    let stopProfile:
      | (() => void)
      | null =
      null;

    const stopAuth =
      onAuthStateChanged(
        firebaseAuth,
        (
          user
        ) => {
          stopProfile?.();

          stopProfile =
            null;

          if (
            !user?.uid
          ) {
            setFirebaseUser(
              null
            );

            router.replace(
              "/pharmacies/login"
            );

            return;
          }

          setFirebaseUser(
            user
          );

          stopProfile =
            onSnapshot(
              doc(
                firestore,
                "pharmacies",
                user.uid
              ),
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
                  } catch {}

                  router.replace(
                    "/pharmacies/login"
                  );

                  return;
                }

                const data =
                  snapshot.data() as PharmacyData;

                const type =
                  s(
                    data.accountType ||
                      data.role ||
                      data.pharmacy?.type
                  ).toLowerCase();

                if (
                  (
                    type &&
                    type !==
                      "pharmacy"
                  ) ||
                  data.active ===
                    false
                ) {
                  try {
                    await signOut(
                      firebaseAuth
                    );
                  } catch {}

                  router.replace(
                    "/pharmacies/login"
                  );

                  return;
                }

                setPharmacyData(
                  data
                );

                setForm(
                  formFromData(
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

                try {
                  window.localStorage.setItem(
                    "docchapghana:account-space",
                    "pharmacy"
                  );
                } catch {
                  // Non-blocking.
                }
              },
              (
                profileError
              ) => {
                console.error(
                  "[PharmacyMyAccount] Profile error:",
                  profileError
                );

                setError(
                  "Unable to load your pharmacy profile."
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return () => {
      stopProfile?.();
      stopAuth();
    };
  }, [
    router,
  ]);

  const verificationStatus =
    s(
      pharmacyData
        ?.pharmacy
        ?.verificationStatus
    ).toLowerCase() ||
    "pending";

  const verified =
    pharmacyData
      ?.pharmacy
      ?.verified ===
      true ||
    verificationStatus ===
      "verified" ||
    verificationStatus ===
      "approved";

  const emailVerified =
    firebaseUser
      ?.emailVerified ===
      true ||
    pharmacyData
      ?.security
      ?.emailVerified ===
      true;

  const profileName =
    useMemo(
      () =>
        s(
          form.pharmacyName
        ) ||
        "Pharmacy",
      [
        form.pharmacyName,
      ]
    );

  function setField(
    key:
      keyof PharmacyForm,
    value:
      string
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
    const firestore =
      db;

    const user =
      auth?.currentUser ||
      firebaseUser;

    if (
      !firestore ||
      !user?.uid ||
      saving
    ) {
      return;
    }

    const pharmacyName =
      s(
        form.pharmacyName
      );

    const firstName =
      s(
        form.ownerFirstName
      );

    const lastName =
      s(
        form.ownerLastName
      );

    const phone =
      normalizeGhanaPhone(
        form.phone
      );

    if (
      pharmacyName.length <
      2
    ) {
      setError(
        "Please enter the pharmacy name."
      );

      return;
    }

    if (
      !/^\+233\d{9}$/.test(
        phone
      )
    ) {
      setError(
        "Please enter a valid Ghana phone number."
      );

      return;
    }

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
      await setDoc(
        doc(
          firestore,
          "pharmacies",
          user.uid
        ),
        {
          uid:
            user.uid,

          profile: {
            pharmacyName,

            displayName:
              pharmacyName,

            email:
              s(
                form.email
              ),

            phone,

            address:
              s(
                form.address
              ),

            city:
              s(
                form.city
              ),

            region:
              s(
                form.region
              ),

            country:
              "Ghana",

            countryIso2:
              "GH",

            bio:
              s(
                form.bio
              ),

            owner: {
              firstName,

              lastName,

              fullName:
                `${firstName} ${lastName}`.trim(),

              email:
                s(
                  form.email
                ),

              phone,
            },
          },

          pharmacy: {
            type:
              "pharmacy",

            registrationNumber:
              s(
                form.registrationNumber
              ) ||
              null,

            licenseNumber:
              s(
                form.licenseNumber
              ) ||
              null,
          },

          meta: {
            profileCompleted:
              Boolean(
                pharmacyName &&
                  phone &&
                  form.city &&
                  form.region &&
                  (
                    form.registrationNumber ||
                    form.licenseNumber
                  )
              ),

            updatedAt:
              serverTimestamp(),
          },
        },
        {
          merge:
            true,
        }
      );

      setForm(
        (
          current
        ) => ({
          ...current,
          phone,
        })
      );

      setSuccess(
        "Your pharmacy profile has been saved successfully."
      );
    } catch (
      saveError
    ) {
      console.error(
        "[PharmacyMyAccount] Save error:",
        saveError
      );

      setError(
        "Unable to save your pharmacy profile."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function verifyEmail() {
    const user =
      auth?.currentUser ||
      firebaseUser;

    if (
      !user ||
      sendingVerification
    ) {
      return;
    }

    setSendingVerification(
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
        user.emailVerified
      ) {
        setSuccess(
          "Your email address is already verified."
        );

        return;
      }

      await sendEmailVerification(
        user
      );

      setSuccess(
        "A verification email has been sent. Open it and follow the verification link."
      );
    } catch (
      verificationError
    ) {
      console.error(
        "[PharmacyMyAccount] Email verification error:",
        verificationError
      );

      setError(
        "Unable to send the verification email."
      );
    } finally {
      setSendingVerification(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
        <Header />

        <main className="flex min-h-[75vh] items-center justify-center">
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
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            <Link
              href="/pharmacies/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to dashboard
            </Link>

            <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <Pill className="h-4 w-4" />

                  My pharmacy account
                </span>

                <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                  {profileName}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                  Complete and maintain your pharmacy information for Doc Chap Ghana.
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#063b34] shadow-xl transition hover:bg-emerald-50 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mr-2 inline h-4 w-4" />

              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />

              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Pharmacy information
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Public and contact information for your pharmacy.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-sm font-semibold">
                      Pharmacy name
                    </span>

                    <input
                      value={
                        form.pharmacyName
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "pharmacyName",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Owner / manager first name
                    </span>

                    <input
                      value={
                        form.ownerFirstName
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "ownerFirstName",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Owner / manager last name
                    </span>

                    <input
                      value={
                        form.ownerLastName
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "ownerLastName",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Email
                    </span>

                    <input
                      value={
                        form.email
                      }
                      disabled
                      className={`${inputClass} cursor-not-allowed opacity-60`}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Phone
                    </span>

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
                      className={inputClass}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="text-sm font-semibold">
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
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
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
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
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
                      className={inputClass}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FileBadge2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Professional registration
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Enter the pharmacy registration and licence references.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold">
                      Registration number
                    </span>

                    <input
                      value={
                        form.registrationNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "registrationNumber",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Licence number
                    </span>

                    <input
                      value={
                        form.licenseNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "licenseNumber",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="text-sm font-semibold">
                      About the pharmacy
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
                      placeholder="Describe your pharmacy and the services available..."
                      className={textareaClass}
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save pharmacy profile"}
              </button>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Pill className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                  {profileName}
                </h3>

                <div className="mt-4 space-y-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />

                    {form.email ||
                      "No email"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />

                    {form.phone ||
                      "No phone"}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />

                    {[
                      form.city,
                      form.region,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ", "
                      ) ||
                      "Ghana"}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <ShieldCheck className="h-6 w-6 text-blue-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Verification
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Status:{" "}
                  <strong className="capitalize">
                    {verified
                      ? "verified"
                      : verificationStatus}
                  </strong>
                </p>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                {emailVerified ? (
                  <>
                    <BadgeCheck className="h-6 w-6 text-emerald-600" />

                    <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      Email verified
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Your pharmacy account email is confirmed.
                    </p>
                  </>
                ) : (
                  <>
                    <Mail className="h-6 w-6 text-amber-600" />

                    <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                      Verify your email
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Confirm your email address to secure your pharmacy account.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void verifyEmail()
                      }
                      disabled={
                        sendingVerification
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      {sendingVerification && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}

                      {sendingVerification
                        ? "Sending..."
                        : "Verify my email"}
                    </button>
                  </>
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}