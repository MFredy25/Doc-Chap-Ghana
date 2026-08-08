"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseMedical,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Smartphone,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";
import { auth, db, storage } from "@/lib/firebase/client";

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
    specialty?: string;
    city?: string;
    region?: string;
  };
  professional?: {
    type?: string;
    specialty?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
  configuration?: {
    profileVisible?: boolean;
    acceptsNewPatients?: boolean;
    inPersonEnabled?: boolean;
    teleconsultationEnabled?: boolean;
    phoneConsultationEnabled?: boolean;
    messagingEnabled?: boolean;
    showWhatsApp?: boolean;
    showPracticeAddress?: boolean;
    defaultConsultationDuration?: number;
    defaultConsultationFee?: number;
    currency?: string;
  };
  kyc?: {
    status?: string;
    submittedAt?: unknown;
    updatedAt?: unknown;
    documents?: {
      identityDocument?: KycStoredDocument | null;
      proofOfAddress?: KycStoredDocument | null;
      medicalCard?: KycStoredDocument | null;
      supportingDocuments?: KycStoredDocument[];
    };
  };
  availability?: {
    completed?: boolean;
    updatedAt?: unknown;
    consultationModes?: string[];
    week?: Partial<Record<DayKey, StoredDayHours>>;
  };
};

type DoctorConfiguration = {
  profileVisible: boolean;
  acceptsNewPatients: boolean;
  inPersonEnabled: boolean;
  teleconsultationEnabled: boolean;
  phoneConsultationEnabled: boolean;
  messagingEnabled: boolean;
  showWhatsApp: boolean;
  showPracticeAddress: boolean;
  defaultConsultationDuration: string;
  defaultConsultationFee: string;
};

type KycDocumentKey =
  | "identityDocument"
  | "proofOfAddress"
  | "medicalCard";

type KycStoredDocument = {
  name: string;
  url: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedAtIso: string;
};

type KycFilesState = {
  identityDocument: File | null;
  proofOfAddress: File | null;
  medicalCard: File | null;
  supportingDocuments: File[];
};

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
  shortLabel: string;
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

const DAYS: DayDefinition[] = [
  { key: "mon", label: "Monday", shortLabel: "Mon" },
  { key: "tue", label: "Tuesday", shortLabel: "Tue" },
  { key: "wed", label: "Wednesday", shortLabel: "Wed" },
  { key: "thu", label: "Thursday", shortLabel: "Thu" },
  { key: "fri", label: "Friday", shortLabel: "Fri" },
  { key: "sat", label: "Saturday", shortLabel: "Sat" },
  { key: "sun", label: "Sunday", shortLabel: "Sun" },
];



type PopupState =
  | { type: "success" | "error"; title: string; message: string }
  | null;

function safeString(value: unknown): string {
  return (value ?? "").toString().trim();
}

function safeObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function safeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDoctorName(data: DoctorData | null, user: User | null): string {
  const profile = safeObject(data?.profile);
  const firstName = safeString(profile.firstName);
  const lastName = safeString(profile.lastName);

  return (
    safeString(profile.displayName) ||
    safeString(profile.fullName) ||
    `${firstName} ${lastName}`.trim() ||
    safeString(user?.displayName) ||
    "Doctor"
  );
}

function getDoctorSpecialty(data: DoctorData | null): string {
  const profile = safeObject(data?.profile);
  const professional = safeObject(data?.professional);

  return (
    safeString(professional.specialty) ||
    safeString(profile.specialty) ||
    "Medical professional"
  );
}

function getVerificationStatus(data: DoctorData | null): string {
  const professional = safeObject(data?.professional);
  return safeString(professional.verificationStatus).toLowerCase() || "pending";
}

function isVerifiedDoctor(data: DoctorData | null): boolean {
  const professional = safeObject(data?.professional);
  const status = getVerificationStatus(data);
  return professional.verified === true || status === "verified" || status === "approved";
}

function configurationFromData(data: DoctorData | null): DoctorConfiguration {
  const config = safeObject(data?.configuration);

  return {
    profileVisible: safeBoolean(config.profileVisible, true),
    acceptsNewPatients: safeBoolean(config.acceptsNewPatients, true),
    inPersonEnabled: safeBoolean(config.inPersonEnabled, true),
    teleconsultationEnabled: safeBoolean(config.teleconsultationEnabled, true),
    phoneConsultationEnabled: safeBoolean(config.phoneConsultationEnabled, true),
    messagingEnabled: safeBoolean(config.messagingEnabled, true),
    showWhatsApp: safeBoolean(config.showWhatsApp, true),
    showPracticeAddress: safeBoolean(config.showPracticeAddress, true),
    defaultConsultationDuration: String(safeNumber(config.defaultConsultationDuration, 30)),
    defaultConsultationFee: String(safeNumber(config.defaultConsultationFee, 0)),
  };
}



function normalizeTime(
  value: unknown,
  fallback: string
): string {
  const raw = safeString(value);

  if (!raw || !raw.includes(":")) {
    return fallback;
  }

  const [hoursRaw, minutesRaw] =
    raw.split(":");

  const hours = Math.min(
    23,
    Math.max(
      0,
      Number.parseInt(
        hoursRaw || "0",
        10
      ) || 0
    )
  );

  const minutes = Math.min(
    59,
    Math.max(
      0,
      Number.parseInt(
        minutesRaw || "0",
        10
      ) || 0
    )
  );

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function defaultDayHours(
  day: DayKey
): DayHours {
  const isWeekend =
    day === "sat" ||
    day === "sun";

  return {
    enabled: !isWeekend,
    start: "09:00",
    end: "17:00",
  };
}

function defaultWeeklyHours(): Record<
  DayKey,
  DayHours
> {
  return DAYS.reduce(
    (accumulator, day) => {
      accumulator[day.key] =
        defaultDayHours(
          day.key
        );

      return accumulator;
    },
    {} as Record<
      DayKey,
      DayHours
    >
  );
}

function weeklyHoursFromData(
  data: DoctorData | null
): Record<DayKey, DayHours> {
  const week =
    data?.availability?.week ??
    {};

  return DAYS.reduce(
    (accumulator, day) => {
      const stored =
        week[day.key];

      const fallback =
        defaultDayHours(
          day.key
        );

      accumulator[day.key] = {
        enabled:
          typeof stored?.open ===
          "boolean"
            ? stored.open
            : fallback.enabled,

        start: normalizeTime(
          stored?.start,
          fallback.start
        ),

        end: normalizeTime(
          stored?.end,
          fallback.end
        ),
      };

      return accumulator;
    },
    {} as Record<
      DayKey,
      DayHours
    >
  );
}

function hasValidAvailability(
  week: Record<
    DayKey,
    DayHours
  >
): boolean {
  return DAYS.some(
    ({ key }) => {
      const day = week[key];

      return Boolean(
        day.enabled &&
          day.start &&
          day.end &&
          day.start < day.end
      );
    }
  );
}

function formatDaySummary(
  hours: DayHours
): string {
  if (!hours.enabled) {
    return "Closed";
  }

  return `${hours.start} – ${hours.end}`;
}

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateKycFile(file: File): string | null {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Only PDF, JPG, PNG and WEBP files are accepted.";
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    return "Each verification document must be 10 MB or less.";
  }

  return null;
}

function KycUploadCard({
  title,
  description,
  icon: Icon,
  iconClass,
  file,
  existingDocument,
  acceptMultiple = false,
  multipleFiles = [],
  onFileChange,
  onMultipleChange,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  file?: File | null;
  existingDocument?: KycStoredDocument | null;
  acceptMultiple?: boolean;
  multipleFiles?: File[];
  onFileChange?: (file: File | null) => void;
  onMultipleChange?: (files: File[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-zinc-950 dark:text-white">
            {title}
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      {existingDocument && !file && !acceptMultiple && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          <FileCheck2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{existingDocument.name}</span>
          <span className="ml-auto shrink-0">Uploaded</span>
        </div>
      )}

      {!acceptMultiple && file && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onFileChange?.(null)}
            className="ml-auto shrink-0 text-blue-600 hover:text-blue-800"
          >
            Remove
          </button>
        </div>
      )}

      {acceptMultiple && multipleFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {multipleFiles.map((selectedFile, index) => (
            <div
              key={`${selectedFile.name}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() =>
                  onMultipleChange?.(
                    multipleFiles.filter((_, fileIndex) => fileIndex !== index)
                  )
                }
                className="ml-auto shrink-0 text-violet-600 hover:text-violet-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/20">
        <UploadCloud className="h-4 w-4" />
        {acceptMultiple ? "Add supporting documents" : file ? "Choose another file" : "Choose document"}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          multiple={acceptMultiple}
          className="hidden"
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []);

            if (acceptMultiple) {
              if (selectedFiles.length) {
                onMultipleChange?.([...multipleFiles, ...selectedFiles]);
              }
            } else {
              onFileChange?.(selectedFiles[0] ?? null);
            }

            event.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
  iconClass,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-zinc-950 dark:text-white">{title}</div>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
      <div className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none dark:text-white"
        />
        <span className="shrink-0 text-xs font-semibold text-zinc-400">{suffix}</span>
      </div>
    </label>
  );
}

export default function ConfigurationClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const [configuration, setConfiguration] = useState<DoctorConfiguration>({
    profileVisible: true,
    acceptsNewPatients: true,
    inPersonEnabled: true,
    teleconsultationEnabled: true,
    phoneConsultationEnabled: true,
    messagingEnabled: true,
    showWhatsApp: true,
    showPracticeAddress: true,
    defaultConsultationDuration: "30",
    defaultConsultationFee: "0",
  });

  const [uploadingKyc, setUploadingKyc] = useState(false);

  const [kycFiles, setKycFiles] = useState<KycFilesState>({
    identityDocument: null,
    proofOfAddress: null,
    medicalCard: null,
    supportingDocuments: [],
  });

  const [
    scheduleModalOpen,
    setScheduleModalOpen,
  ] = useState(false);

  const [
    savingSchedule,
    setSavingSchedule,
  ] = useState(false);

  const [
    scheduleError,
    setScheduleError,
  ] = useState<string | null>(
    null
  );

  const [
    scheduleDraft,
    setScheduleDraft,
  ] = useState<
    Record<DayKey, DayHours>
  >(() => defaultWeeklyHours());

  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;

    if (!firebaseAuth || !firestore) {
      setError("Firebase is not initialized. Check your Firebase environment variables.");
      setLoading(false);
      return;
    }

    const firebaseAuthInstance = firebaseAuth;
    const firestoreInstance = firestore;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuthInstance, async (user) => {
      if (!user?.uid) {
        setFirebaseUser(null);
        router.replace("/doctors/login");
        return;
      }

      setFirebaseUser(user);

      const professionalRef = doc(firestoreInstance, "professionals", user.uid);
      unsubscribeProfile?.();

      unsubscribeProfile = onSnapshot(
        professionalRef,
        async (snapshot) => {
          if (!snapshot.exists()) {
            try {
              await signOut(firebaseAuthInstance);
            } catch {}
            router.replace("/doctors/login");
            return;
          }

          const data = snapshot.data() as DoctorData;
          const professional = safeObject(data.professional);
          const professionalType = safeString(
            data.professionalType || professional.type || data.role
          ).toLowerCase();

          if (professionalType && professionalType !== "doctor") {
            try {
              await signOut(firebaseAuthInstance);
            } catch {}
            router.replace("/doctors/login");
            return;
          }

          if (data.active === false || safeString(data.status).toLowerCase() === "disabled") {
            try {
              await signOut(firebaseAuthInstance);
            } catch {}
            router.replace("/doctors/login");
            return;
          }

          setDoctorData(data);
          setConfiguration(configurationFromData(data));
          setError(null);
          setLoading(false);
        },
        (snapshotError) => {
          console.error("[DoctorConfiguration] Profile realtime error:", snapshotError);
          setError("Unable to load your professional configuration.");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, [router]);

  function setBooleanField(
    key:
      | "profileVisible"
      | "acceptsNewPatients"
      | "inPersonEnabled"
      | "teleconsultationEnabled"
      | "phoneConsultationEnabled"
      | "messagingEnabled"
      | "showWhatsApp"
      | "showPracticeAddress",
    value: boolean
  ) {
    setConfiguration((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function setTextField(
    key: "defaultConsultationDuration" | "defaultConsultationFee",
    value: string
  ) {
    setConfiguration((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function saveConfiguration() {
    if (saving) return;

    setError(null);

    const firebaseAuth = auth;
    const firestore = db;
    const user = firebaseAuth?.currentUser || firebaseUser;

    if (!firebaseAuth || !firestore || !user?.uid) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    const firestoreInstance = firestore;
    const currentUser = user;
    const duration = Number(configuration.defaultConsultationDuration);
    const fee = Number(configuration.defaultConsultationFee);

    if (!Number.isFinite(duration) || duration < 5 || duration > 240) {
      setError("Default consultation duration must be between 5 and 240 minutes.");
      return;
    }

    if (!Number.isFinite(fee) || fee < 0) {
      setError("Default consultation fee must be a valid positive amount or 0.");
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(firestoreInstance, "professionals", currentUser.uid),
        {
          configuration: {
            profileVisible: configuration.profileVisible,
            acceptsNewPatients: configuration.acceptsNewPatients,
            inPersonEnabled: configuration.inPersonEnabled,
            teleconsultationEnabled: configuration.teleconsultationEnabled,
            phoneConsultationEnabled: configuration.phoneConsultationEnabled,
            messagingEnabled: configuration.messagingEnabled,
            showWhatsApp: configuration.showWhatsApp,
            showPracticeAddress: configuration.showPracticeAddress,
            defaultConsultationDuration: duration,
            defaultConsultationFee: fee,
            currency: "GHS",
          },
          meta: {
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setPopup({
        type: "success",
        title: "Configuration saved",
        message: "Your professional profile configuration has been updated successfully.",
      });
    } catch (saveError) {
      console.error("[DoctorConfiguration] Save error:", saveError);
      setError("Unable to save your professional configuration. Please try again.");
      setPopup({
        type: "error",
        title: "Configuration not saved",
        message: "We could not save your changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }


  async function uploadKycDocument(
    uid: string,
    category: string,
    file: File
  ): Promise<KycStoredDocument> {
    const firebaseStorage = storage;

    if (!firebaseStorage) {
      throw new Error("Firebase Storage is not initialized.");
    }

    const storageInstance = firebaseStorage;
    const safeName = sanitizeFileName(file.name) || "document";
    const storagePath =
      `professionals/${uid}/kyc/${category}/${Date.now()}-${safeName}`;

    const storageRef = ref(storageInstance, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      customMetadata: {
        ownerUid: uid,
        category,
      },
    });

    const url = await getDownloadURL(storageRef);

    return {
      name: file.name,
      url,
      storagePath,
      contentType: file.type,
      size: file.size,
      uploadedAtIso: new Date().toISOString(),
    };
  }

  async function submitKycDocuments() {
    if (uploadingKyc) {
      return;
    }

    setError(null);

    const firebaseAuth = auth;
    const firestore = db;
    const firebaseStorage = storage;

    const user =
      firebaseAuth?.currentUser ||
      firebaseUser;

    if (
      !firebaseAuth ||
      !firestore ||
      !firebaseStorage ||
      !user?.uid
    ) {
      setError(
        "Firebase Authentication, Firestore or Storage is not available. Please check your Firebase configuration."
      );
      return;
    }

    const currentUser = user;
    const firestoreInstance = firestore;

    const identityDocument = kycFiles.identityDocument;
    const proofOfAddress = kycFiles.proofOfAddress;
    const medicalCard = kycFiles.medicalCard;
    const supportingDocuments = kycFiles.supportingDocuments;

    if (!identityDocument && !doctorData?.kyc?.documents?.identityDocument) {
      setError("Please add your national ID card or passport.");
      return;
    }

    if (!proofOfAddress && !doctorData?.kyc?.documents?.proofOfAddress) {
      setError("Please add a proof of address.");
      return;
    }

    if (!medicalCard && !doctorData?.kyc?.documents?.medicalCard) {
      setError("Please add your doctor / medical professional card.");
      return;
    }

    const filesToValidate = [
      identityDocument,
      proofOfAddress,
      medicalCard,
      ...supportingDocuments,
    ].filter((file): file is File => Boolean(file));

    for (const file of filesToValidate) {
      const validationError = validateKycFile(file);

      if (validationError) {
        setError(`${file.name}: ${validationError}`);
        return;
      }
    }

    setUploadingKyc(true);

    try {
      const existingDocuments = doctorData?.kyc?.documents ?? {};

      const uploadedIdentity = identityDocument
        ? await uploadKycDocument(
            currentUser.uid,
            "identity-document",
            identityDocument
          )
        : existingDocuments.identityDocument ?? null;

      const uploadedProofOfAddress = proofOfAddress
        ? await uploadKycDocument(
            currentUser.uid,
            "proof-of-address",
            proofOfAddress
          )
        : existingDocuments.proofOfAddress ?? null;

      const uploadedMedicalCard = medicalCard
        ? await uploadKycDocument(
            currentUser.uid,
            "medical-card",
            medicalCard
          )
        : existingDocuments.medicalCard ?? null;

      const uploadedSupportingDocuments: KycStoredDocument[] = [
        ...(existingDocuments.supportingDocuments ?? []),
      ];

      for (const file of supportingDocuments) {
        uploadedSupportingDocuments.push(
          await uploadKycDocument(
            currentUser.uid,
            "supporting-documents",
            file
          )
        );
      }

      await setDoc(
        doc(
          firestoreInstance,
          "professionals",
          currentUser.uid
        ),
        {
          kyc: {
            status: "submitted",
            documents: {
              identityDocument: uploadedIdentity,
              proofOfAddress: uploadedProofOfAddress,
              medicalCard: uploadedMedicalCard,
              supportingDocuments:
                uploadedSupportingDocuments,
            },
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          professional: {
            verificationStatus: "pending",
          },
          meta: {
            updatedAt: serverTimestamp(),
          },
        },
        {
          merge: true,
        }
      );

      setKycFiles({
        identityDocument: null,
        proofOfAddress: null,
        medicalCard: null,
        supportingDocuments: [],
      });

      setPopup({
        type: "success",
        title: "Verification documents submitted",
        message:
          "Your identity and professional documents have been securely submitted. The Doc Chap team can now review your doctor verification request.",
      });
    } catch (uploadError) {
      console.error(
        "[DoctorConfiguration] KYC upload error:",
        uploadError
      );

      setError(
        "Unable to upload your verification documents. Please check Firebase Storage permissions and try again."
      );

      setPopup({
        type: "error",
        title: "Documents not submitted",
        message:
          "We could not upload your verification documents. Please try again.",
      });
    } finally {
      setUploadingKyc(false);
    }
  }


  function openScheduleModal() {
    setScheduleDraft(
      weeklyHoursFromData(
        doctorData
      )
    );

    setScheduleError(null);
    setScheduleModalOpen(true);
  }

  function updateScheduleDay(
    dayKey: DayKey,
    patch: Partial<DayHours>
  ) {
    setScheduleDraft(
      (current) => ({
        ...current,
        [dayKey]: {
          ...current[dayKey],
          ...patch,
        },
      })
    );

    setScheduleError(null);
  }

  function closeScheduleModal() {
    if (savingSchedule) {
      return;
    }

    setScheduleError(null);
    setScheduleModalOpen(false);
  }

  async function saveConsultationHours() {
    if (savingSchedule) {
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;

    const user =
      firebaseAuth?.currentUser ||
      firebaseUser;

    if (
      !firebaseAuth ||
      !firestore ||
      !user?.uid
    ) {
      setScheduleError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    for (const day of DAYS) {
      const hours =
        scheduleDraft[day.key];

      if (
        hours.enabled &&
        hours.start >= hours.end
      ) {
        setScheduleError(
          `${day.label}: the closing time must be later than the opening time.`
        );
        return;
      }
    }

    if (
      !hasValidAvailability(
        scheduleDraft
      )
    ) {
      setScheduleError(
        "Please keep at least one consultation day open with valid opening and closing times."
      );
      return;
    }

    const firestoreInstance =
      firestore;

    const currentUser = user;

    const enabledModes = [
      configuration.inPersonEnabled
        ? "in_person"
        : null,
      configuration.teleconsultationEnabled
        ? "video"
        : null,
      configuration.phoneConsultationEnabled
        ? "phone"
        : null,
    ].filter(
      (value): value is string =>
        Boolean(value)
    );

    const week = DAYS.reduce(
      (accumulator, day) => {
        const hours =
          scheduleDraft[
            day.key
          ];

        accumulator[day.key] =
          hours.enabled
            ? {
                open: true,
                start:
                  hours.start,
                end: hours.end,
              }
            : {
                open: false,
                start: null,
                end: null,
              };

        return accumulator;
      },
      {} as Record<
        DayKey,
        StoredDayHours
      >
    );

    setSavingSchedule(true);
    setScheduleError(null);

    try {
      await setDoc(
        doc(
          firestoreInstance,
          "professionals",
          currentUser.uid
        ),
        {
          availability: {
            completed: true,
            week,
            consultationModes:
              enabledModes,
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

      setScheduleModalOpen(
        false
      );

      setPopup({
        type: "success",
        title:
          "Consultation hours saved",
        message:
          "Your weekly consultation schedule has been updated successfully.",
      });
    } catch (saveError) {
      console.error(
        "[DoctorConfiguration] Consultation schedule save error:",
        saveError
      );

      setScheduleError(
        "Unable to save your consultation hours. Please try again."
      );
    } finally {
      setSavingSchedule(
        false
      );
    }
  }

  const fullName = useMemo(() => getDoctorName(doctorData, firebaseUser), [doctorData, firebaseUser]);
  const titledName = useMemo(
    () => `Dr. ${fullName.replace(/^dr\.?\s+/i, "")}`,
    [fullName]
  );
  const specialty = useMemo(() => getDoctorSpecialty(doctorData), [doctorData]);
  const verified = useMemo(() => isVerifiedDoctor(doctorData), [doctorData]);
  const verificationStatus = useMemo(() => getVerificationStatus(doctorData), [doctorData]);
  const profile = safeObject(doctorData?.profile);
  const location = [safeString(profile.city), safeString(profile.region)].filter(Boolean).join(", ") || "Ghana";

  const savedWeeklyHours =
    useMemo(
      () =>
        weeklyHoursFromData(
          doctorData
        ),
      [doctorData]
    );

  const openConsultationDays =
    useMemo(
      () =>
        DAYS.filter(
          ({ key }) =>
            savedWeeklyHours[
              key
            ].enabled
        ).length,
      [savedWeeklyHours]
    );

  const activeConsultationModes =
    useMemo(
      () => {
        const modes: {
          label: string;
          icon: React.ElementType;
          className: string;
        }[] = [];

        if (
          configuration.inPersonEnabled
        ) {
          modes.push({
            label: "In-person",
            icon: UserRound,
            className:
              "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
          });
        }

        if (
          configuration.teleconsultationEnabled
        ) {
          modes.push({
            label: "Video",
            icon: Video,
            className:
              "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
          });
        }

        if (
          configuration.phoneConsultationEnabled
        ) {
          modes.push({
            label: "Phone",
            icon: Smartphone,
            className:
              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
          });
        }

        return modes;
      },
      [
        configuration.inPersonEnabled,
        configuration.teleconsultationEnabled,
        configuration.phoneConsultationEnabled,
      ]
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="flex min-h-[75vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200/80 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
              <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">Loading professional configuration...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <DoctorSidebar />
      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-900/20 bg-gradient-to-br from-[#071b3a] via-[#0b2d5f] to-[#164a8a] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                      <BriefcaseMedical className="h-4 w-4 text-cyan-300" />
                      Professional configuration
                    </span>
                    {verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" /> Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" /> Verification {verificationStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{titledName}</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
                      <GraduationCap className="h-4 w-4 text-violet-300" /> {specialty}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
                      <MapPin className="h-4 w-4 text-emerald-300" /> {location}
                    </span>
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                    Configure how your professional profile is displayed and how patients can interact with you on Doc Chap Ghana.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                  <Link href="/doctors/my-account" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15">
                    <ArrowLeft className="h-4 w-4" /> Back to my account
                  </Link>
                  <Link href="/doctors/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/15">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button type="button" onClick={() => void saveConfiguration()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a] shadow-xl transition hover:bg-blue-50 disabled:opacity-60">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save configuration</>}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><Eye className="h-5 w-5" /></div>
                    <div><h2 className="text-base font-bold text-zinc-950 dark:text-white">Profile visibility</h2><p className="mt-1 text-xs text-zinc-500">Control what patients can see on your doctor profile.</p></div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting title="Public professional profile" description="Allow patients to discover your doctor profile on Doc Chap." checked={configuration.profileVisible} onChange={(value) => setBooleanField("profileVisible", value)} icon={configuration.profileVisible ? Eye : EyeOff} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" />
                    <ToggleSetting title="Accept new patients" description="Let patients know you are currently accepting appointments." checked={configuration.acceptsNewPatients} onChange={(value) => setBooleanField("acceptsNewPatients", value)} icon={UsersRound} iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300" />
                    <ToggleSetting title="Show WhatsApp number" description="Display your professional WhatsApp number to patients." checked={configuration.showWhatsApp} onChange={(value) => setBooleanField("showWhatsApp", value)} icon={Phone} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
                    <ToggleSetting title="Show practice address" description="Display your practice address on your public profile." checked={configuration.showPracticeAddress} onChange={(value) => setBooleanField("showPracticeAddress", value)} icon={MapPin} iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" />
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"><Stethoscope className="h-5 w-5" /></div>
                    <div><h2 className="text-base font-bold text-zinc-950 dark:text-white">Consultation options</h2><p className="mt-1 text-xs text-zinc-500">Choose the services you want to offer to patients.</p></div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ToggleSetting title="In-person consultation" description="Allow patients to book physical appointments with you." checked={configuration.inPersonEnabled} onChange={(value) => setBooleanField("inPersonEnabled", value)} icon={UserRound} iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300" />
                    <ToggleSetting title="Teleconsultation" description="Allow patients to book remote video consultations." checked={configuration.teleconsultationEnabled} onChange={(value) => setBooleanField("teleconsultationEnabled", value)} icon={Video} iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300" />
                    <ToggleSetting title="Patient messaging" description="Allow patients to contact you through Doc Chap messaging." checked={configuration.messagingEnabled} onChange={(value) => setBooleanField("messagingEnabled", value)} icon={MessageCircle} iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" />
                    <ToggleSetting title="Phone consultation" description="Allow patients to book a consultation by phone and call you on your registered professional number." checked={configuration.phoneConsultationEnabled} onChange={(value) => setBooleanField("phoneConsultationEnabled", value)} icon={Smartphone} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/8 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/8 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                          <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                            Doctor identity & KYC verification
                          </h2>

                          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            Submit your identity, address and professional documents so Doc Chap can verify that you are a licensed medical professional.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                          safeString(doctorData?.kyc?.status).toLowerCase() === "verified"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : safeString(doctorData?.kyc?.status).toLowerCase() === "submitted"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {safeString(doctorData?.kyc?.status).toLowerCase() === "verified"
                          ? "KYC verified"
                          : safeString(doctorData?.kyc?.status).toLowerCase() === "submitted"
                          ? "Under review"
                          : "Verification required"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                        <div>
                          <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                            Secure document submission
                          </div>

                          <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-300">
                            Accepted formats: PDF, JPG, PNG or WEBP. Maximum size: 10 MB per document. Your documents are intended only for doctor identity and professional verification.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <KycUploadCard
                        title="Identity document"
                        description="Ghana Card / national identity card or passport."
                        icon={IdCard}
                        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                        file={kycFiles.identityDocument}
                        existingDocument={doctorData?.kyc?.documents?.identityDocument}
                        onFileChange={(file) =>
                          setKycFiles((current) => ({
                            ...current,
                            identityDocument: file,
                          }))
                        }
                      />

                      <KycUploadCard
                        title="Proof of address"
                        description="Utility bill, bank statement, tenancy document or another recent proof of residence."
                        icon={Home}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                        file={kycFiles.proofOfAddress}
                        existingDocument={doctorData?.kyc?.documents?.proofOfAddress}
                        onFileChange={(file) =>
                          setKycFiles((current) => ({
                            ...current,
                            proofOfAddress: file,
                          }))
                        }
                      />

                      <KycUploadCard
                        title="Doctor / medical professional card"
                        description="Upload your professional medical card or official proof of professional registration."
                        icon={BadgeCheck}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                        file={kycFiles.medicalCard}
                        existingDocument={doctorData?.kyc?.documents?.medicalCard}
                        onFileChange={(file) =>
                          setKycFiles((current) => ({
                            ...current,
                            medicalCard: file,
                          }))
                        }
                      />

                      <KycUploadCard
                        title="Other supporting medical documents"
                        description="Add licences, certificates, registration proof or any other document that supports your doctor status."
                        icon={FileCheck2}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                        acceptMultiple
                        multipleFiles={kycFiles.supportingDocuments}
                        onMultipleChange={(files) =>
                          setKycFiles((current) => ({
                            ...current,
                            supportingDocuments: files,
                          }))
                        }
                      />
                    </div>

                    {doctorData?.kyc?.documents?.supportingDocuments &&
                      doctorData.kyc.documents.supportingDocuments.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                            Previously submitted supporting documents
                          </div>

                          <div className="mt-3 space-y-2">
                            {doctorData.kyc.documents.supportingDocuments.map(
                              (document, index) => (
                                <div
                                  key={`${document.storagePath}-${index}`}
                                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                                >
                                  <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                  <span className="truncate">{document.name}</span>
                                  <span className="ml-auto shrink-0 text-emerald-600">
                                    Uploaded
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={() => void submitKycDocuments()}
                      disabled={uploadingKyc}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingKyc ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading verification documents...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Submit verification documents
                        </>
                      )}
                    </button>
                  </div>
                </section>

                <button type="button" onClick={() => void saveConfiguration()} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#0b2d5f] disabled:opacity-60">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving configuration...</> : <><Save className="h-4 w-4" /> Save professional configuration</>}
                </button>
              </div>

              <aside className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Stethoscope className="h-7 w-7" /></div>
                    <h3 className="mt-4 text-lg font-black">{titledName}</h3>
                    <p className="mt-1 text-sm text-blue-100">{specialty}</p>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">Profile</span><span className={`text-xs font-bold ${configuration.profileVisible ? "text-emerald-600" : "text-zinc-500"}`}>{configuration.profileVisible ? "Visible" : "Hidden"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">New patients</span><span className={`text-xs font-bold ${configuration.acceptsNewPatients ? "text-blue-600" : "text-zinc-500"}`}>{configuration.acceptsNewPatients ? "Accepted" : "Paused"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">Currency</span><span className="text-xs font-bold text-violet-600">GHS</span></div>
                  </div>
                </div>

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Clock3 className="h-5 w-5" /></div>
                    <div><h2 className="text-base font-bold text-zinc-950 dark:text-white">Default consultation settings</h2><p className="mt-1 text-xs text-zinc-500">Set your default duration and consultation fee.</p></div>
                  </div>
                  <div className="mt-6 space-y-5">
                    <NumberField label="Consultation duration" value={configuration.defaultConsultationDuration} onChange={(value) => setTextField("defaultConsultationDuration", value)} suffix="minutes" icon={Clock3} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" />
                    <NumberField label="Default consultation fee" value={configuration.defaultConsultationFee} onChange={(value) => setTextField("defaultConsultationFee", value)} suffix="GHS" icon={Banknote} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                          Consultation hours
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          Set the days and times when patients can book consultations with you.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Weekly availability
                          </div>

                          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
                            {openConsultationDays} open day{openConsultationDays === 1 ? "" : "s"}
                          </div>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            doctorData?.availability?.completed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {doctorData?.availability?.completed
                            ? "Configured"
                            : "To configure"}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeConsultationModes.length > 0 ? (
                          activeConsultationModes.map((mode) => {
                            const ModeIcon = mode.icon;

                            return (
                              <span
                                key={mode.label}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${mode.className}`}
                              >
                                <ModeIcon className="h-3.5 w-3.5" />
                                {mode.label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Enable at least one consultation mode above.
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openScheduleModal}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-500"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {doctorData?.availability?.completed
                        ? "Edit consultation hours"
                        : "Set consultation hours"}
                    </button>
                  </div>
                </section>

                <div className="rounded-[28px] border border-zinc-200/80 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="px-1 pb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Quick access</div>
                  <div className="space-y-3">
                    <Link href="/doctors/my-account" className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3.5 dark:border-zinc-800"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-zinc-900 dark:text-white">My account</div><div className="text-xs text-zinc-500">Personal and professional data</div></div><ChevronRight className="h-4 w-4 text-zinc-400" /></Link>
                    <Link href="/doctors/dashboard" className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3.5 dark:border-zinc-800"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><LayoutDashboard className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-zinc-900 dark:text-white">Doctor dashboard</div><div className="text-xs text-zinc-500">Return to dashboard</div></div><ChevronRight className="h-4 w-4 text-zinc-400" /></Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700"><Sparkles className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-zinc-950 dark:text-white">Professional profile</h3><p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">These settings control how patients interact with your doctor profile. They do not modify your identity or medical credentials.</p></div></div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>


      {scheduleModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-schedule-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingSchedule
            ) {
              closeScheduleModal();
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
                    id="doctor-schedule-title"
                    className="mt-4 text-2xl font-black tracking-tight sm:text-3xl"
                  >
                    Consultation hours
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                    Choose the days when you are available and define the opening and closing time for patient bookings.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeConsultationModes.length > 0 ? (
                      activeConsultationModes.map((mode) => {
                        const ModeIcon = mode.icon;

                        return (
                          <span
                            key={mode.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white"
                          >
                            <ModeIcon className="h-3.5 w-3.5" />
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
                  onClick={closeScheduleModal}
                  disabled={savingSchedule}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close consultation hours"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {scheduleError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    {scheduleError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {DAYS.map((day) => {
                  const hours =
                    scheduleDraft[day.key];

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
                              {hours.enabled
                                ? formatDaySummary(hours)
                                : "Closed"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={hours.enabled}
                            onClick={() =>
                              updateScheduleDay(
                                day.key,
                                {
                                  enabled:
                                    !hours.enabled,
                                }
                              )
                            }
                            className={`inline-flex min-w-[108px] items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                              hours.enabled
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {hours.enabled
                              ? "Open"
                              : "Closed"}
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
                                  updateScheduleDay(
                                    day.key,
                                    {
                                      start:
                                        event.target.value,
                                    }
                                  )
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
                                  updateScheduleDay(
                                    day.key,
                                    {
                                      end:
                                        event.target.value,
                                    }
                                  )
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

              <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" />

                  <div>
                    <div className="text-sm font-bold text-zinc-950 dark:text-white">
                      How these hours are used
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                      These weekly hours define when patients can book the consultation methods you have enabled above. Closed days will not be offered for new bookings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <button
                type="button"
                onClick={closeScheduleModal}
                disabled={savingSchedule}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveConsultationHours()
                }
                disabled={savingSchedule}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSchedule ? (
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
      )}

      {popup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setPopup(null); }}>
          <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-zinc-950">
            <button type="button" onClick={() => setPopup(null)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900"><X className="h-4 w-4" /></button>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${popup.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>{popup.type === "success" ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}</div>
            <h2 className="mt-5 pr-10 text-xl font-black text-zinc-950 dark:text-white">{popup.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{popup.message}</p>
            <button type="button" onClick={() => setPopup(null)} className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white ${popup.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}