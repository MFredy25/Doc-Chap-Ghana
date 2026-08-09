"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  UserRound,
  X,
} from "lucide-react";

import {
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type Props = {
  open: boolean;
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onCreated?: (
    patientName: string,
    patientId: string
  ) => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  city: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeEmail(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function cleanPhone(
  value: string
): string {
  return value
    .replace(
      /[^\d+\s()-]/g,
      ""
    )
    .slice(
      0,
      30
    );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ClinicAddNewPatientModal({
  open,
  clinicId,
  clinicName,
  onClose,
  onCreated,
}: Props) {
  const [
    form,
    setForm,
  ] =
    useState<FormState>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      city: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    });

  const [
    saving,
    setSaving,
  ] =
    useState(false);

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
    useState(false);

  /* ============================================================
     BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
  ]);

  /* ============================================================
     RESET
  ============================================================ */

  useEffect(() => {
    if (open) {
      setError(
        null
      );

      setSuccess(
        false
      );

      return;
    }

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      city: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    });

    setSaving(
      false
    );

    setError(
      null
    );

    setSuccess(
      false
    );
  }, [
    open,
  ]);

  const fullName =
    useMemo(
      () =>
        `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      [
        form.firstName,
        form.lastName,
      ]
    );

  function update<
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K]
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
      false
    );
  }

  /* ============================================================
     CREATE PATIENT
  ============================================================ */

  async function addPatient() {
    const firestore =
      db;

    if (
      !firestore ||
      !clinicId ||
      saving
    ) {
      return;
    }

    const firestoreInstance =
      firestore;

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const email =
      normalizeEmail(
        form.email
      );

    const phone =
      form.phone.trim();

    if (
      firstName.length <
      2
    ) {
      setError(
        "Enter the patient's first name."
      );

      return;
    }

    if (
      lastName.length <
      2
    ) {
      setError(
        "Enter the patient's last name."
      );

      return;
    }

    if (
      !phone &&
      !email
    ) {
      setError(
        "Enter at least a phone number or an email address."
      );

      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Enter a valid email address."
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
      false
    );

    try {
      const patientRef =
        await addDoc(
          collection(
            firestoreInstance,
            "clinics",
            clinicId,
            "patients"
          ),
          {
            clinicId,

            clinicName,

            firstName,

            lastName,

            fullName:
              `${firstName} ${lastName}`,

            displayName:
              `${firstName} ${lastName}`,

            email:
              email ||
              null,

            phone:
              phone ||
              null,

            gender:
              form.gender ||
              null,

            dateOfBirth:
              form.dateOfBirth ||
              null,

            city:
              form.city.trim() ||
              null,

            address:
              form.address.trim() ||
              null,

            emergencyContact: {
              name:
                form.emergencyContactName.trim() ||
                null,

              phone:
                form.emergencyContactPhone.trim() ||
                null,
            },

            notes:
              form.notes.trim() ||
              null,

            status:
              "active",

            active:
              true,

            source:
              "clinic_dashboard",

            accountLinked:
              false,

            profile: {
              firstName,
              lastName,

              fullName:
                `${firstName} ${lastName}`,

              displayName:
                `${firstName} ${lastName}`,

              email:
                email ||
                null,

              phone:
                phone ||
                null,

              gender:
                form.gender ||
                null,

              dateOfBirth:
                form.dateOfBirth ||
                null,

              city:
                form.city.trim() ||
                null,

              address:
                form.address.trim() ||
                null,
            },

            country:
              "GH",

            countryIso2:
              "GH",

            locale:
              "en-GH",

            timezone:
              "Africa/Accra",

            application:
              "doc_chap_ghana",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

      setSuccess(
        true
      );

      onCreated?.(
        `${firstName} ${lastName}`,
        patientRef.id
      );

      window.setTimeout(
        () => {
          onClose();
        },
        800
      );
    } catch (
      createError
    ) {
      console.error(
        "[ClinicAddNewPatientModal] Create patient error:",
        createError
      );

      setError(
        "Unable to add the patient."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (!open) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinic-add-patient-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => {
          if (
            !saving
          ) {
            onClose();
          }
        }}
        aria-label="Close patient modal"
      />

      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* HEADER */}

        <div className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] px-5 py-6 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <UserRound className="h-6 w-6 text-cyan-200" />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  {clinicName}
                </div>

                <h2
                  id="clinic-add-patient-title"
                  className="mt-1 text-2xl font-black tracking-tight"
                >
                  Add new patient
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Add a patient to this clinic so the patient can be selected when creating an appointment.
            </p>
          </div>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              <AlertCircle className="mr-2 inline h-4 w-4" />

              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />

              Patient added successfully.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* FORM */}

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    First name *
                  </span>

                  <input
                    value={
                      form.firstName
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "firstName",
                        event.target
                          .value
                      )
                    }
                    maxLength={
                      80
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Last name *
                  </span>

                  <input
                    value={
                      form.lastName
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "lastName",
                        event.target
                          .value
                      )
                    }
                    maxLength={
                      80
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Phone
                  </span>

                  <div className="relative mt-2">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        form.phone
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          "phone",
                          cleanPhone(
                            event.target
                              .value
                          )
                        )
                      }
                      placeholder="+233..."
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Email
                  </span>

                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          "email",
                          event.target
                            .value
                        )
                      }
                      placeholder="patient@example.com"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Gender
                  </span>

                  <select
                    value={
                      form.gender
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "gender",
                        event.target
                          .value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">
                      Select gender
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

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Date of birth
                  </span>

                  <input
                    type="date"
                    value={
                      form.dateOfBirth
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "dateOfBirth",
                        event.target
                          .value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    City
                  </span>

                  <input
                    value={
                      form.city
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "city",
                        event.target
                          .value
                      )
                    }
                    placeholder="Accra"
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Address
                  </span>

                  <div className="relative mt-2">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        form.address
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          "address",
                          event.target
                            .value
                        )
                      }
                      placeholder="Patient address"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Emergency contact
                </div>

                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    value={
                      form.emergencyContactName
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "emergencyContactName",
                        event.target
                          .value
                      )
                    }
                    placeholder="Contact name"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />

                  <input
                    value={
                      form.emergencyContactPhone
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        "emergencyContactPhone",
                        cleanPhone(
                          event.target
                            .value
                        )
                      )
                    }
                    placeholder="Contact phone"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Internal note
                </span>

                <textarea
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "notes",
                      event.target
                        .value
                    )
                  }
                  rows={4}
                  maxLength={
                    1000
                  }
                  placeholder="Optional clinic note about the patient..."
                  className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </label>
            </div>

            {/* SUMMARY */}

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                <UserRound className="h-6 w-6 text-violet-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Patient summary
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Name
                    </div>

                    <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                      {fullName ||
                        "Not entered"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Phone
                    </div>

                    <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                      {form.phone ||
                        "Not entered"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Email
                    </div>

                    <div className="mt-1 break-all text-sm font-black text-zinc-950 dark:text-white">
                      {form.email ||
                        "Not entered"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Appointment ready
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Once saved, this patient can be selected immediately when the clinic creates a new appointment.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void addPatient()
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />

                Add patient
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}