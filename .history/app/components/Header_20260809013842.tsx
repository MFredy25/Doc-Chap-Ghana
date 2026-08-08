"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Building2,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type AuthProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  accountHref: string;
};

type ProfileSource =
  | "professionals"
  | "patients"
  | "clinics"
  | "users";

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

function safeObject(
  value: unknown
): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      any
    >;
  }

  return {};
}

function makeInitials(
  firstName: string,
  lastName: string,
  fullName: string
): string {
  const first =
    safeString(
      firstName
    );

  const last =
    safeString(
      lastName
    );

  if (
    first ||
    last
  ) {
    return `${first.charAt(0)}${last.charAt(0)}`
      .toUpperCase()
      .slice(0, 2);
  }

  const parts =
    safeString(
      fullName
    )
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "U";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`
    .toUpperCase();
}

function accountHrefForSource(
  source: ProfileSource,
  raw: Record<string, any>
): string {
  if (
    source ===
    "professionals"
  ) {
    const professional =
      safeObject(
        raw.professional
      );

    const type =
      safeString(
        raw.professionalType ||
          professional.type ||
          raw.role
      ).toLowerCase();

    if (
      type ===
      "doctor"
    ) {
      return "/doctors/my-account";
    }

    return "/doctors/dashboard";
  }

  if (
    source ===
    "patients"
  ) {
    return "/patients";
  }

  if (
    source ===
    "clinics"
  ) {
    return "/clinics";
  }

  return "/";
}

function mapProfile(
  source: ProfileSource,
  raw: Record<string, any>,
  user: User
): AuthProfile {
  const profile =
    safeObject(
      raw.profile
    );

  const firstName =
    safeString(
      profile.firstName
    ) ||
    safeString(
      raw.firstName
    );

  const lastName =
    safeString(
      profile.lastName
    ) ||
    safeString(
      raw.lastName
    );

  const fullName =
    safeString(
      profile.fullName
    ) ||
    safeString(
      profile.displayName
    ) ||
    safeString(
      raw.fullName
    ) ||
    safeString(
      raw.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    safeString(
      user.displayName
    ) ||
    safeString(
      user.email
    ).split("@")[0] ||
    "My account";

  return {
    firstName,
    lastName,
    fullName,
    initials:
      makeInitials(
        firstName,
        lastName,
        fullName
      ),
    accountHref:
      accountHrefForSource(
        source,
        raw
      ),
  };
}

function fallbackProfile(
  user: User
): AuthProfile {
  const displayName =
    safeString(
      user.displayName
    );

  const parts =
    displayName
      .split(/\s+/)
      .filter(Boolean);

  const firstName =
    parts[0] ||
    "";

  const lastName =
    parts.length >
    1
      ? parts[
          parts.length - 1
        ]
      : "";

  const fullName =
    displayName ||
    safeString(
      user.email
    ).split("@")[0] ||
    "My account";

  return {
    firstName,
    lastName,
    fullName,
    initials:
      makeInitials(
        firstName,
        lastName,
        fullName
      ),
    accountHref:
      "/",
  };
}

/* ============================================================
   ACTION BUTTON
============================================================ */

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
  variant?:
    | "solid"
    | "outline";
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
      href={
        href
      }
      onClick={
        onClick
      }
      className={`${base} ${
        variant ===
        "solid"
          ? solid
          : outline
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />

      <span className="truncate">
        {
          label
        }
      </span>
    </Link>
  );
}

/* ============================================================
   NAV ITEM
============================================================ */

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
      href={
        href
      }
      onClick={
        onClick
      }
      className="flex items-center gap-2 rounded-[10px] bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-teal-500 active:bg-teal-700 lg:px-4"
    >
      <Icon className="h-4 w-4 shrink-0" />

      <span className="whitespace-nowrap">
        {
          label
        }
      </span>
    </Link>
  );
}

/* ============================================================
   CONNECTED USER BUTTON
============================================================ */

function ConnectedUserButton({
  profile,
  onClick,
}: {
  profile: AuthProfile;
  onClick?: () => void;
}) {
  return (
    <Link
      href={
        profile.accountHref
      }
      onClick={
        onClick
      }
      className="flex min-w-0 items-center gap-2 rounded-[10px] border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-sm font-semibold text-teal-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-black uppercase text-white shadow-sm">
        {
          profile.initials
        }
      </span>

      <span className="max-w-[160px] truncate">
        {
          profile.fullName
        }
      </span>
    </Link>
  );
}

/* ============================================================
   HEADER
============================================================ */

export default function Header() {
  const [
    mounted,
    setMounted,
  ] =
    useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    authProfile,
    setAuthProfile,
  ] =
    useState<AuthProfile | null>(
      null
    );

  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true);

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

  const hrefHome =
    "/";

  const hrefPatients =
    "/patients";

  const hrefDoctors =
    "/doctors";

  const hrefClinics =
    "/clinics";

  const hrefContact =
    "/contact";

  const hrefSignup =
    "/signup";

  const hrefLogin =
    "/login";

  /* ============================================================
     MOUNT
  ============================================================ */

  useEffect(() => {
    setMounted(
      true
    );
  }, []);

  /* ============================================================
     AUTH STATE
  ============================================================ */

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth
    ) {
      setAuthLoading(
        false
      );

      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        firebaseAuth,
        async (
          user
        ) => {
          setCurrentUser(
            user
          );

          if (
            !user
          ) {
            setAuthProfile(
              null
            );

            setAuthLoading(
              false
            );

            return;
          }

          setAuthLoading(
            true
          );

          if (
            !firestore
          ) {
            setAuthProfile(
              fallbackProfile(
                user
              )
            );

            setAuthLoading(
              false
            );

            return;
          }

          const sources:
            ProfileSource[] =
            [
              "professionals",
              "patients",
              "clinics",
              "users",
            ];

          let foundProfile:
            AuthProfile | null =
            null;

          for (
            const source
            of sources
          ) {
            try {
              const snapshot =
                await getDoc(
                  doc(
                    firestore,
                    source,
                    user.uid
                  )
                );

              if (
                snapshot.exists()
              ) {
                foundProfile =
                  mapProfile(
                    source,
                    snapshot.data(),
                    user
                  );

                break;
              }
            } catch (
              profileError
            ) {
              console.warn(
                `[Header] Unable to read ${source}/${user.uid}:`,
                profileError
              );
            }
          }

          setAuthProfile(
            foundProfile ||
              fallbackProfile(
                user
              )
          );

          setAuthLoading(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* ============================================================
     MOBILE BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (
      !mounted ||
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
    mounted,
    mobileOpen,
  ]);

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

      setLogoutOpen(
        false
      );

      setMobileOpen(
        false
      );
    } catch (
      logoutError
    ) {
      console.error(
        "[Header] Logout error:",
        logoutError
      );
    } finally {
      setLoggingOut(
        false
      );
    }
  }

  /* ============================================================
     DESKTOP NAV
  ============================================================ */

  const desktopNav =
    useMemo(
      () => (
        <nav className="flex min-w-0 items-center justify-center gap-2">
          <NavItem
            href={
              hrefPatients
            }
            label="Patients"
            icon={
              Users
            }
          />

          <NavItem
            href={
              hrefDoctors
            }
            label="Doctors"
            icon={
              Stethoscope
            }
          />

          <NavItem
            href={
              hrefClinics
            }
            label="Clinics"
            icon={
              Building2
            }
          />

          <NavItem
            href={
              hrefContact
            }
            label="Contact"
            icon={
              Mail
            }
          />
        </nav>
      ),
      []
    );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <header className="sticky top-0 z-[70] border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex h-16 w-full items-center gap-3 px-4 sm:px-5 lg:px-6">
          {/* LOGO */}

          <div className="min-w-0 shrink-0">
            <Link
              href={
                hrefHome
              }
              className="flex min-w-0 items-center gap-3"
            >
              <Image
                src="/icon.png"
                alt="Doc Chap Ghana"
                width={
                  36
                }
                height={
                  36
                }
                className="h-9 w-9 shrink-0 rounded-xl object-contain"
                priority
              />

              <span className="hidden max-w-[150px] truncate text-lg font-semibold text-gray-900 dark:text-white sm:block md:max-w-[190px] lg:max-w-[210px]">
                Doc Chap Ghana
              </span>
            </Link>
          </div>

          {/* DESKTOP NAV */}

          <div className="hidden min-w-0 flex-1 justify-center overflow-hidden xl:flex">
            {
              desktopNav
            }
          </div>

          {/* DESKTOP ACCOUNT */}

          <div className="ml-auto hidden min-w-0 shrink items-center justify-end gap-2 xl:flex">
            {authLoading ? (
              <div className="flex h-10 items-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />

                Loading...
              </div>
            ) : currentUser &&
              authProfile ? (
              <>
                <ConnectedUserButton
                  profile={
                    authProfile
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setLogoutOpen(
                      true
                    )
                  }
                  className="flex shrink-0 items-center gap-2 rounded-[10px] border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 active:bg-red-100 dark:border-red-900/50 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/20 lg:px-4"
                >
                  <LogOut className="h-4 w-4" />

                  Log out
                </button>
              </>
            ) : (
              <>
                <ActionButton
                  href={
                    hrefSignup
                  }
                  label="Sign up"
                  icon={
                    UserPlus
                  }
                  variant="solid"
                />

                <ActionButton
                  href={
                    hrefLogin
                  }
                  label="Log in"
                  icon={
                    LogIn
                  }
                  variant="outline"
                />
              </>
            )}
          </div>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (
                  value
                ) =>
                  !value
              )
            }
            className="ml-auto inline-flex items-center justify-center rounded-[10px] p-2 text-gray-700 transition hover:bg-gray-100 xl:hidden dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================
          MOBILE DRAWER
      ======================================================== */}

      {mounted &&
      mobileOpen ? (
        <div className="fixed inset-0 z-[9999] xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="Close menu"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                Menu
              </span>

              <button
                type="button"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="inline-flex items-center justify-center rounded-[10px] p-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* CONNECTED USER MOBILE */}

            {!authLoading &&
              currentUser &&
              authProfile && (
                <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                  <ConnectedUserButton
                    profile={
                      authProfile
                    }
                    onClick={() =>
                      setMobileOpen(
                        false
                      )
                    }
                  />
                </div>
              )}

            <div className="space-y-3 p-4">
              <Link
                href={
                  hrefHome
                }
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-white shadow-md transition hover:bg-teal-500 active:bg-teal-700"
              >
                <span className="text-sm font-semibold">
                  Home
                </span>
              </Link>

              <NavItem
                href={
                  hrefPatients
                }
                label="Patients"
                icon={
                  Users
                }
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
              />

              <NavItem
                href={
                  hrefDoctors
                }
                label="Doctors"
                icon={
                  Stethoscope
                }
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
              />

              <NavItem
                href={
                  hrefClinics
                }
                label="Clinics"
                icon={
                  Building2
                }
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
              />

              <NavItem
                href={
                  hrefContact
                }
                label="Contact"
                icon={
                  Mail
                }
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
              />

              <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading account...
                  </div>
                ) : currentUser &&
                  authProfile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(
                        false
                      );

                      setLogoutOpen(
                        true
                      );
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />

                    Log out
                  </button>
                ) : (
                  <>
                    <ActionButton
                      href={
                        hrefSignup
                      }
                      label="Sign up"
                      icon={
                        UserPlus
                      }
                      variant="solid"
                      onClick={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    />

                    <ActionButton
                      href={
                        hrefLogin
                      }
                      label="Log in"
                      icon={
                        LogIn
                      }
                      variant="outline"
                      onClick={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================
          LOGOUT CONFIRMATION MODAL
      ======================================================== */}

      {logoutOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="header-logout-title"
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
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close logout confirmation"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/5 to-transparent" />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    <LogOut className="h-5 w-5" />
                  </div>

                  <div>
                    <h2
                      id="header-logout-title"
                      className="text-lg font-black text-gray-950 dark:text-white"
                    >
                      Log out?
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Are you sure you want to log out of your Doc Chap Ghana account?
                    </p>
                  </div>
                </div>

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
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-900 dark:text-gray-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {authProfile && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-black uppercase text-white">
                    {
                      authProfile.initials
                    }
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-gray-950 dark:text-white">
                      {
                        authProfile.fullName
                      }
                    </div>

                    <div className="mt-0.5 text-xs text-gray-500">
                      Connected account
                    </div>
                  </div>
                </div>
              )}

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
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
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
        </div>
      )}
    </>
  );
}