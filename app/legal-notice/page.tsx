import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import {
  Scale, Building2, Server, Stethoscope, ShieldCheck, Cookie,
  AlertTriangle, Gavel, Mail, ChevronRight, BadgeCheck, Pill, Lock
} from "lucide-react";

const sections = [
  { id: "publisher", title: "Publisher", icon: Building2 },
  { id: "hosting", title: "Hosting", icon: Server },
  { id: "service", title: "Purpose of the service", icon: Stethoscope },
  { id: "health", title: "Healthcare framework", icon: Scale },
  { id: "professionals", title: "Healthcare professionals", icon: BadgeCheck },
  { id: "teleconsultation", title: "Teleconsultation", icon: Stethoscope },
  { id: "privacy", title: "Personal data", icon: ShieldCheck },
  { id: "cookies", title: "Cookies", icon: Cookie },
  { id: "payments", title: "Payments", icon: Server },
  { id: "pharmacies", title: "Pharmacies", icon: Pill },
  { id: "ip", title: "Intellectual property", icon: Lock },
  { id: "liability", title: "Liability", icon: AlertTriangle },
  { id: "law", title: "Applicable law", icon: Gavel },
  { id: "contact", title: "Contact", icon: Mail },
];

function LegalCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">{children}</div>
    </div>
  );
}

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main className="w-full">
        <section className="border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Scale className="h-5 w-5" /><span className="text-sm font-medium">Legal information</span></div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Legal Notice</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              This page sets out the legal information for <strong>Doc Chap Ghana</strong>, a digital healthcare service operated by <strong>Mercury Global</strong>. It covers the publisher, hosting, service purpose, privacy, security and user responsibilities.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Building2, title: "Publisher", desc: "Mercury Global — Doc Chap operator" },
                { icon: Server, title: "Hosting", desc: "Secure cloud infrastructure" },
                { icon: ShieldCheck, title: "Privacy", desc: "Data Protection Act, 2012 (Act 843)" },
              ].map((item) => {
                const Icon = item.icon;
                return <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><div><div className="text-sm font-semibold">{item.title}</div><div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{item.desc}</div></div></div></div>;
              })}
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><BadgeCheck className="h-5 w-5" /><h2 className="font-semibold">Contents</h2></div>
                <nav className="mt-4 space-y-2">
                  {sections.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#${section.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-teal-900/20"><span className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-4 w-4" /></span>{section.title}</span><ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600" /></a>; })}
                </nav>
                <div className="mt-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Mail className="h-4 w-4" /><div className="text-sm font-semibold">Contact</div></div>
                  <p className="mt-2 text-sm"><a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p>
                </div>
              </div>
            </aside>

            <div className="space-y-10">
              <section id="publisher" className="scroll-mt-24"><LegalCard icon={Building2} title="1. Website and application publisher"><p className="font-semibold">Mercury Global</p><p>Doc Chap Ghana is a Doc Chap digital healthcare service operated by Mercury Global.</p><p><strong>Publisher:</strong> Mercury Global</p><p><strong>Contact:</strong> <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p><p>The publication director is the legal representative of Mercury Global.</p></LegalCard></section>
              <section id="hosting" className="scroll-mt-24"><LegalCard icon={Server} title="2. Hosting"><p>Doc Chap Ghana uses secure cloud infrastructure, including Google Cloud and Firebase services where applicable.</p><p>Data may be processed in locations outside Ghana by carefully selected technical providers. Appropriate technical, organisational and contractual safeguards are used to protect confidentiality and security.</p></LegalCard></section>
              <section id="service" className="scroll-mt-24"><LegalCard icon={Stethoscope} title="3. Purpose of the service"><p>Doc Chap Ghana is a technology platform designed to support access to healthcare services and the organisation of care.</p><ul className="list-disc space-y-2 pl-6"><li>Search for doctors, clinics, pharmacies and other healthcare providers;</li><li>Appointment booking and management;</li><li>Teleconsultation where offered by authorised healthcare professionals;</li><li>Schedule management, patient records, documents and authorised messaging;</li><li>Payment-related services and administrative tools for healthcare organisations.</li></ul><p>Doc Chap Ghana is not a medical provider. It does not diagnose, prescribe or replace a healthcare professional.</p><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10"><div className="flex gap-2 text-amber-800 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>Do not use Doc Chap Ghana for medical emergencies. Contact the appropriate emergency services or seek urgent in-person care.</p></div></div></LegalCard></section>
              <section id="health" className="scroll-mt-24"><LegalCard icon={Scale} title="4. Healthcare framework"><p>Healthcare professionals and facilities using Doc Chap Ghana remain responsible for complying with the Ghanaian laws, professional standards, licensing requirements and ethical obligations that apply to their practice.</p><p>Doc Chap Ghana is intended as a digital tool for access, coordination and administration. It does not grant a licence to practise medicine, nursing, midwifery, pharmacy or any other regulated healthcare profession.</p></LegalCard></section>
              <section id="professionals" className="scroll-mt-24"><LegalCard icon={BadgeCheck} title="5. Healthcare professionals and facilities"><p>Healthcare professionals, clinics, pharmacies and other organisations using the platform remain responsible for their qualifications, registrations, licences, services, clinical decisions, prescriptions, advice, patient care and compliance with professional confidentiality obligations.</p><p>Doc Chap Ghana may request supporting documentation to verify the declared professional or organisational status of a listed provider.</p></LegalCard></section>
              <section id="teleconsultation" className="scroll-mt-24"><LegalCard icon={Stethoscope} title="6. Teleconsultation"><p>Teleconsultation is carried out by the healthcare professional who offers it. The healthcare professional remains solely responsible for assessing whether a remote consultation is appropriate, for clinical decisions, advice, prescriptions and follow-up.</p><p>Where teleconsultation is used, the patient should be informed about the remote nature of the consultation and provide any consent required before the consultation begins.</p></LegalCard></section>
              <section id="privacy" className="scroll-mt-24"><LegalCard icon={ShieldCheck} title="7. Personal data and health information"><p>Doc Chap Ghana may process personal data and, depending on the service used, health information. Processing is governed by our <Link href="/privacy" className="underline font-medium">Privacy Policy</Link> and by Ghana’s Data Protection Act, 2012 (Act 843).</p><p>Questions about privacy can be sent to <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a>.</p></LegalCard></section>
              <section id="cookies" className="scroll-mt-24"><LegalCard icon={Cookie} title="8. Cookies"><p>Our use of cookies and similar technologies is described in the <Link href="/cookies" className="underline font-medium">Cookie Policy</Link>.</p></LegalCard></section>
              <section id="payments" className="scroll-mt-24"><LegalCard icon={Server} title="9. Payments and third-party services"><p>Some services may involve third-party providers, including payment processors, messaging, video or identity-verification services. Those providers may have their own terms and privacy notices.</p><p>Doc Chap Ghana does not store full payment-card numbers when payments are processed through external payment providers.</p></LegalCard></section>
              <section id="pharmacies" className="scroll-mt-24"><LegalCard icon={Pill} title="10. Pharmacies and medicines"><p>Pharmacies remain responsible for the products, advice, dispensing, delivery arrangements and regulatory compliance associated with their services. Information displayed on the platform does not replace professional pharmaceutical advice.</p></LegalCard></section>
              <section id="ip" className="scroll-mt-24"><LegalCard icon={Lock} title="11. Intellectual property"><p>The Doc Chap name, logos, interface, software, text, graphics and other platform content are protected by intellectual-property rights. They may not be copied, reproduced, modified or used without prior written permission, except where permitted by law.</p></LegalCard></section>
              <section id="liability" className="scroll-mt-24"><LegalCard icon={AlertTriangle} title="12. Liability"><p>Doc Chap Ghana provides a technology service. Healthcare professionals and facilities remain responsible for clinical acts and decisions. Users must provide accurate information and keep their account credentials secure.</p><p>To the extent permitted by applicable law, Mercury Global is not liable for indirect losses, a user’s misuse of the platform, internet failures outside its control, or clinical decisions made by healthcare professionals.</p></LegalCard></section>
              <section id="law" className="scroll-mt-24"><LegalCard icon={Gavel} title="13. Applicable law"><p>These legal notices are intended for Doc Chap Ghana and are governed by the applicable laws of Ghana. Any dispute should first be raised with us using the contact information below.</p></LegalCard></section>
              <section id="contact" className="scroll-mt-24"><LegalCard icon={Mail} title="14. Contact"><p>For questions about Doc Chap Ghana, contact <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a>.</p><p className="text-sm text-gray-500 dark:text-gray-400">Last updated: 24 June 2026.</p></LegalCard></section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
