import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Timestamp,
} from "firebase-admin/firestore";

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

type UnknownRecord =
  Record<
    string,
    unknown
  >;

type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

const ACTIVE_APPOINTMENT_STATUSES =
  new Set([
    "scheduled",
    "confirmed",
    "ongoing",
    "in_progress",
    "checked_in",
    "pending",
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

function b(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function n(
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

function normalizeProviderType(
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

function dayKeyFromDate(
  date: string
): DayKey {
  const day =
    new Date(
      `${date}T12:00:00.000Z`
    ).getUTCDay();

  if (
    day === 1
  ) {
    return "mon";
  }

  if (
    day === 2
  ) {
    return "tue";
  }

  if (
    day === 3
  ) {
    return "wed";
  }

  if (
    day === 4
  ) {
    return "thu";
  }

  if (
    day === 5
  ) {
    return "fri";
  }

  if (
    day === 6
  ) {
    return "sat";
  }

  return "sun";
}

function asIsoDate(
  value: unknown
): string {
  if (
    !value
  ) {
    return "";
  }

  if (
    value instanceof
    Date
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
    o(
      data.availability
    );

  return o(
    availability.week
  );
}

function clinicWeek(
  data: UnknownRecord
): UnknownRecord {
  const availability =
    o(
      data.availability
    );

  const openingHours =
    o(
      data.openingHours
    );

  const nestedOpeningHours =
    o(
      availability.openingHours
    );

  const directWeek =
    o(
      availability.week
    );

  if (
    Object.keys(
      directWeek
    ).length >
    0
  ) {
    return directWeek;
  }

  const rootWeek =
    o(
      openingHours.week
    );

  if (
    Object.keys(
      rootWeek
    ).length >
    0
  ) {
    return rootWeek;
  }

  return o(
    nestedOpeningHours.week
  );
}

function daySchedule(
  week: UnknownRecord,
  key: DayKey
) {
  const day =
    o(
      week[
        key
      ]
    );

  const open =
    day.open ===
      true;

  const start =
    s(
      day.start
    );

  const end =
    s(
      day.end
    );

  return {
    key,

    open:
      Boolean(
        open &&
          start &&
          end &&
          start <
            end
      ),

    start:
      start ||
      null,

    end:
      end ||
      null,
  };
}

function doctorSummary(
  id: string,
  data: UnknownRecord
) {
  const profile =
    o(
      data.profile
    );

  const professional =
    o(
      data.professional
    );

  const configuration =
    o(
      data.configuration
    );

  const firstName =
    s(
      profile.firstName
    );

  const lastName =
    s(
      profile.lastName
    );

  const name =
    s(
      profile.displayName ||
        profile.fullName ||
        data.displayName ||
        data.fullName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  return {
    id,

    type:
      "doctor",

    name:
      /^dr\.?\s+/i.test(
        name
      )
        ? name
        : `Dr. ${name}`,

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
      b(
        configuration.acceptsNewPatients,
        true
      ),

    modes: {
      inPerson:
        b(
          configuration.inPersonEnabled,
          true
        ),

      teleconsultation:
        b(
          configuration.teleconsultationEnabled,
          true
        ),

      phone:
        b(
          configuration.phoneConsultationEnabled,
          false
        ),
    },

    durationMinutes:
      Math.max(
        5,
        Math.min(
          240,
          n(
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

    visible:
      configuration.profileVisible !==
        false,
  };
}

function clinicSummary(
  id: string,
  data: UnknownRecord,
  configuration: UnknownRecord
) {
  const profile =
    o(
      data.profile
    );

  const clinic =
    o(
      data.clinic
    );

  return {
    id,

    type:
      "clinic",

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
      b(
        configuration.acceptsNewPatients,
        true
      ),

    modes: {
      inPerson:
        b(
          configuration.inPersonEnabled,
          true
        ),

      teleconsultation:
        b(
          configuration.teleconsultationEnabled,
          true
        ),

      phone:
        b(
          configuration.phoneConsultationEnabled,
          false
        ),
    },

    durationMinutes:
      Math.max(
        5,
        Math.min(
          240,
          n(
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

    visible:
      configuration.clinicVisible !==
        false,
  };
}

async function busyIntervals(
  collectionPath: string,
  date: string,
  durationMinutes: number
) {
  const startDate =
    new Date(
      `${date}T00:00:00.000Z`
    );

  const endDate =
    new Date(
      `${date}T23:59:59.999Z`
    );

  const snapshot =
    await adminDb
      .collection(
        collectionPath
      )
      .get();

  const intervals:
    Array<{
      startAt: string;
      endAt: string;
    }> =
    [];

  for (
    const appointment of
    snapshot.docs
  ) {
    const data =
      appointment.data();

    const status =
      s(
        data.status
      ).toLowerCase();

    if (
      status &&
      !ACTIVE_APPOINTMENT_STATUSES.has(
        status
      )
    ) {
      continue;
    }

    const startIso =
      asIsoDate(
        data.startAt
      ) ||
      asIsoDate(
        data.startAtISO
      ) ||
      asIsoDate(
        data.start
      );

    if (
      !startIso
    ) {
      continue;
    }

    const start =
      new Date(
        startIso
      );

    if (
      start <
        startDate ||
      start >
        endDate
    ) {
      continue;
    }

    const explicitEndIso =
      asIsoDate(
        data.endAt
      ) ||
      asIsoDate(
        data.endAtISO
      ) ||
      asIsoDate(
        data.end
      );

    const end =
      explicitEndIso
        ? new Date(
            explicitEndIso
          )
        : new Date(
            start.getTime() +
              durationMinutes *
                60_000
          );

    intervals.push({
      startAt:
        start.toISOString(),

      endAt:
        end.toISOString(),
    });
  }

  return intervals;
}

export async function GET(
  request: NextRequest
) {
  try {
    const type =
      normalizeProviderType(
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

    const providerCollection =
      type ===
        "doctor"
        ? "professionals"
        : "clinics";

    const providerRef =
      adminDb.doc(
        `${providerCollection}/${id}`
      );

    const providerSnapshot =
      await providerRef.get();

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

    const providerData =
      providerSnapshot.data() as UnknownRecord;

    if (
      providerData.active ===
        false ||
      s(
        providerData.status
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
        typeof doctorSummary
      > |
      ReturnType<
        typeof clinicSummary
      >;

    let week:
      UnknownRecord;

    if (
      type ===
      "doctor"
    ) {
      provider =
        doctorSummary(
          id,
          providerData
        );

      week =
        doctorWeek(
          providerData
        );
    } else {
      const configurationSnapshot =
        await adminDb
          .doc(
            `clinics/${id}/configuration/general`
          )
          .get();

      const configuration =
        configurationSnapshot.exists
          ? (
              configurationSnapshot.data() as UnknownRecord
            )
          : {};

      provider =
        clinicSummary(
          id,
          providerData,
          configuration
        );

      week =
        clinicWeek(
          providerData
        );
    }

    if (
      provider.visible ===
        false ||
      provider.acceptsNewPatients ===
        false
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

    const key =
      dayKeyFromDate(
        date
      );

    const schedule =
      daySchedule(
        week,
        key
      );

    const busy =
      await busyIntervals(
        `${providerCollection}/${id}/appointments`,
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
      "[BookAppointmentAvailabilityAPI] GET error:",
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