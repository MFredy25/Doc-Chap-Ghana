import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import {
  ShieldCheck, Lock, UserCircle2, FileText, CreditCard, Server, Globe2,
  Clock, BadgeCheck, Cookie, Scale, Mail, ChevronRight, HeartPulse
} from "lucide-react";

const sections = [
  { id: "intro", title: "Introduction", icon: ShieldCheck },
  { id: "controller", title: "Controller and contact", icon: UserCircle2 },
  { id: "data", title: "Data we process", icon: FileText },
  { id: "sources", title: "Data sources", icon: Globe2 },
  { id: "purposes", title: "Purposes and lawful basis", icon: Scale },
  { id: "sharing", title: "Sharing and processors", icon: Server },
  { id: "transfers", title: "International transfers", icon: Globe2 },
  { id: "retention", title: "Retention", icon: Clock },
  { id: "security", title: "Security", icon: Lock },
  { id: "rights", title: "Your rights", icon: BadgeCheck },
  { id: "children", title: "Children", icon: UserCircle2 },
  { id: "changes", title: "Changes", icon: FileText },
];

function PolicyCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
    <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><h2 className="text-lg font-semibold sm:text-xl">{title}</h2></div>
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">{children}</div>
  </div>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main className="w-full">
        <section className="border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-medium">Trust and privacy</span></div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Privacy Policy</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">This policy explains how <strong>Doc Chap Ghana</strong>, operated by <strong>Mercury Global</strong>, collects, uses, shares and protects personal information when you use our website, applications and healthcare-related services.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Lock, title: "Role-based access", desc: "Access limited to authorised users" },
                { icon: HeartPulse, title: "Health information", desc: "Handled with enhanced care" },
                { icon: CreditCard, title: "Payments", desc: "No full card-number storage" },
              ].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><div><div className="text-sm font-semibold">{item.title}</div><div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{item.desc}</div></div></div></div>; })}
            </div>
            <p className="mt-6 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">This policy is prepared for Doc Chap Ghana and reflects the Data Protection Act, 2012 (Act 843). Last updated: <strong>24 June 2026</strong>.</p>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block"><div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><FileText className="h-5 w-5" /><h2 className="font-semibold">Contents</h2></div>
              <nav className="mt-4 space-y-2">{sections.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#${section.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-teal-900/20"><span className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-4 w-4" /></span>{section.title}</span><ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600" /></a>; })}</nav>
              <div className="mt-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950"><div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Mail className="h-4 w-4" /><div className="text-sm font-semibold">Privacy contact</div></div><p className="mt-2 text-sm"><a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p></div>
            </div></aside>

            <div className="space-y-10">
              <section id="intro" className="scroll-mt-24"><PolicyCard icon={ShieldCheck} title="Introduction"><p>Doc Chap Ghana provides digital tools that can support appointment booking, healthcare-provider discovery, clinic operations, messaging, payments and other healthcare-related services. This policy applies to information processed through those services.</p><p>Where we process health information, we apply additional safeguards appropriate to the sensitivity of that information.</p></PolicyCard></section>
              <section id="controller" className="scroll-mt-24"><PolicyCard icon={UserCircle2} title="1. Data controller and contact"><p><strong>Data controller:</strong> Mercury Global, operator of Doc Chap Ghana.</p><p><strong>Email:</strong> <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p><p>Where a clinic or healthcare professional determines the purpose and means of processing patient information in its own service, that organisation may also act as an independent controller for its relevant processing.</p></PolicyCard></section>
              <section id="data" className="scroll-mt-24"><PolicyCard icon={FileText} title="2. Personal information we may process"><ul className="list-disc space-y-2 pl-6"><li><strong>Account information:</strong> name, email address, phone number, password hash and account role.</li><li><strong>Profile and professional information:</strong> speciality, clinic details, availability, professional documentation and public profile content where applicable.</li><li><strong>Appointment information:</strong> dates, times, appointment type, status and related service details.</li><li><strong>Health information:</strong> only where a user or authorised healthcare organisation uses healthcare-record features.</li><li><strong>Payment information:</strong> amounts, status, method and provider references; full payment-card numbers are not stored by Doc Chap Ghana.</li><li><strong>Technical information:</strong> device, browser, IP address, logs, security events, preferences and cookie identifiers.</li></ul></PolicyCard></section>
              <section id="sources" className="scroll-mt-24"><PolicyCard icon={Globe2} title="3. Sources of information"><ul className="list-disc space-y-2 pl-6"><li>Information you give us through forms, account registration, uploads, support requests or appointments.</li><li>Information submitted by authorised healthcare professionals or clinics in connection with their services.</li><li>Information from payment, messaging, hosting or other technical providers where necessary to operate the service.</li><li>Technical data generated by your device, browser or use of the platform.</li></ul></PolicyCard></section>
              <section id="purposes" className="scroll-mt-24"><PolicyCard icon={Scale} title="4. Purposes and lawful basis"><p>We process information to provide and secure the service, create and manage accounts, arrange appointments, respond to requests, operate payments, maintain records where relevant, improve reliability, prevent fraud and meet legal obligations.</p><p>Processing is carried out in accordance with Ghana’s Data Protection Act, 2012 (Act 843), including where processing is necessary for a service you request, a legal obligation, legitimate operational and security interests, or your consent where consent is required.</p></PolicyCard></section>
              <section id="sharing" className="scroll-mt-24"><PolicyCard icon={Server} title="5. Sharing and service providers"><p>We may share information only when necessary with authorised healthcare professionals and clinics, technical hosting providers, communication providers, payment providers, security and support providers, or authorities where required by law.</p><p>Each recipient is expected to access only the information needed for its authorised purpose.</p></PolicyCard></section>
              <section id="transfers" className="scroll-mt-24"><PolicyCard icon={Globe2} title="6. International transfers"><p>Some technical providers may process information outside Ghana. Where this occurs, we take reasonable steps to use appropriate safeguards and providers capable of protecting personal data in line with applicable requirements.</p></PolicyCard></section>
              <section id="retention" className="scroll-mt-24"><PolicyCard icon={Clock} title="7. Retention"><p>We retain personal information only for as long as needed for the purposes described in this policy, including account management, healthcare operations where applicable, security, dispute resolution and legal obligations. Retention periods can differ depending on the nature of the data and the service used.</p></PolicyCard></section>
              <section id="security" className="scroll-mt-24"><PolicyCard icon={Lock} title="8. Security"><p>We use measures designed to protect information from unauthorised access, loss, misuse, alteration or disclosure. These measures may include access controls, authentication, encryption in transit, audit logging, backups and security monitoring.</p><p>No internet service can guarantee absolute security. Users should protect their passwords, use trusted devices and report suspected unauthorised access promptly.</p></PolicyCard></section>
              <section id="rights" className="scroll-mt-24"><PolicyCard icon={BadgeCheck} title="9. Your rights"><p>Subject to applicable law, you may have rights to be informed, access personal information, request correction of inaccurate information, object to certain processing, withdraw consent where processing depends on consent, and complain about unlawful processing.</p><p>To submit a request, email <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a>. You may also raise a concern with Ghana’s Data Protection Commission.</p></PolicyCard></section>
              <section id="children" className="scroll-mt-24"><PolicyCard icon={UserCircle2} title="10. Children"><p>Where services involve children or minors, the relevant parent, guardian, clinic or healthcare professional is responsible for ensuring that any required authority, consent and safeguarding obligations are met.</p></PolicyCard></section>
              <section id="changes" className="scroll-mt-24"><PolicyCard icon={FileText} title="11. Changes to this policy"><p>We may update this policy as the platform, applicable law or our practices change. The latest version will be posted on this page with an updated date.</p><p>See also our <Link href="/legal-notice" className="underline font-medium">Legal Notice</Link> and <Link href="/cookies" className="underline font-medium">Cookie Policy</Link>.</p></PolicyCard></section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
