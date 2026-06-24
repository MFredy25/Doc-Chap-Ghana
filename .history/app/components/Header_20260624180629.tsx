"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  HeartPulse,
  LogIn,
  Menu,
  Search,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/clinics", label: "Clinics", icon: Building2 },
  { href: "/pharmacies", label: "Pharmacies", icon: HeartPulse },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex min-h-16 w-full items-center gap-3 px-3 sm:px-4 lg:px-6 xl:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Doc Chap Ghana"
        >
          <Image
            src="/images/doc-chap.png"
            alt="Doc Chap Ghana"
            width={40}
            height={40}
            priority
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
          />

          <span className="hidden max-w-[190px] truncate text-lg font-semibold text-gray-900 dark:text-white sm:block">
            Doc Chap Ghana
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-[10px] bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-md transition hover:bg-teal-500"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          <Link
            href="/contact"
            className="rounded-[10px] bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-md transition hover:bg-teal-500"
          >
            Contact
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-[10px] bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-teal-500"
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 rounded-[10px] border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 dark:border-teal-500 dark:text-white dark:hover:bg-teal-600/20"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="ml-auto inline-flex items-center justify-center rounded-[10px] p-2 text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 xl:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                Menu
              </span>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-[10px] p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
              >
                Home
              </Link>

              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}

              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
              >
                Contact
              </Link>

              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
                >
                  <UserPlus className="h-5 w-5" />
                  Sign up
                </Link>

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 py-3 text-sm font-semibold text-teal-700 dark:border-teal-500 dark:text-white"
                >
                  <LogIn className="h-5 w-5" />
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}