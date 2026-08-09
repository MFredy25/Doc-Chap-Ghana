import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  Timestamp,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = new Set([
  "scheduled",
  "confirmed",
  "pending",
  "ongoing",
  "in_progress",
  "checked_in",
]);

function str(value: unknown): string {
  return (value ?? "").toString().trim();
}

function asObject(
  value: unknown
): Record<string, unknown> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(
    min,
    Math.min(max, parsed)
  );
}

function validDate(
  value: string
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dayKey(
  date: string
): string {
  const day =
    new Date(
      `${date}T12:00:00.000Z`
    ).getUTCDay();

  return [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ][day];
}

function asDate(
  value: unknown
): Date | null {
  if (!value) return null;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      return (
        value as {
          toDate: () => Date;
        }
      ).toDate();
    } catch {
      return null;
    }
  }

  const date =
    new Date(
      value as string | number
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return (
    aStart < bEnd &&
    aEnd > bStart
  );
}

function getBearerToken(
  request: NextRequest
): string {
  const header =
    request.headers.get(
      "authorization"
    ) || "";

  return header.startsWith(
    "Bearer "
  )
    ? header.slice(7).trim()
    : "";
}

async function loadBusy(
  providerId: string,
  date: string,
  durationMinutes: number
) {
  const snapshot =
    await adminDb
      .collection(
        `professionals/${providerId}/appointments`
      )
      .get();

  const dayStart =
    new Date(
      `${date}T00:00:00.000Z`
    );

  const dayEnd =
    new Date(
      `${date}T23:59:59.999Z`
    );

  const busy: Array<{
    startAt: string;
    endAt: string;
  }> = [];

  snapshot.docs.forEach(
    (document) => {
      const data =
        document.data();

      const status =
        str(data.status)
          .toLowerCase();

      if (
        status &&
        !ACTIVE_STATUSES.has(status)
      ) {
        return;
      }

      const start =
        asDate(data.startAt) ||
        asDate(data.startAtISO);

      if (
        !start ||
        start < dayStart ||
        start > dayEnd
      ) {
        return;
      }

      const end =
        asDate(data.endAt) ||
        asDate(data.endAtISO) ||
        new Date(
          start.getTime() +
            durationMinutes * 60_000
        );

      busy.push({
        startAt:
          start.toISOString(),
        endAt:
          end.toISOString(),
      });
    }
  );

  return busy;
}

async function getProvider(
  id: string
) {
  const snapshot =
    await adminDb
      .doc(`professionals/${id}`)
      .get();

  if (!snapshot.exists) {
    return null;
  }

  const data =
    snapshot.data() as Record<string, unknown>;

  if (
    data.active === false ||
    str(data.status)
      .toLowerCase() ===
      "disabled"
  ) {
    return null;
  }


    const config =
      asObject(data.configuration);


    const profile = asObject(data.profile);
    const professional = asObject(data.professional);

    const firstName = str(profile.firstName);
    const lastName = str(profile.lastName);

    const rawName =
      str(profile.displayName || profile.fullName) ||
      `${firstName} ${lastName}`.trim() ||
      "Doctor";

    const provider = {
      id,
      name: /^dr\.?\s+/i.test(rawName)
        ? rawName
        : `Dr. ${rawName}`,
      specialty:
        str(
          data.specialty ||
          professional.specialty ||
          profile.specialty
        ) || "Medical professional",
      city: str(data.city || profile.city),
      region: str(data.region || profile.region),
      address:
        config.showPracticeAddress === false
          ? ""
          : str(data.address || profile.address),
      photoUrl:
        str(
          data.photoUrl ||
          profile.photoUrl ||
          profile.avatarUrl
        ),
      acceptsNewPatients:
        config.acceptsNewPatients !== false,
      visible:
        config.profileVisible !== false,
      durationMinutes:
        clampNumber(
          config.defaultConsultationDuration,
          30,
          5,
          240
        ),
      modes: {
        inPerson:
          config.inPersonEnabled !== false,
        teleconsultation:
          config.teleconsultationEnabled !== false,
        phone:
          config.phoneConsultationEnabled === true,
      },
    };

    const availability =
      asObject(data.availability);

    const week =
      asObject(availability.week);


  return {
    provider,
    week,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const id =
      str(
        request.nextUrl.searchParams.get(
          "id"
        )
      );

    const date =
      str(
        request.nextUrl.searchParams.get(
          "date"
        )
      );

    if (
      !id ||
      !validDate(date)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid doctor or date.",
        },
        {
          status: 400,
        }
      );
    }

    const loaded =
      await getProvider(id);

    if (!loaded) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Doctor not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      provider,
      week,
    } = loaded;

    if (
      !provider.visible ||
      !provider.acceptsNewPatients
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This doctor is not currently accepting appointment requests.",
        },
        {
          status: 404,
        }
      );
    }

    const day =
      asObject(
        week[dayKey(date)]
      );

    const start =
      str(day.start);

    const end =
      str(day.end);

    const schedule = {
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

    const busy =
      await loadBusy(
        id,
        date,
        provider.durationMinutes
      );

    return NextResponse.json({
      ok: true,
      doctor: provider,
      schedule,
      busy,
    });
  } catch (error) {
    console.error(
      "[DoctorBookAppointment] GET:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to load appointment availability.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const decoded =
      await getAuth()
        .verifyIdToken(
          token,
          true
        );

    const body =
      await request.json() as {
        doctorId?: string;
        patient?: {
          uid?: string;
          fullName?: string;
          email?: string;
          phone?: string;
        };
        appointment?: {
          type?:
            | "in_person"
            | "teleconsultation"
            | "phone";
          reason?: string;
          date?: string;
          startAt?: string;
          endAt?: string;
        };
      };

    const providerId =
      str(body.doctorId);

    const patientUid =
      str(body.patient?.uid);

    const fullName =
      str(body.patient?.fullName);

    const email =
      str(body.patient?.email)
        .toLowerCase();

    const phone =
      str(body.patient?.phone);

    const appointmentType =
      body.appointment?.type;

    const reason =
      str(body.appointment?.reason);

    const date =
      str(body.appointment?.date);

    const startAt =
      asDate(
        body.appointment?.startAt
      );

    const endAt =
      asDate(
        body.appointment?.endAt
      );

    if (
      decoded.uid !== patientUid
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid patient session.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !providerId ||
      fullName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      ) ||
      !/^\+233\d{9}$/.test(phone) ||
      !appointmentType ||
      ![
        "in_person",
        "teleconsultation",
        "phone",
      ].includes(appointmentType) ||
      reason.length < 3 ||
      !validDate(date) ||
      !startAt ||
      !endAt ||
      endAt <= startAt
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid appointment information.",
        },
        {
          status: 400,
        }
      );
    }

    const loaded =
      await getProvider(
        providerId
      );

    if (!loaded) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Doctor not found.",
        },
        {
          status: 404,
        }
      );
    }

    const provider =
      loaded.provider;

    const modeAllowed =
      appointmentType ===
        "in_person"
        ? provider.modes.inPerson
        : appointmentType ===
          "teleconsultation"
        ? provider.modes.teleconsultation
        : provider.modes.phone;

    if (
      !provider.visible ||
      !provider.acceptsNewPatients ||
      !modeAllowed
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This appointment is not available.",
        },
        {
          status: 409,
        }
      );
    }

    const busy =
      await loadBusy(
        providerId,
        date,
        provider.durationMinutes
      );

    const alreadyTaken =
      busy.some(
        (item) =>
          overlaps(
            startAt,
            endAt,
            new Date(
              item.startAt
            ),
            new Date(
              item.endAt
            )
          )
      );

    if (alreadyTaken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This time has just been booked. Please choose another time.",
        },
        {
          status: 409,
        }
      );
    }

    const appointmentId =
      adminDb
        .collection(
          "_appointment_ids"
        )
        .doc().id;

    const patientRef =
      adminDb.doc(
        `patients/${patientUid}/appointments/${appointmentId}`
      );

    const providerRef =
      adminDb.doc(
        `professionals/${providerId}/appointments/${appointmentId}`
      );

    const lockId =
      `${date}_${startAt
        .toISOString()
        .slice(11, 16)
        .replace(":", "-")}`;

    const lockRef =
      adminDb.doc(
        `professionals/${providerId}/appointment_slot_locks/${lockId}`
      );

    const now =
      Timestamp.now();

    const payload = {
      id:
        appointmentId,
      appointmentId,
      status:
        "confirmed",
      bookingStatus:
        "confirmed",

      providerType:
        "doctor",
      providerId,

      doctorId:
        providerId,

      patientId:
        patientUid,

      providerName:
        provider.name,
      providerSpecialty:
        provider.specialty,

      patient: {
        uid:
          patientUid,
        fullName,
        email,
        phone,
      },

      appointmentType,
      reason,
      date,

      startAt:
        Timestamp.fromDate(
          startAt
        ),

      endAt:
        Timestamp.fromDate(
          endAt
        ),

      startAtISO:
        startAt.toISOString(),

      endAtISO:
        endAt.toISOString(),

      timezone:
        "Africa/Accra",

      country:
        "Ghana",
      countryIso2:
        "GH",

      source:
        "doctor_public_booking",

      createdAt:
        now,
      updatedAt:
        now,
    };

    await adminDb.runTransaction(
      async (transaction) => {
        const lock =
          await transaction.get(
            lockRef
          );

        if (lock.exists) {
          throw new Error(
            "SLOT_ALREADY_BOOKED"
          );
        }

        transaction.create(
          lockRef,
          {
            appointmentId,
            providerId,
            patientId:
              patientUid,
            startAt:
              Timestamp.fromDate(
                startAt
              ),
            endAt:
              Timestamp.fromDate(
                endAt
              ),
            createdAt:
              now,
          }
        );

        transaction.set(
          patientRef,
          payload
        );

        transaction.set(
          providerRef,
          payload
        );
      }
    );

    return NextResponse.json(
      {
        ok: true,
        appointment: {
          id:
            appointmentId,
          status:
            "confirmed",
          providerId,
          providerName:
            provider.name,
          date,
          startAt:
            startAt.toISOString(),
          endAt:
            endAt.toISOString(),
          appointmentType,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SLOT_ALREADY_BOOKED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This time has just been booked. Please choose another time.",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "[DoctorBookAppointment] POST:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to confirm appointment.",
      },
      {
        status: 500,
      }
    );
  }
}