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
  CalendarCheck2,
  BadgeCheck,
  Sparkles,
  Users,
  CreditCard,
  FileText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sign up | Patient, Doctor or Clinic | Doc Chap Ghana",
  description:
    "Create your Doc Chap Ghana account as a patient, independent doctor or clinic. Book appointments, manage your schedule, patients and healthcare activity on a modern and secure platform.",
  keywords: [
    "Doc Chap Ghana signup",
    "patient signup Ghana",
    "doctor signup Ghana",
    "clinic signup Ghana",
    "healthcare account Ghana",
    "doctor account Ghana",
    "clinic account Ghana",
    "medical appointment Ghana",
    "teleconsultation Ghana",
    "patient management Ghana",
    "doctor schedule Ghana",
    "clinic dashboard Ghana",
  ],
  openGraph: {
    title: "Sign up | Patient, Doctor or Clinic | Doc Chap Ghana",
    description:
      "Choose your Doc Chap Ghana registration space: patient, doctor or clinic.",
    url: "/signup",
    siteName: "Doc Chap Ghana",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign up | Patient, Doctor or Clinic | Doc Chap Ghana",
    description:
      "Choose your registration space: patient, doctor or clinic.",
  },
  alternates: {
    canonical: "/signup",
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
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBgClass} shadow-sm`}
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

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="relative mt-3 h-56 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 33vw"
              priority={false}
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

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="w-full px-4 py-12 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-900/40 dark:bg-teal-900/20 dark:text-teal-200">
                <Sparkles className="h-4 w-4" />
                Doc Chap Ghana registration
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
                Choose your registration space
              </h1>

              <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                Join Doc Chap Ghana based on your profile. Whether you are a
                patient, independent doctor or clinic, you get access to a
                clear, modern, secure and tailored experience.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Secure access
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                  <CalendarCheck2 className="h-4 w-4" />
                  Simple onboarding
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-200">
                  <Users className="h-4 w-4" />
                  Experience tailored to every profile
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RoleCard
              href="/patients/signup"
              title="I am a patient"
              subtitle="Create my patient account"
              description="Sign up to book appointments easily, search for doctors or clinics, manage your consultations and access your healthcare space securely."
              icon={HeartPulse}
              iconBgClass="bg-emerald-600"
              tintClass="from-emerald-500/12 via-teal-500/8 to-transparent"
              bullets={[
                "Book appointments online easily",
                "Search doctors and clinics",
                "Access your secure patient account",
                "Follow your healthcare journey",
              ]}
              cta="Sign up as a patient"
              imageSrc="/images/inscription-patient.png"
              imageAlt="Doc Chap Ghana patient registration"
            />

            <RoleCard
              href="/doctors/signup"
              title="I am a doctor"
              subtitle="Create my doctor account"
              description="Create your professional space to manage your schedule, patients, appointments, medical activity and visibility on Doc Chap Ghana."
              icon={Stethoscope}
              iconBgClass="bg-blue-600"
              tintClass="from-blue-500/12 via-indigo-500/8 to-transparent"
              bullets={[
                "Manage your professional schedule",
                "Follow your patients more easily",
                "Develop your medical activity",
                "Access a modern doctor workspace",
              ]}
              cta="Sign up as a doctor"
              imageSrc="/images/inscription-docteur.png"
              imageAlt="Doc Chap Ghana doctor registration"
            />

            <RoleCard
              href="/clinics/signup"
              title="I manage a clinic"
              subtitle="Create my clinic account"
              description="Register your clinic to centralise appointments, patients, teams, payments and visibility on a professional healthcare platform."
              icon={Building2}
              iconBgClass="bg-teal-700"
              tintClass="from-teal-500/12 via-cyan-500/8 to-transparent"
              bullets={[
                "Centralise clinic management",
                "Follow patients and appointments",
                "Organise your team and permissions",
                "Manage activity and payments",
              ]}
              cta="Register my clinic"
              imageSrc="/images/inscription-clinique.png"
              imageAlt="Doc Chap Ghana clinic registration"
            />
          </div>
        </section>

        <section className="w-full px-4 pb-12 sm:px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/6 to-transparent" />

            <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                    <HeartPulse className="h-5 w-5 text-white" />
                  </div>

                  <div className="text-sm font-bold text-black dark:text-white">
                    Patient space
                  </div>
                </div>

                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Book appointments, search for professionals and access your
                  healthcare account.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>

                  <div className="text-sm font-bold text-black dark:text-white">
                    Doctor space
                  </div>
                </div>

                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Manage your schedule, patients, professional profile and
                  daily activity.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>

                  <div className="text-sm font-bold text-black dark:text-white">
                    Clinic space
                  </div>
                </div>

                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Supervise your organisation, appointments, patients and
                  operational activity.
                </p>
              </div>
            </div>

            <div className="relative mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>

                <div>
                  <div className="text-sm font-bold text-black dark:text-white">
                    Why this page matters
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    This central registration page helps each user choose the
                    right journey based on their profile. It improves
                    understanding, conversion and the discoverability of Doc
                    Chap Ghana for patients, doctors and clinics.
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