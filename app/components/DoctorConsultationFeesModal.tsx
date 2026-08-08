"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Loader2,
  Save,
  Smartphone,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase/client";

type ConsultationModes = {
  inPersonEnabled: boolean;
  teleconsultationEnabled: boolean;
  phoneConsultationEnabled: boolean;
};

type ConsultationPricing = {
  currency?: string;

  inPerson?: {
    enabled?: boolean;
    amount?: number;
  };

  video?: {
    enabled?: boolean;
    amount?: number;
  };

  phone?: {
    enabled?: boolean;
    amount?: number;
  };
};

type Props = {
  open: boolean;
  doctorId: string | null | undefined;
  doctorName: string;
  consultationModes: ConsultationModes;
  onClose: () => void;
  onSaved?: () => void;
};

type FeesForm = {
  inPerson: string;
  video: string;
  phone: string;
};

type ConsultationFeeOption = {
  key: keyof FeesForm;
  label: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
};

function safeAmount(
  value: unknown,
  fallback = 0
): string {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return String(value);
  }

  return String(fallback);
}

export default function DoctorConsultationFeesModal({
  open,
  doctorId,
  doctorName,
  consultationModes,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [fees, setFees] =
    useState<FeesForm>({
      inPerson: "0",
      video: "0",
      phone: "0",
    });

  const [
    existingPricing,
    setExistingPricing,
  ] =
    useState<ConsultationPricing>(
      {}
    );

  /* ============================================================
     LOAD SAVED PRICES
  ============================================================ */

  useEffect(() => {
    if (!open) {
      return;
    }

    setSaved(false);

    const firestore = db;

    if (!firestore || !doctorId) {
      setError(
        "Unable to load consultation fees. Firebase or doctor information is missing."
      );

      setLoading(false);

      return;
    }

    const firestoreInstance =
      firestore;

    setLoading(true);
    setError(null);

    const professionalRef = doc(
      firestoreInstance,
      "professionals",
      doctorId
    );

    const unsubscribe =
      onSnapshot(
        professionalRef,
        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setError(
              "Doctor profile not found."
            );

            setLoading(false);

            return;
          }

          const data =
            snapshot.data() as {
              consultationPricing?: ConsultationPricing;
            };

          const pricing =
            data.consultationPricing ??
            {};

          setExistingPricing(
            pricing
          );

          setFees({
            inPerson:
              safeAmount(
                pricing.inPerson
                  ?.amount,
                0
              ),

            video:
              safeAmount(
                pricing.video
                  ?.amount,
                0
              ),

            phone:
              safeAmount(
                pricing.phone
                  ?.amount,
                0
              ),
          });

          setError(null);
          setLoading(false);
        },
        (
          snapshotError
        ) => {
          console.error(
            "[DoctorConsultationFeesModal] Realtime error:",
            snapshotError
          );

          setError(
            "Unable to load consultation fees."
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, [
    open,
    doctorId,
  ]);

  /* ============================================================
     ENABLED CONSULTATION OPTIONS
  ============================================================ */

  const enabledOptions =
    useMemo<
      ConsultationFeeOption[]
    >(() => {
      const options:
        ConsultationFeeOption[] =
        [];

      if (
        consultationModes.inPersonEnabled
      ) {
        options.push({
          key: "inPerson",

          label:
            "In-person consultation",

          description:
            "Fee charged for a physical consultation with the patient.",

          icon: UserRound,

          iconClass:
            "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
        });
      }

      if (
        consultationModes.teleconsultationEnabled
      ) {
        options.push({
          key: "video",

          label:
            "Video consultation",

          description:
            "Fee charged for a remote video consultation.",

          icon: Video,

          iconClass:
            "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
        });
      }

      if (
        consultationModes.phoneConsultationEnabled
      ) {
        options.push({
          key: "phone",

          label:
            "Phone consultation",

          description:
            "Fee charged for a consultation conducted by phone.",

          icon: Smartphone,

          iconClass:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
        });
      }

      return options;
    }, [
      consultationModes.inPersonEnabled,
      consultationModes.teleconsultationEnabled,
      consultationModes.phoneConsultationEnabled,
    ]);

  /* ============================================================
     UPDATE FIELD
  ============================================================ */

  function updateFee(
    key: keyof FeesForm,
    value: string
  ) {
    setFees(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setError(null);
    setSaved(false);
  }

  /* ============================================================
     SAVE
  ============================================================ */

  async function saveFees() {
    if (saving) {
      return;
    }

    const firestore = db;

    if (
      !firestore ||
      !doctorId
    ) {
      setError(
        "Unable to save consultation fees. Firebase or doctor information is missing."
      );

      return;
    }

    if (
      enabledOptions.length ===
      0
    ) {
      setError(
        "Enable at least one consultation option before setting consultation fees."
      );

      return;
    }

    const inPerson =
      Number(
        fees.inPerson
      );

    const video =
      Number(
        fees.video
      );

    const phone =
      Number(
        fees.phone
      );

    const values = [
      {
        enabled:
          consultationModes.inPersonEnabled,

        label:
          "In-person consultation",

        value: inPerson,
      },

      {
        enabled:
          consultationModes.teleconsultationEnabled,

        label:
          "Video consultation",

        value: video,
      },

      {
        enabled:
          consultationModes.phoneConsultationEnabled,

        label:
          "Phone consultation",

        value: phone,
      },
    ];

    for (
      const item of values
    ) {
      if (
        item.enabled &&
        (!Number.isFinite(
          item.value
        ) ||
          item.value < 0)
      ) {
        setError(
          `${item.label}: please enter a valid fee of 0 GHS or more.`
        );

        return;
      }
    }

    const firestoreInstance =
      firestore;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await setDoc(
        doc(
          firestoreInstance,
          "professionals",
          doctorId
        ),
        {
          consultationPricing:
            {
              currency:
                "GHS",

              inPerson: {
                enabled:
                  consultationModes.inPersonEnabled,

                amount:
                  consultationModes.inPersonEnabled
                    ? inPerson
                    : existingPricing
                        .inPerson
                        ?.amount ??
                      0,
              },

              video: {
                enabled:
                  consultationModes.teleconsultationEnabled,

                amount:
                  consultationModes.teleconsultationEnabled
                    ? video
                    : existingPricing
                        .video
                        ?.amount ??
                      0,
              },

              phone: {
                enabled:
                  consultationModes.phoneConsultationEnabled,

                amount:
                  consultationModes.phoneConsultationEnabled
                    ? phone
                    : existingPricing
                        .phone
                        ?.amount ??
                      0,
              },

              updatedAt:
                serverTimestamp(),
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

      setSaved(true);

      onSaved?.();

      window.setTimeout(
        () => {
          onClose();
        },
        450
      );
    } catch (
      saveError
    ) {
      console.error(
        "[DoctorConsultationFeesModal] Save error:",
        saveError
      );

      setError(
        "Unable to save your consultation fees. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     CLOSED
  ============================================================ */

  if (!open) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-consultation-fees-title"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="relative overflow-hidden border-b border-blue-900/20 bg-gradient-to-br from-[#071b3a] via-[#0b2d5f] to-[#164a8a] px-5 py-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Banknote className="h-4 w-4 text-emerald-300" />

                Professional pricing
              </div>

              <h2
                id="doctor-consultation-fees-title"
                className="mt-4 text-2xl font-black tracking-tight sm:text-3xl"
              >
                Consultation fees
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                {doctorName
                  ? `Set the consultation fees for ${doctorName}.`
                  : "Set your consultation fees."}{" "}
                Only consultation options currently enabled in your professional configuration are shown.
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close consultation fees"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                {error}
              </div>
            </div>
          )}

          {saved && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />

                Consultation fees saved successfully.
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                <p className="mt-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  Loading consultation fees...
                </p>
              </div>
            </div>
          ) : enabledOptions.length ===
            0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />

                <div>
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    No consultation option enabled
                  </div>

                  <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                    Enable In-person consultation, Teleconsultation or Phone consultation on the configuration page before setting prices.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {enabledOptions.map(
                (
                  option
                ) => {
                  const Icon =
                    option.icon;

                  return (
                    <div
                      key={
                        option.key
                      }
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${option.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-zinc-950 dark:text-white">
                            {
                              option.label
                            }
                          </div>

                          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {
                              option.description
                            }
                          </p>
                        </div>
                      </div>

                      <label className="mt-4 block">
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          Consultation fee
                        </span>

                        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900">
                          <Banknote className="h-5 w-5 shrink-0 text-emerald-600" />

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              fees[
                                option
                                  .key
                              ]
                            }
                            onChange={(
                              event
                            ) =>
                              updateFee(
                                option.key,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="h-14 w-full min-w-0 bg-transparent text-base font-bold text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white"
                            placeholder="0"
                          />

                          <span className="shrink-0 text-sm font-black text-zinc-500">
                            GHS
                          </span>
                        </div>
                      </label>
                    </div>
                  );
                }
              )}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-xs leading-5 text-blue-700 dark:text-blue-300">
              These prices are linked to your enabled consultation options and can later be displayed to patients before they book or pay for an appointment.
            </p>
          </div>
        </div>

        {/* =====================================================
            FOOTER ACTIONS
        ===================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void saveFees()
            }
            disabled={
              saving ||
              loading ||
              enabledOptions.length ===
                0
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Saving fees...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Save consultation fees
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}