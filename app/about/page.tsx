// app/about/page.tsx
import Link from "next/link";
import Footer from "@/app/components/Footer";
import {
  ShieldCheck,
  Stethoscope,
  CalendarCheck2,
  MessageSquareText,
  FileText,
  CreditCard,
  BadgeCheck,
  Users,
  Building2,
  HeartPulse,
  Lock,
  Globe2,
  Headphones,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function Page() {
  const features = [
    {
      icon: CalendarCheck2,
      title: "Appointments & scheduling",
      desc: "Appointment booking, reminders, status tracking and queue management.",
    },
    {
      icon: Stethoscope,
      title: "Teleconsultation",
      desc: "Remote consultations with a seamless experience, depending on the selected plan.",
    },
    {
      icon: MessageSquareText,
      title: "Messaging",
      desc: "Internal communication and, depending on the plan, secure patient messaging.",
    },
    {
      icon: FileText,
      title: "Patient record (EMR)",
      desc: "Clinical follow-up, documents and medical history, subject to activation and compliance requirements.",
    },
    {
      icon: CreditCard,
      title: "Payments & invoicing",
      desc: "Quotes, invoices and payment collection through supported payment providers.",
    },
    {
      icon: BadgeCheck,
      title: "Verification (KYC)",
      desc: "Biometric selfie and OCR used only for identity verification, with explicit consent.",
    },
  ];

  const values = [
    {
      icon: Lock,
      title: "Privacy first",
      desc: "Data minimisation, role-based access, encryption and activity logging.",
    },
    {
      icon: Sparkles,
      title: "Easy to use",
      desc: "Clear interfaces designed for the day-to-day needs of healthcare teams.",
    },
    {
      icon: ShieldCheck,
      title: "Reliability",
      desc: "Real-time services, backups, resilience and incident monitoring.",
    },
    {
      icon: Globe2,
      title: "Compliance",
      desc: "A privacy-focused approach, traceability of sensitive actions and recognised best practices.",
    },
    {
      icon: HeartPulse,
      title: "Mobile access",
      desc: "Optimised for smartphones and variable internet connectivity.",
    },
    {
      icon: CheckCircle2,
      title: "Impact",
      desc: "Fewer missed appointments, better follow-up and an improved patient experience.",
    },
  ];

  const audiences = [
    {
      icon: Users,
      title: "Patients",
      desc: "Access to appointments, documents and teleconsultation depending on the clinic’s selected plan.",
    },
    {
      icon: Stethoscope,
      title: "Doctors",
      desc: "Scheduling, teleconsultation, messaging and patient records when these services are enabled.",
    },
    {
      icon: Building2,
      title: "Clinics",
      desc: "Roles and permissions, finances, reporting and multi-site organisation, depending on the selected plan.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <main className="min-h-[70vh] w-full">
        {/* Hero */}
        <section className="w-full border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">About Doc Chap Health</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
              A clinical management and teleconsultation platform designed for West Africa
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Doc Chap Health</strong> helps clinics, medical practices and independent
              healthcare professionals organise appointments, manage patient follow-up, communicate,
              invoice and grow — while respecting the confidentiality of health data.
            </p>

            {/* Mini stats / highlights */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Appointments & queue", v: "Real-time management" },
                { k: "Teleconsultation", v: "Depending on plan" },
                { k: "Security", v: "Role-based access" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="text-sm font-semibold">{s.k}</div>
                  <div className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission + What we do */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <HeartPulse className="h-5 w-5" />
                <h2 className="text-lg sm:text-xl font-semibold">Our mission</h2>
              </div>

              <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                To provide healthcare professionals with simple, reliable and secure tools to deliver
                modern care, from appointment booking to post-consultation follow-up, both in person
                and remotely.
              </p>

              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>
                  Built for real-world healthcare delivery: mobile-first, fast and adapted to care teams.
                </span>
              </div>

              <div className="mt-2 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Our priority: security, consent and traceability of access.</span>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Stethoscope className="h-5 w-5" />
                <h2 className="text-lg sm:text-xl font-semibold">What we do</h2>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {features.map((f, i) => {
                  const Icon = f.icon;

                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                          <Icon className="h-5 w-5" />
                        </span>

                        <h3 className="text-sm sm:text-base font-semibold">{f.title}</h3>
                      </div>

                      <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="w-full border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Our values</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v, i) => {
                const Icon = v.icon;

                return (
                  <div
                    key={i}
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                        <Icon className="h-5 w-5" />
                      </span>

                      <h3 className="font-semibold">{v.title}</h3>
                    </div>

                    <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security & Data Protection */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Security &amp; data protection</h2>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  Data protection
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>Encryption in transit using TLS and encryption at rest where available.</li>
                  <li>Role-based access controls, including owner, admin and staff roles, with audit logs.</li>
                  <li>Data minimisation, limited retention, backups and incident-response procedures.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                <h3 className="flex items-center gap-2 font-semibold">
                  <BadgeCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  Identity &amp; consent
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>
                    Hosting and database infrastructure provided through{" "}
                    <strong>Firebase / Google Cloud</strong>.
                  </li>

                  <li>
                    <strong>Selfie biometrics</strong> including liveness detection and comparison, as well
                    as <strong>OCR</strong>, are used only for identity verification and with{" "}
                    <strong>explicit consent</strong>.
                  </li>

                  <li>Traceability of sensitive actions and compliance best practices.</li>
                </ul>

                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                  Learn more:{" "}
                  <Link href="/confidentialite-et-rgpd" className="underline">
                    Privacy &amp; Data Protection
                  </Link>{" "}
                  —{" "}
                  <Link href="/mention-legale" className="underline">
                    Legal Notice
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who is it for? */}
        <section className="w-full border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 dark:border-gray-800 dark:from-gray-950 dark:to-gray-900/20">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <Users className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Who is it for?</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audiences.map((a, i) => {
                const Icon = a.icon;

                return (
                  <div
                    key={i}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                        <Icon className="h-5 w-5" />
                      </span>

                      <h3 className="text-base sm:text-lg font-semibold">{a.title}</h3>
                    </div>

                    <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quality commitments */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <Headphones className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Our quality commitments</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  Availability &amp; performance
                </h3>

                <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Active monitoring, mobile optimisation and resilient handling of key operations,
                  including appointments and payments.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Headphones className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  Support
                </h3>

                <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Email and phone support during business hours, with enhanced service levels available
                  on the Enterprise plan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="w-full px-4 sm:px-6 lg:px-10 pb-12">
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <MessageSquareText className="h-5 w-5" />
              <h2 className="text-lg sm:text-xl font-semibold">Contact us</h2>
            </div>

            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Write to us at{" "}
              <a href="mailto:contact@doc-chap.com" className="underline font-medium">
                contact@doc-chap.com
              </a>{" "}
              or call us on{" "}
              <a href="tel:+2250748316544" className="underline font-medium">
                +225 07 48 316 544
              </a>
              .
            </p>

            <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Last updated: <strong>September 3, 2025</strong>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}