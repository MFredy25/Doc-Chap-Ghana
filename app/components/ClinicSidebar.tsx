"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  BadgeCheck,
  Building2,
  Calendar,
  CalendarCheck2,
  ChevronRight,
  CircleDollarSign,
  Headphones,
  LayoutDashboard,
  LineChart,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
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
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type ClinicData = {
  uid?: string;
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
    city?: string;
    logoUrl?: string | null;
  };

  clinic?: {
    type?: string;
    verified?: boolean;
    verificationStatus?: string;
  };
};

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  iconClass: string;
};

/* ============================================================
   HELPERS
============================================================ */

function safeString(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function clinicNameFromData(
  data: ClinicData | null,
  user: User | null
): string {
  return (
    safeString(
      data?.profile?.clinicName
    ) ||
    safeString(
      data?.profile?.displayName
    ) ||
    safeString(
      data?.profile?.fullName
    ) ||
    safeString(
      user?.displayName
    ) ||
    "My clinic"
  );
}

function verificationFromData(
  data: ClinicData | null
) {
  const status =
    safeString(
      data?.clinic
        ?.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    status,
    verified:
      data?.clinic
        ?.verified ===
        true ||
      status ===
        "verified" ||
      status ===
        "approved",
  };
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function ClinicSidebar() {
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

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    firebaseUser,
    setFirebaseUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    clinicData,
    setClinicData,
  ] =
    useState<ClinicData | null>(
      null
    );

  /* ============================================================
     FIREBASE / CLINIC PROFILE
  ============================================================ */

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setLoading(false);

      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribeClinic:
      | (() => void)
      | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (
          user
        ) => {
          unsubscribeClinic?.();
          unsubscribeClinic =
            null;

          setFirebaseUser(
            user
          );

          if (
            !user?.uid
          ) {
            setClinicData(
              null
            );

            setLoading(
              false
            );

            return;
          }

          const clinicRef =
            doc(
              firestoreInstance,
              "clinics",
              user.uid
            );

          unsubscribeClinic =
            onSnapshot(
              clinicRef,
              (
                snapshot
              ) => {
                if (
                  snapshot.exists()
                ) {
                  setClinicData(
                    snapshot.data() as ClinicData
                  );
                } else {
                  setClinicData(
                    null
                  );
                }

                setLoading(
                  false
                );
              },
              (
                error
              ) => {
                console.error(
                  "[ClinicSidebar] Clinic realtime error:",
                  error
                );

                setClinicData(
                  null
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeClinic?.();
    };
  }, []);

  /* ============================================================
     BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (
      !mobileOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    mobileOpen,
  ]);

  /* ============================================================
     DATA
  ============================================================ */

  const clinicName =
    useMemo(
      () =>
        clinicNameFromData(
          clinicData,
          firebaseUser
        ),
      [
        clinicData,
        firebaseUser,
      ]
    );

  const verification =
    useMemo(
      () =>
        verificationFromData(
          clinicData
        ),
      [
        clinicData,
      ]
    );

  const items:
    SidebarItem[] =
    useMemo(
      () => [
        {
          label:
            "Dashboard",
          href:
            "/clinics/dashboard",
          icon:
            LayoutDashboard,
          iconClass:
            "text-blue-600",
        },
        {
          label:
            "Schedule",
          href:
            "/clinics/dashboard/schedule",
          icon:
            Calendar,
          iconClass:
            "text-cyan-600",
        },
        {
          label:
            "Appointments",
          href:
            "/clinics/dashboard/appointments",
          icon:
            CalendarCheck2,
          iconClass:
            "text-indigo-600",
        },
        {
          label:
            "Teleconsultation",
          href:
            "/clinics/dashboard/teleconsultation",
          icon:
            Video,
          iconClass:
            "text-violet-600",
        },
        {
          label:
            "Messages",
          href:
            "/clinics/dashboard/messages",
          icon:
            MessageCircle,
          iconClass:
            "text-sky-600",
        },
        {
          label:
            "Healthcare team",
          href:
            "/clinics/dashboard/team",
          icon:
            Stethoscope,
          iconClass:
            "text-emerald-600",
        },
        {
          label:
            "Patients",
          href:
            "/clinics/dashboard/patients",
          icon:
            Users,
          iconClass:
            "text-rose-600",
        },
        {
          label:
            "Finances",
          href:
            "/clinics/dashboard/finances",
          icon:
            CircleDollarSign,
          iconClass:
            "text-lime-600",
        },
        {
          label:
            "Insurance",
          href:
            "/clinics/dashboard/insurance",
          icon:
            ShieldCheck,
          iconClass:
            "text-teal-700",
        },
        {
          label:
            "Statistics",
          href:
            "/clinics/dashboard/statistics",
          icon:
            LineChart,
          iconClass:
            "text-orange-600",
        },
        {
          label:
            "Subscriptions",
          href:
            "/clinics/dashboard/subscriptions",
          icon:
            BadgeCheck,
          iconClass:
            "text-amber-600",
        },
        {
          label:
            "Configuration",
          href:
            "/clinics/dashboard/configuration",
          icon:
            SlidersHorizontal,
          iconClass:
            "text-purple-600",
        },
        {
          label:
            "Support",
          href:
            "/clinics/dashboard/support",
          icon:
            Headphones,
          iconClass:
            "text-pink-600",
        },
        {
          label:
            "Settings",
          href:
            "/clinics/dashboard/settings",
          icon:
            Settings,
          iconClass:
            "text-zinc-500",
        },
      ],
      []
    );

  function isActive(
    href: string
  ): boolean {
    if (
      href ===
      "/clinics/dashboard"
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
  }

  /* ============================================================
     LOGOUT
  ============================================================ */

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
      await signOut(
        firebaseAuth
      );

      try {
        window.localStorage.removeItem(
          "docchapghana:account-space"
        );
      } catch {
        // Non-blocking.
      }

      setLogoutOpen(
        false
      );

      setMobileOpen(
        false
      );

      router.replace(
        "/clinics/login"
      );
    } catch (
      error
    ) {
      console.error(
        "[ClinicSidebar] Logout error:",
        error
      );
    } finally {
      setLoggingOut(
        false
      );
    }
  }

  /* ============================================================
     CONTENT
  ============================================================ */

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#eef3f8] dark:bg-zinc-950">
      {/* CLINIC IDENTITY */}

      <div className="border-b border-zinc-200/80 px-4 py-5 dark:border-zinc-800">
        <Link
          href="/clinics/dashboard"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/70 dark:hover:bg-zinc-900"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/15">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
              {loading
                ? "Loading..."
                : clinicName}
            </div>

            <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Doc Chap Ghana
            </div>
          </div>
        </Link>

        <div className="mt-3 px-2">
          {verification.verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" />

              Verified clinic
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <LockKeyhole className="h-3.5 w-3.5" />

              Verification{" "}
              {verification.status}
            </span>
          )}
        </div>
      </div>

      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.17em] text-zinc-400">
          Clinic workspace
        </div>

        <nav className="space-y-1.5">
          {items.map(
            (
              item
            ) => {
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
                  onClick={() =>
                    setMobileOpen(
                      false
                    )
                  }
                  className={`group flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-blue-200 bg-white text-blue-700 shadow-sm dark:border-blue-900/50 dark:bg-zinc-900 dark:text-blue-300"
                      : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-white/80 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "bg-white/80 dark:bg-zinc-900"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${item.iconClass}`}
                    />
                  </div>

                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition ${
                      active
                        ? "text-blue-500"
                        : "text-zinc-300 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            }
          )}
        </nav>

        <div className="my-4 border-t border-zinc-200/80 dark:border-zinc-800" />

        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.17em] text-zinc-400">
          Account
        </div>

        <Link
          href="/clinics/my-account"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className={`group flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
            pathname?.startsWith(
              "/clinics/my-account"
            )
              ? "border-blue-200 bg-white text-blue-700 shadow-sm dark:border-blue-900/50 dark:bg-zinc-900 dark:text-blue-300"
              : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-white/80 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-zinc-900">
            <UserRound className="h-4 w-4 text-blue-600" />
          </div>

          <span className="min-w-0 flex-1 truncate">
            My clinic account
          </span>

          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100" />
        </Link>

        <button
          type="button"
          onClick={() =>
            setLogoutOpen(
              true
            )
          }
          className="mt-1.5 flex min-h-11 w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:border-red-100 hover:bg-red-50 dark:text-red-300 dark:hover:border-red-900/40 dark:hover:bg-red-950/20"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
            <LogOut className="h-4 w-4" />
          </div>

          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}

      <aside className="fixed inset-y-0 left-0 z-[60] hidden w-72 border-r border-zinc-200 bg-[#eef3f8] lg:block dark:border-zinc-800 dark:bg-zinc-950">
        {sidebarContent}
      </aside>

      {/* MOBILE FLOATING BUTTON */}

      <button
        type="button"
        onClick={() =>
          setMobileOpen(
            true
          )
        }
        className="fixed bottom-5 left-4 z-[55] inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071b3a] text-white shadow-xl lg:hidden"
        aria-label="Open clinic menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* MOBILE DRAWER */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="Close clinic menu"
          />

          <div className="absolute inset-y-0 left-0 w-[88%] max-w-72 overflow-hidden border-r border-zinc-200 bg-[#eef3f8] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            {sidebarContent}
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}

      {logoutOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clinic-sidebar-logout-title"
        >
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
            className="absolute inset-0"
            aria-label="Close logout confirmation"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
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
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
              <LogOut className="h-5 w-5" />
            </div>

            <h2
              id="clinic-sidebar-logout-title"
              className="mt-4 text-xl font-black text-zinc-950 dark:text-white"
            >
              Log out?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Are you sure you want to log out of your clinic workspace?
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

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
      )}
    </>
  );
}