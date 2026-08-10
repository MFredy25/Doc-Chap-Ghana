"use client";

import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Smartphone,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase/client";

type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

type DayDefinition = {
  key: DayKey;
  label: string;
};

type DayHours = {
  enabled: boolean;
  start: string;
  end: string;
};

type StoredDayHours = {
  open?: boolean;
  start?: string | null;
  end?: string | null;
};

type ConsultationModes = {
  inPersonEnabled: boolean;
  teleconsultationEnabled: boolean;
  phoneConsultationEnabled: boolean;
};

type Props = {
  open: boolean;
  doctorId: string | null | undefined;
  doctorName: string;
  consultationModes: ConsultationModes;
  onClose: () => void;
  onSaved?: () => void;
};

const DAYS: DayDefinition[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function normalizeTime(
  value: unknown,
  fallback: string
): string {
  const raw = safeString(value);

  if (!raw || !raw.includes(":")) {
    return fallback;
  }

  const [hoursRaw, minutesRaw] = raw.split(":");

  const hours = Math.min(
    23,
    Math.max(
      0,
      Number.parseInt(hoursRaw || "0", 10) || 0
    )
  );

  const minutes = Math.min(
    59,
    Math.max(
      0,
      Number.parseInt(minutesRaw || "0", 10) || 0
    )
  );

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

function defaultDayHours(day: DayKey): DayHours {
  const weekend = day === "sat" || day === "sun";

  return {
    enabled: !weekend,
    start: "09:00",
    end: "17:00",
  };
}

function defaultWeeklyHours(): Record<DayKey, DayHours> {
  return DAYS.reduce(
    (accumulator, day) => {
      accumulator[day.key] = defaultDayHours(day.key);
      return accumulator;
    },
    {} as Record<DayKey, DayHours>
  );
}

function weekFromFirestore(
  rawWeek: unknown
): Record<DayKey, DayHours> {
  const week =
    rawWeek &&
    typeof rawWeek === "object" &&
    !Array.isArray(rawWeek)
      ? (rawWeek as Partial<Record<DayKey, StoredDayHours>>)
      : {};

  return DAYS.reduce(
    (accumulator, day) => {
      const stored = week[day.key];
      const fallback = defaultDayHours(day.key);

      accumulator[day.key] = {
        enabled:
          typeof stored?.open === "boolean"
            ? stored.open
            : fallback.enabled,
        start: normalizeTime(
          stored?.start,
          fallback.start
        ),
        end: normalizeTime(stored?.end, fallback.end),
      };

      return accumulator;
    },
    {} as Record<DayKey, DayHours>
  );
}

function formatSummary(hours: DayHours): string {
  if (!hours.enabled) {
    return "Closed";
  }

  return `${hours.start} – ${hours.end}`;
}

export default function DoctorDisponibilitiesModal({
  open,
  doctorId,
  doctorName,
  consultationModes,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  const [week, setWeek] = useState<
    Record<DayKey, DayHours>
  >(() => defaultWeeklyHours());

  useEffect(() => {
    if (!open) {
      return;
    }

    const firestore = db;

    if (!firestore || !doctorId) {
      setError(
        "Unable to load consultation hours. Firebase or doctor information is missing."
      );
      setLoading(false);
      return;
    }

    const firestoreInstance = firestore;
    const professionalRef = doc(
      firestoreInstance,
      "professionals",
      doctorId
    );

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      professionalRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Doctor profile not found.");
          setLoading(false);
          return;
        }

        const data = snapshot.data() as {
          availability?: {
            week?: unknown;
          };
        };

        setWeek(
          weekFromFirestore(data.availability?.week)
        );
        setLoading(false);
      },
      (snapshotError) => {
        console.error(
          "[DoctorDisponibilitiesModal] Realtime error:",
          snapshotError
        );

        setError(
          "Unable to load your consultation hours."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [open, doctorId]);

  const activeModes = useMemo(() => {
    const modes: {
      label: string;
      icon: React.ElementType;
      className: string;
    }[] = [];

    if (consultationModes.inPersonEnabled) {
      modes.push({
        label: "In-person",
        icon: UserRound,
        className:
          "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
      });
    }

    if (consultationModes.teleconsultationEnabled) {
      modes.push({
        label: "Video consultation",
        icon: Video,
        className:
          "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
      });
    }

    if (consultationModes.phoneConsultationEnabled) {
      modes.push({
        label: "Phone consultation",
        icon: Smartphone,
        className:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
      });
    }

    return modes;
  }, [
    consultationModes.inPersonEnabled,
    consultationModes.teleconsultationEnabled,
    consultationModes.phoneConsultationEnabled,
  ]);

  function updateDay(
    dayKey: DayKey,
    patch: Partial<DayHours>
  ) {
    setWeek((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch,
      },
    }));

    setError(null);
  }

  async function saveHours() {
    if (saving) {
      return;
    }

    const firestore = db;

    if (!firestore || !doctorId) {
      setError(
        "Unable to save consultation hours. Firebase or doctor information is missing."
      );
      return;
    }

    for (const day of DAYS) {
      const hours = week[day.key];

      if (
        hours.enabled &&
        hours.start >= hours.end
      ) {
        setError(
          `${day.label}: the closing time must be later than the opening time.`
        );
        return;
      }
    }

    const openDays = DAYS.filter(
      ({ key }) =>
        week[key].enabled &&
        week[key].start &&
        week[key].end &&
        week[key].start < week[key].end
    );

    if (openDays.length === 0) {
      setError(
        "Please keep at least one consultation day open."
      );
      return;
    }

    const firestoreInstance = firestore;

    const storedWeek = DAYS.reduce(
      (accumulator, day) => {
        const hours = week[day.key];

        accumulator[day.key] = hours.enabled
          ? {
              open: true,
              start: hours.start,
              end: hours.end,
            }
          : {
              open: false,
              start: null,
              end: null,
            };

        return accumulator;
      },
      {} as Record<DayKey, StoredDayHours>
    );

    const consultationModesList = [
      consultationModes.inPersonEnabled
        ? "in_person"
        : null,
      consultationModes.teleconsultationEnabled
        ? "video"
        : null,
      consultationModes.phoneConsultationEnabled
        ? "phone"
        : null,
    ].filter(
      (value): value is string => Boolean(value)
    );

    setSaving(true);
    setError(null);

    try {
      await setDoc(
        doc(
          firestoreInstance,
          "professionals",
          doctorId
        ),
        {
          availability: {
            completed: true,
            week: storedWeek,
            consultationModes:
              consultationModesList,
            updatedAt: serverTimestamp(),
          },
          meta: {
            updatedAt: serverTimestamp(),
          },
        },
        {
          merge: true,
        }
      );

      onSaved?.();
      onClose();
    } catch (saveError) {
      console.error(
        "[DoctorDisponibilitiesModal] Save error:",
        saveError
      );

      setError(
        "Unable to save your consultation hours. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-disponibilities-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative overflow-hidden border-b border-blue-900/20 bg-gradient-to-br from-[#071b3a] via-[#0b2d5f] to-[#164a8a] px-5 py-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                Weekly availability
              </div>

              <h2
                id="doctor-disponibilities-title"
                className="mt-4 text-2xl font-black tracking-tight sm:text-3xl"
              >
                Consultation hours
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                {doctorName
                  ? `Set the weekly consultation hours for ${doctorName}.`
                  : "Set your weekly consultation hours."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {activeModes.length > 0 ? (
                  activeModes.map((mode) => {
                    const Icon = mode.icon;

                    return (
                      <span
                        key={mode.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {mode.label}
                      </span>
                    );
                  })
                ) : (
                  <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                    No consultation mode enabled
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-50"
              aria-label="Close consultation hours"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  Loading consultation hours...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {DAYS.map((day) => {
                const hours = week[day.key];

                return (
                  <div
                    key={day.key}
                    className={`rounded-2xl border p-4 transition ${
                      hours.enabled
                        ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/15"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            hours.enabled
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          <CalendarDays className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-bold text-zinc-950 dark:text-white">
                            {day.label}
                          </div>

                          <div
                            className={`mt-1 text-xs font-semibold ${
                              hours.enabled
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-zinc-500"
                            }`}
                          >
                            {formatSummary(hours)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={hours.enabled}
                          onClick={() =>
                            updateDay(day.key, {
                              enabled: !hours.enabled,
                            })
                          }
                          className={`inline-flex min-w-[108px] items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                            hours.enabled
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {hours.enabled ? "Open" : "Closed"}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                              From
                            </span>

                            <input
                              type="time"
                              value={hours.start}
                              disabled={!hours.enabled}
                              onChange={(event) =>
                                updateDay(day.key, {
                                  start: event.target.value,
                                })
                              }
                              className="mt-1 w-full bg-transparent text-xs font-semibold text-zinc-900 outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-white"
                            />
                          </label>

                          <label className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                              To
                            </span>

                            <input
                              type="time"
                              value={hours.end}
                              disabled={!hours.enabled}
                              onChange={(event) =>
                                updateDay(day.key, {
                                  end: event.target.value,
                                })
                              }
                              className="mt-1 w-full bg-transparent text-xs font-semibold text-zinc-900 outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-white"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" />

              <div>
                <div className="text-sm font-bold text-zinc-950 dark:text-white">
                  Booking availability
                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Patients can only request appointments during your open days and within the hours defined here.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void saveHours()}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving hours...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save consultation hours
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}