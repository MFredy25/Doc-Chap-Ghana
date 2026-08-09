"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
  Video,
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
  onCreated?: (appointmentId: string) => void;
};

type PatientDoc = {
  id: string;
  uid?: string;
  patientId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  status?: string;
  active?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
};

type TeamDoc = {
  id: string;
  uid?: string;
  professionalId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  role?: string;
  professionalType?: string;
  specialty?: string;
  status?: string;
  active?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    specialty?: string;
  };
  professional?: {
    type?: string;
    specialty?: string;
  };
};

type PatientOption = {
  id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
};

type DoctorOption = {
  id: string;
  doctorId: string;
  name: string;
  specialty: string;
};

type FormState = {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationMode: "in_person" | "video" | "phone";
  location: string;
  reason: string;
  notes: string;
};

function s(value: unknown): string {
  return (value ?? "").toString().trim();
}

function obj(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function mapPatient(item: PatientDoc): PatientOption | null {
  if (
    item.active === false ||
    s(item.status).toLowerCase() === "disabled"
  ) {
    return null;
  }

  const profile = obj(item.profile);

  const firstName =
    s(item.firstName || profile.firstName);

  const lastName =
    s(item.lastName || profile.lastName);

  const name =
    s(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient";

  return {
    id: item.id,
    patientId: s(item.patientId || item.uid) || item.id,
    name,
    email: s(item.email || profile.email),
    phone: s(item.phone || profile.phone),
  };
}

function mapDoctor(item: TeamDoc): DoctorOption | null {
  const profile = obj(item.profile);
  const professional = obj(item.professional);

  const type = s(
    item.professionalType ||
      professional.type ||
      item.role
  ).toLowerCase();

  const isDoctor = [
    "doctor",
    "physician",
    "medical_doctor",
    "medical doctor",
  ].includes(type);

  if (
    !isDoctor ||
    item.active === false ||
    s(item.status).toLowerCase() === "disabled"
  ) {
    return null;
  }

  const firstName =
    s(item.firstName || profile.firstName);

  const lastName =
    s(item.lastName || profile.lastName);

  const rawName =
    s(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    /^dr\.?\s/i.test(rawName)
      ? rawName
      : `Dr. ${rawName}`;

  return {
    id: item.id,
    doctorId:
      s(item.professionalId || item.uid) || item.id,
    name,
    specialty:
      s(
        item.specialty ||
          profile.specialty ||
          professional.specialty
      ) || "Medical doctor",
  };
}

function makeDate(
  date: string,
  time: string
): Date | null {
  if (!date || !time) {
    return null;
  }

  const value = new Date(`${date}T${time}:00`);

  return Number.isNaN(value.getTime())
    ? null
    : value;
}

export default function ClinicCreateAppointmentModal({
  open,
  clinicId,
  clinicName,
  onClose,
  onCreated,
}: Props) {
  const [patientsRaw, setPatientsRaw] =
    useState<PatientDoc[]>([]);

  const [teamRaw, setTeamRaw] =
    useState<TeamDoc[]>([]);

  const [loadingData, setLoadingData] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const [form, setForm] =
    useState<FormState>({
      patientId: "",
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
      consultationMode: "in_person",
      location: "",
      reason: "",
      notes: "",
    });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !clinicId) {
      return;
    }

    const firestore = db;

    if (!firestore) {
      setError("Firebase is not initialized.");
      return;
    }

    const firestoreInstance = firestore;
    const clinicUid = clinicId;

    setLoadingData(true);

    let patientsReady = false;
    let teamReady = false;

    const finish = () => {
      if (patientsReady && teamReady) {
        setLoadingData(false);
      }
    };

    const unsubscribePatients = onSnapshot(
      collection(
        firestoreInstance,
        "clinics",
        clinicUid,
        "patients"
      ),
      (snapshot) => {
        setPatientsRaw(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<PatientDoc, "id">),
          }))
        );

        patientsReady = true;
        finish();
      },
      (snapshotError) => {
        console.error(
          "[ClinicCreateAppointmentModal] Patients error:",
          snapshotError
        );

        patientsReady = true;
        finish();
      }
    );

    const unsubscribeTeam = onSnapshot(
      collection(
        firestoreInstance,
        "clinics",
        clinicUid,
        "team"
      ),
      (snapshot) => {
        setTeamRaw(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<TeamDoc, "id">),
          }))
        );

        teamReady = true;
        finish();
      },
      (snapshotError) => {
        console.error(
          "[ClinicCreateAppointmentModal] Team error:",
          snapshotError
        );

        teamReady = true;
        finish();
      }
    );

    return () => {
      unsubscribePatients();
      unsubscribeTeam();
    };
  }, [open, clinicId]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      return;
    }

    setForm({
      patientId: "",
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
      consultationMode: "in_person",
      location: "",
      reason: "",
      notes: "",
    });

    setError(null);
    setSuccess(false);
    setSaving(false);
  }, [open]);

  const patients = useMemo(
    () =>
      patientsRaw
        .map(mapPatient)
        .filter(
          (item): item is PatientOption =>
            item !== null
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [patientsRaw]
  );

  const doctors = useMemo(
    () =>
      teamRaw
        .map(mapDoctor)
        .filter(
          (item): item is DoctorOption =>
            item !== null
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teamRaw]
  );

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (item) =>
          item.patientId === form.patientId ||
          item.id === form.patientId
      ) || null,
    [patients, form.patientId]
  );

  const selectedDoctor = useMemo(
    () =>
      doctors.find(
        (item) =>
          item.doctorId === form.doctorId ||
          item.id === form.doctorId
      ) || null,
    [doctors, form.doctorId]
  );

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(null);
    setSuccess(false);
  }

  async function createAppointment() {
    const firestore = db;

    if (
      !firestore ||
      !clinicId ||
      saving
    ) {
      return;
    }

    const firestoreInstance = firestore;

    if (!selectedPatient) {
      setError("Select a patient.");
      return;
    }

    if (!selectedDoctor) {
      setError("Select a doctor.");
      return;
    }

    if (!form.date) {
      setError("Select an appointment date.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("Enter the start time and end time.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError(
        "The end time must be later than the start time."
      );
      return;
    }

    if (!form.reason.trim()) {
      setError("Enter the reason for the appointment.");
      return;
    }

    const startAt = makeDate(
      form.date,
      form.startTime
    );

    const endAt = makeDate(
      form.date,
      form.endTime
    );

    if (!startAt || !endAt) {
      setError("The appointment date or time is invalid.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const reference = await addDoc(
        collection(
          firestoreInstance,
          "clinics",
          clinicId,
          "appointments"
        ),
        {
          clinicId,
          clinicName,

          patientId: selectedPatient.patientId,
          patientDocumentId: selectedPatient.id,
          patientName: selectedPatient.name,
          patientPhone: selectedPatient.phone || null,
          patientEmail: selectedPatient.email || null,

          doctorId: selectedDoctor.doctorId,
          teamMemberId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          professionalName: selectedDoctor.name,
          specialty: selectedDoctor.specialty,

          status: "confirmed",

          appointmentType: form.consultationMode,
          consultationMode: form.consultationMode,

          date: form.date,
          time: form.startTime,
          startTime: form.startTime,
          endTime: form.endTime,

          startAt: Timestamp.fromDate(startAt),
          endAt: Timestamp.fromDate(endAt),

          location:
            form.consultationMode === "in_person"
              ? form.location.trim() || clinicName
              : null,

          reason: form.reason.trim(),
          notes: form.notes.trim() || null,

          timezone: "Africa/Accra",
          country: "GH",
          application: "doc_chap_ghana",
          source: "clinic_dashboard",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setSuccess(true);

      onCreated?.(reference.id);

      window.setTimeout(() => {
        onClose();
      }, 800);
    } catch (createError) {
      console.error(
        "[ClinicCreateAppointmentModal] Create error:",
        createError
      );

      setError("Unable to create the appointment.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinic-create-appointment-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
        aria-label="Close appointment modal"
      />

      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] px-5 py-6 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <CalendarCheck2 className="h-6 w-6 text-cyan-200" />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  {clinicName}
                </div>

                <h2
                  id="clinic-create-appointment-title"
                  className="mt-1 text-2xl font-black tracking-tight"
                >
                  Create appointment
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Select a clinic patient and doctor, then define the consultation details.
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
              Appointment created successfully.
            </div>
          )}

          {loadingData ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  Loading patients and doctors...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Patient *
                    </span>

                    <select
                      value={form.patientId}
                      onChange={(event) =>
                        update("patientId", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="">Select a patient</option>

                      {patients.map((patient) => (
                        <option
                          key={patient.id}
                          value={patient.patientId}
                        >
                          {patient.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Doctor *
                    </span>

                    <select
                      value={form.doctorId}
                      onChange={(event) =>
                        update("doctorId", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="">Select a doctor</option>

                      {doctors.map((doctor) => (
                        <option
                          key={doctor.id}
                          value={doctor.doctorId}
                        >
                          {doctor.name} — {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Date *
                    </span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        update("date", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Start *
                    </span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        update("startTime", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      End *
                    </span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        update("endTime", event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Consultation type *
                  </span>

                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {([
                      ["in_person", "In person", Stethoscope],
                      ["video", "Video", Video],
                      ["phone", "Phone", Phone],
                    ] as const).map(([value, label, Icon]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          update("consultationMode", value)
                        }
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                          form.consultationMode === value
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10 dark:bg-blue-950/30 dark:text-blue-300"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-bold">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {form.consultationMode === "in_person" && (
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Location
                    </span>

                    <div className="relative mt-2">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={form.location}
                        onChange={(event) =>
                          update("location", event.target.value)
                        }
                        placeholder={clinicName}
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Reason for appointment *
                  </span>
                  <input
                    value={form.reason}
                    onChange={(event) =>
                      update("reason", event.target.value)
                    }
                    maxLength={240}
                    placeholder="e.g. General consultation or follow-up"
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Internal note
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      update("notes", event.target.value)
                    }
                    rows={4}
                    maxLength={1000}
                    placeholder="Optional note for the clinic team..."
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[24px] border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <CalendarCheck2 className="h-6 w-6 text-blue-600" />
                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Appointment summary
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/70">
                      <div className="text-[10px] font-bold uppercase text-zinc-400">
                        Patient
                      </div>
                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {selectedPatient?.name || "Not selected"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/70">
                      <div className="text-[10px] font-bold uppercase text-zinc-400">
                        Doctor
                      </div>
                      <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
                        {selectedDoctor?.name || "Not selected"}
                      </div>
                      {selectedDoctor && (
                        <div className="mt-1 text-xs text-zinc-500">
                          {selectedDoctor.specialty}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/70">
                        <CalendarCheck2 className="h-4 w-4 text-blue-600" />
                        <div className="mt-2 text-xs font-bold text-zinc-950 dark:text-white">
                          {form.date || "Date"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/80 p-3 dark:bg-zinc-950/70">
                        <Clock3 className="h-4 w-4 text-violet-600" />
                        <div className="mt-2 text-xs font-bold text-zinc-950 dark:text-white">
                          {form.startTime || "Time"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <UserRound className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                    Clinic records
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Only patients and doctors linked to this clinic can be selected.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/70 p-3 text-center dark:bg-zinc-950/60">
                      <div className="text-xl font-black text-zinc-950 dark:text-white">
                        {patients.length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-zinc-400">
                        Patients
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/70 p-3 text-center dark:bg-zinc-950/60">
                      <div className="text-xl font-black text-zinc-950 dark:text-white">
                        {doctors.length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-zinc-400">
                        Doctors
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void createAppointment()
            }
            disabled={saving || loadingData}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CalendarCheck2 className="h-4 w-4" />
                Create appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}