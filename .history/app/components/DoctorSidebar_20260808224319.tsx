"use client";

import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  BadgeCheck,
  Calendar,
  CalendarCheck2,
  ChevronRight,
  CreditCard,
  Home,
  LifeBuoy,
  LineChart,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Users,
  Video,
  X,
} from "lucide-react";

import { signOut } from "firebase/auth";

import {
  auth,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  iconClass: string;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [logoutOpen, setLogoutOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  /* ============================================================
     MENU
  ============================================================ */

  const items: SidebarItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/doctors/dashboard",
        icon: Home,
        iconClass:
          "text-blue-600 dark:text-blue-300",
      },
      {
        label: "Calendar",
        href: "/doctors/dashboard/calendar",
        icon: Calendar,
        iconClass:
          "text-indigo-600 dark:text-indigo-300",
      },
      {
        label: "Appointments",
        href: "/doctors/dashboard/appointments",
        icon: CalendarCheck2,
        iconClass:
          "text-emerald-600 dark:text-emerald-300",
      },
      {
        label: "Teleconsultation",
        href: "/doctors/dashboard/teleconsultation",
        icon: Video,
        iconClass:
          "text-violet-600 dark:text-violet-300",
      },
      {
        label: "Messages",
        href: "/doctors/dashboard/messages",
        icon: MessagesSquare,
        iconClass:
          "text-sky-600 dark:text-sky-300",
      },
      {
        label: "Patients",
        href: "/doctors/dashboard/patients",
        icon: Users,
        iconClass:
          "text-amber-600 dark:text-amber-300",
      },
      {
        label: "Finances",
        href: "/doctors/dashboard/finances",
        icon: CreditCard,
        iconClass:
          "text-cyan-700 dark:text-cyan-300",
      },
      {
        label: "Insurance",
        href: "/doctors/dashboard/insurance",
        icon: ShieldCheck,
        iconClass:
          "text-emerald-700 dark:text-emerald-300",
      },
      {
        label: "Statistics",
        href: "/doctors/dashboard/statistics",
        icon: LineChart,
        iconClass:
          "text-fuchsia-600 dark:text-fuchsia-300",
      },
      {
        label: "Subscriptions",
        href: "/doctors/dashboard/subscriptions",
        icon: BadgeCheck,
        iconClass:
          "text-blue-600 dark:text-blue-300",
      },
      {
        label: "Configuration",
        href: "/doctors/dashboard/configuration",
        icon: Settings,
        iconClass:
          "text-zinc-700 dark:text-zinc-300",
      },
      {
        label: "Support",
        href: "/doctors/dashboard/support",
        icon: LifeBuoy,
        iconClass:
          "text-teal-700 dark:text-teal-300",
      },
      {
        label: "Settings",
        href: "/doctors/dashboard/settings",
        icon: SlidersHorizontal,
        iconClass:
          "text-orange-600 dark:text-orange-300",
      },
    ],
    []
  );

  /* ============================================================
     ACTIVE ITEM
  ============================================================ */

  const isActive = useCallback(
    (href: string) => {
      if (href === "/doctors/dashboard") {
        return pathname === href;
      }

      return Boolean(
        pathname?.startsWith(href)
      );
    },
    [pathname]
  );

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = useCallback(
    async () => {
      if (loggingOut) {
        return;
      }

      setLoggingOut(true);

      try {
        if (auth) {
          await signOut(auth);
        }

        router.replace(
          "/doctors/login"
        );
      } catch (error) {
        console.error(
          "[DoctorSidebar] Logout error:",
          error
        );

        router.replace(
          "/doctors/login"
        );
      } finally {
        setLoggingOut(false);
        setLogoutOpen(false);
        setMobileOpen(false);
      }
    },
    [
      loggingOut,
      router,
    ]
  );

  /* ============================================================
     MENU CONTENT
  ============================================================ */

  function MenuContent({
    mobile = false,
  }: {
    mobile?: boolean;
  }) {
    return (
      <>
        {/* BRAND */}

        <Link
          href="/doctors/dashboard"
          onClick={() => {
            if (mobile) {
              setMobileOpen(false);
            }
          }}
          className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <Stethoscope className="h-5 w-5 text-white" />
          </span>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-black dark:text-white">
              Doctor Space
            </div>

            <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
              Doc Chap Ghana
            </div>
          </div>
        </Link>

        {/* NAVIGATION */}

        <nav className="mt-6 space-y-1">
          {items.map(
            (item) => {
              const active =
                isActive(
                  item.href
                );

              const Icon =
                item.icon;

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  onClick={() => {
                    if (
                      mobile
                    ) {
                      setMobileOpen(
                        false
                      );
                    }
                  }}
                  className={`group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200"
                      : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? "text-blue-700 dark:text-blue-200"
                          : item.iconClass
                      }`}
                    />

                    <span className="truncate">
                      {
                        item.label
                      }
                    </span>
                  </span>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition ${
                      active
                        ? "opacity-100 text-blue-700 dark:text-blue-200"
                        : "text-zinc-400 opacity-0 group-hover:opacity-100 dark:text-zinc-500"
                    }`}
                  />
                </Link>
              );
            }
          )}

          {/* MY ACCOUNT */}

          <Link
            href="/doctors/my-account"
            onClick={() => {
              if (mobile) {
                setMobileOpen(false);
              }
            }}
            className="group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <span className="inline-flex items-center gap-3">
              <Stethoscope className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />

              My account
            </span>

            <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition group-hover:opacity-100" />
          </Link>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={() => {
              setLogoutOpen(
                true
              );
            }}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-red-50 dark:text-zinc-200 dark:hover:bg-red-950/20"
          >
            <span className="inline-flex items-center gap-3">
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-300" />

              Log out
            </span>

            <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition group-hover:opacity-100" />
          </button>
        </nav>

        {/* FOOTER */}

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-3 text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          Complete your professional
          profile to make the most of
          your Doc Chap Ghana doctor
          space.
        </div>
      </>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      {/* ========================================================
          DESKTOP SIDEBAR
      ======================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:flex lg:flex-col">
        <div className="relative h-full overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/8 via-indigo-500/6 to-transparent" />

          <div className="relative min-h-full px-4 py-6">
            <MenuContent />
          </div>
        </div>
      </aside>

      {/* ========================================================
          MOBILE MENU BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() =>
          setMobileOpen(true)
        }
        className="fixed bottom-5 left-5 z-[80] inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl transition hover:bg-blue-500 lg:hidden"
        aria-label="Open doctor menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ========================================================
          MOBILE DRAWER
      ======================================================== */}

      <div
        className={`fixed inset-0 z-[100] lg:hidden ${
          mobileOpen
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
        aria-hidden={
          !mobileOpen
        }
      >
        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${
            mobileOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
          aria-label="Close menu"
        />

        <aside
          className={`absolute left-0 top-0 h-full w-[84vw] max-w-[340px] overflow-y-auto border-r border-zinc-200 bg-white shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-end border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-5">
            <MenuContent mobile />
          </div>
        </aside>
      </div>

      {/* ========================================================
          LOGOUT MODAL
      ======================================================== */}

      {logoutOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Log out confirmation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (
                !loggingOut
              ) {
                setLogoutOpen(
                  false
                );
              }
            }}
            aria-label="Close"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/6 to-transparent" />

            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
                    <LogOut className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <div className="text-base font-semibold text-black dark:text-white">
                      Log out?
                    </div>

                    <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                      You will need to log
                      in again to access
                      your doctor dashboard.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !loggingOut
                    ) {
                      setLogoutOpen(
                        false
                      );
                    }
                  }}
                  className="rounded-xl p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    loggingOut
                  }
                  onClick={() =>
                    setLogoutOpen(
                      false
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                >
                  Stay logged in
                </button>

                <button
                  type="button"
                  disabled={
                    loggingOut
                  }
                  onClick={() =>
                    void handleLogout()
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {loggingOut
                    ? "Logging out..."
                    : "Yes, log out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}