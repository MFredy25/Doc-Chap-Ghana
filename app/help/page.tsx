import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  HelpCircle,
  ShieldCheck,
  UserCircle2,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  Video,
  CreditCard,
  FileText,
  Lock,
  Headphones,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help & FAQ | Doc Chap Ghana",
  description:
    "Find answers to frequently asked questions about Doc Chap Ghana: account creation, identity verification, appointments, teleconsultation, payments, data protection, subscriptions and support.",
  keywords: [
    "Doc Chap Ghana FAQ",
    "Doc Chap Ghana help",
    "medical appointment Ghana",
    "teleconsultation Ghana",
    "healthcare payment Ghana",
    "clinic Ghana",
    "doctor Ghana",
    "data protection Ghana",
  ],
  alternates: { canonical: "https://gh.doc-chap.com/help" },
  openGraph: {
    title: "Help & FAQ | Doc Chap Ghana",
    description:
      "Find answers about accounts, appointments, teleconsultation, payments, personal data and support on Doc Chap Ghana.",
    url: "https://gh.doc-chap.com/help",
    siteName: "Doc Chap Ghana",
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help & FAQ | Doc Chap Ghana",
    description:
      "Frequently asked questions about accounts, appointments, teleconsultation, payments, privacy and support.",
  },
  robots: { index: true, follow: true },
};

type FaqItem = { q: string; a: React.ReactNode; plain: string };
type Group = {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
  items: FaqItem[];
};

export default function HelpPage() {
  const groups: Group[] = [
    {
      id: "account",
      number: "1",
      title: "Account & identity verification",
      icon: UserCircle2,
      items: [
        {
          q: "How do I create a Patient, Doctor or Clinic account?",
          plain:
            "Use the dedicated registration pages for patients, doctors or clinics and follow the steps shown on screen.",
          a: (
            <>
              <p>Use the dedicated registration pages on the website:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Clinic: select <strong>“Add my clinic”</strong> and follow the registration steps.</li>
                <li>Doctor: select <strong>“Sign up as a doctor”</strong>.</li>
                <li>Patient: select <strong>“Patient account”</strong> to sign up or log in.</li>
              </ul>
            </>
          ),
        },
        {
          q: "Why may biometric verification and document OCR be required?",
          plain:
            "Identity verification may include a selfie with liveness detection and document OCR to secure access and prevent identity fraud, with explicit consent.",
          a: (
            <p>
              To secure access, prevent identity fraud and strengthen compliance, identity verification may include a{" "}
              <strong>selfie with liveness detection</strong> and <strong>OCR</strong> of identity documents
              such as a national ID, passport or driving licence. This is completed with <strong>explicit consent</strong>.
            </p>
          ),
        },
        {
          q: "What happens to my biometric data and documents?",
          plain:
            "They are used strictly for identity verification and are deleted or securely retained only for a limited period where needed for fraud prevention or legal obligations.",
          a: (
            <>
              <p>
                They are used <strong>strictly</strong> for identity verification, then <strong>deleted</strong> or{" "}
                <strong>securely retained</strong> for a limited period when necessary for evidence, fraud prevention
                or applicable legal obligations.
              </p>
              <p className="mt-2">
                Details: <Link href="/privacy" className="underline">Privacy policy</Link>.
              </p>
            </>
          ),
        },
      ],
    },
    {
      id: "professionals",
      number: "2",
      title: "Clinics & doctors",
      icon: Building2,
      items: [
        {
          q: "Which roles and permissions are available?",
          plain:
            "Roles can include owner, admin, clinical staff, secretary, accountant and read-only support, each with different access levels.",
          a: (
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Owner:</strong> full access, administrator management and subscription management.</li>
              <li><strong>Admin:</strong> operations and configuration without irreversible actions.</li>
              <li><strong>Clinical staff:</strong> schedule, patient records and messaging.</li>
              <li><strong>Secretary:</strong> reception, appointment scheduling and waiting list.</li>
              <li><strong>Accountant:</strong> finance, invoicing and reports.</li>
              <li><strong>Read-only support:</strong> limited read-only access.</li>
            </ul>
          ),
        },
        {
          q: "Can I manage multiple sites or clinics?",
          plain: "Multi-site or multi-clinic access may be available depending on your subscription plan.",
          a: <p>Yes, depending on your <strong>subscription plan</strong> and enabled features.</p>,
        },
      ],
    },
    {
      id: "appointments",
      number: "3",
      title: "Appointments & teleconsultation",
      icon: CalendarCheck2,
      items: [
        {
          q: "How do I schedule, change or cancel an appointment?",
          plain:
            "Use the relevant appointment or clinic schedule page to create, reschedule or cancel appointments according to your permissions.",
          a: <p>Use the relevant appointment or clinic schedule page to create, reschedule or cancel appointments according to your permissions.</p>,
        },
        {
          q: "Is teleconsultation included?",
          plain:
            "Teleconsultation features can vary by plan and may include invitations, document sharing, online payment and multi-practitioner options.",
          a: <p>Yes, with capabilities that can vary by <strong>plan</strong>, including duration, invitations, document sharing, online payments and multiple practitioners.</p>,
        },
      ],
    },
    {
      id: "payments",
      number: "4",
      title: "Payments & invoicing",
      icon: CreditCard,
      items: [
        {
          q: "Which payment methods are accepted?",
          plain:
            "Available payment methods depend on the clinic settings and may include Mobile Money, cards, bank transfers, insurance or cash. Card numbers are not stored by Doc Chap Ghana.",
          a: <p>Available methods depend on clinic settings and may include cash, Mobile Money, bank cards through supported providers, bank transfer, cheque or insurance. We do not store card numbers.</p>,
        },
        {
          q: "Can I get an invoice or receipt?",
          plain: "Invoices and receipts can be generated by the clinic and made available for download.",
          a: <p>Yes. Invoices and receipts can be generated by the clinic and made available for download.</p>,
        },
      ],
    },
    {
      id: "privacy",
      number: "5",
      title: "Data & privacy",
      icon: ShieldCheck,
      items: [
        {
          q: "How is my data protected?",
          plain:
            "Doc Chap Ghana uses measures such as encryption in transit, role-based access control, logging, backups and secure hosting.",
          a: (
            <p>
              Your data is protected through encryption in transit, role-based access control, logging, backups and secure hosting. See the{" "}
              <Link href="/privacy" className="underline">Privacy policy</Link>.
            </p>
          ),
        },
        {
          q: "What are my data protection rights?",
          plain:
            "You may have rights of access, correction, deletion, restriction, objection, portability and withdrawal of consent, subject to applicable law.",
          a: (
            <p>
              You may have rights of access, correction, deletion, restriction, objection, portability and withdrawal of consent, subject to applicable law. Contact:{" "}
              <a href="mailto:contact@doc-chap.com" className="underline">contact@doc-chap.com</a>.
            </p>
          ),
        },
      ],
    },
    {
      id: "subscriptions",
      number: "6",
      title: "Subscriptions & limits",
      icon: FileText,
      items: [
        {
          q: "What is the difference between Start, Standard, Pro and Enterprise?",
          plain:
            "Plans can differ by number of users, schedules, reporting, teleconsultation, multi-site access and other enabled features.",
          a: <p>Plans can differ by number of users, schedules, reports, teleconsultation, multi-site management and other enabled features. A free trial may be available depending on the offer.</p>,
        },
      ],
    },
    {
      id: "support",
      number: "7",
      title: "Technical help & support",
      icon: Headphones,
      items: [
        {
          q: "I am not receiving confirmation emails or SMS messages",
          plain:
            "Check spam folders, confirm your email address and phone number, request another message from the relevant page, then contact support if needed.",
          a: (
            <ul className="list-disc space-y-1 pl-6">
              <li>Check your spam folder and confirm that your email address and phone number are correct.</li>
              <li>Request another message from the relevant page.</li>
              <li>Contact support if needed.</li>
            </ul>
          ),
        },
        {
          q: "How do I contact support?",
          plain: "Write to contact@doc-chap.com for support.",
          a: <p>Write to us at <a href="mailto:contact@doc-chap.com" className="underline">contact@doc-chap.com</a>.</p>,
        },
      ],
    },
  ];

  const quickCards = [
    { icon: CalendarCheck2, title: "Appointments", desc: "Schedule, change or cancel", href: "#appointments" },
    { icon: Video, title: "Teleconsultation", desc: "Access & requirements", href: "#appointments" },
    { icon: CreditCard, title: "Payments", desc: "Methods & invoices", href: "#payments" },
    { icon: Lock, title: "Privacy", desc: "Data, rights and consent", href: "#privacy" },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.plain },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <main className="min-h-[70vh] w-full">
        <section className="w-full border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <HelpCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Help centre</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Doc Chap Ghana Help &amp; FAQ</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              Find answers to frequently asked questions about account creation, doctor and clinic registration, appointments, teleconsultation, payments and personal data protection on Doc Chap Ghana.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickCards.map((card) => {
                const Icon = card.icon;
                return (
                  <a key={card.title} href={card.href} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900/40">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
                      <div><div className="font-semibold">{card.title}</div><div className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{card.desc}</div></div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><BadgeCheck className="h-5 w-5" /><h2 className="font-semibold">Contents</h2></div>
                <nav className="mt-4 space-y-2" aria-label="FAQ contents">
                  {groups.map((group) => { const Icon = group.icon; return (
                    <a key={group.id} href={`#${group.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-teal-900/20">
                      <span className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-4 w-4" /></span><span>{group.number}. {group.title}</span></span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-300" />
                    </a>
                  ); })}
                </nav>
                <div className="mt-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Headphones className="h-4 w-4" /><div className="text-sm font-semibold">Support</div></div>
                  <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">Need help? <a className="font-medium underline" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p>
                </div>
              </div>
            </aside>

            <div className="space-y-10">
              {groups.map((group) => { const Icon = group.icon; return (
                <section key={group.id} id={group.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><h2 className="text-lg font-semibold sm:text-xl">{group.number}. {group.title}</h2></div>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <details key={item.q} className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm open:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:open:bg-gray-900/40">
                        <summary className="cursor-pointer list-none select-none"><div className="flex items-start justify-between gap-3"><div className="font-semibold text-gray-900 dark:text-gray-100">{item.q}</div><span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors group-open:border-teal-600 group-open:bg-teal-600 group-open:text-white dark:border-gray-800 dark:text-gray-300"><ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /></span></div><p className="mt-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Click to view the answer</p></summary>
                        <div className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">{item.a}</div>
                      </details>
                    ))}
                  </div>
                </section>
              ); })}
              <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Headphones className="h-5 w-5" /><h2 className="text-lg font-semibold sm:text-xl">Still need help?</h2></div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 sm:text-base">Contact us: <a href="mailto:contact@doc-chap.com" className="font-medium underline">contact@doc-chap.com</a>.</p>
                <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Last updated: <strong>24 June 2026</strong></p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
