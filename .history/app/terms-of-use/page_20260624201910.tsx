// app/terms-of-use/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  FileText,
  BadgeCheck,
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
  MessageSquareText,
  CreditCard,
  Stethoscope,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use | Doc Chap Ghana",
  description:
    "Read the Doc Chap Ghana Terms of Use covering account access, acceptable use, medical responsibilities, payments, data security and support.",
  alternates: {
    canonical: "/terms-of-use",
  },
  openGraph: {
    title: "Terms of Use | Doc Chap Ghana",
    description:
      "Usage rules for Doc Chap Ghana users, patients, professionals, clinics and partners.",
    url: "/terms-of-use",
    siteName: "Doc Chap Ghana",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "purpose", title: "Purpose and acceptance", icon: ClipboardList },
  { id: "access", title: "Access and account", icon: UserCheck },
  { id: "usage", title: "Acceptable use", icon: BadgeCheck },
  { id: "medical", title: "Medical content and responsibility", icon: AlertTriangle },
  { id: "availability", title: "Availability and maintenance", icon: CalendarCheck2 },
  { id: "payments", title: "Payments and third-party services", icon: CreditCard },
  { id: "data", title: "Data, security and confidentiality", icon: ShieldCheck },
  { id: "messages", title: "Messages and notifications", icon: MessageSquareText },
  { id: "ip", title: "Intellectual property", icon: Lock },
  { id: "suspension", title: "Suspension and termination", icon: AlertTriangle },
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

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />

      <main className="w-full">
        <section className="w-full border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Usage terms</span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Terms of Use
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              These Terms of Use govern access to and use of the Doc Chap Ghana
              platform by patients, doctors, clinics, pharmacies, staff members,
              partners and visitors. By using the service, you agree to follow
              these rules.
            </p>

            <div className="mt-6 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Last updated: <strong>24 June 2026</strong>.
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                  <BadgeCheck className="h-5 w-5" />
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
              <section id="purpose" className="scroll-mt-24">
                <CardTitle icon={ClipboardList} title="1. Purpose and acceptance" />
                <Card>
                  <p>
                    These Terms of Use define the rules for accessing and using
                    Doc Chap Ghana. By browsing, creating an account or using any
                    feature, you accept these terms.
                  </p>
                  <p className="mt-3">
                    Doc Chap is not an emergency service. In a medical emergency,
                    contact the competent emergency services immediately.
                  </p>
                </Card>
              </section>

              <section id="access" className="scroll-mt-24">
                <CardTitle icon={UserCheck} title="2. Access and account" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>You must provide accurate, complete and up-to-date information.</li>
                    <li>Your login credentials are personal and must not be shared.</li>
                    <li>
                      You are responsible for any activity performed through your
                      account and must report any suspected unauthorised access.
                    </li>
                    <li>
                      Some areas may require identity, professional or facility
                      verification before access is granted.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="usage" className="scroll-mt-24">
                <CardTitle icon={BadgeCheck} title="3. Acceptable use" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Use the service only for lawful healthcare-related purposes.</li>
                    <li>Do not access, copy or modify data without authorisation.</li>
                    <li>Do not disrupt, overload, reverse engineer or attack the service.</li>
                    <li>Do not impersonate another person or professional.</li>
                    <li>
                      Use roles and permissions responsibly to protect sensitive
                      personal and healthcare data.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="medical" className="scroll-mt-24">
                <CardTitle icon={AlertTriangle} title="4. Medical content and responsibility" />
                <Card>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Doc Chap provides digital tools and does not perform medical acts.</li>
                    <li>
                      Healthcare professionals and facilities remain responsible
                      for notes, prescriptions, diagnoses, advice, medical files
                      and care decisions.
                    </li>
                    <li>
                      The service may provide forms, fields or workflow assistance,
                      but this does not replace professional judgement.
                    </li>
                  </ul>
                </Card>
              </section>

              <section id="availability" className="scroll-mt-24">
                <CardTitle icon={CalendarCheck2} title="5. Availability and maintenance" />
                <Card>
                  <p>
                    Mercury Global aims to provide a reliable service, but
                    temporary interruptions may occur due to maintenance, updates,
                    third-party incidents, network failures or security events.
                  </p>
                  <p className="mt-3">
                    Planned maintenance may be announced through appropriate
                    channels whenever reasonably possible.
                  </p>
                </Card>
              </section>

              <section id="payments" className="scroll-mt-24">
                <CardTitle icon={CreditCard} title="6. Payments and third-party services" />
                <Card>
                  <p>
                    Some features may depend on third-party providers, including
                    payment, messaging, video or identity verification services.
                    Their own terms may also apply.
                  </p>
                  <p className="mt-3">
                    Commercial conditions, pricing and billing rules are described
                    in the
                    <Link href="/terms-of-sale" className="font-medium underline"> Terms of Sale</Link>
                    .
                  </p>
                </Card>
              </section>

              <section id="data" className="scroll-mt-24">
                <CardTitle icon={ShieldCheck} title="7. Data, security and confidentiality" />
                <Card>
                  <p>
                    Doc Chap may process personal data and healthcare data depending
                    on how the service is used. Access is restricted through roles,
                    permissions and security controls.
                  </p>
                  <p className="mt-3">
                    Users must protect confidential information and may only access
                    data that they are authorised to view or manage. More details
                    are available in the
                    <Link href="/privacy" className="font-medium underline"> Privacy Policy</Link>
                    .
                  </p>
                </Card>
              </section>

              <section id="messages" className="scroll-mt-24">
                <CardTitle icon={MessageSquareText} title="8. Messages and notifications" />
                <Card>
                  <p>
                    The platform may send emails, SMS, WhatsApp messages, push
                    notifications or in-app messages related to accounts,
                    appointments, payments, security and service updates.
                  </p>
                  <p className="mt-3">
                    Users must ensure that their contact details are accurate and
                    must not use messaging features for abusive, fraudulent or
                    unlawful communications.
                  </p>
                </Card>
              </section>

              <section id="ip" className="scroll-mt-24">
                <CardTitle icon={Lock} title="9. Intellectual property" />
                <Card>
                  <p>
                    The Doc Chap brand, platform, interface, design, text, visuals,
                    software and related content are protected. No licence is
                    granted except the limited right to use the service according
                    to these terms.
                  </p>
                </Card>
              </section>

              <section id="suspension" className="scroll-mt-24">
                <CardTitle icon={AlertTriangle} title="10. Suspension and termination" />
                <Card>
                  <p>
                    Mercury Global may suspend or terminate access in case of
                    breach of these terms, fraud, security risk, abusive use,
                    unlawful behaviour, non-payment or professional compliance
                    concerns.
                  </p>
                </Card>
              </section>

              <section id="law" className="scroll-mt-24">
                <CardTitle icon={Gavel} title="11. Applicable law and disputes" />
                <Card>
                  <p>
                    These Terms of Use are intended for the Ghana version of Doc
                    Chap. Any issue should first be discussed in good faith with
                    Mercury Global. Where no amicable solution is found, the
                    dispute may be submitted to the competent courts or authorities
                    according to the applicable legal framework.
                  </p>
                </Card>
              </section>

              <section id="contact" className="scroll-mt-24">
                <CardTitle icon={Mail} title="12. Contact" />
                <Card>
                  <p>
                    For questions about these Terms of Use, contact:
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
