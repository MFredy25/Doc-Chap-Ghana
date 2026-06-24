"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Stethoscope,
  UserPlus,
  LogIn,
  Menu,
  X,
  Mail,
  BookOpenText,
} from "lucide-react";

function ActionButton({
  href,
  label,
  icon: Icon,
  variant = "solid",
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  variant?: "solid" | "outline";
  onClick?: () => void;
}) {
  const base =
    "flex min-w-0 shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium shadow-md transition-colors whitespace-nowrap lg:px-4";

  const solid =
    "bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700";

  const outline =
    "border border-teal-600 text-teal-700 hover:bg-teal-50 active:bg-teal-100 dark:border-teal-500 dark:text-white dark:hover:bg-teal-600/20";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${base} ${variant === "solid" ? solid : outline}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-w-0 shrink items-center gap-2 rounded-[10px] bg-teal-600 px-2 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-teal-500 active:bg-teal-700 whitespace-nowrap xl:px-3"
    >
      <Icon className="h-4 w-4 shrink-0 text-white" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hrefHome = "/";
  const hrefPatients = "/patients";
  const hrefDoctors = "/doctors";
  const hrefClinics = "/clinics";
  const hrefContact = "/contact";

  const hrefSignup = "/signup";
  const hrefLogin = "/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, mobileOpen]);

  const desktopNav = (
    <nav className="flex min-w-0 flex-wrap items-center justify-center gap-2 xl:flex-nowrap">
      <NavItem href={hrefPatients} label="Patients" icon={Users} />
      <NavItem href={hrefDoctors} label="Doctors" icon={Stethoscope} />
      <NavItem href={hrefClinics} label="Clinics" icon={Building2} />
      <NavItem href={hrefContact} label="Contact" icon={Mail} />
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex min-h-16 w-full items-center gap-3 px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex min-w-0 shrink-0 items-center">
            <Link
              href={hrefHome}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
              aria-label="Doc Chap Ghana"
            >
              <Image
                src="/images/doc-chap.png"
                alt="Doc Chap Ghana"
                width={40}
                height={40}
                className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
                priority
              />

              <span className="hidden max-w-[150px] truncate text-lg font-semibold text-gray-900 dark:text-white sm:block md:max-w-[190px] lg:max-w-[210px]">
                Doc Chap Ghana
              </span>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center overflow-hidden xl:flex">
            {desktopNav}
          </div>

          <div className="ml-auto hidden min-w-0 shrink items-center justify-end gap-2 xl:flex">
            <ActionButton
              href={hrefSignup}
              label="Sign up"
              icon={UserPlus}
              variant="solid"
            />

            <ActionButton
              href={hrefLogin}
              label="Log in"
              icon={LogIn}
              variant="outline"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="ml-auto inline-flex items-center justify-center rounded-[10px] p-2 text-gray-700 hover:bg-gray-100 xl:hidden dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {mounted && mobileOpen ? (
        <div className="fixed inset-0 z-[9999] xl:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                Menu
              </span>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-[10px] p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <Link
                href={hrefHome}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-white shadow-md hover:bg-teal-500 active:bg-teal-700"
              >
                <span className="text-sm font-semibold">Home</span>
              </Link>

              <NavItem
                href={hrefPatients}
                label="Patients"
                icon={Users}
                onClick={() => setMobileOpen(false)}
              />

              <NavItem
                href={hrefDoctors}
                label="Doctors"
                icon={Stethoscope}
                onClick={() => setMobileOpen(false)}
              />

              <NavItem
                href={hrefClinics}
                label="Clinics"
                icon={Building2}
                onClick={() => setMobileOpen(false)}
              />

              

              <NavItem
                href={hrefContact}
                label="Contact"
                icon={Mail}
                onClick={() => setMobileOpen(false)}
              />

              <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                <ActionButton
                  href={hrefSignup}
                  label="Sign up"
                  icon={UserPlus}
                  variant="solid"
                  onClick={() => setMobileOpen(false)}
                />

                <ActionButton
                  href={hrefLogin}
                  label="Log in"
                  icon={LogIn}
                  variant="outline"
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}