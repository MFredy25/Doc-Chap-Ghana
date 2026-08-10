import {
  NextRequest,
  NextResponse,
} from "next/server";

import nodemailer from "nodemailer";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type AnyMap =
  Record<
    string,
    unknown
  >;

type PatientMailPayload = {
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
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
    configured === "true" ||
    configured === "1" ||
    configured === "yes"
  ) {
    return true;
  }

  if (
    configured === "false" ||
    configured === "0" ||
    configured === "no"
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

function validatePayload(
  body: AnyMap
):
  | {
      ok: true;
      data: PatientMailPayload;
    }
  | {
      ok: false;
      error: string;
    } {
  const patientId =
    s(
      body.patientId
    );

  const firstName =
    s(
      body.firstName
    );

  const lastName =
    s(
      body.lastName
    );

  const fullName =
    s(
      body.fullName
    ) ||
    `${firstName} ${lastName}`.trim();

  const email =
    s(
      body.email
    ).toLowerCase();

  const phone =
    s(
      body.phone
    );

  if (
    !patientId
  ) {
    return {
      ok: false,
      error:
        "patientId is required.",
    };
  }

  if (
    !firstName
  ) {
    return {
      ok: false,
      error:
        "firstName is required.",
    };
  }

  if (
    !lastName
  ) {
    return {
      ok: false,
      error:
        "lastName is required.",
    };
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return {
      ok: false,
      error:
        "A valid email address is required.",
    };
  }

  return {
    ok: true,
    data: {
      patientId,
      firstName,
      lastName,
      fullName,
      email,
      phone,
    },
  };
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

function buildPatientHtml(
  data: PatientMailPayload
): string {
  const safeName =
    escapeHtml(
      data.fullName ||
      `${data.firstName} ${data.lastName}`.trim()
    );

  return emailShell({
    eyebrow:
      "Doc Chap Ghana",

    title:
      "Your patient account has been created",

    intro:
      `Welcome to Doc Chap Ghana, ${data.firstName}.`,

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
          Hello <strong>${safeName}</strong>,
        </p>

        <p
          style="
            margin:14px 0 0;
            color:#374151;
            font-size:15px;
            line-height:1.8;
          "
        >
          Your patient account has been created successfully on
          <strong>Doc Chap Ghana</strong>.
        </p>

        <div
          style="
            margin-top:20px;
            padding:18px;
            border:1px solid #d1fae5;
            border-radius:18px;
            background:#ecfdf5;
          "
        >
          <p
            style="
              margin:0;
              color:#065f46;
              font-size:14px;
              line-height:1.7;
            "
          >
            You can now access your patient space, search for healthcare
            professionals and clinics, book appointments and manage your
            healthcare information from your Doc Chap Ghana account.
          </p>
        </div>

        <div
          style="
            margin-top:20px;
            padding:18px;
            border:1px solid #e5e7eb;
            border-radius:18px;
            background:#f9fafb;
          "
        >
          <p style="margin:0 0 9px;color:#111827;font-size:14px;">
            <strong>Patient:</strong>
            ${safeName}
          </p>

          <p style="margin:0 0 9px;color:#111827;font-size:14px;">
            <strong>Email:</strong>
            ${escapeHtml(
              data.email
            )}
          </p>

          <p style="margin:0;color:#111827;font-size:14px;">
            <strong>Phone:</strong>
            ${escapeHtml(
              data.phone ||
              "—"
            )}
          </p>
        </div>

        <p
          style="
            margin:20px 0 0;
            color:#6b7280;
            font-size:13px;
            line-height:1.7;
          "
        >
          You may also receive a separate email verification message.
          Please use it to verify your email address.
        </p>
      `,
  });
}

function buildPatientText(
  data: PatientMailPayload
): string {
  return [
    "Your patient account has been created",
    "",
    `Hello ${data.fullName || `${data.firstName} ${data.lastName}`.trim()},`,
    "",
    "Your patient account has been created successfully on Doc Chap Ghana.",
    "",
    `Patient: ${data.fullName || `${data.firstName} ${data.lastName}`.trim()}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "—"}`,
    "",
    "You can now access your patient space, search healthcare providers and book appointments.",
    "",
    "You may also receive a separate email verification message. Please use it to verify your email address.",
    "",
    "Doc Chap Ghana",
  ].join(
    "\n"
  );
}

function buildAdminHtml(
  data: PatientMailPayload
): string {
  return emailShell({
    eyebrow:
      "Admin notification",

    title:
      "New patient registered",

    intro:
      "A new patient account has just been created on Doc Chap Ghana.",

    content:
      `
        <div
          style="
            padding:18px;
            border:1px solid #e5e7eb;
            border-radius:18px;
            background:#f9fafb;
          "
        >
          <p style="margin:0 0 10px;color:#111827;font-size:14px;">
            <strong>Patient:</strong>
            ${escapeHtml(
              data.fullName ||
              `${data.firstName} ${data.lastName}`.trim()
            )}
          </p>

          <p style="margin:0 0 10px;color:#111827;font-size:14px;">
            <strong>First name:</strong>
            ${escapeHtml(
              data.firstName ||
              "—"
            )}
          </p>

          <p style="margin:0 0 10px;color:#111827;font-size:14px;">
            <strong>Last name:</strong>
            ${escapeHtml(
              data.lastName ||
              "—"
            )}
          </p>

          <p style="margin:0 0 10px;color:#111827;font-size:14px;">
            <strong>Email:</strong>
            ${escapeHtml(
              data.email
            )}
          </p>

          <p style="margin:0 0 10px;color:#111827;font-size:14px;">
            <strong>Phone:</strong>
            ${escapeHtml(
              data.phone ||
              "—"
            )}
          </p>

          <p style="margin:0;color:#111827;font-size:14px;">
            <strong>Patient ID:</strong>
            ${escapeHtml(
              data.patientId
            )}
          </p>
        </div>

        <p
          style="
            margin:20px 0 0;
            color:#4b5563;
            font-size:14px;
            line-height:1.8;
          "
        >
          This is an automatic Doc Chap Ghana administration notification.
        </p>
      `,

    footer:
      "Doc Chap Ghana — Automatic administration notification.",
  });
}

function buildAdminText(
  data: PatientMailPayload
): string {
  return [
    "New patient registered",
    "",
    `Patient: ${data.fullName || `${data.firstName} ${data.lastName}`.trim()}`,
    `First name: ${data.firstName || "—"}`,
    `Last name: ${data.lastName || "—"}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "—"}`,
    `Patient ID: ${data.patientId}`,
    "",
    "Doc Chap Ghana — Automatic administration notification.",
  ].join(
    "\n"
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (
        await request.json()
      ) as AnyMap;

    const validated =
      validatePayload(
        body
      );

    if (
      !validated.ok
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            validated.error,
        },
        {
          status: 400,
        }
      );
    }

    const data =
      validated.data;

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

    const adminEmail =
      requiredEnv(
        "ADMIN_NOTIFICATION_EMAIL"
      );

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

    const patientSubject =
      "Welcome to Doc Chap Ghana — Your patient account is ready";

    const adminSubject =
      `New patient registered: ${
        data.fullName ||
        `${data.firstName} ${data.lastName}`.trim()
      }`;

    const [
      patientInfo,
      adminInfo,
    ] =
      await Promise.all([
        transporter.sendMail({
          from,

          to:
            data.email,

          subject:
            patientSubject,

          text:
            buildPatientText(
              data
            ),

          html:
            buildPatientHtml(
              data
            ),
        }),

        transporter.sendMail({
          from,

          to:
            adminEmail,

          subject:
            adminSubject,

          text:
            buildAdminText(
              data
            ),

          html:
            buildAdminHtml(
              data
            ),
        }),
      ]);

    console.log(
      "[send-email-new-patient-add] Emails sent:",
      {
        patientId:
          data.patientId,

        patientEmail:
          data.email,

        adminEmail,

        patientMessageId:
          patientInfo.messageId,

        adminMessageId:
          adminInfo.messageId,

        patientAccepted:
          patientInfo.accepted,

        patientRejected:
          patientInfo.rejected,

        adminAccepted:
          adminInfo.accepted,

        adminRejected:
          adminInfo.rejected,
      }
    );

    return NextResponse.json({
      ok: true,

      message:
        "Patient and administrator emails sent successfully.",

      patient: {
        messageId:
          patientInfo.messageId,

        accepted:
          patientInfo.accepted,

        rejected:
          patientInfo.rejected,
      },

      admin: {
        messageId:
          adminInfo.messageId,

        accepted:
          adminInfo.accepted,

        rejected:
          adminInfo.rejected,
      },
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
      "[send-email-new-patient-add] Error:",
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
          "Server error while sending patient registration emails.",
      },
      {
        status: 500,
      }
    );
  }
}