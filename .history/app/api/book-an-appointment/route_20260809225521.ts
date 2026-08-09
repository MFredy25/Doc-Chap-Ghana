import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  adminDb,
} from "@/lib/firebase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ProviderType =
  | "doctor"
  | "clinic";

type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

type UnknownRecord =
  Record<string, unknown>;

const ACTIVE_STATUSES =
  new Set([
    "scheduled",
    "confirmed",
    "pending",
    "ongoing",
    "in_progress",
    "checked_in",
  ]);

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): UnknownRecord {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as UnknownRecord;
  }

  return {};
}

function bool(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function num(
  value: unknown,
  fallback: number
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function normalizeType(
  value: string
): ProviderType | null {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "doctor" ||
    normalized ===
      "doctors"
  ) {
    return "doctor";
  }

  if (
    normalized ===
      "clinic" ||
    normalized ===
      "clinics"
  ) {
    return "clinic";
  }

  return null;
}

function validDate(
  value: string
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}

function dayKey(
  date: string
): DayKey {
  const day =
    new Date(
      `${date}T12:00:00.000Z`
    ).getUTCDay();

  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  if (day === 6) return "sat";

  return "sun";
}

function iso(
  value: unknown
): string {
  if (!value) return "";

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? ""
      : value.toISOString();
  }

  if (
    typeof value ===
      "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate ===
      "function"
  ) {
    try {
      const date =
        (
          value as {
            toDate: () => Date;
          }
        ).toDate();

      return Number.isNaN(
        date.getTime()
      )
        ? ""
        : date.toISOString();
    } catch {
      return "";
    }
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? ""
      : date.toISOString();
  }

  return "";
}

function doctorWeek(
  data: UnknownRecord
): UnknownRecord {
  const availability =
    o(data.availability);

  return o(
    availability.week
  );
}

function clinicWeek(
  data: UnknownRecord
): UnknownRecord {
  const availability =
    o(data.availability);

  const directWeek =
    o(availability.week);

  if (
    Object.keys(
      directWeek
    ).length >
    0
  ) {
    return directWeek;
  }

  const openingHours =
    o(data.openingHours);

  const rootWeek =
    o(openingHours.week);

  if (
    Object.keys(
      rootWeek
    ).length >
    0
  ) {
    return rootWeek;
  }

  const nestedOpeningHours =
    o(
      availability.openingHours
    );

  return o(
    nestedOpeningHours.week
  );
}

function scheduleForDay(
  week: UnknownRecord,
  key: DayKey
) {
  const day =
    o(week[key]);

  const start =
    s(day.start);

  const end =
    s(day.end);

  return {
    key,

    open:
      day.open === true &&
      Boolean(start) &&
      Boolean(end) &&
      start < end,

    start:
      start || null,

    end:
      end || null,
  };
}

function doctorPublic(
  id: string,
  data: UnknownRecord
) {
  const profile =
    o(data.profile);

  const professional =
    o(data.professional);

  const configuration =
    o(data.configuration);

  const firstName =
    s(profile.firstName);

  const lastName =
    s(profile.lastName);

  const rawName =
    s(
      profile.displayName ||
      profile.fullName ||
      data.displayName ||
      data.fullName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    /^dr\.?\s+/i.test(
      rawName
    )
      ? rawName
      : `Dr. ${rawName}`;

  return {
    id,
    type:
      "doctor" as const,
    name,

    specialty:
      s(
        data.specialty ||
        professional.specialty ||
        profile.specialty
      ) ||
      "Medical professional",

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

    address:
      configuration.showPracticeAddress ===
        false
        ? ""
        : s(
            data.address ||
            profile.address
          ),

    photoUrl:
      s(
        data.photoUrl ||
        profile.photoUrl ||
        profile.avatarUrl
      ),

    acceptsNewPatients:
      bool(
        configuration.acceptsNewPatients,
        true
      ),

    visible:
      configuration.profileVisible !==
        false,

    durationMinutes:
      Math.max(
        5,
        Math.min(
          240,
          num(
            configuration.defaultConsultationDuration,
            30
          )
        )
      ),

    currency:
      s(
        configuration.currency ||
        o(
          data.consultationPricing
        ).currency
      ) ||
      "GHS",

    modes: {
      inPerson:
        bool(
          configuration.inPersonEnabled,
          true
        ),

      teleconsultation:
        bool(
          configuration.teleconsultationEnabled,
          true
        ),

      phone:
        bool(
          configuration.phoneConsultationEnabled,
          false
        ),
    },
  };
}

function clinicPublic(
  id: string,
  data: UnknownRecord,
  configuration: UnknownRecord
) {
  const profile =
    o(data.profile);

  const clinic =
    o(data.clinic);

  return {
    id,
    type:
      "clinic" as const,

    name:
      s(
        data.name ||
        profile.clinicName ||
        profile.displayName ||
        profile.fullName
      ) ||
      "Clinic",

    specialty:
      s(
        data.specialty ||
        data.type ||
        clinic.type
      ) ||
      "Clinic",

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

    address:
      configuration.showAddress ===
        false
        ? ""
        : s(
            data.address ||
            profile.address
          ),

    photoUrl:
      s(
        data.logoUrl ||
        data.photoUrl ||
        profile.logoUrl ||
        profile.photoUrl
      ),

    acceptsNewPatients:
      bool(
        configuration.acceptsNewPatients,
        true
      ),

    visible:
      configuration.clinicVisible !==
        false,

    durationMinutes:
      Math.max(
        5,
        Math.min(
          240,
          num(
            configuration.defaultConsultationDuration,
            30
          )
        )
      ),

    currency:
      s(
        configuration.currency
      ) ||
      "GHS",

    modes: {
      inPerson:
        bool(
          configuration.inPersonEnabled,
          true
        ),

      teleconsultation:
        bool(
          configuration.teleconsultationEnabled,
          true
        ),

      phone:
        bool(
          configuration.phoneConsultationEnabled,
          false
        ),
    },
  };
}

async function loadBusy(
  providerCollection: string,
  providerId: string,
  date: string,
  durationMinutes: number
) {
  const snapshot =
    await adminDb
      .collection(
        `${providerCollection}/${providerId}/appointments`
      )
      .get();

  const dateStart =
    new Date(
      `${date}T00:00:00.000Z`
    );

  const dateEnd =
    new Date(
      `${date}T23:59:59.999Z`
    );

  const rows:
    Array<{
      startAt: string;
      endAt: string;
    }> =
    [];

  snapshot.docs.forEach(
    (
      document
    ) => {
      const data =
        document.data();

      const status =
        s(
          data.status
        ).toLowerCase();

      if (
        status &&
        !ACTIVE_STATUSES.has(
          status
        )
      ) {
        return;
      }

      const startIso =
        iso(data.startAt) ||
        iso(data.startAtISO);

      if (
        !startIso
      ) {
        return;
      }

      const start =
        new Date(startIso);

      if (
        start <
          dateStart ||
        start >
          dateEnd
      ) {
        return;
      }

      const endIso =
        iso(data.endAt) ||
        iso(data.endAtISO);

      const end =
        endIso
          ? new Date(endIso)
          : new Date(
              start.getTime() +
              durationMinutes *
                60_000
            );

      rows.push({
        startAt:
          start.toISOString(),

        endAt:
          end.toISOString(),
      });
    }
  );

  return rows;
}

export async function GET(
  request: NextRequest
) {
  try {
    const type =
      normalizeType(
        request.nextUrl.searchParams.get(
          "type"
        ) ||
        ""
      );

    const id =
      s(
        request.nextUrl.searchParams.get(
          "id"
        )
      );

    const date =
      s(
        request.nextUrl.searchParams.get(
          "date"
        )
      );

    if (
      !type ||
      !id ||
      !validDate(
        date
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Invalid provider or date.",
        },
        {
          status:
            400,
        }
      );
    }

    const collectionName =
      type ===
        "doctor"
        ? "professionals"
        : "clinics";

    const providerSnapshot =
      await adminDb
        .doc(
          `${collectionName}/${id}`
        )
        .get();

    if (
      !providerSnapshot.exists
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Healthcare provider not found.",
        },
        {
          status:
            404,
        }
      );
    }

    const data =
      providerSnapshot.data() as UnknownRecord;

    if (
      data.active === false ||
      s(
        data.status
      ).toLowerCase() ===
        "disabled"
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "This healthcare provider is not currently available.",
        },
        {
          status:
            404,
        }
      );
    }

    let provider:
      ReturnType<
        typeof doctorPublic
      > |
      ReturnType<
        typeof clinicPublic
      >;

    let week:
      UnknownRecord;

    if (
      type ===
      "doctor"
    ) {
      provider =
        doctorPublic(
          id,
          data
        );

      week =
        doctorWeek(
          data
        );
    } else {
      const configSnapshot =
        await adminDb
          .doc(
            `clinics/${id}/configuration/general`
          )
          .get();

      const configuration =
        configSnapshot.exists
          ? (
              configSnapshot.data() as UnknownRecord
            )
          : {};

      provider =
        clinicPublic(
          id,
          data,
          configuration
        );

      week =
        clinicWeek(
          data
        );
    }

    if (
      !provider.visible ||
      !provider.acceptsNewPatients
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "This provider is not currently accepting appointment requests.",
        },
        {
          status:
            404,
        }
      );
    }

    const schedule =
      scheduleForDay(
        week,
        dayKey(
          date
        )
      );

    const busy =
      await loadBusy(
        collectionName,
        id,
        date,
        provider.durationMinutes
      );

    return NextResponse.json(
      {
        ok:
          true,
        provider,
        date,
        schedule,
        busy,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[BookAppointmentAvailability] GET error:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          "Unable to load appointment availability.",
      },
      {
        status:
          500,
      }
    );
  }
}