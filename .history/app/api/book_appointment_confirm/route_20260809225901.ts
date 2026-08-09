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

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ProviderType =
  | "doctor"
  | "clinic";

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type UnknownRecord =
  Record<string, unknown>;

type RequestBody = {
  provider?: {
    id?: string;
    type?: ProviderType;
  };

  patient?: {
    uid?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    beneficiary?: "self" | "other";
    beneficiaryName?: string;
  };

  appointment?: {
    type?: AppointmentType;
    reason?: string;
  };

  selectedSlot?: {
    date?: string;
    startAt?: string;
    endAt?: string;
  };
};

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

function validType(
  value: unknown
): value is ProviderType {
  return (
    value ===
      "doctor" ||
    value ===
      "clinic"
  );
}

function validAppointmentType(
  value: unknown
): value is AppointmentType {
  return (
    value ===
      "in_person" ||
    value ===
      "teleconsultation" ||
    value ===
      "phone"
  );
}

function overlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return (
    aStart <
      bEnd &&
    aEnd >
      bStart
  );
}

function asDate(
  value: unknown
): Date | null {
  if (!value) return null;

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
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
        ? null
        : date;
    } catch {
      return null;
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
      ? null
      : date;
  }

  return null;
}

function authorizationToken(
  request: NextRequest
): string {
  const header =
    request.headers.get(
      "authorization"
    ) ||
    "";

  if (
    !header.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return header.slice(7).trim();
}

async function providerBusy(
  collectionName: string,
  providerId: string,
  startAt: Date,
  endAt: Date
): Promise<boolean> {
  const snapshot =
    await adminDb
      .collection(
        `${collectionName}/${providerId}/appointments`
      )
      .get();

  return snapshot.docs.some(
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
        return false;
      }

      const existingStart =
        asDate(
          data.startAt
        ) ||
        asDate(
          data.startAtISO
        );

      if (
        !existingStart
      ) {
        return false;
      }

      const existingEnd =
        asDate(
          data.endAt
        ) ||
        asDate(
          data.endAtISO
        ) ||
        new Date(
          existingStart.getTime() +
          30 *
          60_000
        );

      return overlap(
        startAt,
        endAt,
        existingStart,
        existingEnd
      );
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const token =
      authorizationToken(
        request
      );

    if (
      !token
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Authentication required.",
        },
        {
          status:
            401,
        }
      );
    }

    const decoded =
      await getAuth().verifyIdToken(
        token,
        true
      );

    const body =
      (
        await request.json()
      ) as RequestBody;

    const providerId =
      s(
        body.provider?.id
      );

    const providerType =
      body.provider?.type;

    const patientUid =
      s(
        body.patient?.uid
      );

    const fullName =
      s(
        body.patient?.fullName
      );

    const email =
      s(
        body.patient?.email
      ).toLowerCase();

    const phone =
      s(
        body.patient?.phone
      );

    const beneficiary =
      body.patient?.beneficiary ===
        "other"
        ? "other"
        : "self";

    const beneficiaryName =
      s(
        body.patient?.beneficiaryName
      ) ||
      fullName;

    const appointmentType =
      body.appointment?.type;

    const reason =
      s(
        body.appointment?.reason
      );

    const startAt =
      asDate(
        body.selectedSlot?.startAt
      );

    const endAt =
      asDate(
        body.selectedSlot?.endAt
      );

    const date =
      s(
        body.selectedSlot?.date
      );

    if (
      decoded.uid !==
        patientUid
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "The authenticated patient does not match this appointment.",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      !providerId ||
      !validType(
        providerType
      ) ||
      !patientUid ||
      fullName.length <
        2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      ) ||
      !/^\+233\d{9}$/.test(
        phone
      ) ||
      !validAppointmentType(
        appointmentType
      ) ||
      reason.length <
        3 ||
      !startAt ||
      !endAt ||
      endAt <=
        startAt ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Invalid appointment information.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      startAt <=
      new Date()
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "This appointment time is no longer available.",
        },
        {
          status:
            409,
        }
      );
    }

    const collectionName =
      providerType ===
        "doctor"
        ? "professionals"
        : "clinics";

    const providerRef =
      adminDb.doc(
        `${collectionName}/${providerId}`
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
            409,
        }
      );
    }

    const alreadyBusy =
      await providerBusy(
        collectionName,
        providerId,
        startAt,
        endAt
      );

    if (
      alreadyBusy
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "This time has just been booked. Please choose another available time.",
        },
        {
          status:
            409,
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

    const providerAppointmentRef =
      adminDb.doc(
        `${collectionName}/${providerId}/appointments/${appointmentId}`
      );

    const slotLockId =
      `${date}_${startAt
        .toISOString()
        .slice(11, 16)
        .replace(
          ":",
          "-"
        )}`;

    const slotLockRef =
      adminDb.doc(
        `${collectionName}/${providerId}/appointment_slot_locks/${slotLockId}`
      );

    const profile =
      o(
        providerData.profile
      );

    const professional =
      o(
        providerData.professional
      );

    const clinic =
      o(
        providerData.clinic
      );

    const providerName =
      s(
        providerData.name ||
        profile.displayName ||
        profile.fullName ||
        profile.clinicName
      ) ||
      [
        s(
          profile.firstName
        ),
        s(
          profile.lastName
        ),
      ]
        .filter(Boolean)
        .join(" ") ||
      (
        providerType ===
          "doctor"
          ? "Doctor"
          : "Clinic"
      );

    const providerSpecialty =
      s(
        providerData.specialty ||
        professional.specialty ||
        profile.specialty ||
        clinic.type
      ) ||
      (
        providerType ===
          "doctor"
          ? "Medical professional"
          : "Clinic"
      );

    const startTimestamp =
      Timestamp.fromDate(
        startAt
      );

    const endTimestamp =
      Timestamp.fromDate(
        endAt
      );

    const appointmentData = {
      id:
        appointmentId,
      appointmentId,

      status:
        "confirmed",
      bookingStatus:
        "confirmed",

      providerType,
      providerId,

      doctorId:
        providerType ===
          "doctor"
          ? providerId
          : null,

      clinicId:
        providerType ===
          "clinic"
          ? providerId
          : null,

      providerName,
      providerSpecialty,

      patientId:
        patientUid,

      patient: {
        uid:
          patientUid,
        fullName,
        email,
        phone,
        beneficiary,
        beneficiaryName,
      },

      appointmentType,
      reason,

      date,
      startAt:
        startTimestamp,
      endAt:
        endTimestamp,
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
        "public_search_booking",

      createdAt:
        Timestamp.now(),
      updatedAt:
        Timestamp.now(),
    };

    await adminDb.runTransaction(
      async (
        transaction
      ) => {
        const slotSnapshot =
          await transaction.get(
            slotLockRef
          );

        if (
          slotSnapshot.exists
        ) {
          throw new Error(
            "SLOT_ALREADY_BOOKED"
          );
        }

        transaction.create(
          slotLockRef,
          {
            appointmentId,
            providerId,
            providerType,
            patientId:
              patientUid,
            startAt:
              startTimestamp,
            endAt:
              endTimestamp,
            createdAt:
              Timestamp.now(),
          }
        );

        transaction.set(
          patientRef,
          appointmentData
        );

        transaction.set(
          providerAppointmentRef,
          appointmentData
        );
      }
    );

    return NextResponse.json(
      {
        ok:
          true,

        appointment: {
          id:
            appointmentId,
          status:
            "confirmed",
          providerType,
          providerId,
          providerName,
          providerSpecialty,
          patientId:
            patientUid,
          beneficiaryName,
          appointmentType,
          reason,
          date,
          startAt:
            startAt.toISOString(),
          endAt:
            endAt.toISOString(),
          timezone:
            "Africa/Accra",
        },
      },
      {
        status:
          201,
      }
    );
  } catch (
    error
  ) {
    if (
      error instanceof Error &&
      error.message ===
        "SLOT_ALREADY_BOOKED"
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "This time has just been booked. Please choose another available time.",
        },
        {
          status:
            409,
        }
      );
    }

    console.error(
      "[ConfirmAppointmentAPI] POST error:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          "Unable to confirm the appointment.",
      },
      {
        status:
          500,
      }
    );
  }
}