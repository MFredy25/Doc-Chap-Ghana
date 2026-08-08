"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseMedical,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";
import { auth, db } from "@/lib/firebase/client";

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
    messagingEnabled?: boolean;
    showWhatsApp?: boolean;
    showPracticeAddress?: boolean;
    defaultConsultationDuration?: number;
    defaultConsultationFee?: number;
    currency?: string;
  };
};

type DoctorConfiguration = {
  profileVisible: boolean;
  acceptsNewPatients: boolean;
  inPersonEnabled: boolean;
  teleconsultationEnabled: boolean;
  messagingEnabled: boolean;
  showWhatsApp: boolean;
  showPracticeAddress: boolean;
  defaultConsultationDuration: string;
  defaultConsultationFee: string;
};

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
    messagingEnabled: safeBoolean(config.messagingEnabled, true),
    showWhatsApp: safeBoolean(config.showWhatsApp, true),
    showPracticeAddress: safeBoolean(config.showPracticeAddress, true),
    defaultConsultationDuration: String(safeNumber(config.defaultConsultationDuration, 30)),
    defaultConsultationFee: String(safeNumber(config.defaultConsultationFee, 0)),
  };
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
    messagingEnabled: true,
    showWhatsApp: true,
    showPracticeAddress: true,
    defaultConsultationDuration: "30",
    defaultConsultationFee: "0",
  });

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

  const fullName = useMemo(() => getDoctorName(doctorData, firebaseUser), [doctorData, firebaseUser]);
  const specialty = useMemo(() => getDoctorSpecialty(doctorData), [doctorData]);
  const verified = useMemo(() => isVerifiedDoctor(doctorData), [doctorData]);
  const verificationStatus = useMemo(() => getVerificationStatus(doctorData), [doctorData]);
  const profile = safeObject(doctorData?.profile);
  const location = [safeString(profile.city), safeString(profile.region)].filter(Boolean).join(", ") || "Ghana";

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

                  <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{fullName}</h1>
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
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Clock3 className="h-5 w-5" /></div>
                    <div><h2 className="text-base font-bold text-zinc-950 dark:text-white">Default consultation settings</h2><p className="mt-1 text-xs text-zinc-500">Set your default duration and consultation fee.</p></div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <NumberField label="Consultation duration" value={configuration.defaultConsultationDuration} onChange={(value) => setTextField("defaultConsultationDuration", value)} suffix="minutes" icon={Clock3} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" />
                    <NumberField label="Default consultation fee" value={configuration.defaultConsultationFee} onChange={(value) => setTextField("defaultConsultationFee", value)} suffix="GHS" icon={Banknote} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
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
                    <h3 className="mt-4 text-lg font-black">{fullName}</h3>
                    <p className="mt-1 text-sm text-blue-100">{specialty}</p>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">Profile</span><span className={`text-xs font-bold ${configuration.profileVisible ? "text-emerald-600" : "text-zinc-500"}`}>{configuration.profileVisible ? "Visible" : "Hidden"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">New patients</span><span className={`text-xs font-bold ${configuration.acceptsNewPatients ? "text-blue-600" : "text-zinc-500"}`}>{configuration.acceptsNewPatients ? "Accepted" : "Paused"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900"><span className="text-xs text-zinc-500">Currency</span><span className="text-xs font-bold text-violet-600">GHS</span></div>
                  </div>
                </div>

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