"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useSearchParams,
} from "next/navigation";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  AlertCircle,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
  db,
} from "@/lib/firebase/client";

type SearchType =
  | "all"
  | "doctor"
  | "clinic"
  | "pharmacy";

type SearchItem = {
  id: string;
  type:
    | "doctor"
    | "clinic"
    | "pharmacy";
  name: string;
  subtitle: string;
  specialty: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  photoUrl: string;
  verified: boolean;
  active: boolean;
  href: string;
};

const ITEMS_PER_PAGE =
  12;

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function bool(
  value: unknown
): boolean {
  return value === true;
}

function isGhanaRecord(
  data: Record<
    string,
    unknown
  >
): boolean {
  const profile =
    o(
      data.profile
    );

  const country =
    s(
      profile.country ||
        data.country
    ).toLowerCase();

  const iso2 =
    s(
      profile.countryIso2 ||
        data.countryIso2
    ).toUpperCase();

  if (
    !country &&
    !iso2
  ) {
    return true;
  }

  return (
    country ===
      "ghana" ||
    iso2 ===
      "GH"
  );
}

function mapDoctor(
  id: string,
  raw: unknown
): SearchItem | null {
  const data =
    o(raw);

  const profile =
    o(
      data.profile
    );

  const professional =
    o(
      data.professional
    );

  const professionalType =
    s(
      data.professionalType ||
        professional.type ||
        data.role ||
        data.type
    ).toLowerCase();

  if (
    professionalType &&
    professionalType !==
      "doctor"
  ) {
    return null;
  }

  if (
    data.active === false ||
    s(
      data.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  if (
    !isGhanaRecord(
      data
    )
  ) {
    return null;
  }

  const firstName =
    s(
      profile.firstName
    );

  const lastName =
    s(
      profile.lastName
    );

  const baseName =
    s(
      data.name
    ) ||
    s(
      profile.displayName
    ) ||
    s(
      profile.fullName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    /^dr\.?\s+/i.test(
      baseName
    )
      ? baseName
      : `Dr. ${baseName}`;

  const verificationStatus =
    s(
      professional.verificationStatus
    ).toLowerCase();

  return {
    id,
    type:
      "doctor",
    name,
    subtitle:
      "Medical doctor",
    specialty:
      s(
        data.specialty ||
          professional.specialty ||
          profile.specialty
      ) ||
      "Medical professional",
    address:
      s(
        data.address ||
          profile.address
      ),
    city:
      s(
        data.city ||
          profile.city
      ),
    region:
      s(
        data.region ||
          profile.region
      ),
    phone:
      s(
        data.phone ||
          profile.phone
      ),
    photoUrl:
      s(
        data.photoUrl ||
          profile.photoUrl
      ),
    verified:
      bool(
        data.verified
      ) ||
      bool(
        professional.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",
    active:
      data.active !==
      false,
    href:
      `/doctors/${encodeURIComponent(
        id
      )}`,
  };
}

function mapClinic(
  id: string,
  raw: unknown
): SearchItem | null {
  const data =
    o(raw);

  const profile =
    o(
      data.profile
    );

  const clinic =
    o(
      data.clinic
    );

  if (
    data.active === false ||
    s(
      data.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  if (
    !isGhanaRecord(
      data
    )
  ) {
    return null;
  }

  const name =
    s(
      data.name
    ) ||
    s(
      profile.clinicName
    ) ||
    s(
      profile.displayName
    ) ||
    s(
      profile.fullName
    ) ||
    "Clinic";

  const verificationStatus =
    s(
      clinic.verificationStatus
    ).toLowerCase();

  return {
    id,
    type:
      "clinic",
    name,
    subtitle:
      "Healthcare facility",
    specialty:
      s(
        data.specialty ||
          data.type ||
          clinic.type
      ) ||
      "Clinic",
    address:
      s(
        data.address ||
          profile.address
      ),
    city:
      s(
        data.city ||
          profile.city
      ),
    region:
      s(
        data.region ||
          profile.region
      ),
    phone:
      s(
        data.phone ||
          profile.phone
      ),
    photoUrl:
      s(
        data.logoUrl ||
          data.photoUrl ||
          profile.logoUrl
      ),
    verified:
      bool(
        data.verified
      ) ||
      bool(
        clinic.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",
    active:
      data.active !==
      false,
    href:
      `/clinics/${encodeURIComponent(
        id
      )}`,
  };
}

function mapPharmacy(
  id: string,
  raw: unknown
): SearchItem | null {
  const data =
    o(raw);

  const profile =
    o(
      data.profile
    );

  const pharmacy =
    o(
      data.pharmacy
    );

  if (
    data.active === false ||
    s(
      data.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  if (
    !isGhanaRecord(
      data
    )
  ) {
    return null;
  }

  const name =
    s(
      profile.pharmacyName ||
        pharmacy.name ||
        data.name ||
        profile.displayName ||
        profile.fullName
    );

  if (
    !name
  ) {
    return null;
  }

  const verificationStatus =
    s(
      pharmacy.verificationStatus ||
        data.verificationStatus
    ).toLowerCase();

  return {
    id,
    type:
      "pharmacy",
    name,
    subtitle:
      "Pharmacy",
    specialty:
      s(
        data.specialty ||
          pharmacy.type ||
          data.type
      ) ||
      "Community pharmacy",
    address:
      s(
        profile.address ||
          data.address
      ),
    city:
      s(
        profile.city ||
          data.city
      ),
    region:
      s(
        profile.region ||
          data.region
      ),
    phone:
      s(
        profile.phone ||
          data.phone
      ),
    photoUrl:
      s(
        profile.logoUrl ||
          data.logoUrl
      ),
    verified:
      bool(
        pharmacy.verified
      ) ||
      bool(
        data.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",
    active:
      data.active !==
      false,
    href:
      `/pharmacies/${encodeURIComponent(
        id
      )}`,
  };
}

function iconForType(
  type:
    | "doctor"
    | "clinic"
    | "pharmacy"
) {
  if (
    type ===
    "doctor"
  ) {
    return Stethoscope;
  }

  if (
    type ===
    "clinic"
  ) {
    return Building2;
  }

  return HeartPulse;
}

function iconClasses(
  type:
    | "doctor"
    | "clinic"
    | "pharmacy"
): string {
  if (
    type ===
    "doctor"
  ) {
    return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (
    type ===
    "clinic"
  ) {
    return "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300";
  }

  return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300";
}

function categoryLabel(
  type:
    | "doctor"
    | "clinic"
    | "pharmacy"
): string {
  if (
    type ===
    "doctor"
  ) {
    return "Doctor";
  }

  if (
    type ===
    "clinic"
  ) {
    return "Clinic";
  }

  return "Pharmacy";
}

export default function SearchClient() {
  const searchParams =
    useSearchParams();

  const initialType =
    s(
      searchParams.get(
        "type"
      )
    ).toLowerCase();

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<SearchType>(
      initialType ===
        "doctor" ||
        initialType ===
          "clinic" ||
        initialType ===
          "pharmacy"
        ? initialType
        : "all"
    );

  const [
    queryText,
    setQueryText,
  ] =
    useState("");

  const [
    region,
    setRegion,
  ] =
    useState("");

  const [
    doctors,
    setDoctors,
  ] =
    useState<SearchItem[]>(
      []
    );

  const [
    clinics,
    setClinics,
  ] =
    useState<SearchItem[]>(
      []
    );

  const [
    pharmacies,
    setPharmacies,
  ] =
    useState<SearchItem[]>(
      []
    );

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    loadingDoctors,
    setLoadingDoctors,
  ] =
    useState(true);

  const [
    loadingClinics,
    setLoadingClinics,
  ] =
    useState(true);

  const [
    loadingPharmacies,
    setLoadingPharmacies,
  ] =
    useState(true);

  const [
    errors,
    setErrors,
  ] =
    useState<string[]>(
      []
    );

  useEffect(() => {
    const type =
      s(
        searchParams.get(
          "type"
        )
      ).toLowerCase();

    if (
      type ===
        "doctor" ||
      type ===
        "clinic" ||
      type ===
        "pharmacy"
    ) {
      setSelectedType(
        type
      );
    } else {
      setSelectedType(
        "all"
      );
    }

    setCurrentPage(
      1
    );
  }, [
    searchParams,
  ]);

  useEffect(() => {
    const firestore =
      db;

    if (
      !firestore
    ) {
      setErrors([
        "Firebase is not initialized.",
      ]);

      setLoadingDoctors(
        false
      );

      setLoadingClinics(
        false
      );

      setLoadingPharmacies(
        false
      );

      return;
    }

    const unsubDoctors =
      onSnapshot(
        collection(
          firestore,
          "public_doctors"
        ),
        (
          snapshot
        ) => {
          const rows =
            snapshot.docs
              .map(
                (
                  item
                ) =>
                  mapDoctor(
                    item.id,
                    item.data()
                  )
              )
              .filter(
                (
                  item
                ): item is SearchItem =>
                  item !==
                  null
              );

          rows.sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          );

          setDoctors(
            rows
          );

          setLoadingDoctors(
            false
          );
        },
        (
          error
        ) => {
          console.error(
            "[HealthSearch] Doctors:",
            error
          );

          setLoadingDoctors(
            false
          );

          setErrors(
            (
              current
            ) => [
              ...new Set([
                ...current,
                "The public doctor directory is temporarily unavailable.",
              ]),
            ]
          );
        }
      );

    const unsubClinics =
      onSnapshot(
        collection(
          firestore,
          "public_clinics"
        ),
        (
          snapshot
        ) => {
          const rows =
            snapshot.docs
              .map(
                (
                  item
                ) =>
                  mapClinic(
                    item.id,
                    item.data()
                  )
              )
              .filter(
                (
                  item
                ): item is SearchItem =>
                  item !==
                  null
              );

          rows.sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          );

          setClinics(
            rows
          );

          setLoadingClinics(
            false
          );
        },
        (
          error
        ) => {
          console.error(
            "[HealthSearch] Clinics:",
            error
          );

          setLoadingClinics(
            false
          );

          setErrors(
            (
              current
            ) => [
              ...new Set([
                ...current,
                "The public clinic directory is temporarily unavailable.",
              ]),
            ]
          );
        }
      );

    const unsubPharmacies =
      onSnapshot(
        collection(
          firestore,
          "public_pharmacies"
        ),
        (
          snapshot
        ) => {
          const rows =
            snapshot.docs
              .map(
                (
                  item
                ) =>
                  mapPharmacy(
                    item.id,
                    item.data()
                  )
              )
              .filter(
                (
                  item
                ): item is SearchItem =>
                  item !==
                  null
              );

          rows.sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          );

          setPharmacies(
            rows
          );

          setLoadingPharmacies(
            false
          );
        },
        (
          error
        ) => {
          console.error(
            "[HealthSearch] Pharmacies:",
            error
          );

          setLoadingPharmacies(
            false
          );

          setErrors(
            (
              current
            ) => [
              ...new Set([
                ...current,
                "The public pharmacy directory is temporarily unavailable.",
              ]),
            ]
          );
        }
      );

    return () => {
      unsubDoctors();
      unsubClinics();
      unsubPharmacies();
    };
  }, []);

  const loading =
    loadingDoctors ||
    loadingClinics ||
    loadingPharmacies;

  const allItems =
    useMemo(
      () => [
        ...doctors,
        ...clinics,
        ...pharmacies,
      ],
      [
        doctors,
        clinics,
        pharmacies,
      ]
    );

  const regions =
    useMemo(
      () => {
        const values =
          allItems
            .flatMap(
              (
                item
              ) => [
                item.region,
                item.city,
              ]
            )
            .map(
              (
                value
              ) =>
                s(
                  value
                )
            )
            .filter(
              Boolean
            );

        return [
          ...new Set(
            values
          ),
        ].sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b
            )
        );
      },
      [
        allItems,
      ]
    );

  const filteredItems =
    useMemo(
      () => {
        const q =
          queryText
            .trim()
            .toLowerCase();

        return allItems.filter(
          (
            item
          ) => {
            if (
              selectedType !==
                "all" &&
              item.type !==
                selectedType
            ) {
              return false;
            }

            if (
              region
            ) {
              const itemRegion =
                `${item.region} ${item.city}`
                  .toLowerCase();

              if (
                !itemRegion.includes(
                  region.toLowerCase()
                )
              ) {
                return false;
              }
            }

            if (
              !q
            ) {
              return true;
            }

            const haystack =
              [
                item.name,
                item.subtitle,
                item.specialty,
                item.address,
                item.city,
                item.region,
              ]
                .join(
                  " "
                )
                .toLowerCase();

            return haystack.includes(
              q
            );
          }
        );
      },
      [
        allItems,
        queryText,
        region,
        selectedType,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredItems.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    queryText,
    region,
    selectedType,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const visibleItems =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          ITEMS_PER_PAGE;

        return filteredItems.slice(
          start,
          start +
            ITEMS_PER_PAGE
        );
      },
      [
        currentPage,
        filteredItems,
      ]
    );

  const counts = {
    doctor:
      doctors.length,
    clinic:
      clinics.length,
    pharmacy:
      pharmacies.length,
  };

  return (
    <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
      <Header />

      <main>
          <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative px-4 py-9 sm:px-6 sm:py-12 lg:px-10">
              <div className="max-w-4xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <Search className="h-4 w-4" />

                  Healthcare search
                </span>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  Find healthcare in Ghana
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">
                  Search Doc Chap Ghana for doctors, clinics and pharmacies near you.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                    <input
                      value={
                        queryText
                      }
                      onChange={(
                        event
                      ) =>
                        setQueryText(
                          event.target.value
                        )
                      }
                      placeholder="Search by name, specialty, city or region..."
                      className="h-14 w-full rounded-2xl border border-white/20 bg-white pl-12 pr-4 text-sm font-semibold text-zinc-900 outline-none shadow-xl placeholder:text-zinc-400 focus:ring-4 focus:ring-white/20"
                    />
                  </div>

                  <select
                    value={
                      region
                    }
                    onChange={(
                      event
                    ) =>
                      setRegion(
                        event.target.value
                      )
                    }
                    className="h-14 rounded-2xl border border-white/20 bg-white px-4 text-sm font-bold text-zinc-900 outline-none shadow-xl"
                  >
                    <option value="">
                      All Ghana
                    </option>

                    {regions.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedType(
                    "doctor"
                  )
                }
                className={`rounded-[24px] border p-5 text-left transition ${
                  selectedType ===
                  "doctor"
                    ? "border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                }`}
              >
                <Stethoscope className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  {counts.doctor}
                </div>

                <div
                  className={`mt-1 text-xs font-bold ${
                    selectedType ===
                    "doctor"
                      ? "text-emerald-50"
                      : "text-zinc-500"
                  }`}
                >
                  Doctors
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedType(
                    "clinic"
                  )
                }
                className={`rounded-[24px] border p-5 text-left transition ${
                  selectedType ===
                  "clinic"
                    ? "border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-cyan-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                }`}
              >
                <Building2 className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  {counts.clinic}
                </div>

                <div
                  className={`mt-1 text-xs font-bold ${
                    selectedType ===
                    "clinic"
                      ? "text-emerald-50"
                      : "text-zinc-500"
                  }`}
                >
                  Clinics
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedType(
                    "pharmacy"
                  )
                }
                className={`rounded-[24px] border p-5 text-left transition ${
                  selectedType ===
                  "pharmacy"
                    ? "border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                }`}
              >
                <HeartPulse className="h-5 w-5" />

                <div className="mt-4 text-2xl font-black">
                  {counts.pharmacy}
                </div>

                <div
                  className={`mt-1 text-xs font-bold ${
                    selectedType ===
                    "pharmacy"
                      ? "text-emerald-50"
                      : "text-zinc-500"
                  }`}
                >
                  Pharmacies
                </div>
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                {
                  key:
                    "all" as SearchType,
                  label:
                    "All",
                },
                {
                  key:
                    "doctor" as SearchType,
                  label:
                    "Doctors",
                },
                {
                  key:
                    "clinic" as SearchType,
                  label:
                    "Clinics",
                },
                {
                  key:
                    "pharmacy" as SearchType,
                  label:
                    "Pharmacies",
                },
              ].map(
                (
                  item
                ) => (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    onClick={() =>
                      setSelectedType(
                        item.key
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      selectedType ===
                      item.key
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

            {errors.length >
              0 && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {errors.join(
                  " "
                )}
              </div>
            )}

            <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                    Search results
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"} found in Ghana.
                  </p>
                </div>

                {selectedType !==
                  "all" && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedType(
                        "all"
                      )
                    }
                    className="text-xs font-black text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
                  >
                    Show all
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

                    <p className="mt-3 text-sm font-semibold text-zinc-500">
                      Searching healthcare providers...
                    </p>
                  </div>
                </div>
              ) : visibleItems.length ===
                0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Search className="mx-auto h-9 w-9 text-zinc-400" />

                  <h3 className="mt-3 text-sm font-black text-zinc-900 dark:text-white">
                    No result found
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Try another name, specialty, city, region or healthcare category.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {visibleItems.map(
                      (
                        item
                      ) => {
                        const Icon =
                          iconForType(
                            item.type
                          );

                        const location =
                          [
                            item.city,
                            item.region,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            ) ||
                          "Ghana";

                        return (
                          <Link
                            key={`${item.type}-${item.id}`}
                            href={
                              item.href
                            }
                            className="group flex flex-col rounded-[24px] border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/10"
                          >
                            <div className="flex items-start gap-3">
                              {item.photoUrl ? (
                                <img
                                  src={
                                    item.photoUrl
                                  }
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                                />
                              ) : (
                                <div
                                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClasses(
                                    item.type
                                  )}`}
                                >
                                  <Icon className="h-6 w-6" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <h3 className="min-w-0 flex-1 truncate text-sm font-black text-zinc-950 dark:text-white">
                                    {item.name}
                                  </h3>

                                  {item.verified && (
                                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                                  )}
                                </div>

                                <div className="mt-1 text-xs font-bold text-zinc-500">
                                  {item.specialty}
                                </div>

                                <span className="mt-2 inline-flex rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                  {categoryLabel(
                                    item.type
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="mt-5 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />

                                <span className="truncate">
                                  {item.address
                                    ? `${item.address} • ${location}`
                                    : location}
                                </span>
                              </div>

                              {item.phone && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <Phone className="h-4 w-4 shrink-0 text-blue-600" />

                                  {item.phone}
                                </div>
                              )}
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                              <div className="flex items-center gap-2">
                                {item.verified ? (
                                  <>
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />

                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                      Verified
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-zinc-400">
                                    View profile
                                  </span>
                                )}
                              </div>

                              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 transition group-hover:translate-x-0.5 dark:text-emerald-300">
                                View

                                <ChevronRight className="h-4 w-4" />
                              </span>
                            </div>
                          </Link>
                        );
                      }
                    )}
                  </div>

                  {totalPages >
                    1 && (
                    <div className="mt-7 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              current
                            ) =>
                              Math.max(
                                1,
                                current -
                                  1
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          1
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        <ChevronLeft className="h-4 w-4" />

                        Previous
                      </button>

                      <div className="text-center text-xs font-bold text-zinc-500">
                        Page{" "}
                        <span className="text-zinc-900 dark:text-white">
                          {currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="text-zinc-900 dark:text-white">
                          {totalPages}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (
                              current
                            ) =>
                              Math.min(
                                totalPages,
                                current +
                                  1
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Next

                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                <Stethoscope className="h-6 w-6 text-blue-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Doctors
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Search by doctor name, specialty, city or region.
                </p>
              </div>

              <div className="rounded-[24px] border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                <Building2 className="h-6 w-6 text-cyan-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Clinics
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Find healthcare facilities and open their Doc Chap Ghana profile.
                </p>
              </div>

              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <HeartPulse className="h-6 w-6 text-emerald-600" />

                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                  Pharmacies
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Search pharmacies available in the Doc Chap Ghana directory.
                </p>
              </div>
            </div>
          </section>
      </main>

      <Footer />
    </div>
  );
}