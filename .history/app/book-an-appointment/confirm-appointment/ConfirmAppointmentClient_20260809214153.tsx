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
    collection,
    getDocs,
    query,
    Timestamp,
    where,
} from "firebase/firestore";

import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CalendarDays,
    Check,
    Clock3,
    Info,
    Loader2,
    MapPin,
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
    durationMinutes: number;
    currency: string;

    modes: {
        inPerson: boolean;
        teleconsultation: boolean;
        phone: boolean;
    };
};

type DaySchedule = {
    key: string;
    open: boolean;
    start: string | null;
    end: string | null;
};

type BusyInterval = {
    startAt: string;
    endAt: string;
};

type AvailabilityResponse = {
    ok: boolean;
    provider?: Provider;
    date?: string;
    schedule?: DaySchedule;
    busy?: BusyInterval[];
    error?: string;
};

type BookingDraft = {
    version: number;

    provider: {
        id: string;
        type: ProviderType;
        name: string;
        specialty: string;
        city: string;
        region: string;
        address: string;
        photoUrl: string;
        durationMinutes: number;
        currency: string;
    };

    patient: {
        uid: string;
        fullName: string;
        email: string;
        phone: string;
        beneficiary:
        | "self"
        | "other";
        beneficiaryName: string;
    };

    appointment: {
        type: AppointmentType;
        reason: string;
    };

    selectedSlot?: {
        date: string;
        startAt: string;
        endAt: string;
    };

    createdAtIso: string;
};

type UiSlot = {
    startAt: string;
    endAt: string;
    label: string;
    taken: boolean;
    selected: boolean;
};

const DRAFT_KEY =
    "docchapghana:booking-draft:v1";

const DAY_MS =
    86_400_000;

function s(
    value: unknown
): string {
    return (value ?? "")
        .toString()
        .trim();
}

function parseDraft(
    value: string | null
): BookingDraft | null {
    if (
        !value
    ) {
        return null;
    }

    try {
        return JSON.parse(
            value
        ) as BookingDraft;
    } catch {
        return null;
    }
}

function ghanaDateString(
    offsetDays = 0
): string {
    const now =
        new Date(
            Date.now() +
            offsetDays *
            DAY_MS
        );

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
            now
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

function formatDay(
    date: string
): string {
    return new Intl.DateTimeFormat(
        "en-GH",
        {
            timeZone:
                "Africa/Accra",
            weekday:
                "short",
            day:
                "2-digit",
            month:
                "short",
        }
    ).format(
        new Date(
            `${date}T12:00:00.000Z`
        )
    );
}

function formatTime(
    iso: string
): string {
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
                false,
        }
    ).format(
        new Date(
            iso
        )
    );
}

function parseTime(
    value: string | null
) {
    if (
        !value
    ) {
        return null;
    }

    const match =
        /^(\d{1,2}):(\d{2})$/.exec(
            value
        );

    if (
        !match
    ) {
        return null;
    }

    const hour =
        Number(
            match[1]
        );

    const minute =
        Number(
            match[2]
        );

    if (
        !Number.isInteger(
            hour
        ) ||
        !Number.isInteger(
            minute
        ) ||
        hour <
        0 ||
        hour >
        23 ||
        minute <
        0 ||
        minute >
        59
    ) {
        return null;
    }

    return {
        hour,
        minute,
    };
}

function overlaps(
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

function buildSlots(
    date: string,
    schedule: DaySchedule | null,
    durationMinutes: number,
    busy: BusyInterval[],
    patientBusy: BusyInterval[],
    selectedStartAt: string
): UiSlot[] {
    if (
        !schedule?.open ||
        !schedule.start ||
        !schedule.end
    ) {
        return [];
    }

    const startParts =
        parseTime(
            schedule.start
        );

    const endParts =
        parseTime(
            schedule.end
        );

    if (
        !startParts ||
        !endParts
    ) {
        return [];
    }

    const start =
        new Date(
            `${date}T${String(
                startParts.hour
            ).padStart(
                2,
                "0"
            )}:${String(
                startParts.minute
            ).padStart(
                2,
                "0"
            )}:00.000Z`
        );

    const close =
        new Date(
            `${date}T${String(
                endParts.hour
            ).padStart(
                2,
                "0"
            )}:${String(
                endParts.minute
            ).padStart(
                2,
                "0"
            )}:00.000Z`
        );

    const now =
        new Date();

    const rows:
        UiSlot[] =
        [];

    for (
        let cursor =
            new Date(
                start
            );

        cursor <
        close;

        cursor =
        new Date(
            cursor.getTime() +
            durationMinutes *
            60_000
        )
    ) {
        const end =
            new Date(
                cursor.getTime() +
                durationMinutes *
                60_000
            );

        if (
            end >
            close
        ) {
            break;
        }

        const providerTaken =
            busy.some(
                (
                    interval
                ) =>
                    overlaps(
                        cursor,
                        end,
                        new Date(
                            interval.startAt
                        ),
                        new Date(
                            interval.endAt
                        )
                    )
            );

        const patientTaken =
            patientBusy.some(
                (
                    interval
                ) =>
                    overlaps(
                        cursor,
                        end,
                        new Date(
                            interval.startAt
                        ),
                        new Date(
                            interval.endAt
                        )
                    )
            );

        const inPast =
            cursor <=
            now;

        rows.push({
            startAt:
                cursor.toISOString(),

            endAt:
                end.toISOString(),

            label:
                formatTime(
                    cursor.toISOString()
                ),

            taken:
                providerTaken ||
                patientTaken ||
                inPast,

            selected:
                selectedStartAt ===
                cursor.toISOString(),
        });
    }

    return rows;
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

function appointmentTypeLabel(
    value: AppointmentType
): string {
    if (
        value ===
        "teleconsultation"
    ) {
        return "Teleconsultation";
    }

    if (
        value ===
        "phone"
    ) {
        return "Phone consultation";
    }

    return "In-person consultation";
}

export default function ConfirmAppointmentClient() {
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
        draft,
        setDraft,
    ] =
        useState<BookingDraft | null>(
            null
        );

    const [
        patientUid,
        setPatientUid,
    ] =
        useState("");

    const [
        selectedDate,
        setSelectedDate,
    ] =
        useState(
            ghanaDateString()
        );

    const [
        provider,
        setProvider,
    ] =
        useState<Provider | null>(
            null
        );

    const [
        schedule,
        setSchedule,
    ] =
        useState<DaySchedule | null>(
            null
        );

    const [
        busy,
        setBusy,
    ] =
        useState<BusyInterval[]>(
            []
        );

    const [
        patientBusy,
        setPatientBusy,
    ] =
        useState<BusyInterval[]>(
            []
        );

    const [
        selectedStartAt,
        setSelectedStartAt,
    ] =
        useState("");

    const [
        selectedEndAt,
        setSelectedEndAt,
    ] =
        useState("");

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        availabilityLoading,
        setAvailabilityLoading,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null
        );

    useEffect(() => {
        let stored:
            BookingDraft | null =
            null;

        try {
            stored =
                parseDraft(
                    window.sessionStorage.getItem(
                        DRAFT_KEY
                    )
                );
        } catch {
            stored =
                null;
        }

        if (
            !stored ||
            !type ||
            !id ||
            stored.provider.id !==
            id ||
            stored.provider.type !==
            type
        ) {
            setError(
                "The appointment information is missing. Please restart the booking."
            );

            setLoading(
                false
            );

            return;
        }

        setDraft(
            stored
        );

        if (
            stored.selectedSlot?.date
        ) {
            setSelectedDate(
                stored.selectedSlot.date
            );

            setSelectedStartAt(
                stored.selectedSlot.startAt ||
                ""
            );

            setSelectedEndAt(
                stored.selectedSlot.endAt ||
                ""
            );
        }
    }, [
        id,
        type,
    ]);

    useEffect(() => {
        if (
            !auth
        ) {
            setLoading(
                false
            );

            setError(
                "Firebase is not initialized."
            );

            return;
        }

        const firebaseAuth =
            auth;

        return onAuthStateChanged(
            firebaseAuth,
            (
                user
            ) => {
                if (
                    !user?.uid
                ) {
                    const next =
                        `/book-an-appointment/confirm-appointment?type=${encodeURIComponent(
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

                setLoading(
                    false
                );
            }
        );
    }, [
        id,
        router,
        type,
    ]);

    useEffect(() => {
        if (
            !draft ||
            !type ||
            !id ||
            !selectedDate
        ) {
            return;
        }

        const bookingDraft =
            draft;

        const providerType =
            type;

        const providerId =
            id;

        const appointmentDate =
            selectedDate;

        let cancelled =
            false;

        const controller =
            new AbortController();

        async function loadAvailability() {
            setAvailabilityLoading(
                true
            );

            setError(
                null
            );

            setSelectedStartAt(
                ""
            );

            setSelectedEndAt(
                ""
            );

            try {
                const params =
                    new URLSearchParams({
                        type:
                            providerType,
                        id:
                            providerId,
                        date:
                            appointmentDate,
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
                    !payload.provider ||
                    !payload.schedule
                ) {
                    throw new Error(
                        payload.error ||
                        "Unable to load appointment availability."
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

                setSchedule(
                    payload.schedule
                );

                setBusy(
                    payload.busy ||
                    []
                );

                /*
                 * bookingDraft est garanti non-null ici.
                 */
                console.log(
                    "[ConfirmAppointment] Booking draft loaded:",
                    bookingDraft.provider.id
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
                    "[ConfirmAppointment] Availability error:",
                    loadError
                );

                setError(
                    loadError instanceof
                        Error
                        ? loadError.message
                        : "Unable to load appointment availability."
                );

                setSchedule(
                    null
                );

                setBusy(
                    []
                );
            } finally {
                if (
                    !cancelled
                ) {
                    setAvailabilityLoading(
                        false
                    );
                }
            }
        }

        void loadAvailability();

        return () => {
            cancelled =
                true;

            controller.abort();
        };
    }, [
        draft,
        id,
        selectedDate,
        type,
    ]);

    useEffect(() => {
        if (
            !patientUid ||
            !db ||
            !selectedDate
        ) {
            setPatientBusy(
                []
            );

            return;
        }

        let cancelled =
            false;

        async function loadPatientBusy() {
            try {
                const firestore =
                    db;

                if (
                    !firestore
                ) {
                    return;
                }

                const dayStart =
                    new Date(
                        `${selectedDate}T00:00:00.000Z`
                    );

                const dayEnd =
                    new Date(
                        `${selectedDate}T23:59:59.999Z`
                    );

                const snapshot =
                    await getDocs(
                        query(
                            collection(
                                firestore,
                                "patients",
                                patientUid,
                                "appointments"
                            ),
                            where(
                                "startAt",
                                ">=",
                                Timestamp.fromDate(
                                    dayStart
                                )
                            ),
                            where(
                                "startAt",
                                "<=",
                                Timestamp.fromDate(
                                    dayEnd
                                )
                            )
                        )
                    );

                if (
                    cancelled
                ) {
                    return;
                }

                const intervals:
                    BusyInterval[] =
                    [];

                for (
                    const document of
                    snapshot.docs
                ) {
                    const data =
                        document.data();

                    const status =
                        s(
                            data.status
                        ).toLowerCase();

                    if (
                        status &&
                        ![
                            "scheduled",
                            "confirmed",
                            "ongoing",
                            "in_progress",
                            "checked_in",
                            "pending",
                        ].includes(
                            status
                        )
                    ) {
                        continue;
                    }

                    const start =
                        data.startAt?.toDate?.();

                    if (
                        !start
                    ) {
                        continue;
                    }

                    const explicitEnd =
                        data.endAt?.toDate?.();

                    const duration =
                        provider?.durationMinutes ??
                        draft?.provider?.durationMinutes ??
                        30;

                    const end =
                        explicitEnd ||
                        new Date(
                            start.getTime() +
                            duration *
                            60_000
                        );

                    intervals.push({
                        startAt:
                            start.toISOString(),

                        endAt:
                            end.toISOString(),
                    });
                }

                setPatientBusy(
                    intervals
                );
            } catch (
            patientBusyError
            ) {
                console.warn(
                    "[ConfirmAppointment] Patient busy slots error:",
                    patientBusyError
                );

                if (
                    !cancelled
                ) {
                    setPatientBusy(
                        []
                    );
                }
            }
        }

        void loadPatientBusy();

        return () => {
            cancelled =
                true;
        };
    }, [
        draft,
        patientUid,
        provider?.durationMinutes,
        selectedDate,
    ]);

    const days =
        useMemo(
            () =>
                Array.from(
                    {
                        length:
                            14,
                    },
                    (
                        _,
                        index
                    ) =>
                        ghanaDateString(
                            index
                        )
                ),
            []
        );

    const duration =
        provider?.durationMinutes ||
        draft?.provider.durationMinutes ||
        30;

    const slots =
        useMemo(
            () =>
                buildSlots(
                    selectedDate,
                    schedule,
                    duration,
                    busy,
                    patientBusy,
                    selectedStartAt
                ),
            [
                busy,
                duration,
                patientBusy,
                schedule,
                selectedDate,
                selectedStartAt,
            ]
        );

    const availableCount =
        slots.filter(
            (
                slot
            ) =>
                !slot.taken
        ).length;

    function selectSlot(
        slot: UiSlot
    ) {
        if (
            slot.taken
        ) {
            return;
        }

        setSelectedStartAt(
            slot.startAt
        );

        setSelectedEndAt(
            slot.endAt
        );

        if (
            !draft
        ) {
            return;
        }

        const updated:
            BookingDraft = {
            ...draft,

            selectedSlot: {
                date:
                    selectedDate,

                startAt:
                    slot.startAt,

                endAt:
                    slot.endAt,
            },
        };

        setDraft(
            updated
        );

        try {
            window.sessionStorage.setItem(
                DRAFT_KEY,
                JSON.stringify(
                    updated
                )
            );
        } catch {
            // Non-blocking.
        }
    }

    if (
        loading
    ) {
        return (
            <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
                <Header />

                <main className="flex min-h-[70vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </main>

                <Footer />
            </div>
        );
    }

    if (
        !draft ||
        !type ||
        !id
    ) {
        return (
            <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
                <Header />

                <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
                    <div className="rounded-[28px] border border-red-200 bg-white p-7 text-center shadow-sm dark:border-red-900/40 dark:bg-zinc-950">
                        <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

                        <h1 className="mt-4 text-xl font-black">
                            Booking information unavailable
                        </h1>

                        <p className="mt-2 text-sm text-zinc-500">
                            {error}
                        </p>

                        <Link
                            href="/search"
                            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />

                            Back to search
                        </Link>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    const displayedProvider =
        provider ||
        draft.provider;

    return (
        <div className="min-h-screen bg-[#f7faf9] dark:bg-black">
            <Header />

            <main>
                <section className="relative overflow-hidden border-b border-emerald-950/20 bg-gradient-to-br from-[#063b34] via-[#08745e] to-[#10a37f] text-white">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-10">
                        <Link
                            href={`/book-an-appointment?type=${encodeURIComponent(
                                type
                            )}&id=${encodeURIComponent(
                                id
                            )}`}
                            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-50 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />

                            Back to appointment details
                        </Link>

                        <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                            Choose a date and time
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
                            These times are generated from the schedule saved by the healthcare provider. Already occupied times cannot be selected.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                            <AlertCircle className="mr-2 inline h-4 w-4" />

                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-6">
                            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                                            Select a day
                                        </h2>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            Next 14 days • Ghana time
                                        </p>
                                    </div>

                                    <CalendarDays className="h-6 w-6 text-emerald-600" />
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                    {days.map(
                                        (
                                            day
                                        ) => (
                                            <button
                                                key={
                                                    day
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setSelectedDate(
                                                        day
                                                    )
                                                }
                                                className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${selectedDate ===
                                                        day
                                                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                                                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                                                    }`}
                                            >
                                                {formatDay(
                                                    day
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                                            Available times
                                        </h2>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {schedule?.open
                                                ? `${schedule.start} – ${schedule.end} • ${duration} min per consultation`
                                                : "The provider has not opened this day."}
                                        </p>
                                    </div>

                                    {!availabilityLoading && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                            {availableCount} available
                                        </span>
                                    )}
                                </div>

                                {availabilityLoading ? (
                                    <div className="flex min-h-48 items-center justify-center">
                                        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                                    </div>
                                ) : !schedule?.open ? (
                                    <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                                        <Clock3 className="mx-auto h-8 w-8 text-zinc-400" />

                                        <div className="mt-3 text-sm font-black">
                                            No consultation hours for this day
                                        </div>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            Choose another day to see the provider's availability.
                                        </p>
                                    </div>
                                ) : slots.length ===
                                    0 ? (
                                    <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                                        <Clock3 className="mx-auto h-8 w-8 text-zinc-400" />

                                        <div className="mt-3 text-sm font-black">
                                            No time slot available
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {slots.map(
                                            (
                                                slot
                                            ) => (
                                                <button
                                                    key={
                                                        slot.startAt
                                                    }
                                                    type="button"
                                                    disabled={
                                                        slot.taken
                                                    }
                                                    onClick={() =>
                                                        selectSlot(
                                                            slot
                                                        )
                                                    }
                                                    className={`relative rounded-2xl border px-3 py-3 text-sm font-black transition ${slot.selected
                                                            ? "border-emerald-600 bg-emerald-600 text-white ring-2 ring-emerald-200"
                                                            : slot.taken
                                                                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 line-through dark:border-zinc-800 dark:bg-zinc-900"
                                                                : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                                                        }`}
                                                >
                                                    {slot.selected && (
                                                        <Check className="absolute right-2 top-2 h-3.5 w-3.5" />
                                                    )}

                                                    {slot.label}
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>

                            {selectedStartAt && (
                                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                                            <Check className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-black text-zinc-950 dark:text-white">
                                                Time selected
                                            </h2>

                                            <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                {formatDay(
                                                    selectedDate
                                                )} •{" "}
                                                {formatTime(
                                                    selectedStartAt
                                                )} –{" "}
                                                {formatTime(
                                                    selectedEndAt
                                                )}
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                                The selected slot is saved in the booking draft. No appointment is created yet at this stage.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        <aside className="space-y-5">
                            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                        <TypeIcon
                                            type={
                                                type
                                            }
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                                            {displayedProvider.name}
                                        </h3>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {displayedProvider.specialty}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                    <MapPin className="h-4 w-4 text-emerald-600" />

                                    {[
                                        displayedProvider.city,
                                        displayedProvider.region,
                                    ]
                                        .filter(
                                            Boolean
                                        )
                                        .join(
                                            ", "
                                        ) ||
                                        "Ghana"}
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                                {draft.appointment.type ===
                                    "teleconsultation" ? (
                                    <Video className="h-6 w-6 text-violet-600" />
                                ) : draft.appointment.type ===
                                    "phone" ? (
                                    <Clock3 className="h-6 w-6 text-emerald-600" />
                                ) : (
                                    <UserRound className="h-6 w-6 text-blue-600" />
                                )}

                                <h3 className="mt-3 text-sm font-black text-zinc-950 dark:text-white">
                                    {appointmentTypeLabel(
                                        draft.appointment.type
                                    )}
                                </h3>

                                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                    {draft.appointment.reason}
                                </p>
                            </section>

                            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                                    Patient
                                </h3>

                                <div className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    {draft.patient.beneficiaryName}
                                </div>

                                <div className="mt-1 text-xs text-zinc-500">
                                    {draft.patient.email}
                                </div>

                                <div className="mt-1 text-xs text-zinc-500">
                                    {draft.patient.phone}
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                <Info className="h-5 w-5 text-amber-600" />

                                <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                    This is the availability-selection step only. Appointment creation, final confirmation and payment can be connected in the next step.
                                </p>
                            </section>
                        </aside>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}