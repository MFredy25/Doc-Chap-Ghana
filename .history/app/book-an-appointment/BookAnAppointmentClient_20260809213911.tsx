"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    onAuthStateChanged,
} from "firebase/auth";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    HeartPulse,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Stethoscope,
    UserRound,
    Video,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

import {
    auth,
    db,
} from "@/lib/firebase/client";

type ProviderType =
    | "doctor"
    | "clinic";

type AppointmentType =
    | "in_person"
    | "teleconsultation"
    | "phone";

type Provider = {
    id: string;
    type: ProviderType;
    name: string;
    specialty: string;
    city: string;
    region: string;
    address: string;
    photoUrl: string;
    acceptsNewPatients: boolean;
    durationMinutes: number;
    currency: string;

    modes: {
        inPerson: boolean;
        teleconsultation: boolean;
        phone: boolean;
    };
};

type AvailabilityResponse = {
    ok: boolean;
    provider?: Provider;
    error?: string;
};

type PatientData = {
    profile?: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        displayName?: string;
        email?: string;
        phone?: string;
        phoneNumber?: string;
    };

    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
};

const DRAFT_KEY =
    "docchapghana:booking-draft:v1";

function s(
    value: unknown
): string {
    return (value ?? "")
        .toString()
        .trim();
}

function ghanaToday(): string {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "Africa/Accra",
                year:
                    "numeric",
                month:
                    "2-digit",
                day:
                    "2-digit",
            }
        ).formatToParts(
            new Date()
        );

    const values =
        Object.fromEntries(
            parts.map(
                (
                    part
                ) => [
                        part.type,
                        part.value,
                    ]
            )
        );

    return `${values.year}-${values.month}-${values.day}`;
}

function normalizePhone(
    value: string
): string {
    const raw =
        s(
            value
        );

    if (
        !raw
    ) {
        return "";
    }

    let digits =
        raw.replace(
            /\D/g,
            ""
        );

    if (
        digits.startsWith(
            "233"
        )
    ) {
        digits =
            digits.slice(
                3
            );
    }

    if (
        digits.startsWith(
            "0"
        )
    ) {
        digits =
            digits.slice(
                1
            );
    }

    return `+233${digits}`;
}

function TypeIcon({
    type,
    className,
}: {
    type: ProviderType;
    className?: string;
}) {
    if (
        type ===
        "doctor"
    ) {
        return (
            <Stethoscope
                className={
                    className
                }
            />
        );
    }

    return (
        <Building2
            className={
                className
            }
        />
    );
}

export default function BookAnAppointmentClient() {
    const router =
        useRouter();

    const searchParams =
        useSearchParams();

    const rawType =
        s(
            searchParams.get(
                "type"
            )
        ).toLowerCase();

    const type:
        | ProviderType
        | null =
        rawType ===
            "doctor" ||
            rawType ===
            "clinic"
            ? rawType
            : null;

    const id =
        s(
            searchParams.get(
                "id"
            )
        );

    const [
        authLoading,
        setAuthLoading,
    ] =
        useState(true);

    const [
        patientUid,
        setPatientUid,
    ] =
        useState("");

    const [
        provider,
        setProvider,
    ] =
        useState<Provider | null>(
            null
        );

    const [
        providerLoading,
        setProviderLoading,
    ] =
        useState(true);

    const [
        fullName,
        setFullName,
    ] =
        useState("");

    const [
        email,
        setEmail,
    ] =
        useState("");

    const [
        phone,
        setPhone,
    ] =
        useState("");

    const [
        beneficiary,
        setBeneficiary,
    ] =
        useState<
            "self" |
            "other"
        >(
            "self"
        );

    const [
        otherFullName,
        setOtherFullName,
    ] =
        useState("");

    const [
        reason,
        setReason,
    ] =
        useState("");

    const [
        appointmentType,
        setAppointmentType,
    ] =
        useState<AppointmentType | null>(
            null
        );

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null
        );

    useEffect(() => {
        if (
            !auth ||
            !db
        ) {
            setError(
                "Firebase is not initialized."
            );

            setAuthLoading(
                false
            );

            return;
        }

        const firebaseAuth =
            auth;

        const firestore =
            db;

        const stopAuth =
            onAuthStateChanged(
                firebaseAuth,
                async (
                    user
                ) => {
                    if (
                        !user?.uid
                    ) {
                        const next =
                            `/book-an-appointment?type=${encodeURIComponent(
                                type ||
                                ""
                            )}&id=${encodeURIComponent(
                                id
                            )}`;

                        router.replace(
                            `/patients/login?next=${encodeURIComponent(
                                next
                            )}`
                        );

                        return;
                    }

                    setPatientUid(
                        user.uid
                    );

                    try {
                        const patientSnapshot =
                            await getDoc(
                                doc(
                                    firestore,
                                    "patients",
                                    user.uid
                                )
                            );

                        if (
                            patientSnapshot.exists()
                        ) {
                            const data =
                                patientSnapshot.data() as PatientData;

                            const profile =
                                data.profile ||
                                {};

                            const firstName =
                                s(
                                    profile.firstName ||
                                    data.firstName
                                );

                            const lastName =
                                s(
                                    profile.lastName ||
                                    data.lastName
                                );

                            setFullName(
                                s(
                                    profile.fullName ||
                                    profile.displayName ||
                                    data.fullName ||
                                    data.displayName
                                ) ||
                                `${firstName} ${lastName}`.trim() ||
                                s(
                                    user.displayName
                                )
                            );

                            setEmail(
                                s(
                                    profile.email ||
                                    data.email ||
                                    user.email
                                )
                            );

                            setPhone(
                                s(
                                    profile.phone ||
                                    profile.phoneNumber ||
                                    data.phone ||
                                    user.phoneNumber
                                )
                            );
                        } else {
                            setFullName(
                                s(
                                    user.displayName
                                )
                            );

                            setEmail(
                                s(
                                    user.email
                                )
                            );

                            setPhone(
                                s(
                                    user.phoneNumber
                                )
                            );
                        }
                    } catch (
                    profileError
                    ) {
                        console.error(
                            "[BookAppointment] Patient profile error:",
                            profileError
                        );

                        setFullName(
                            s(
                                user.displayName
                            )
                        );

                        setEmail(
                            s(
                                user.email
                            )
                        );
                    } finally {
                        setAuthLoading(
                            false
                        );
                    }
                }
            );

        return () =>
            stopAuth();
    }, [
        id,
        router,
        type,
    ]);

    useEffect(() => {
        if (
            !type ||
            !id
        ) {
            setProvider(
                null
            );

            setProviderLoading(
                false
            );

            setError(
                "Invalid healthcare provider."
            );

            return;
        }

        let cancelled =
            false;

        const controller =
            new AbortController();

        async function loadProvider() {
            setProviderLoading(
                true
            );

            try {
                const params =
                    new URLSearchParams({
                        type:
                            type ?? "",
                        id,
                        date:
                            ghanaToday(),
                    });

                const response =
                    await fetch(
                        `/api/book-an-appointment/availability?${params.toString()}`,
                        {
                            cache:
                                "no-store",

                            signal:
                                controller.signal,
                        }
                    );

                const payload =
                    (
                        await response.json()
                    ) as AvailabilityResponse;

                if (
                    !response.ok ||
                    payload.ok !==
                    true ||
                    !payload.provider
                ) {
                    throw new Error(
                        payload.error ||
                        "Unable to load this provider."
                    );
                }

                if (
                    cancelled
                ) {
                    return;
                }

                setProvider(
                    payload.provider
                );

                const modes =
                    payload.provider.modes;

                if (
                    modes.inPerson &&
                    !modes.teleconsultation &&
                    !modes.phone
                ) {
                    setAppointmentType(
                        "in_person"
                    );
                } else if (
                    !modes.inPerson &&
                    modes.teleconsultation &&
                    !modes.phone
                ) {
                    setAppointmentType(
                        "teleconsultation"
                    );
                } else if (
                    !modes.inPerson &&
                    !modes.teleconsultation &&
                    modes.phone
                ) {
                    setAppointmentType(
                        "phone"
                    );
                }

                setError(
                    null
                );
            } catch (
            loadError
            ) {
                if (
                    cancelled ||
                    (
                        loadError instanceof
                        DOMException &&
                        loadError.name ===
                        "AbortError"
                    )
                ) {
                    return;
                }

                console.error(
                    "[BookAppointment] Provider load error:",
                    loadError
                );

                setError(
                    loadError instanceof
                        Error
                        ? loadError.message
                        : "Unable to load this provider."
                );

                setProvider(
                    null
                );
            } finally {
                if (
                    !cancelled
                ) {
                    setProviderLoading(
                        false
                    );
                }
            }
        }

        void loadProvider();

        return () => {
            cancelled =
                true;

            controller.abort();
        };
    }, [
        id,
        type,
    ]);

    const location =
        useMemo(
            () => {
                if (
                    !provider
                ) {
                    return "Ghana";
                }

                return [
                    provider.city,
                    provider.region,
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        ", "
                    ) ||
                    "Ghana";
            },
            [
                provider,
            ]
        );

    function continueToAvailability() {
        if (
            !provider ||
            !type ||
            !patientUid
        ) {
            return;
        }

        const cleanFullName =
            s(
                fullName
            );

        const cleanEmail =
            s(
                email
            ).toLowerCase();

        const cleanPhone =
            normalizePhone(
                phone
            );

        if (
            cleanFullName.length <
            2
        ) {
            setError(
                "Please enter the patient full name."
            );

            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                cleanEmail
            )
        ) {
            setError(
                "Please enter a valid email address."
            );

            return;
        }

        if (
            !/^\+233\d{9}$/.test(
                cleanPhone
            )
        ) {
            setError(
                "Please enter a valid Ghana phone number."
            );

            return;
        }

        if (
            beneficiary ===
            "other" &&
            s(
                otherFullName
            ).length <
            2
        ) {
            setError(
                "Please enter the beneficiary's full name."
            );

            return;
        }

        if (
            !appointmentType
        ) {
            setError(
                "Please choose a consultation type."
            );

            return;
        }

        if (
            s(
                reason
            ).length <
            3
        ) {
            setError(
                "Please briefly describe the reason for the appointment."
            );

            return;
        }

        const draft = {
            version:
                1,

            provider: {
                id:
                    provider.id,

                type:
                    provider.type,

                name:
                    provider.name,

                specialty:
                    provider.specialty,

                city:
                    provider.city,

                region:
                    provider.region,

                address:
                    provider.address,

                photoUrl:
                    provider.photoUrl,

                durationMinutes:
                    provider.durationMinutes,

                currency:
                    provider.currency,
            },

            patient: {
                uid:
                    patientUid,

                fullName:
                    cleanFullName,

                email:
                    cleanEmail,

                phone:
                    cleanPhone,

                beneficiary,

                beneficiaryName:
                    beneficiary ===
                        "other"
                        ? s(
                            otherFullName
                        )
                        : cleanFullName,
            },

            appointment: {
                type:
                    appointmentType,

                reason:
                    s(
                        reason
                    ),
            },

            createdAtIso:
                new Date().toISOString(),
        };

        try {
            window.sessionStorage.setItem(
                DRAFT_KEY,
                JSON.stringify(
                    draft
                )
            );
        } catch (
        storageError
        ) {
            console.warn(
                "[BookAppointment] Unable to save booking draft:",
                storageError
            );
        }

        router.push(
            `/book-an-appointment/confirm-appointment?type=${encodeURIComponent(
                type
            )}&id=${encodeURIComponent(
                provider.id
            )}`
        );
    }

    const loading =
        authLoading ||
        providerLoading;

    return (
        <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
            <Header />

            <main>
                <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-10">
                        <Link
                            href={
                                type &&
                                    id
                                    ? `/search/${encodeURIComponent(
                                        id
                                    )}?type=${encodeURIComponent(
                                        type
                                    )}`
                                    : "/search"
                            }
                            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-50 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />

                            Back to provider
                        </Link>

                        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                                    <CalendarDays className="h-4 w-4" />

                                    Book an appointment
                                </span>

                                <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                                    Appointment details
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                                    Complete the patient and consultation information. You will choose an available date and time on the next page.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                            <AlertCircle className="mr-2 inline h-4 w-4" />

                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

                                <p className="mt-4 text-sm font-semibold text-zinc-500">
                                    Loading appointment information...
                                </p>
                            </div>
                        </div>
                    ) : provider ? (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-6">
                                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                                            <UserRound className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                                                Patient information
                                            </h2>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                Confirm who the appointment is for and how we can contact you.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <label className="sm:col-span-2">
                                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                Full name
                                            </span>

                                            <input
                                                value={
                                                    fullName
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setFullName(
                                                        event.target.value
                                                    )
                                                }
                                                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                                            />
                                        </label>

                                        <label>
                                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                Email
                                            </span>

                                            <div className="relative mt-2">
                                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                                                <input
                                                    type="email"
                                                    value={
                                                        email
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setEmail(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                                                />
                                            </div>
                                        </label>

                                        <label>
                                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                Ghana phone number
                                            </span>

                                            <div className="relative mt-2">
                                                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                                                <input
                                                    value={
                                                        phone
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setPhone(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="+233..."
                                                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                                                />
                                            </div>
                                        </label>
                                    </div>

                                    <div className="mt-5">
                                        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                            Who is this appointment for?
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setBeneficiary(
                                                        "self"
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left transition ${beneficiary ===
                                                        "self"
                                                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:bg-emerald-950/20"
                                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                    }`}
                                            >
                                                <UserRound className="h-5 w-5 text-emerald-600" />

                                                <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                                                    Myself
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setBeneficiary(
                                                        "other"
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left transition ${beneficiary ===
                                                        "other"
                                                        ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/20"
                                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                    }`}
                                            >
                                                <HeartPulse className="h-5 w-5 text-blue-600" />

                                                <div className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                                                    Someone else
                                                </div>
                                            </button>
                                        </div>

                                        {beneficiary ===
                                            "other" && (
                                                <label className="mt-4 block">
                                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                        Beneficiary full name
                                                    </span>

                                                    <input
                                                        value={
                                                            otherFullName
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setOtherFullName(
                                                                event.target.value
                                                            )
                                                        }
                                                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                                                    />
                                                </label>
                                            )}
                                    </div>
                                </section>

                                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                    <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                                        Consultation
                                    </h2>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Choose one of the consultation modes offered by this provider.
                                    </p>

                                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {provider.modes.inPerson && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAppointmentType(
                                                        "in_person"
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left ${appointmentType ===
                                                        "in_person"
                                                        ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100 dark:bg-cyan-950/20"
                                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                    }`}
                                            >
                                                <UserRound className="h-5 w-5 text-cyan-600" />

                                                <div className="mt-3 text-sm font-black">
                                                    In-person
                                                </div>
                                            </button>
                                        )}

                                        {provider.modes.teleconsultation && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAppointmentType(
                                                        "teleconsultation"
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left ${appointmentType ===
                                                        "teleconsultation"
                                                        ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100 dark:bg-violet-950/20"
                                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                    }`}
                                            >
                                                <Video className="h-5 w-5 text-violet-600" />

                                                <div className="mt-3 text-sm font-black">
                                                    Teleconsultation
                                                </div>
                                            </button>
                                        )}

                                        {provider.modes.phone && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAppointmentType(
                                                        "phone"
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left ${appointmentType ===
                                                        "phone"
                                                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:bg-emerald-950/20"
                                                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                                                    }`}
                                            >
                                                <Phone className="h-5 w-5 text-emerald-600" />

                                                <div className="mt-3 text-sm font-black">
                                                    Phone
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    <label className="mt-5 block">
                                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                            Reason for the appointment
                                        </span>

                                        <textarea
                                            value={
                                                reason
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setReason(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Briefly describe why you need this consultation..."
                                            className="mt-2 min-h-32 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                                        />
                                    </label>
                                </section>

                                <button
                                    type="button"
                                    onClick={
                                        continueToAvailability
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                                >
                                    Continue to availability

                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>

                            <aside className="space-y-5">
                                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                                            {provider.photoUrl ? (
                                                <img
                                                    src={
                                                        provider.photoUrl
                                                    }
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <TypeIcon
                                                    type={
                                                        provider.type
                                                    }
                                                    className="h-6 w-6"
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                                                {provider.name}
                                            </h3>

                                            <p className="mt-1 text-xs font-semibold text-zinc-500">
                                                {provider.specialty}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                            <MapPin className="h-4 w-4 text-emerald-600" />

                                            {location}
                                        </div>

                                        {provider.address && (
                                            <div className="mt-2 text-xs leading-5 text-zinc-500">
                                                {provider.address}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <CalendarDays className="h-6 w-6 text-blue-600" />

                                    <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                                        Next step
                                    </h3>

                                    <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                        The next page will show the actual weekly schedule saved by this provider and remove already occupied appointment times.
                                    </p>
                                </section>
                            </aside>
                        </div>
                    ) : null}
                </section>
            </main>

            <Footer />
        </div>
    );
}