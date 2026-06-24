import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  ArrowRight,
  HeartPulse,
  Stethoscope,
  Building2,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  LogIn,
  CalendarDays,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Log in | Patient, Doctor or Clinic | Doc Chap Ghana",
  description:
    "Log in to your Doc Chap Ghana space based on your profile: patient, independent doctor or clinic. Quickly access your appointments, patients, schedule and secure services.",
  keywords: [
    "Doc Chap Ghana login",
    "patient login",
    "doctor login",
    "clinic login",
    "patient space",
    "doctor space",
    "clinic space",
    "medical appointment login",
    "teleconsultation login",
    "doctor dashboard",
    "clinic dashboard",
  ],
  openGraph: {
    title: "Log in | Patient, Doctor or Clinic | Doc Chap Ghana",
    description:
      "Choisissez votre espace de Doc Chap Ghana login : patient, médecin ou clinique.",
    url: "/login",
    siteName: "Doc Chap Ghana",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Log in | Patient, Doctor or Clinic | Doc Chap Ghana",
    description:
      "Choose your login space: patient, doctor or clinic.",
  },
  alternates: {
    canonical: "/login",
  },
};

function RoleCard({
  href,
  title,
  subtitle,
  description,
  icon: Icon,
  iconBgClass,
  tintClass,
  bullets,
  cta,
  imageSrc,
  imageAlt,
}: {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
  tintClass: string;
  bullets: string[];
  cta: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tintClass}`}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-2xl ${iconBgClass} flex items-center justify-center shadow-sm`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-bold text-black dark:text-white">
              {title}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {description}
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/60">
          
          <div className="relative mt-0 h-56 w-full">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {bullets.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:group-hover:bg-zinc-100">
          <span>{cta}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="w-full px-4 sm:px-6 lg:px-10 py-12">
            <div className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                <LogIn className="h-4 w-4" />
                Doc Chap Ghana login
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
                Choose your login space
              </h1>

              <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                Log in directly to the right space based on your profile.
                Patient, independent doctor or clinic: each journey has its
                own dedicated, secure interface designed for its use.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Secure login
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <CalendarDays className="h-4 w-4" />
                  Quick access to your space
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-200">
                  <Sparkles className="h-4 w-4" />
                  Interface tailored to every profile
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RoleCard
              href="/patients/login"
              title="Patient login"
              subtitle="Accéder à mon patient space"
              description="Log in to your patient account to book appointments, follow your consultations, search for a doctor or clinic and access your personal space."
              icon={HeartPulse}
              iconBgClass="bg-emerald-600"
              tintClass="from-emerald-500/12 via-teal-500/8 to-transparent"
              bullets={[
                "View your appointments",
                "Search doctors and clinics",
                "Access your healthcare space",
                "Continue your healthcare journey",
              ]}
              cta="Log in as a patient"
              imageSrc="/images/connexion-patients.png"
              imageAlt="Doc Chap Ghana patient login"
            />

            <RoleCard
              href="/doctors/login"
              title="Doctor login"
              subtitle="Accéder à mon doctor space"
              description="Log in to your doctor account to manage your schedule, patients, consultations, professional activity and secure workspace."
              icon={Stethoscope}
              iconBgClass="bg-blue-600"
              tintClass="from-blue-500/12 via-indigo-500/8 to-transparent"
              bullets={[
                "Manage your professional schedule",
                "Access your patients",
                "Track your medical activity",
                "Retrouver votre doctor space",
              ]}
              cta="Log in as a doctor"
              imageSrc="/images/connexion-docteurs.png"
              imageAlt="Doc Chap Ghana doctor login"
            />

            <RoleCard
              href="/clinics/login"
              title="Clinic login"
              subtitle="Accéder à mon clinic space"
              description="Connectez-vous à votre clinic space pour piloter vos rendez-vous, vos patients, votre organisation interne, votre équipe et votre activité."
              icon={Building2}
              iconBgClass="bg-teal-700"
              tintClass="from-teal-500/12 via-cyan-500/8 to-transparent"
              bullets={[
                "Accéder au clinic dashboard",
                "Manage patients and appointments",
                "Access your organisation",
                "Track clinic activity",
              ]}
              cta="Log in as a clinic"
              imageSrc="/images/connexion-clinique.png"
              imageAlt="Doc Chap Ghana clinic login"
            />
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 lg:px-10 pb-12">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/6 to-transparent" />

            <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                    <HeartPulse className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-bold text-black dark:text-white">
                    Connexion patient
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Accédez à vos rendez-vous, à votre recherche médicale et à
                  votre compte personnel.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-bold text-black dark:text-white">
                    Connexion docteur
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Retrouvez votre agenda, vos patients et votre espace
                  professionnel sécurisé.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-bold text-black dark:text-white">
                    Connexion clinique
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Retrouvez votre clinic space, vos patients, vos rendez-vous
                  et vos outils d’organisation.
                </p>
              </div>
            </div>

            <div className="relative mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-black dark:text-white">
                    Pourquoi cette page de connexion est utile ?
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Cette page permet de guider immédiatement l’utilisateur vers
                    le bon espace de connexion selon son profil. Elle améliore
                    l’expérience utilisateur, limite les erreurs d’orientation
                    et renforce le référencement SEO autour des connexions
                    patient, médecin et clinique sur Doc Chap Ghana.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}