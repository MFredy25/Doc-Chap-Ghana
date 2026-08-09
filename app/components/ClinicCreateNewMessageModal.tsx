"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  Loader2,
  Send,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import {
  db,
} from "@/lib/firebase/client";

/* ============================================================
   TYPES
============================================================ */

type RecipientType =
  | "doctor"
  | "patient"
  | "support";

type RecipientOption = {
  id: string;
  sourceDocumentId: string;
  type: RecipientType;
  name: string;
  subtitle: string;
  email: string;
};

type PatientDocument = {
  id: string;
  uid?: string;
  patientId?: string;

  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;

  email?: string;
  phone?: string;

  active?: boolean;
  status?: string;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
};

type TeamMemberDocument = {
  id: string;
  uid?: string;
  professionalId?: string;

  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;

  email?: string;

  role?: string;
  professionalType?: string;
  specialty?: string;

  active?: boolean;
  status?: string;

  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    specialty?: string;
  };

  professional?: {
    type?: string;
    specialty?: string;
  };
};

type Props = {
  open: boolean;
  clinicId: string;
  clinicName: string;
  clinicEmail?: string;
  onClose: () => void;
  onCreated?: (
    messageId: string
  ) => void;
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

function safeObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function mapPatient(
  item: PatientDocument
): RecipientOption | null {
  if (
    item.active === false ||
    safeString(
      item.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  const profile =
    safeObject(
      item.profile
    );

  const firstName =
    safeString(
      item.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      item.lastName ||
        profile.lastName
    );

  const name =
    safeString(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Patient";

  return {
    id:
      safeString(
        item.patientId ||
          item.uid
      ) ||
      item.id,

    sourceDocumentId:
      item.id,

    type:
      "patient",

    name,

    subtitle:
      "Clinic patient",

    email:
      safeString(
        item.email ||
          profile.email
      ),
  };
}

function mapDoctor(
  item: TeamMemberDocument
): RecipientOption | null {
  const profile =
    safeObject(
      item.profile
    );

  const professional =
    safeObject(
      item.professional
    );

  const role =
    safeString(
      item.professionalType ||
        professional.type ||
        item.role
    ).toLowerCase();

  const isDoctor =
    [
      "doctor",
      "physician",
      "medical_doctor",
      "medical doctor",
    ].includes(
      role
    );

  if (
    !isDoctor ||
    item.active === false ||
    safeString(
      item.status
    ).toLowerCase() ===
      "disabled"
  ) {
    return null;
  }

  const firstName =
    safeString(
      item.firstName ||
        profile.firstName
    );

  const lastName =
    safeString(
      item.lastName ||
        profile.lastName
    );

  const rawName =
    safeString(
      item.fullName ||
        item.displayName ||
        profile.fullName ||
        profile.displayName
    ) ||
    `${firstName} ${lastName}`.trim() ||
    "Doctor";

  const name =
    /^dr\.?\s/i.test(
      rawName
    )
      ? rawName
      : `Dr. ${rawName}`;

  const specialty =
    safeString(
      item.specialty ||
        profile.specialty ||
        professional.specialty
    ) ||
    "Medical doctor";

  return {
    id:
      safeString(
        item.professionalId ||
          item.uid
      ) ||
      item.id,

    sourceDocumentId:
      item.id,

    type:
      "doctor",

    name,

    subtitle:
      specialty,

    email:
      safeString(
        item.email ||
          profile.email
      ),
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ClinicCreateNewMessageModal({
  open,
  clinicId,
  clinicName,
  clinicEmail = "",
  onClose,
  onCreated,
}: Props) {
  const [
    patientsRaw,
    setPatientsRaw,
  ] =
    useState<
      PatientDocument[]
    >([]);

  const [
    teamRaw,
    setTeamRaw,
  ] =
    useState<
      TeamMemberDocument[]
    >([]);

  const [
    recipientType,
    setRecipientType,
  ] =
    useState<RecipientType>(
      "doctor"
    );

  const [
    recipientId,
    setRecipientId,
  ] =
    useState("");

  const [
    subject,
    setSubject,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    loadingContacts,
    setLoadingContacts,
  ] =
    useState(false);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* ============================================================
     BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (!open) {
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
    open,
  ]);

  /* ============================================================
     LOAD CONTACTS
  ============================================================ */

  useEffect(() => {
    if (
      !open ||
      !clinicId
    ) {
      return;
    }

    const firestore =
      db;

    if (!firestore) {
      setError(
        "Firebase is not initialized."
      );

      return;
    }

    const firestoreInstance =
      firestore;

    const clinicUid =
      clinicId;

    setLoadingContacts(
      true
    );

    let patientsReady =
      false;

    let teamReady =
      false;

    function finish() {
      if (
        patientsReady &&
        teamReady
      ) {
        setLoadingContacts(
          false
        );
      }
    }

    const unsubscribePatients =
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "patients"
        ),
        (
          snapshot
        ) => {
          setPatientsRaw(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    PatientDocument,
                    "id"
                  >
                ),
              })
            )
          );

          patientsReady =
            true;

          finish();
        },
        (
          snapshotError
        ) => {
          console.error(
            "[ClinicCreateNewMessageModal] Patients error:",
            snapshotError
          );

          patientsReady =
            true;

          finish();
        }
      );

    const unsubscribeTeam =
      onSnapshot(
        collection(
          firestoreInstance,
          "clinics",
          clinicUid,
          "team"
        ),
        (
          snapshot
        ) => {
          setTeamRaw(
            snapshot.docs.map(
              (
                item
              ) => ({
                id:
                  item.id,

                ...(
                  item.data() as Omit<
                    TeamMemberDocument,
                    "id"
                  >
                ),
              })
            )
          );

          teamReady =
            true;

          finish();
        },
        (
          snapshotError
        ) => {
          console.error(
            "[ClinicCreateNewMessageModal] Team error:",
            snapshotError
          );

          teamReady =
            true;

          finish();
        }
      );

    return () => {
      unsubscribePatients();
      unsubscribeTeam();
    };
  }, [
    open,
    clinicId,
  ]);

  /* ============================================================
     RESET
  ============================================================ */

  useEffect(() => {
    if (open) {
      setError(
        null
      );

      setSuccess(
        false
      );

      return;
    }

    setRecipientType(
      "doctor"
    );

    setRecipientId(
      ""
    );

    setSubject(
      ""
    );

    setMessage(
      ""
    );

    setError(
      null
    );

    setSuccess(
      false
    );

    setSending(
      false
    );
  }, [
    open,
  ]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const doctors =
    useMemo(
      () =>
        teamRaw
          .map(
            mapDoctor
          )
          .filter(
            (
              item
            ): item is RecipientOption =>
              item !== null
          )
          .sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          ),
      [
        teamRaw,
      ]
    );

  const patients =
    useMemo(
      () =>
        patientsRaw
          .map(
            mapPatient
          )
          .filter(
            (
              item
            ): item is RecipientOption =>
              item !== null
          )
          .sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          ),
      [
        patientsRaw,
      ]
    );

  const supportRecipient =
    useMemo<RecipientOption>(
      () => ({
        id:
          "docchap-support",

        sourceDocumentId:
          "docchap-support",

        type:
          "support",

        name:
          "Doc Chap Support",

        subtitle:
          "Platform support team",

        email:
          "support@doc-chap.com",
      }),
      []
    );

  const recipients =
    useMemo(
      () => {
        if (
          recipientType ===
          "doctor"
        ) {
          return doctors;
        }

        if (
          recipientType ===
          "patient"
        ) {
          return patients;
        }

        return [
          supportRecipient,
        ];
      },
      [
        recipientType,
        doctors,
        patients,
        supportRecipient,
      ]
    );

  const selectedRecipient =
    useMemo(
      () => {
        if (
          recipientType ===
          "support"
        ) {
          return supportRecipient;
        }

        return (
          recipients.find(
            (
              item
            ) =>
              item.id ===
              recipientId
          ) ||
          null
        );
      },
      [
        recipientType,
        recipientId,
        recipients,
        supportRecipient,
      ]
    );

  /* ============================================================
     SEND MESSAGE
  ============================================================ */

  async function sendMessage() {
    const firestore =
      db;

    if (
      !firestore ||
      !clinicId ||
      sending
    ) {
      return;
    }

    const firestoreInstance =
      firestore;

    const cleanSubject =
      subject.trim();

    const cleanMessage =
      message.trim();

    if (
      !selectedRecipient
    ) {
      setError(
        "Select a recipient."
      );

      return;
    }

    if (
      !cleanSubject
    ) {
      setError(
        "Enter a subject."
      );

      return;
    }

    if (
      cleanMessage.length <
      2
    ) {
      setError(
        "Enter your message."
      );

      return;
    }

    setSending(
      true
    );

    setError(
      null
    );

    setSuccess(
      false
    );

    try {
      const messageRef =
        await addDoc(
          collection(
            firestoreInstance,
            "clinics",
            clinicId,
            "messages"
          ),
          {
            clinicId,

            clinicName,

            senderId:
              clinicId,

            senderType:
              "clinic",

            senderName:
              clinicName,

            senderEmail:
              clinicEmail ||
              null,

            recipientId:
              selectedRecipient.id,

            recipientDocumentId:
              selectedRecipient.sourceDocumentId,

            recipientType:
              selectedRecipient.type,

            recipientName:
              selectedRecipient.name,

            recipientEmail:
              selectedRecipient.email ||
              null,

            subject:
              cleanSubject,

            text:
              cleanMessage,

            message:
              cleanMessage,

            content:
              cleanMessage,

            direction:
              "outgoing",

            status:
              "sent",

            read:
              false,

            channel:
              "internal",

            country:
              "GH",

            locale:
              "en-GH",

            timezone:
              "Africa/Accra",

            application:
              "doc_chap_ghana",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

      setSuccess(
        true
      );

      onCreated?.(
        messageRef.id
      );

      window.setTimeout(
        () => {
          onClose();
        },
        800
      );
    } catch (
      sendError
    ) {
      console.error(
        "[ClinicCreateNewMessageModal] Send message error:",
        sendError
      );

      setError(
        "Unable to send the message."
      );
    } finally {
      setSending(
        false
      );
    }
  }

  if (!open) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinic-create-message-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => {
          if (
            !sending
          ) {
            onClose();
          }
        }}
        aria-label="Close new message modal"
      />

      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* HEADER */}

        <div className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#071b3a] via-[#0b2f63] to-[#1767b5] px-5 py-6 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              sending
            }
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Send className="h-6 w-6 text-cyan-200" />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  {clinicName}
                </div>

                <h2
                  id="clinic-create-message-title"
                  className="mt-1 text-2xl font-black tracking-tight"
                >
                  Create new message
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Send a secure clinic message to a doctor, patient or the Doc Chap support team.
            </p>
          </div>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              <AlertCircle className="mr-2 inline h-4 w-4" />

              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />

              Message sent successfully.
            </div>
          )}

          {loadingContacts ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  Loading clinic contacts...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* RECIPIENT TYPE */}

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Send to
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      [
                        "doctor",
                        "Doctor",
                        Stethoscope,
                        `${doctors.length} available`,
                      ],
                      [
                        "patient",
                        "Patient",
                        UserRound,
                        `${patients.length} available`,
                      ],
                      [
                        "support",
                        "Support",
                        Headphones,
                        "Doc Chap support",
                      ],
                    ] as const
                  ).map(
                    (
                      [
                        value,
                        label,
                        Icon,
                        subtitle,
                      ]
                    ) => {
                      const selected =
                        recipientType ===
                        value;

                      return (
                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() => {
                            setRecipientType(
                              value
                            );

                            setRecipientId(
                              ""
                            );

                            setError(
                              null
                            );

                            setSuccess(
                              false
                            );
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-950/30"
                              : "border-zinc-200 bg-zinc-50 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900/60"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              selected
                                ? "text-blue-600"
                                : "text-zinc-500"
                            }`}
                          />

                          <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                            {label}
                          </div>

                          <div className="mt-1 text-[11px] text-zinc-500">
                            {subtitle}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* RECIPIENT */}

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Recipient
                </span>

                {recipientType ===
                "support" ? (
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Headphones className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        Doc Chap Support
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        Platform support team
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={
                      recipientId
                    }
                    onChange={(
                      event
                    ) => {
                      setRecipientId(
                        event.target
                          .value
                      );

                      setError(
                        null
                      );

                      setSuccess(
                        false
                      );
                    }}
                    className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">
                      {recipientType ===
                      "doctor"
                        ? "Select a doctor"
                        : "Select a patient"}
                    </option>

                    {recipients.map(
                      (
                        recipient
                      ) => (
                        <option
                          key={
                            `${recipient.type}:${recipient.id}`
                          }
                          value={
                            recipient.id
                          }
                        >
                          {recipient.name} —{" "}
                          {recipient.subtitle}
                        </option>
                      )
                    )}
                  </select>
                )}
              </label>

              {/* SELECTED RECIPIENT */}

              {selectedRecipient && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                    Selected recipient
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-zinc-950">
                      {selectedRecipient.type ===
                      "doctor" ? (
                        <Stethoscope className="h-5 w-5" />
                      ) : selectedRecipient.type ===
                        "patient" ? (
                        <UserRound className="h-5 w-5" />
                      ) : (
                        <Headphones className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                        {selectedRecipient.name}
                      </div>

                      <div className="mt-1 truncate text-xs text-zinc-500">
                        {selectedRecipient.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT */}

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Subject
                </span>

                <input
                  value={
                    subject
                  }
                  onChange={(
                    event
                  ) => {
                    setSubject(
                      event.target
                        .value
                    );

                    setError(
                      null
                    );

                    setSuccess(
                      false
                    );
                  }}
                  maxLength={
                    160
                  }
                  placeholder="Message subject"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />

                <div className="mt-1 text-right text-[11px] text-zinc-400">
                  {subject.length}
                  /160
                </div>
              </label>

              {/* MESSAGE */}

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Message
                </span>

                <textarea
                  value={
                    message
                  }
                  onChange={(
                    event
                  ) => {
                    setMessage(
                      event.target
                        .value
                    );

                    setError(
                      null
                    );

                    setSuccess(
                      false
                    );
                  }}
                  rows={8}
                  maxLength={
                    3000
                  }
                  placeholder="Write your message..."
                  className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />

                <div className="mt-1 text-right text-[11px] text-zinc-400">
                  {message.length}
                  /3000
                </div>
              </label>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              sending
            }
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void sendMessage()
            }
            disabled={
              sending ||
              loadingContacts
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />

                Send message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}