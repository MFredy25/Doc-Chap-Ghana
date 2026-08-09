"use client";

import {
  useEffect,
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
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  db,
} from "@/lib/firebase/client";

type Props = {
  open: boolean;
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onCreated?: (
    insuranceName: string,
    insuranceId: string
  ) => void;
};

type FormState = {
  insurerName: string;
  contactName: string;
  email: string;
  phone: string;
  contractReference: string;
  notes: string;
};

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

export default function ClinicAddNewInsuranceModal({
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
      insurerName: "",
      contactName: "",
      email: "",
      phone: "",
      contractReference: "",
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
      insurerName: "",
      contactName: "",
      email: "",
      phone: "",
      contractReference: "",
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

  async function addInsurance() {
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

    const cleanName =
      form.insurerName.trim();

    const cleanEmail =
      normalizeEmail(
        form.email
      );

    if (
      cleanName.length <
      2
    ) {
      setError(
        "Enter the insurance company name."
      );

      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
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
      const insuranceRef =
        await addDoc(
          collection(
            firestoreInstance,
            "clinics",
            clinicId,
            "insurance"
          ),
          {
            clinicId,

            clinicName,

            name:
              cleanName,

            insurerName:
              cleanName,

            companyName:
              cleanName,

            contactName:
              form.contactName.trim() ||
              null,

            email:
              cleanEmail ||
              null,

            phone:
              form.phone.trim() ||
              null,

            reference:
              form.contractReference.trim() ||
              null,

            contractReference:
              form.contractReference.trim() ||
              null,

            notes:
              form.notes.trim() ||
              null,

            status:
              "active",

            active:
              true,

            country:
              "GH",

            locale:
              "en-GH",

            timezone:
              "Africa/Accra",

            application:
              "doc_chap_ghana",

            source:
              "clinic_dashboard",

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
        cleanName,
        insuranceRef.id
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
        "[ClinicAddNewInsuranceModal] Create insurance error:",
        createError
      );

      setError(
        "Unable to add the insurance company."
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

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinic-add-insurance-title"
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
        aria-label="Close insurance modal"
      />

      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
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
                <ShieldCheck className="h-6 w-6 text-cyan-200" />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  {clinicName}
                </div>

                <h2
                  id="clinic-add-insurance-title"
                  className="mt-1 text-2xl font-black tracking-tight"
                >
                  Add insurance company
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Add an insurance company your clinic currently works with.
            </p>
          </div>
        </div>

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

              Insurance company added successfully.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Insurance company name *
                </span>

                <input
                  value={
                    form.insurerName
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "insurerName",
                      event.target
                        .value
                    )
                  }
                  placeholder="Insurance company"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Contact person
                  </span>

                  <div className="relative mt-2">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        form.contactName
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          "contactName",
                          event.target
                            .value
                        )
                      }
                      placeholder="Contact person"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Contract / reference
                  </span>

                  <div className="relative mt-2">
                    <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        form.contractReference
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          "contractReference",
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional reference"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      placeholder="insurance@example.com"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </label>

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
                  rows={5}
                  maxLength={
                    1000
                  }
                  placeholder="Optional note about this insurance relationship..."
                  className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </label>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ShieldCheck className="h-6 w-6 text-blue-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Insurance summary
                </h3>

                <div className="mt-4 rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Company
                  </div>

                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                    {form.insurerName ||
                      "Not entered"}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/60">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Contact
                  </div>

                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                    {form.contactName ||
                      form.email ||
                      form.phone ||
                      "Not entered"}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Clinic insurance
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  This insurer will be saved only under the current clinic account.
                </p>
              </div>
            </aside>
          </div>
        </div>

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
              void addInsurance()
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

                Add insurance company
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}