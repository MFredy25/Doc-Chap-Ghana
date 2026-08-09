"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  Loader2,
  Send,
  X,
} from "lucide-react";

import {
  db,
} from "@/lib/firebase/client";

type SupportCategory =
  | "technical"
  | "account"
  | "appointments"
  | "payments"
  | "team"
  | "other";

type Props = {
  open: boolean;
  clinicId: string;
  clinicName: string;
  clinicOwner: string;
  onClose: () => void;
  onCreated?: (
    subject: string,
    ticketId: string
  ) => void;
};

export default function ClinicNewSupportMessageModal({
  open,
  clinicId,
  clinicName,
  clinicOwner,
  onClose,
  onCreated,
}: Props) {
  const [
    category,
    setCategory,
  ] =
    useState<SupportCategory>(
      "technical"
    );

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

    setCategory(
      "technical"
    );

    setSubject("");
    setMessage("");
    setSending(
      false
    );
    setError(
      null
    );
    setSuccess(
      false
    );
  }, [
    open,
  ]);

  async function sendTicket() {
    const firestore =
      db;

    if (
      !firestore ||
      !clinicId ||
      sending
    ) {
      return;
    }

    const cleanSubject =
      subject.trim();

    const cleanMessage =
      message.trim();

    if (
      !cleanSubject ||
      !cleanMessage
    ) {
      setError(
        "Enter a subject and a message before sending your request."
      );

      return;
    }

    if (
      cleanSubject.length <
      3
    ) {
      setError(
        "Please enter a more descriptive subject."
      );

      return;
    }

    if (
      cleanMessage.length <
      10
    ) {
      setError(
        "Please provide a little more detail about your request."
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
      const ticketRef =
        await addDoc(
          collection(
            firestore,
            "clinics",
            clinicId,
            "supportTickets"
          ),
          {
            clinicId,

            clinicName,

            clinicOwner,

            category,

            subject:
              cleanSubject,

            message:
              cleanMessage,

            status:
              "open",

            priority:
              "normal",

            application:
              "doc_chap_ghana",

            accountType:
              "clinic",

            country:
              "GH",

            locale:
              "en-GH",

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
        cleanSubject,
        ticketRef.id
      );
    } catch (
      sendError
    ) {
      console.error(
        "[ClinicNewSupportMessageModal] Send error:",
        sendError
      );

      setError(
        "Unable to send your support request."
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

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinic-support-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close support request modal"
        onClick={() => {
          if (
            !sending
          ) {
            onClose();
          }
        }}
      />

      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] px-5 py-6 text-white sm:px-7">
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
                <Headphones className="h-6 w-6 text-cyan-200" />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  {clinicName}
                </div>

                <h2
                  id="clinic-support-modal-title"
                  className="mt-1 text-2xl font-black tracking-tight"
                >
                  New support request
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Write to the Doc Chap Ghana support team. Your request will be saved under your clinic account.
            </p>
          </div>
        </div>

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

              Your support request has been sent successfully.
            </div>
          )}

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Category
              </span>

              <select
                value={
                  category
                }
                onChange={(
                  event
                ) => {
                  setCategory(
                    event.target
                      .value as SupportCategory
                  );

                  setError(
                    null
                  );
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              >
                <option value="technical">
                  Technical issue
                </option>

                <option value="account">
                  Clinic account
                </option>

                <option value="appointments">
                  Appointments
                </option>

                <option value="payments">
                  Payments
                </option>

                <option value="team">
                  Healthcare team
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

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
                placeholder="Briefly describe your request"
                maxLength={
                  160
                }
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />

              <div className="mt-1 text-right text-[11px] text-zinc-400">
                {subject.length}
                /160
              </div>
            </label>

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
                  2500
                }
                placeholder="Explain what your clinic needs help with..."
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />

              <div className="mt-1 text-right text-[11px] text-zinc-400">
                {message.length}
                /2500
              </div>
            </label>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Clinic
              </div>

              <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                {clinicName}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Administrator:{" "}
                {clinicOwner}
              </div>
            </div>
          </div>
        </div>

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
              void sendTicket()
            }
            disabled={
              sending
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

                Send request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}