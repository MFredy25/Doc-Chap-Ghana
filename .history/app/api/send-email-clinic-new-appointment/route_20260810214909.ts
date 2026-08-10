import {
  NextRequest,
  NextResponse,
} from "next/server";

import nodemailer from "nodemailer";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type AnyMap =
  Record<
    string,
    unknown
  >;

type AppointmentType =
  | "in_person"
  | "teleconsultation"
  | "phone";

type AppointmentMailData = {
  appointmentId: string;

  clinicId: string;
  clinicName: string;
  clinicEmail: string;

  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;

  specialtyName: string;

  appointmentType: AppointmentType;

  reason: string;

  date: string;
  startAt: string;
  endAt: string;

  consultationPrice: number;
  consultationCurrency: string;
};

function s(
  value: unknown
): string {
  return (
    value ??
    ""
  )
    .toString()
    .trim();
}

function asObject(
  value: unknown
): AnyMap {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as AnyMap;
  }

  return {};
}

function getBearerToken(
  request: NextRequest
): string {
  const header =
    request.headers.get(
      "authorization"
    ) ||
    "";

  return header.startsWith(
    "Bearer "
  )
    ? header
        .slice(7)
        .trim()
    : "";
}

function requiredEnv(
  name: string
): string {
  const value =
    process.env[name];

  if (
    !value ||
    !value.trim()
  ) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value.trim();
}

function getMailFrom(): string {
  const value =
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  if (
    !value ||
    !value.trim()
  ) {
    throw new Error(
      "Missing MAIL_FROM, SMTP_FROM or SMTP_USER environment variable."
    );
  }

  return value.trim();
}

function getSmtpSecure(
  port: number
): boolean {
  const configured =
    s(
      process.env.SMTP_SECURE
    ).toLowerCase();

  if (
    configured ===
      "true" ||
    configured ===
      "1" ||
    configured ===
      "yes"
  ) {
    return true;
  }

  if (
    configured ===
      "false" ||
    configured ===
      "0" ||
    configured ===
      "no"
  ) {
    return false;
  }

  return port === 465;
}

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function toIsoString(
  value: unknown
): string {
  if (
    !value
  ) {
    return "";
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
      return (
        value as {
          toDate: () => Date;
        }
      )
        .toDate()
        .toISOString();
    } catch {
      return "";
    }
  }

  const parsed =
    new Date(
      value as
        | string
        | number
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "";
  }

  return parsed.toISOString();
}

function appointmentTypeLabel(
  type: AppointmentType
): string {
  if (
    type ===
    "in_person"
  ) {
    return "In-person consultation";
  }

  if (
    type ===
    "teleconsultation"
  ) {
    return "Teleconsultation";
  }

  return "Phone consultation";
}

function formatAppointmentDate(
  date: string,
  startAt: string
): string {
  const source =
    startAt ||
    (
      date
        ? `${date}T12:00:00.000Z`
        : ""
    );

  const parsed =
    new Date(
      source
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date ||
      "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",

      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    parsed
  );
}

function formatAppointmentTime(
  value: string
): string {
  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value ||
      "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      timeZone:
        "Africa/Accra",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    }
  ).format(
    parsed
  );
}

function formatPrice(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style:
          "currency",

        currency:
          currency ||
          "GHS",

        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      }
    ).format(
      amount
    );
  } catch {
    return `${amount.toLocaleString(
      "en-GH"
    )} ${
      currency ||
      "GHS"
    }`;
  }
}

function emailShell(
  params: {
    eyebrow: string;
    title: string;
    intro: string;
    content: string;
    footer?: string;
  }
): string {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />

    <title>${escapeHtml(
      params.title
    )}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f4f7fb;
      font-family:Arial,Helvetica,sans-serif;
      color:#111827;
    "
  >
    <div
      style="
        width:100%;
        padding:32px 14px;
        box-sizing:border-box;
      "
    >
      <div
        style="
          width:100%;
          max-width:680px;
          margin:0 auto;
          background:#ffffff;
          border:1px solid #e5e7eb;
          border-radius:24px;
          overflow:hidden;
          box-shadow:0 18px 50px rgba(15,23,42,.08);
        "
      >
        <div
          style="
            background:linear-gradient(
              135deg,
              #063b34 0%,
              #08745e 52%,
              #10a37f 100%
            );
            padding:28px 26px;
          "
        >
          <div
            style="
              display:inline-block;
              margin-bottom:12px;
              padding:6px 10px;
              border-radius:999px;
              background:rgba(255,255,255,.13);
              color:#d1fae5;
              font-size:11px;
              font-weight:700;
              letter-spacing:.08em;
              text-transform:uppercase;
            "
          >
            ${escapeHtml(
              params.eyebrow
            )}
          </div>

          <h1
            style="
              margin:0;
              color:#ffffff;
              font-size:25px;
              line-height:1.25;
              font-weight:800;
            "
          >
            ${escapeHtml(
              params.title
            )}
          </h1>

          <p
            style="
              margin:12px 0 0;
              color:rgba(255,255,255,.9);
              font-size:14px;
              line-height:1.7;
            "
          >
            ${escapeHtml(
              params.intro
            )}
          </p>
        </div>

        <div
          style="
            padding:26px;
          "
        >
          ${params.content}

          <div
            style="
              margin-top:26px;
              border-top:1px solid #e5e7eb;
              padding-top:18px;
              color:#6b7280;
              font-size:12px;
              line-height:1.7;
            "
          >
            ${
              params.footer ||
              "Doc Chap Ghana — Healthcare access made simpler."
            }
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

function appointmentDetailsHtml(
  data: AppointmentMailData
): string {
  return `
    <div
      style="
        margin-top:20px;
        padding:18px;
        border:1px solid #e5e7eb;
        border-radius:18px;
        background:#f9fafb;
      "
    >
      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Clinic:</strong>
        ${escapeHtml(
          data.clinicName
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Patient:</strong>
        ${escapeHtml(
          data.patientName
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Specialty:</strong>
        ${escapeHtml(
          data.specialtyName ||
          "—"
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Date:</strong>
        ${escapeHtml(
          formatAppointmentDate(
            data.date,
            data.startAt
          )
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Time:</strong>
        ${escapeHtml(
          `${formatAppointmentTime(
            data.startAt
          )} – ${formatAppointmentTime(
            data.endAt
          )} (Ghana time)`
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Consultation type:</strong>
        ${escapeHtml(
          appointmentTypeLabel(
            data.appointmentType
          )
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Price:</strong>
        ${escapeHtml(
          formatPrice(
            data.consultationPrice,
            data.consultationCurrency
          )
        )}
      </p>

      <p
        style="
          margin:0 0 10px;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Reason:</strong>
        ${escapeHtml(
          data.reason ||
          "—"
        )}
      </p>

      <p
        style="
          margin:0;
          color:#111827;
          font-size:14px;
        "
      >
        <strong>Appointment ID:</strong>
        ${escapeHtml(
          data.appointmentId
        )}
      </p>
    </div>
  `;
}

function buildPatientHtml(
  data: AppointmentMailData
): string {
  return emailShell({
    eyebrow:
      "Appointment confirmed",

    title:
      "Your clinic appointment is confirmed",

    intro:
      `Your appointment with ${data.clinicName} has been successfully booked.`,

    content:
      `
        <p
          style="
            margin:0;
            color:#374151;
            font-size:15px;
            line-height:1.8;
          "
        >
          Hello
          <strong>${escapeHtml(
            data.patientName
          )}</strong>,
        </p>

        <p
          style="
            margin:14px 0 0;
            color:#374151;
            font-size:15px;
            line-height:1.8;
          "
        >
          Your appointment has been confirmed on
          <strong>Doc Chap Ghana</strong>.
        </p>

        ${appointmentDetailsHtml(
          data
        )}

        <p
          style="
            margin:20px 0 0;
            color:#4b5563;
            font-size:14px;
            line-height:1.8;
          "
        >
          Please keep this email for your records.
        </p>
      `,
  });
}

function buildClinicHtml(
  data: AppointmentMailData
): string {
  return emailShell({
    eyebrow:
      "New appointment",

    title:
      "A patient has booked an appointment",

    intro:
      `A new appointment has been booked with ${data.clinicName}.`,

    content:
      `
        <p
          style="
            margin:0;
            color:#374151;
            font-size:15px;
            line-height:1.8;
          "
        >
          Hello
          <strong>${escapeHtml(
            data.clinicName
          )}</strong>,
        </p>

        <p
          style="
            margin:14px 0 0;
            color:#374151;
            font-size:15px;
            line-height:1.8;
          "
        >
          A patient has just booked a new appointment through
          <strong>Doc Chap Ghana</strong>.
        </p>

        ${appointmentDetailsHtml(
          data
        )}

        <div
          style="
            margin-top:20px;
            padding:18px;
            border:1px solid #dbeafe;
            border-radius:18px;
            background:#eff6ff;
          "
        >
          <p
            style="
              margin:0;
              color:#1e3a8a;
              font-size:14px;
              line-height:1.7;
            "
          >
            Patient email:
            <strong>${escapeHtml(
              data.patientEmail
            )}</strong>
            <br />

            Patient phone:
            <strong>${escapeHtml(
              data.patientPhone ||
              "—"
            )}</strong>
          </p>
        </div>
      `,
  });
}

function buildPatientText(
  data: AppointmentMailData
): string {
  return [
    "Your clinic appointment is confirmed",
    "",
    `Hello ${data.patientName},`,
    "",
    `Your appointment with ${data.clinicName} has been successfully booked on Doc Chap Ghana.`,
    "",
    `Clinic: ${data.clinicName}`,
    `Specialty: ${data.specialtyName || "—"}`,
    `Date: ${formatAppointmentDate(data.date, data.startAt)}`,
    `Time: ${formatAppointmentTime(data.startAt)} – ${formatAppointmentTime(data.endAt)} (Ghana time)`,
    `Consultation type: ${appointmentTypeLabel(data.appointmentType)}`,
    `Price: ${formatPrice(data.consultationPrice, data.consultationCurrency)}`,
    `Reason: ${data.reason || "—"}`,
    `Appointment ID: ${data.appointmentId}`,
    "",
    "Please keep this email for your records.",
    "",
    "Doc Chap Ghana",
  ].join(
    "\n"
  );
}

function buildClinicText(
  data: AppointmentMailData
): string {
  return [
    "New clinic appointment",
    "",
    `A patient has booked a new appointment with ${data.clinicName}.`,
    "",
    `Patient: ${data.patientName}`,
    `Patient email: ${data.patientEmail}`,
    `Patient phone: ${data.patientPhone || "—"}`,
    `Specialty: ${data.specialtyName || "—"}`,
    `Date: ${formatAppointmentDate(data.date, data.startAt)}`,
    `Time: ${formatAppointmentTime(data.startAt)} – ${formatAppointmentTime(data.endAt)} (Ghana time)`,
    `Consultation type: ${appointmentTypeLabel(data.appointmentType)}`,
    `Price: ${formatPrice(data.consultationPrice, data.consultationCurrency)}`,
    `Reason: ${data.reason || "—"}`,
    `Appointment ID: ${data.appointmentId}`,
    "",
    "Doc Chap Ghana",
  ].join(
    "\n"
  );
}

function validAppointmentType(
  value: string
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

export async function POST(
  request: NextRequest
) {
  try {
    const token =
      getBearerToken(
        request
      );

    if (
      !token
    ) {
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
      (
        await request.json()
      ) as AnyMap;

    const appointmentId =
      s(
        body.appointmentId
      );

    const clinicId =
      s(
        body.clinicId
      );

    if (
      !appointmentId ||
      !clinicId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "appointmentId and clinicId are required.",
        },
        {
          status: 400,
        }
      );
    }

    const appointmentRef =
      adminDb.doc(
        `clinics/${clinicId}/appointments/${appointmentId}`
      );

    const appointmentSnapshot =
      await appointmentRef.get();

    if (
      !appointmentSnapshot.exists
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Appointment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const appointment =
      appointmentSnapshot.data() as AnyMap;

    const patientId =
      s(
        appointment.patientId
      );

    if (
      !patientId ||
      decoded.uid !==
        patientId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You are not allowed to send this appointment notification.",
        },
        {
          status: 403,
        }
      );
    }

    const appointmentProviderId =
      s(
        appointment.clinicId ||
        appointment.providerId
      );

    if (
      appointmentProviderId !==
      clinicId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid clinic appointment.",
        },
        {
          status: 403,
        }
      );
    }

    const notifications =
      asObject(
        appointment.notifications
      );

    const bookingEmail =
      asObject(
        notifications.bookingEmail
      );

    const patientAlreadySent =
      bookingEmail.patientSent ===
      true;

    const clinicAlreadySent =
      bookingEmail.clinicSent ===
      true;

    if (
      patientAlreadySent &&
      clinicAlreadySent
    ) {
      return NextResponse.json({
        ok: true,
        alreadySent:
          true,
        message:
          "Appointment emails have already been sent.",
      });
    }

    const [
      clinicSnapshot,
      patientSnapshot,
    ] =
      await Promise.all([
        adminDb
          .doc(
            `clinics/${clinicId}`
          )
          .get(),

        adminDb
          .doc(
            `patients/${patientId}`
          )
          .get(),
      ]);

    if (
      !clinicSnapshot.exists
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Clinic not found.",
        },
        {
          status: 404,
        }
      );
    }

    const clinic =
      clinicSnapshot.data() as AnyMap;

    const clinicProfile =
      asObject(
        clinic.profile
      );

    const clinicOwner =
      asObject(
        clinicProfile.owner
      );

    const patientDocument =
      patientSnapshot.exists
        ? patientSnapshot.data() as AnyMap
        : {};

    const patientProfile =
      asObject(
        patientDocument.profile
      );

    const appointmentPatient =
      asObject(
        appointment.patient
      );

    const clinicName =
      s(
        appointment.providerName ||
        clinicProfile.clinicName ||
        clinicProfile.displayName ||
        clinicProfile.fullName
      ) ||
      "Clinic";

    const clinicEmail =
      s(
        clinicProfile.email ||
        clinicOwner.email ||
        clinic.email
      ).toLowerCase();

    const patientName =
      s(
        appointmentPatient.fullName ||
        patientProfile.fullName ||
        patientProfile.displayName ||
        patientDocument.fullName ||
        patientDocument.displayName
      ) ||
      `${s(
        patientProfile.firstName ||
        patientDocument.firstName
      )} ${s(
        patientProfile.lastName ||
        patientDocument.lastName
      )}`.trim() ||
      "Patient";

    const patientEmail =
      s(
        appointmentPatient.email ||
        patientProfile.email ||
        patientDocument.email ||
        decoded.email
      ).toLowerCase();

    const patientPhone =
      s(
        appointmentPatient.phone ||
        patientProfile.phone ||
        patientProfile.phoneNumber ||
        patientDocument.phone
      );

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        patientEmail
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Patient email address is unavailable.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        clinicEmail
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Clinic email address is unavailable.",
        },
        {
          status: 400,
        }
      );
    }

    const rawAppointmentType =
      s(
        appointment.appointmentType
      );

    if (
      !validAppointmentType(
        rawAppointmentType
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid appointment type.",
        },
        {
          status: 400,
        }
      );
    }

    const data:
      AppointmentMailData =
      {
        appointmentId,

        clinicId,

        clinicName,

        clinicEmail,

        patientId,

        patientName,

        patientEmail,

        patientPhone,

        specialtyName:
          s(
            appointment.specialtyName ||
            appointment.providerSpecialty
          ),

        appointmentType:
          rawAppointmentType,

        reason:
          s(
            appointment.reason
          ),

        date:
          s(
            appointment.date
          ),

        startAt:
          toIsoString(
            appointment.startAt
          ) ||
          s(
            appointment.startAtISO
          ),

        endAt:
          toIsoString(
            appointment.endAt
          ) ||
          s(
            appointment.endAtISO
          ),

        consultationPrice:
          Math.max(
            0,
            Number(
              appointment.consultationPrice
            ) ||
            0
          ),

        consultationCurrency:
          s(
            appointment.consultationCurrency
          ) ||
          "GHS",
      };

    const smtpHost =
      requiredEnv(
        "SMTP_HOST"
      );

    const smtpPort =
      Number(
        requiredEnv(
          "SMTP_PORT"
        )
      );

    if (
      !Number.isFinite(
        smtpPort
      ) ||
      smtpPort <= 0
    ) {
      throw new Error(
        "SMTP_PORT is invalid."
      );
    }

    const smtpUser =
      requiredEnv(
        "SMTP_USER"
      );

    const smtpPass =
      requiredEnv(
        "SMTP_PASS"
      );

    const from =
      getMailFrom();

    const transporter =
      nodemailer.createTransport({
        host:
          smtpHost,

        port:
          smtpPort,

        secure:
          getSmtpSecure(
            smtpPort
          ),

        auth: {
          user:
            smtpUser,

          pass:
            smtpPass,
        },
      });

    await transporter.verify();

    let patientInfo:
      nodemailer.SentMessageInfo |
      null =
      null;

    let clinicInfo:
      nodemailer.SentMessageInfo |
      null =
      null;

    let patientError:
      string |
      null =
      null;

    let clinicError:
      string |
      null =
      null;

    if (
      !patientAlreadySent
    ) {
      try {
        patientInfo =
          await transporter.sendMail({
            from,

            to:
              patientEmail,

            subject:
              `Appointment confirmed — ${clinicName}`,

            text:
              buildPatientText(
                data
              ),

            html:
              buildPatientHtml(
                data
              ),
          });
      } catch (
        error: unknown
      ) {
        patientError =
          error instanceof Error
            ? error.message
            : "Unable to send patient email.";
      }
    }

    if (
      !clinicAlreadySent
    ) {
      try {
        clinicInfo =
          await transporter.sendMail({
            from,

            to:
              clinicEmail,

            subject:
              `New appointment booked — ${patientName}`,

            text:
              buildClinicText(
                data
              ),

            html:
              buildClinicHtml(
                data
              ),
          });
      } catch (
        error: unknown
      ) {
        clinicError =
          error instanceof Error
            ? error.message
            : "Unable to send clinic email.";
      }
    }

    const patientSentNow =
      patientAlreadySent ||
      Boolean(
        patientInfo
      );

    const clinicSentNow =
      clinicAlreadySent ||
      Boolean(
        clinicInfo
      );

    const patientAppointmentRef =
      adminDb.doc(
        `patients/${patientId}/appointments/${appointmentId}`
      );

    const notificationUpdate = {
      "notifications.bookingEmail.patientSent":
        patientSentNow,

      "notifications.bookingEmail.clinicSent":
        clinicSentNow,

      "notifications.bookingEmail.patientEmail":
        patientEmail,

      "notifications.bookingEmail.clinicEmail":
        clinicEmail,

      "notifications.bookingEmail.lastAttemptAt":
        FieldValue.serverTimestamp(),

      "notifications.bookingEmail.updatedAt":
        FieldValue.serverTimestamp(),

      ...(patientSentNow
        ? {
            "notifications.bookingEmail.patientSentAt":
              FieldValue.serverTimestamp(),
          }
        : {}),

      ...(clinicSentNow
        ? {
            "notifications.bookingEmail.clinicSentAt":
              FieldValue.serverTimestamp(),
          }
        : {}),

      ...(patientInfo?.messageId
        ? {
            "notifications.bookingEmail.patientMessageId":
              patientInfo.messageId,
          }
        : {}),

      ...(clinicInfo?.messageId
        ? {
            "notifications.bookingEmail.clinicMessageId":
              clinicInfo.messageId,
          }
        : {}),
    };

    await Promise.all([
      appointmentRef.set(
        notificationUpdate,
        {
          merge:
            true,
        }
      ),

      patientAppointmentRef.set(
        notificationUpdate,
        {
          merge:
            true,
        }
      ),
    ]);

    console.log(
      "[send-email-clinic-new-appointment] Result:",
      {
        appointmentId,

        patientId,

        clinicId,

        patientEmail,

        clinicEmail,

        patientSent:
          patientSentNow,

        clinicSent:
          clinicSentNow,

        patientMessageId:
          patientInfo?.messageId ||
          null,

        clinicMessageId:
          clinicInfo?.messageId ||
          null,

        patientError,

        clinicError,
      }
    );

    if (
      !patientSentNow ||
      !clinicSentNow
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "The appointment was confirmed, but one or more notification emails could not be sent.",

          patientSent:
            patientSentNow,

          clinicSent:
            clinicSentNow,

          patientError,

          clinicError,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      message:
        "Appointment emails sent successfully.",

      patientSent:
        patientSentNow,

      clinicSent:
        clinicSentNow,

      patientMessageId:
        patientInfo?.messageId ||
        null,

      clinicMessageId:
        clinicInfo?.messageId ||
        null,
    });
  } catch (
    error: unknown
  ) {
    const candidate =
      error as {
        message?: string;
        stack?: string;
        name?: string;
        code?: string;
        command?: string;
        response?: string;
        responseCode?: number;
      };

    console.error(
      "[send-email-clinic-new-appointment] Error:",
      {
        message:
          candidate?.message,

        stack:
          candidate?.stack,

        name:
          candidate?.name,

        code:
          candidate?.code,

        command:
          candidate?.command,

        response:
          candidate?.response,

        responseCode:
          candidate?.responseCode,
      }
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          candidate?.message ||
          "Server error while sending appointment emails.",
      },
      {
        status: 500,
      }
    );
  }
}