"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  BadgeCheck,
  CheckCheck,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DoctorSidebar from "@/app/components/DoctorSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type Message = {
  id: string;
  body: string;
  senderId: string;
  receiverId: string;
  patientId: string;
  patientName: string;
  direction: "inbound" | "outbound";
  read: boolean;
  createdAt: Date;
};

type Patient = {
  id: string;
  name: string;
  email: string;
};

function s(value: unknown): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): Record<string, any> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function d(
  value: unknown
): Date | null {
  if (
    value instanceof Timestamp
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const parsed =
      new Date(value);

    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in
      (value as any) &&
    typeof (value as any)
      .toDate === "function"
  ) {
    try {
      return (
        value as any
      ).toDate();
    } catch {
      return null;
    }
  }

  return null;
}

function doctor(
  raw: unknown
) {
  const data =
    o(raw);

  const profile =
    o(data.profile);

  const professional =
    o(data.professional);

  const firstName =
    s(
      profile.firstName
    );

  const name =
    s(
      profile.displayName
    ) ||
    s(
      profile.fullName
    ) ||
    `${firstName} ${s(
      profile.lastName
    )}`.trim() ||
    "Doctor";

  const titledName =
    name === "Doctor"
      ? name
      : `Dr. ${name.replace(/^dr\.?\s+/i, "")}`;

  const verificationStatus =
    s(
      professional.verificationStatus
    ).toLowerCase() ||
    "pending";

  return {
    name: titledName,

    specialty:
      s(
        professional.specialty
      ) ||
      s(
        profile.specialty
      ) ||
      "Medical professional",

    verified:
      professional.verified ===
        true ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    verificationStatus,
  };
}

function mapM(
  id: string,
  raw: unknown,
  uid: string
): Message {
  const data =
    o(raw);

  const sender =
    s(
      data.senderId
    );

  const receiver =
    s(
      data.receiverId
    );

  const patientSummary =
    o(
      data.patientSummary
    );

  const direction:
    | "inbound"
    | "outbound" =
    s(
      data.direction
    ).toLowerCase() ===
      "inbound" ||
    (
      sender &&
      sender !== uid
    )
      ? "inbound"
      : "outbound";

  return {
    id,

    body:
      s(
        data.body
      ) ||
      s(
        data.message
      ) ||
      s(
        data.text
      ),

    senderId:
      sender,

    receiverId:
      receiver,

    patientId:
      s(
        data.patientId
      ) ||
      (
        direction ===
        "inbound"
          ? sender
          : receiver
      ),

    patientName:
      s(
        data.patientName
      ) ||
      s(
        data.patientDisplayName
      ) ||
      s(
        patientSummary.displayName
      ) ||
      s(
        patientSummary.fullName
      ) ||
      "Patient",

    direction,

    read:
      data.read ===
        true ||
      data.seen ===
        true,

    createdAt:
      d(
        data.createdAt
      ) ||
      new Date(),
  };
}

function fdate(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    date
  );
}

export default function MessagesClient() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uid,
    setUid,
  ] =
    useState<string | null>(
      null
    );

  const [
    doctorData,
    setDoctorData,
  ] =
    useState<any>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>(
      []
    );

  const [
    patients,
    setPatients,
  ] =
    useState<Patient[]>(
      []
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    selected,
    setSelected,
  ] =
    useState("");

  const [
    text,
    setText,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    sendError,
    setSendError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const firebaseAuth =
      auth;

    const firestore =
      db;

    if (
      !firebaseAuth ||
      !firestore
    ) {
      setError(
        "Firebase is not initialized."
      );

      setLoading(
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
          if (
            !user?.uid
          ) {
            router.replace(
              "/doctors/login"
            );

            return;
          }

          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  "professionals",
                  user.uid
                )
              );

            if (
              !snapshot.exists()
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            const data =
              snapshot.data();

            const professional =
              o(
                data.professional
              );

            const type =
              s(
                data.professionalType ||
                  professional.type ||
                  data.role
              ).toLowerCase();

            if (
              (
                type &&
                type !==
                  "doctor"
              ) ||
              data.active ===
                false
            ) {
              await signOut(
                firebaseAuth
              );

              router.replace(
                "/doctors/login"
              );

              return;
            }

            setUid(
              user.uid
            );

            setDoctorData(
              data
            );
          } catch (
            authError
          ) {
            console.error(
              authError
            );

            setError(
              "Unable to verify your doctor account."
            );
          } finally {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [router]);

  useEffect(() => {
    const firestore =
      db;

    if (
      !firestore ||
      !uid
    ) {
      return;
    }

    const unsubscribeProfile =
      onSnapshot(
        doc(
          firestore,
          "professionals",
          uid
        ),
        (
          snapshot
        ) => {
          if (
            snapshot.exists()
          ) {
            setDoctorData(
              snapshot.data()
            );
          }
        }
      );

    const messagesQuery =
      query(
        collection(
          firestore,
          "professionals",
          uid,
          "messages"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribeMessages =
      onSnapshot(
        messagesQuery,
        (
          snapshot
        ) => {
          setMessages(
            snapshot.docs.map(
              (
                messageDoc
              ) =>
                mapM(
                  messageDoc.id,
                  messageDoc.data(),
                  uid
                )
            )
          );
        },
        (
          messagesError
        ) => {
          console.error(
            messagesError
          );

          setMessages(
            []
          );
        }
      );

    const unsubscribePatients =
      onSnapshot(
        collection(
          firestore,
          "professionals",
          uid,
          "patients"
        ),
        (
          snapshot
        ) => {
          setPatients(
            snapshot.docs.map(
              (
                patientDoc
              ) => {
                const data =
                  o(
                    patientDoc.data()
                  );

                const profile =
                  o(
                    data.profile
                  );

                const firstName =
                  s(
                    data.firstName
                  ) ||
                  s(
                    profile.firstName
                  );

                const lastName =
                  s(
                    data.lastName
                  ) ||
                  s(
                    profile.lastName
                  );

                return {
                  id:
                    patientDoc.id,

                  name:
                    s(
                      data.fullName
                    ) ||
                    s(
                      data.displayName
                    ) ||
                    s(
                      profile.fullName
                    ) ||
                    `${firstName} ${lastName}`.trim() ||
                    "Patient",

                  email:
                    s(
                      data.email
                    ) ||
                    s(
                      profile.email
                    ),
                };
              }
            )
          );
        },
        (
          patientsError
        ) => {
          console.error(
            patientsError
          );

          setPatients(
            []
          );
        }
      );

    return () => {
      unsubscribeProfile();
      unsubscribeMessages();
      unsubscribePatients();
    };
  }, [uid]);

  const dr =
    useMemo(
      () =>
        doctor(
          doctorData ||
            {}
        ),
      [
        doctorData,
      ]
    );

  const conversations =
    useMemo(() => {
      const conversationMap =
        new Map<
          string,
          {
            patientId: string;
            patientName: string;
            last: Message;
            unread: number;
          }
        >();

      messages.forEach(
        (
          message
        ) => {
          if (
            !message.patientId
          ) {
            return;
          }

          const existing =
            conversationMap.get(
              message.patientId
            );

          if (
            !existing
          ) {
            conversationMap.set(
              message.patientId,
              {
                patientId:
                  message.patientId,

                patientName:
                  message.patientName,

                last:
                  message,

                unread:
                  message.direction ===
                    "inbound" &&
                  !message.read
                    ? 1
                    : 0,
              }
            );

            return;
          }

          if (
            message.createdAt >
            existing.last.createdAt
          ) {
            existing.last =
              message;

            existing.patientName =
              message.patientName ||
              existing.patientName;
          }

          if (
            message.direction ===
              "inbound" &&
            !message.read
          ) {
            existing.unread +=
              1;
          }
        }
      );

      return Array.from(
        conversationMap.values()
      ).sort(
        (
          first,
          second
        ) =>
          second.last.createdAt.getTime() -
          first.last.createdAt.getTime()
      );
    }, [
      messages,
    ]);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (
        !query
      ) {
        return conversations;
      }

      return conversations.filter(
        (
          conversation
        ) =>
          conversation.patientName
            .toLowerCase()
            .includes(
              query
            ) ||
          conversation.last.body
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      conversations,
      search,
    ]);

  const thread =
    useMemo(() => {
      if (
        !selected
      ) {
        return [];
      }

      return messages
        .filter(
          (
            message
          ) =>
            message.patientId ===
            selected
        )
        .sort(
          (
            first,
            second
          ) =>
            first.createdAt.getTime() -
            second.createdAt.getTime()
        );
    }, [
      messages,
      selected,
    ]);

  const selectedPatient =
    patients.find(
      (
        patient
      ) =>
        patient.id ===
        selected
    );

  const selectedConversation =
    conversations.find(
      (
        conversation
      ) =>
        conversation.patientId ===
        selected
    );

  const unread =
    messages.filter(
      (
        message
      ) =>
        message.direction ===
          "inbound" &&
        !message.read
    ).length;

  async function send() {
    if (
      sending
    ) {
      return;
    }

    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      !selected ||
      !text.trim()
    ) {
      setSendError(
        "Select a patient and enter a message."
      );

      return;
    }

    setSending(
      true
    );

    setSendError(
      null
    );

    try {
      await addDoc(
        collection(
          firestore,
          "professionals",
          uid,
          "messages"
        ),
        {
          body:
            text.trim(),

          senderId:
            uid,

          receiverId:
            selected,

          patientId:
            selected,

          patientName:
            selectedPatient
              ?.name ||
            selectedConversation
              ?.patientName ||
            "Patient",

          direction:
            "outbound",

          read:
            true,

          seen:
            true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          application:
            "doc_chap_ghana",
        }
      );

      setText(
        ""
      );
    } catch (
      sendMessageError
    ) {
      console.error(
        sendMessageError
      );

      setSendError(
        "Unable to send this message."
      );
    } finally {
      setSending(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <DoctorSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <DoctorSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                      <MessagesSquare className="h-4 w-4 text-cyan-300" />

                      Messages
                    </span>

                    {dr.verified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />

                        Verified doctor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <ShieldCheck className="h-4 w-4" />

                        Verification{" "}
                        {
                          dr.verificationStatus
                        }
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                    Patient messaging
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                    Communicate with patients linked to your professional account from one secure space.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      {
                        dr.name
                      }
                      {" • "}
                      {
                        dr.specialty
                      }
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
                      <MessageCircle className="h-4 w-4 text-emerald-300" />

                      {
                        unread
                      }{" "}
                      unread
                    </span>
                  </div>
                </div>

                <Link
                  href="/doctors/dashboard/patients"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#071b3a]"
                >
                  Patient directory

                  <UserRound className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {
                  error
                }
              </div>
            )}

            <div className="grid min-h-[640px] grid-cols-1 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)] dark:border-zinc-800 dark:bg-zinc-950">
              <aside className="border-b border-zinc-200 bg-zinc-50/70 p-4 lg:border-b-0 lg:border-r dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search conversations..."
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <select
                  value={
                    selected
                  }
                  onChange={(
                    event
                  ) =>
                    setSelected(
                      event.target.value
                    )
                  }
                  className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  <option value="">
                    Start / select conversation
                  </option>

                  {patients.map(
                    (
                      patient
                    ) => (
                      <option
                        key={
                          patient.id
                        }
                        value={
                          patient.id
                        }
                      >
                        {
                          patient.name
                        }
                      </option>
                    )
                  )}
                </select>

                <div className="mt-4 space-y-2">
                  {filtered.length ===
                  0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500">
                      No conversations yet.
                    </div>
                  ) : (
                    filtered.map(
                      (
                        conversation
                      ) => (
                        <button
                          key={
                            conversation.patientId
                          }
                          type="button"
                          onClick={() =>
                            setSelected(
                              conversation.patientId
                            )
                          }
                          className={`w-full rounded-2xl border p-3 text-left ${
                            selected ===
                            conversation.patientId
                              ? "border-blue-200 bg-blue-50"
                              : "border-zinc-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <UserRound className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-black">
                                  {
                                    conversation.patientName
                                  }
                                </span>

                                {conversation.unread >
                                  0 && (
                                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {
                                      conversation.unread
                                    }
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 truncate text-xs text-zinc-500">
                                {conversation.last.body ||
                                  "Message"}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>
              </aside>

              <div className="flex min-h-[560px] flex-col">
                {!selected ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <MessagesSquare className="h-7 w-7" />
                      </div>

                      <h2 className="mt-4 text-lg font-black dark:text-white">
                        Select a patient
                      </h2>

                      <p className="mt-2 max-w-sm text-sm text-zinc-500">
                        Select an existing conversation or a patient to start messaging.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="text-sm font-black dark:text-white">
                            {selectedPatient
                              ?.name ||
                              selectedConversation
                                ?.patientName ||
                              "Patient"}
                          </div>

                          <div className="text-xs text-zinc-500">
                            Secure patient conversation
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-5">
                      {thread.length ===
                      0 ? (
                        <div className="py-16 text-center text-sm text-zinc-500">
                          No messages yet. Send the first message below.
                        </div>
                      ) : (
                        thread.map(
                          (
                            message
                          ) => (
                            <div
                              key={
                                message.id
                              }
                              className={`flex ${
                                message.direction ===
                                "outbound"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                                  message.direction ===
                                  "outbound"
                                    ? "bg-blue-600 text-white"
                                    : "border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                                }`}
                              >
                                <p className="text-sm leading-6">
                                  {
                                    message.body
                                  }
                                </p>

                                <div
                                  className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                                    message.direction ===
                                    "outbound"
                                      ? "text-blue-100"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  {fdate(
                                    message.createdAt
                                  )}

                                  {message.direction ===
                                    "outbound" && (
                                    <CheckCheck className="h-3 w-3" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                      {sendError && (
                        <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                          {
                            sendError
                          }
                        </div>
                      )}

                      <div className="flex items-end gap-3">
                        <textarea
                          value={
                            text
                          }
                          onChange={(
                            event
                          ) =>
                            setText(
                              event.target.value
                            )
                          }
                          rows={
                            2
                          }
                          placeholder="Write a message..."
                          className="min-h-12 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void send()
                          }
                          disabled={
                            sending ||
                            !text.trim()
                          }
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-50"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
              <Mail className="mr-2 inline h-4 w-4" />

              Messages are stored under your doctor account and should only be used for professional patient communication.
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
