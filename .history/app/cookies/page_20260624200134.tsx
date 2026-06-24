import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import {
  Cookie, ShieldCheck, Lock, BarChart3, Settings2, Mail, ChevronRight,
  FileText, Globe2, Clock, CheckCircle2
} from "lucide-react";

const sections = [
  { id: "overview", title: "Overview", icon: Cookie },
  { id: "what", title: "What cookies are", icon: FileText },
  { id: "types", title: "Cookies we use", icon: Settings2 },
  { id: "choices", title: "Your choices", icon: CheckCircle2 },
  { id: "third", title: "Third-party services", icon: Globe2 },
  { id: "retention", title: "Cookie duration", icon: Clock },
  { id: "updates", title: "Updates", icon: FileText },
  { id: "contact", title: "Contact", icon: Mail },
];

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
    <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><h2 className="text-lg font-semibold sm:text-xl">{title}</h2></div>
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">{children}</div>
  </div>;
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main className="w-full">
        <section className="border-b border-gray-200 bg-gradient-to-b from-teal-50 to-white dark:border-gray-800 dark:from-teal-900/20 dark:to-gray-950">
          <div className="w-full px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Cookie className="h-5 w-5" /><span className="text-sm font-medium">Website preferences</span></div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Cookie Policy</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">This Cookie Policy explains how Doc Chap Ghana uses cookies and similar technologies on its website and services.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Lock, title: "Essential cookies", desc: "Security, session and core features" },
                { icon: Settings2, title: "Preference cookies", desc: "Remember selected settings" },
                { icon: BarChart3, title: "Analytics", desc: "Only where enabled and permitted" },
              ].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-5 w-5" /></span><div><div className="text-sm font-semibold">{item.title}</div><div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{item.desc}</div></div></div></div>; })}
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block"><div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Cookie className="h-5 w-5" /><h2 className="font-semibold">Contents</h2></div>
              <nav className="mt-4 space-y-2">{sections.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#${section.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-teal-900/20"><span className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Icon className="h-4 w-4" /></span>{section.title}</span><ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600" /></a>; })}</nav>
              <div className="mt-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-800 dark:from-teal-900/20 dark:to-gray-950"><div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><Mail className="h-4 w-4" /><div className="text-sm font-semibold">Contact</div></div><p className="mt-2 text-sm"><a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a></p></div>
            </div></aside>
            <div className="space-y-10">
              <section id="overview" className="scroll-mt-24"><Card icon={Cookie} title="Overview"><p>Cookies are small text files placed on your device by a website. They help websites work properly, keep services secure and remember choices.</p><p>Doc Chap Ghana uses cookies and related technologies only as described in this policy and in line with applicable data-protection requirements.</p></Card></section>
              <section id="what" className="scroll-mt-24"><Card icon={FileText} title="1. What cookies are"><p>Cookies may be set by Doc Chap Ghana directly (first-party cookies) or by carefully selected providers that support technical functions such as authentication, security, hosting, payments or analytics.</p><p>Similar technologies can include local storage, session storage and device identifiers. This policy refers to all of them as “cookies”.</p></Card></section>
              <section id="types" className="scroll-mt-24"><Card icon={Settings2} title="2. Cookies we use"><div className="space-y-4"><div><p className="font-semibold">Strictly necessary cookies</p><p>These are needed for the website and account features to work, including authentication, load balancing, session management, security and fraud prevention. They cannot normally be disabled through our site because the service may not function correctly without them.</p></div><div><p className="font-semibold">Preference cookies</p><p>These remember choices such as language, user-interface settings or consent preferences where those features are enabled.</p></div><div><p className="font-semibold">Analytics cookies</p><p>Analytics technologies may be used to understand how visitors use the site and to improve performance. Where consent is required for non-essential analytics, they will be activated only after the required choice is made.</p></div></div></Card></section>
              <section id="choices" className="scroll-mt-24"><Card icon={CheckCircle2} title="3. Your cookie choices"><p>You can control cookies through the cookie controls made available on the site, where applicable, and through your browser settings. Browser settings can usually block or delete cookies.</p><p>Blocking essential cookies may affect sign-in, security and other core features of Doc Chap Ghana.</p></Card></section>
              <section id="third" className="scroll-mt-24"><Card icon={Globe2} title="4. Third-party services"><p>Where we use third-party technical services, such as cloud infrastructure, authentication, payment processing, messaging or analytics, those services may use their own cookies or similar technologies. Their processing is subject to their own notices and terms.</p></Card></section>
              <section id="retention" className="scroll-mt-24"><Card icon={Clock} title="5. Cookie duration"><p>Some cookies expire when you close your browser (session cookies). Others remain for a longer period so that your preferences can be remembered. The duration depends on the purpose of each cookie and the configuration of the relevant service.</p></Card></section>
              <section id="updates" className="scroll-mt-24"><Card icon={FileText} title="6. Updates to this policy"><p>We may update this Cookie Policy if our technology or legal requirements change. The newest version will always be available on this page.</p><p>Read our <Link href="/privacy" className="underline font-medium">Privacy Policy</Link> and <Link href="/legal-notice" className="underline font-medium">Legal Notice</Link> for more information.</p></Card></section>
              <section id="contact" className="scroll-mt-24"><Card icon={Mail} title="7. Contact"><p>Questions about cookies can be sent to <a className="underline font-medium" href="mailto:contact@doc-chap.com">contact@doc-chap.com</a>.</p><p className="text-sm text-gray-500 dark:text-gray-400">Last updated: 24 June 2026.</p></Card></section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
