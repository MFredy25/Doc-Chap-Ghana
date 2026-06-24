"use client";

import Link from "next/link";
import {
  Building2,
  Cookie,
  FileSignature,
  FileText,
  HeartPulse,
  Home,
  Mail,
  Phone,
  Scale,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-teal-600 px-4 py-10 text-white">
      <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-8 text-sm sm:grid-cols-3 sm:text-base lg:grid-cols-5">
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider">
            Navigation
          </h3>

          <ul className="space-y-3">
            <FooterItem href="/" icon={Home} label="Home" />
            <FooterItem href="/about" icon={Users} label="About us" />
            <FooterItem href="/help" icon={FileText} label="Help & FAQ" />
            <FooterItem href="/blog" icon={FileText} label="Blog" />
            <FooterItem href="/clinics" icon={Building2} label="Find a clinic" />
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider">
            For professionals
          </h3>

          <ul className="space-y-3">
            <FooterItem
              href="/doctors/signup"
              icon={Stethoscope}
              label="I am a doctor"
            />

            <FooterItem
              href="/clinics/signup"
              icon={Building2}
              label="List my clinic"
            />

            <FooterItem
              href="/nurses"
              icon={HeartPulse}
              label="I am a nurse"
            />

            <FooterItem
              href="/midwives"
              icon={UserRound}
              label="I am a midwife"
            />

            <FooterItem
              href="/pharmacies"
              icon={Building2}
              label="List my pharmacy"
            />

            <FooterItem
              href="/patients"
              icon={Users}
              label="I am a patient"
            />
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider">
            Legal
          </h3>

          <ul className="space-y-3">
            <FooterItem
              href="/legal-notice"
              icon={Scale}
              label="Legal notice"
            />

            <FooterItem
              href="/privacy"
              icon={ShieldCheck}
              label="Privacy policy"
            />

            <FooterItem href="/cookies" icon={Cookie} label="Cookies" />

            <FooterItem
              href="/terms-of-sale"
              icon={FileText}
              label="Terms of sale"
            />

            <FooterItem
              href="/terms-of-use"
              icon={FileSignature}
              label="Terms of use"
            />
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider">
            Contact
          </h3>

          <div className="space-y-3 text-sm text-white/90">
            <div className="flex items-start gap-2">
              <Building2 className="mt-1 h-4 w-4 shrink-0" />
              <span>
                Mercury Global
                <br />
                Ghana
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:contact@doc-chap.com"
                className="hover:underline"
              >
                contact@doc-chap.com
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>Contact details coming soon</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider">
            Follow us
          </h3>

          <div className="flex gap-4">
            <SocialIcon
              href="https://www.facebook.com/profile.php?id=61585620164450"
              label="Facebook"
              icon={<FacebookIcon />}
            />

            <SocialIcon
              href="https://www.instagram.com/doc_chap/"
              label="Instagram"
              icon={<InstagramIcon />}
            />

            <SocialIcon
              href="https://www.linkedin.com/company/doc-chap/"
              label="LinkedIn"
              icon={<LinkedInIcon />}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <a
              href="https://apps.apple.com/us/app/doc-chap/id6754101364"
              target="_blank"
              rel="noopener noreferrer"
              className="w-[150px] transition hover:opacity-90"
            >
              <img
                src="/images/disponible-sur-apple.png"
                alt="Download on the App Store"
                className="block h-auto w-full"
              />
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.verichaptechnology.docchap.doc_chap"
              target="_blank"
              rel="noopener noreferrer"
              className="w-[150px] transition hover:opacity-90"
            >
              <img
                src="/images/disponible-sur-google.png"
                alt="Get it on Google Play"
                className="block h-auto w-full"
              />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-white/20 pt-5">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-2 text-center text-xs text-white/90 sm:flex-row sm:text-left sm:text-sm">
          <p>
            Developed by{" "}
            <a
              href="https://www.mercuryglobal.fr/accueil-page"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              Mercury Global
            </a>{" "}
            — Doc Chap and Doc Chap Pro are Mercury Global brands.
          </p>

          <span>© {new Date().getFullYear()} — All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}

function FooterItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 text-white transition hover:underline"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
    >
      {icon}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-current text-white"
    >
      <path d="M13.7 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.8V13h2.7v8h3.2Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-current text-white"
    >
      <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.2 2A3 3 0 0 0 4 7v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm10.3 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 6.5A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5Zm0 2A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 fill-current text-white"
    >
      <path d="M6.5 8.3H3.4V20h3.1V8.3ZM5 3a1.8 1.8 0 1 0 0 3.6A1.8 1.8 0 0 0 5 3Zm15.6 9.9c0-3.5-1.9-5.1-4.4-5.1-2 0-2.9 1.1-3.4 1.9V8.3H9.7V20h3.1v-5.8c0-1.5.3-3 2.2-3 1.9 0 1.9 1.8 1.9 3.1V20H20v-6.6l.6-.5Z" />
    </svg>
  );
}