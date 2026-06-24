// app/terms-of-sale/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  FileText,
  Building2,
  CreditCard,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Gavel,
  Headphones,
  Mail,
  ChevronRight,
  ClipboardList,
  UserCheck,
  CalendarCheck2,
  Sparkles,
  Stethoscope,
  Pill,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Sale | Doc Chap Ghana",
  description:
    "Read the Doc Chap Ghana Terms of Sale covering subscriptions, payments, invoices, refunds, healthcare service responsibilities and support.",
  alternates: {
    canonical: "/terms-of-sale",
  },
  openGraph: {
    title: "Terms of Sale | Doc Chap Ghana",
    description:
      "Commercial terms for Doc Chap Ghana services, subscriptions, payments and professional healthcare accounts.",
    url: "/terms-of-sale",
    siteName: "Doc Chap Ghana",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "scope", title: "Scope and purpose", icon: ClipboardList },
  { id: "definitions", title: "Definitions", icon: FileText },
  { id: "account", title: "Access and account", icon: UserCheck },
  { id: "plans", title: "Plans and subscriptions", icon: Sparkles },
  { id: "prices", title: "Prices, fees and invoicing", icon: CreditCard },
  { id: "payments", title: "Payments, failures and refunds", icon: CreditCard },
  { id: "trial", title: "Free trial", icon: CalendarCheck2 },
  { id: "termination", title: "Duration, suspension and termination", icon: AlertTriangle },
  { id: "data", title: "Data, security and confidentiality", icon: ShieldCheck },
  { id: "medical", title: "Medical responsibility", icon: Stethoscope },
  { id: "pharmacies", title: "Pharmacies and medicines", icon: Pill },
  { id: "support", title: "Support and maintenance", icon: Headphones },
  { id: "liability", title: "Liability", icon: AlertTriangle },
  { id: "ip", title: "Intellectual property", icon: Lock },
  { id: "law", title: "Applicable law and disputes", icon: Gavel },
  { id: "contact", title: "Contact", icon: Mail },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 sm:text-base">
      {children}
    </div>
  );
}

function CardTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
        {title}
      </h2>
    </div>
  );
}

export default function TermsOfSalePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />

      <main className="w-full">
        <section className="w-full border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Commercial terms</span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Terms of Sale
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              These Terms of Sale define the commercial conditions under which
              <strong> Mercury Global</strong> provides access to the digital
              healthcare platform operated under the <strong>Doc Chap</strong>
              brand for Ghana. They apply to paid services, subscriptions,
              professional accounts, optional features and related transactions.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: "Healthcare platform",
                  desc: "Doc Chap Ghana operated by Mercury Global",
                },
                {
                  icon: CreditCard,
                  title: "Payments",
                  desc: "Subscriptions, fees, invoices and receipts",
                },
                {
                  icon: ShieldCheck,
                  title: "Confidentiality",
                  desc: "Security, access control and protected data",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Last updated: <strong>24 June 2026</strong>.
            </p>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                  <FileText className="h-5 w-5" />
                  <h2 className="font-semibold">Table of contents</h2>
                </div>

                <nav className="mt-4 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-teal-900/20"
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{section.title}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-300" />
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                    <Headphones className="h-4 w-4" />
                    <div className="text-sm font-semibold">Support</div>
                  </div>
                  <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                    <a className="font-medium underline" href="mailto:contact@doc-chap.com">
                      contact@doc-chap.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            <div className="space-y-10">
              <section id="scope" className="scroll-mt-24">
                <CardTitle icon={ClipboardList} title="1. Scope and purpose" />
                <Card>
                  <p>
                    These Terms of Sale govern the purchase, subscription and use
                    of paid services provided through Doc Chap Ghana. They apply
                    to healthcare professionals, clinics, pharmacies, facilities
                    and any organisation subscribing to a paid Doc Chap service.
                  </p>
                  <p className="mt-3">
                    Doc Chap is a technology platform. It does not provide
                    medical acts, medical diagnoses or medical prescriptions.
                    In an emergency, users must contact the competent emergency
                    services.
                  </p>
                </Card>
              </section>

              <section id="definitions" className="scroll-mt-24">
                <CardTitle icon={FileText} title="2. Definitions" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>
                      <strong>Platform / Service:</strong> all Doc Chap digital
                      services, including the website, applications, user spaces
                      and related features.
                    </li>
                    <li>
                      <strong>Mercury Global:</strong> the company operating the
                      Doc Chap brand and services.
                    </li>
                    <li>
                      <strong>Customer:</strong> any doctor, clinic, pharmacy,
                      facility or professional subscribing to a Doc Chap service.
                    </li>
                    <li>
                      <strong>User:</strong> any person authorised to use the
                      platform, including patients, professionals, staff members
                      and administrators.
                    </li>
                    <li>
                      <strong>Plan / Subscription:</strong> a free or paid package
                      giving access to selected Doc Chap features.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="account" className="scroll-mt-24">
                <CardTitle icon={UserCheck} title="3. Access and account" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Some features require the creation of a user account.</li>
                    <li>The customer must provide accurate and up-to-date information.</li>
                    <li>The customer is responsible for protecting login credentials.</li>
                    <li>
                      Mercury Global may suspend or restrict access in case of
                      fraud, misuse, illegal activity or breach of these terms.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="plans" className="scroll-mt-24">
                <CardTitle icon={Sparkles} title="4. Plans and subscriptions" />
                <Card>
                  <p>
                    Doc Chap may offer different plans depending on the customer
                    profile: doctor, clinic, pharmacy or other healthcare actor.
                  </p>
                  <p className="mt-3">
                    Features may vary depending on the selected plan, including
                    appointment management, teleconsultation, team management,
                    multi-user access, billing, payments, reporting and advanced
                    options.
                  </p>
                  <p className="mt-3">
                    Mercury Global may update plans, prices and features. When a
                    material change affects existing customers, reasonable notice
                    will be provided through appropriate channels.
                  </p>
                </Card>
              </section>

              <section id="prices" className="scroll-mt-24">
                <CardTitle icon={CreditCard} title="5. Prices, fees and invoicing" />
                <Card>
                  <p>
                    Applicable prices are those displayed at the time of
                    subscription or purchase. Depending on the service, billing
                    may include subscriptions, one-off payments, transaction fees
                    or optional feature fees.
                  </p>
                  <p className="mt-3">
                    Prices may be displayed in Ghanaian cedi or any other
                    currency shown on the platform. Invoices or receipts may be
                    generated depending on the selected service and payment flow.
                  </p>
                </Card>
              </section>

              <section id="payments" className="scroll-mt-24">
                <CardTitle icon={CreditCard} title="6. Payments, failures and refunds" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>
                      Payments may be processed through third-party payment
                      providers available on the platform.
                    </li>
                    <li>
                      Payment failures, delays or suspected fraud may lead to a
                      temporary restriction of the related service.
                    </li>
                    <li>
                      Refunds, when applicable, are processed according to the
                      nature of the service, the payment provider rules and the
                      verified status of the transaction.
                    </li>
                    <li>
                      Card numbers are not stored directly by Doc Chap.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="trial" className="scroll-mt-24">
                <CardTitle icon={CalendarCheck2} title="7. Free trial" />
                <Card>
                  <p>
                    Doc Chap may offer a free trial for selected professional or
                    clinic services. Trial duration, available features and
                    conversion conditions are displayed during the registration
                    or subscription process.
                  </p>
                  <p className="mt-3">
                    At the end of the trial, access may be limited until a paid
                    plan is selected, unless otherwise stated.
                  </p>
                </Card>
              </section>

              <section id="termination" className="scroll-mt-24">
                <CardTitle icon={AlertTriangle} title="8. Duration, suspension and termination" />
                <Card>
                  <p>
                    Subscriptions may be monthly, annual or based on another
                    period displayed at the time of purchase. Customers may stop
                    using the service or request termination according to the
                    conditions shown in their account or contract.
                  </p>
                  <p className="mt-3">
                    Mercury Global may suspend or terminate access in case of
                    non-payment, fraud, security risk, unlawful use or breach of
                    these terms.
                  </p>
                </Card>
              </section>

              <section id="data" className="scroll-mt-24">
                <CardTitle icon={ShieldCheck} title="9. Data, security and confidentiality" />
                <Card>
                  <p>
                    The use of Doc Chap may involve personal data and healthcare
                    data. Access is managed through roles, permissions and
                    security controls. More information is available in the
                    <Link href="/privacy" className="font-medium underline"> Privacy Policy</Link>
                    .
                  </p>
                </Card>
              </section>

              <section id="medical" className="scroll-mt-24">
                <CardTitle icon={Stethoscope} title="10. Medical responsibility" />
                <Card>
                  <p>
                    Healthcare professionals, clinics, pharmacies and healthcare
                    facilities remain solely responsible for their authorisations,
                    professional obligations, medical decisions, prescriptions,
                    advice, diagnoses and patient care.
                  </p>
                  <p className="mt-3">
                    Doc Chap provides digital tools for organisation, connection,
                    scheduling and communication. It does not replace medical
                    judgement or professional responsibility.
                  </p>
                </Card>
              </section>

              <section id="pharmacies" className="scroll-mt-24">
                <CardTitle icon={Pill} title="11. Pharmacies and medicines" />
                <Card>
                  <p>
                    Pharmacies using Doc Chap remain responsible for the lawful
                    sale, preparation, dispensing and delivery of medicines or
                    health products according to applicable professional and
                    regulatory obligations.
                  </p>
                </Card>
              </section>

              <section id="support" className="scroll-mt-24">
                <CardTitle icon={Headphones} title="12. Support and maintenance" />
                <Card>
                  <p>
                    Support may be provided by email or through platform support
                    channels. Maintenance, updates or technical incidents may
                    temporarily affect service availability.
                  </p>
                </Card>
              </section>

              <section id="liability" className="scroll-mt-24">
                <CardTitle icon={AlertTriangle} title="13. Liability" />
                <Card>
                  <p>
                    Mercury Global is responsible for providing the digital
                    platform with reasonable care. Mercury Global is not
                    responsible for medical acts, professional decisions,
                    incorrect information provided by users, third-party service
                    failures or events outside its reasonable control.
                  </p>
                </Card>
              </section>

              <section id="ip" className="scroll-mt-24">
                <CardTitle icon={Lock} title="14. Intellectual property" />
                <Card>
                  <p>
                    The Doc Chap brand, interface, design, content, software and
                    related materials are protected. Users may not reproduce,
                    copy, modify, distribute or exploit them without prior written
                    authorisation.
                  </p>
                </Card>
              </section>

              <section id="law" className="scroll-mt-24">
                <CardTitle icon={Gavel} title="15. Applicable law and disputes" />
                <Card>
                  <p>
                    These Terms of Sale are intended for the Ghana version of Doc
                    Chap. Any dispute should first be addressed through a good
                    faith discussion with Mercury Global. Where no amicable
                    solution is found, the matter may be submitted to the
                    competent courts or authorities according to the applicable
                    legal framework.
                  </p>
                </Card>
              </section>

              <section id="contact" className="scroll-mt-24">
                <CardTitle icon={Mail} title="16. Contact" />
                <Card>
                  <p>
                    For questions about these Terms of Sale, contact:
                    <a href="mailto:contact@doc-chap.com" className="ml-1 font-medium underline">
                      contact@doc-chap.com
                    </a>
                    .
                  </p>
                </Card>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
