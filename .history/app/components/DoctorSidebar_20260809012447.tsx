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
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";

import {
  signOut,
} from "firebase/auth";

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
  iconBgClass: string;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DoctorSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    logoutOpen,
    setLogoutOpen,
  ] =
    useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  /* ============================================================
     MENU
  ============================================================ */

  const sections: SidebarSection[] =
    useMemo(
      () => [
        {
          label:
            "Workspace",

          items: [
            {
              label:
                "Dashboard",
              href:
                "/doctors/dashboard",
              icon:
                Home,
              iconClass:
                "text-blue-700 dark:text-blue-300",
              iconBgClass:
                "bg-blue-50 dark:bg-blue-950/40",
            },
            {
              label:
                "Schedule",
              href:
                "/doctors/dashboard/schedule",
              icon:
                Calendar,
              iconClass:
                "text-indigo-700 dark:text-indigo-300",
              iconBgClass:
                "bg-indigo-50 dark:bg-indigo-950/40",
            },
            {
              label:
                "Appointments",
              href:
                "/doctors/dashboard/appointments",
              icon:
                CalendarCheck2,
              iconClass:
                "text-emerald-700 dark:text-emerald-300",
              iconBgClass:
                "bg-emerald-50 dark:bg-emerald-950/40",
            },
            {
              label:
                "Teleconsultation",
              href:
                "/doctors/dashboard/teleconsultation",
              icon:
                Video,
              iconClass:
                "text-violet-700 dark:text-violet-300",
              iconBgClass:
                "bg-violet-50 dark:bg-violet-950/40",
            },
            {
              label:
                "Messages",
              href:
                "/doctors/dashboard/messages",
              icon:
                MessagesSquare,
              iconClass:
                "text-sky-700 dark:text-sky-300",
              iconBgClass:
                "bg-sky-50 dark:bg-sky-950/40",
            },
            {
              label:
                "Patients",
              href:
                "/doctors/dashboard/patients",
              icon:
                Users,
              iconClass:
                "text-amber-700 dark:text-amber-300",
              iconBgClass:
                "bg-amber-50 dark:bg-amber-950/40",
            },
          ],
        },
        {
          label:
            "Management",

          items: [
            {
              label:
                "Finances",
              href:
                "/doctors/dashboard/finances",
              icon:
                CreditCard,
              iconClass:
                "text-cyan-700 dark:text-cyan-300",
              iconBgClass:
                "bg-cyan-50 dark:bg-cyan-950/40",
            },
            {
              label:
                "Insurance",
              href:
                "/doctors/dashboard/insurance",
              icon:
                ShieldCheck,
              iconClass:
                "text-emerald-700 dark:text-emerald-300",
              iconBgClass:
                "bg-emerald-50 dark:bg-emerald-950/40",
            },
            {
              label:
                "Statistics",
              href:
                "/doctors/dashboard/statistics",
              icon:
                LineChart,
              iconClass:
                "text-fuchsia-700 dark:text-fuchsia-300",
              iconBgClass:
                "bg-fuchsia-50 dark:bg-fuchsia-950/40",
            },
            {
              label:
                "Subscriptions",
              href:
                "/doctors/dashboard/subscriptions",
              icon:
                BadgeCheck,
              iconClass:
                "text-blue-700 dark:text-blue-300",
              iconBgClass:
                "bg-blue-50 dark:bg-blue-950/40",
            },
          ],
        },
        {
          label:
            "Preferences",

          items: [
            {
              label:
                "Configuration",
              href:
                "/doctors/dashboard/configuration",
              icon:
                Settings,
              iconClass:
                "text-zinc-700 dark:text-zinc-300",
              iconBgClass:
                "bg-zinc-100 dark:bg-zinc-900",
            },
            {
              label:
                "Support",
              href:
                "/doctors/dashboard/support",
              icon:
                LifeBuoy,
              iconClass:
                "text-teal-700 dark:text-teal-300",
              iconBgClass:
                "bg-teal-50 dark:bg-teal-950/40",
            },
            {
              label:
                "Settings",
              href:
                "/doctors/dashboard/settings",
              icon:
                SlidersHorizontal,
              iconClass:
                "text-orange-700 dark:text-orange-300",
              iconBgClass:
                "bg-orange-50 dark:bg-orange-950/40",
            },
          ],
        },
      ],
      []
    );

  /* ============================================================
     ACTIVE ITEM
  ============================================================ */

  const isActive =
    useCallback(
      (
        href: string
      ) => {
        if (
          href ===
          "/doctors/dashboard"
        ) {
          return (
            pathname ===
            href
          );
        }

        return Boolean(
          pathname?.startsWith(
            href
          )
        );
      },
      [
        pathname,
      ]
    );

  const isAccountActive =
    Boolean(
      pathname?.startsWith(
        "/doctors/my-account"
      )
    );

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout =
    useCallback(
      async () => {
        if (
          loggingOut
        ) {
          return;
        }

        setLoggingOut(
          true
        );

        try {
          if (
            auth
          ) {
            await signOut(
              auth
            );
          }

          router.replace(
            "/doctors/login"
          );
        } catch (
          error
        ) {
          console.error(
            "[DoctorSidebar] Logout error:",
            error
          );

          router.replace(
            "/doctors/login"
          );
        } finally {
          setLoggingOut(
            false
          );

          setLogoutOpen(
            false
          );

          setMobileOpen(
            false
          );
        }
      },
      [
        loggingOut,
        router,
      ]
    );

  /* ============================================================
     NAV ITEM
  ============================================================ */

  function SidebarLink({
    item,
    mobile = false,
  }: {
    item: SidebarItem;
    mobile?: boolean;
  }) {
    const active =
      isActive(
        item.href
      );

    const Icon =
      item.icon;

    return (
      <Link
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
        className={`group relative flex items-center justify-between gap-3 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
          active
            ? "border-blue-200 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100"
            : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white"
        }`}
      >
        {active && (
          <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-blue-600" />
        )}

        <span className="inline-flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              active
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : item.iconBgClass
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                active
                  ? "text-white"
                  : item.iconClass
              }`}
            />
          </span>

          <span className="truncate">
            {
              item.label
            }
          </span>
        </span>

        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-all duration-200 ${
            active
              ? "translate-x-0 text-blue-700 opacity-100 dark:text-blue-300"
              : "-translate-x-1 text-zinc-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
          }`}
        />
      </Link>
    );
  }

  /* ============================================================
     MENU CONTENT
  ============================================================ */

  function MenuContent({
    mobile = false,
  }: {
    mobile?: boolean;
  }) {
    return (
      <div className="flex min-h-full flex-col">
        {/* BRAND */}

        <Link
          href="/doctors/dashboard"
          onClick={() => {
            if (
              mobile
            ) {
              setMobileOpen(
                false
              );
            }
          }}
          className="group flex items-center gap-3 rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-3.5 transition-all hover:border-blue-200 hover:shadow-md dark:border-blue-950/60 dark:from-blue-950/30 dark:via-zinc-950 dark:to-cyan-950/20"
        >
          <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/20">
            <Stethoscope className="h-5 w-5 text-white" />

            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black tracking-tight text-[#071b3a] dark:text-white">
              Doctor Space
            </div>

            <div className="mt-0.5 truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Doc Chap Ghana
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* NAVIGATION */}

        <div className="mt-5 flex-1">
          {sections.map(
            (
              section,
              sectionIndex
            ) => (
              <div
                key={
                  section.label
                }
                className={
                  sectionIndex >
                  0
                    ? "mt-5"
                    : ""
                }
              >
                <div className="mb-2 flex items-center gap-2 px-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                    {
                      section.label
                    }
                  </span>

                  <span className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
                </div>

                <nav className="space-y-1">
                  {section.items.map(
                    (
                      item
                    ) => (
                      <SidebarLink
                        key={
                          item.href
                        }
                        item={
                          item
                        }
                        mobile={
                          mobile
                        }
                      />
                    )
                  )}
                </nav>
              </div>
            )
          )}
        </div>

        {/* ACCOUNT */}

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Link
            href="/doctors/my-account"
            onClick={() => {
              if (
                mobile
              ) {
                setMobileOpen(
                  false
                );
              }
            }}
            className={`group relative flex items-center justify-between gap-3 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isAccountActive
                ? "border-blue-200 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100"
                : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white"
            }`}
          >
            {isAccountActive && (
              <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-blue-600" />
            )}

            <span className="inline-flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  isAccountActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                }`}
              >
                <UserRound className="h-4 w-4" />
              </span>

              My account
            </span>

            <ChevronRight
              className={`h-4 w-4 transition ${
                isAccountActive
                  ? "text-blue-700 opacity-100 dark:text-blue-300"
                  : "text-zinc-400 opacity-0 group-hover:opacity-100"
              }`}
            />
          </Link>

          <button
            type="button"
            onClick={() =>
              setLogoutOpen(
                true
              )
            }
            className="group mt-1 flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-700 dark:text-zinc-300 dark:hover:border-red-950/40 dark:hover:bg-red-950/20 dark:hover:text-red-300"
          >
            <span className="inline-flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300">
                <LogOut className="h-4 w-4" />
              </span>

              Log out
            </span>

            <ChevronRight className="h-4 w-4 -translate-x-1 text-red-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </button>

          <div className="mt-4 rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 dark:border-blue-950/50 dark:from-blue-950/30 dark:via-zinc-950 dark:to-cyan-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <BadgeCheck className="h-4 w-4" />
              </div>

              <div>
                <div className="text-xs font-black text-[#071b3a] dark:text-white">
                  Professional profile
                </div>

                <p className="mt-1 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
                  Keep your information and availability up to date.
                </p>

                <Link
                  href="/doctors/dashboard/configuration"
                  onClick={() => {
                    if (
                      mobile
                    ) {
                      setMobileOpen(
                        false
                      );
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-600 dark:text-blue-300"
                >
                  Manage profile

                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
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
        <div className="relative h-full overflow-y-auto border-r border-zinc-200 bg-[#f8fafc] dark:border-zinc-800 dark:bg-[#09090b]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/[0.045] via-indigo-500/[0.025] to-transparent" />

          <div className="relative min-h-full px-4 py-5">
            <MenuContent />
          </div>
        </div>
      </aside>

      {/* ========================================================
          MOBILE BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() =>
          setMobileOpen(
            true
          )
        }
        className="fixed bottom-5 left-5 z-[80] inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-500 lg:hidden"
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
            setMobileOpen(
              false
            )
          }
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
            mobileOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
          aria-label="Close menu"
        />

        <aside
          className={`absolute left-0 top-0 h-full w-[88vw] max-w-[340px] overflow-y-auto border-r border-zinc-200 bg-[#f8fafc] shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-[#09090b] ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
              Doctor menu
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
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
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
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

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent" />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    <LogOut className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                      Log out?
                    </h2>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      You will need to log in again to access your doctor dashboard.
                    </p>
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
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
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {loggingOut ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />

                      Yes, log out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}