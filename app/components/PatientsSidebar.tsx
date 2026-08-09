"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  Building2,
  CalendarDays,
  ChevronRight,
  CreditCard,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type PatientData = {
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
  };
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  iconClass: string;
  activeClass: string;
};

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function PatientSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    patientData,
    setPatientData,
  ] =
    useState<PatientData | null>(
      null
    );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const [
    logoutModalOpen,
    setLogoutModalOpen,
  ] =
    useState(false);

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribePatient:
      | (() => void)
      | null =
      null;

    const stopPatient =
      () => {
        unsubscribePatient?.();
        unsubscribePatient =
          null;
      };

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          stopPatient();

          if (
            !user?.uid
          ) {
            setPatientData(
              null
            );

            return;
          }

          unsubscribePatient =
            onSnapshot(
              doc(
                firestoreInstance,
                "patients",
                user.uid
              ),
              (
                snapshot
              ) => {
                if (
                  !snapshot.exists()
                ) {
                  setPatientData(
                    null
                  );

                  return;
                }

                const data =
                  snapshot.data() as PatientData;

                const accountType =
                  s(
                    data.accountType ||
                      data.role
                  ).toLowerCase();

                if (
                  accountType &&
                  accountType !==
                    "patient"
                ) {
                  setPatientData(
                    null
                  );

                  return;
                }

                setPatientData(
                  data
                );
              },
              (
                error
              ) => {
                if (
                  !firebaseAuthInstance.currentUser
                ) {
                  return;
                }

                console.error(
                  "[PatientsSidebar] Patient profile error:",
                  error
                );
              }
            );
        }
      );

    return () => {
      stopPatient();
      unsubscribeAuth();
    };
  }, []);

  const profile =
    patientData?.profile;

  const patientName =
    useMemo(
      () =>
        s(
          profile?.fullName
        ) ||
        s(
          profile?.displayName
        ) ||
        `${s(
          profile?.firstName
        )} ${s(
          profile?.lastName
        )}`.trim() ||
        "Patient",
      [
        profile,
      ]
    );

  const patientEmail =
    s(
      profile?.email
    );

  const menu: MenuItem[] =
    [
      {
        label:
          "Dashboard",
        href:
          "/patients/dashboard",
        icon:
          LayoutDashboard,
        exact:
          true,
        iconClass:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
        activeClass:
          "bg-blue-600 text-white shadow-md shadow-blue-600/15",
      },
      {
        label:
          "My appointments",
        href:
          "/patients/dashboard/appointments",
        icon:
          CalendarDays,
        iconClass:
          "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300",
        activeClass:
          "bg-violet-600 text-white shadow-md shadow-violet-600/15",
      },
      {
        label:
          "Medical record",
        href:
          "/patients/dashboard/medical-record",
        icon:
          FileHeart,
        iconClass:
          "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
        activeClass:
          "bg-rose-600 text-white shadow-md shadow-rose-600/15",
      },
      {
        label:
          "Teleconsultation",
        href:
          "/patients/dashboard/teleconsultation",
        icon:
          Video,
        iconClass:
          "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300",
        activeClass:
          "bg-sky-600 text-white shadow-md shadow-sky-600/15",
      },
      {
        label:
          "Finances",
        href:
          "/patients/dashboard/finances",
        icon:
          CreditCard,
        iconClass:
          "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-300",
        activeClass:
          "bg-teal-600 text-white shadow-md shadow-teal-600/15",
      },
      {
        label:
          "Find a doctor",
        href:
          "/search?type=doctor",
        icon:
          Stethoscope,
        iconClass:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
        activeClass:
          "bg-emerald-600 text-white shadow-md shadow-emerald-600/15",
      },
      {
        label:
          "Find a clinic",
        href:
          "/search?type=clinic",
        icon:
          Building2,
        iconClass:
          "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300",
        activeClass:
          "bg-cyan-600 text-white shadow-md shadow-cyan-600/15",
      },
      {
        label:
          "Find a pharmacy",
        href:
          "/search?type=pharmacy",
        icon:
          Pill,
        iconClass:
          "bg-lime-50 text-lime-700 dark:bg-lime-950/30 dark:text-lime-300",
        activeClass:
          "bg-lime-600 text-white shadow-md shadow-lime-600/15",
      },
      {
        label:
          "My account",
        href:
          "/patients/dashboard/my-account",
        icon:
          UserRound,
        iconClass:
          "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
        activeClass:
          "bg-amber-500 text-white shadow-md shadow-amber-500/15",
      },
    ];

  function isActive(
    item: MenuItem
  ) {
    if (
      item.href.includes(
        "#"
      )
    ) {
      return false;
    }

    if (
      item.href.startsWith(
        "/search?"
      )
    ) {
      return false;
    }

    if (
      item.exact
    ) {
      return (
        pathname ===
        item.href
      );
    }

    return (
      pathname ===
        item.href ||
      pathname.startsWith(
        `${item.href}/`
      )
    );
  }

  async function handleLogout() {
    const firebaseAuth =
      auth;

    if (
      !firebaseAuth ||
      loggingOut
    ) {
      return;
    }

    setLoggingOut(
      true
    );

    try {
      try {
        window.localStorage.removeItem(
          "docchapghana:account-space"
        );
      } catch {
        // Non-blocking.
      }

      await signOut(
        firebaseAuth
      );

      router.replace(
        "/patients/login"
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "[PatientsSidebar] Logout error:",
        error
      );

      setLoggingOut(
        false
      );
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f2f8f6] dark:bg-zinc-950">
      <div className="border-b border-emerald-950/10 px-5 py-5 dark:border-zinc-800">
        <Link
          href="/patients/dashboard"
          onClick={
            onNavigate
          }
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <HeartPulse className="h-6 w-6" />
          </div>

          <div>
            <div className="text-base font-black text-[#063b34] dark:text-white">
              Doc Chap
            </div>

            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              Patient space
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                {patientName}
              </div>

              {patientEmail && (
                <div className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {patientEmail}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
          My space
        </div>

        <div className="space-y-1.5">
          {menu.map(
            (
              item
            ) => {
              const Icon =
                item.icon;

              const active =
                isActive(
                  item
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  onClick={
                    onNavigate
                  }
                  className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
                    active
                      ? item.activeClass
                      : "text-zinc-700 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/15 text-white"
                        : item.iconClass
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <span className="flex-1">
                    {item.label}
                  </span>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${
                      active
                        ? "text-white/80"
                        : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                </Link>
              );
            }
          )}
        </div>
      </nav>

      <div className="border-t border-emerald-950/10 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={() =>
            setLogoutModalOpen(
              true
            )
          }
          disabled={
            loggingOut
          }
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-5 w-5" />

          <span className="flex-1 text-left">
            {loggingOut
              ? "Logging out..."
              : "Log out"}
          </span>
        </button>
      </div>

      {logoutModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
              <LogOut className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">
              Log out?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Are you sure you want to log out of your Doc Chap Ghana patient account?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setLogoutModalOpen(
                    false
                  )
                }
                disabled={
                  loggingOut
                }
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleLogout()
                }
                disabled={
                  loggingOut
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />

                {loggingOut
                  ? "Logging out..."
                  : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientsSidebar() {
  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-emerald-950/10 lg:block dark:border-zinc-800">
        <PatientSidebarContent />
      </aside>

      <button
        type="button"
        onClick={() =>
          setMobileOpen(
            true
          )
        }
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/25 lg:hidden"
        aria-label="Open patient menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="Close patient menu"
          />

          <aside className="relative h-full w-[86%] max-w-[320px] border-r border-emerald-950/10 shadow-2xl dark:border-zinc-800">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            <PatientSidebarContent
              onNavigate={() =>
                setMobileOpen(
                  false
                )
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}