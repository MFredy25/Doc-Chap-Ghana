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
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ReceiptText,
  Smartphone,
  UserRound,
  WalletCards,
} from "lucide-react";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ClinicSidebar from "@/app/components/ClinicSidebar";

import {
  auth,
  db,
} from "@/lib/firebase/client";

type ClinicData = {
  role?: string;
  accountType?: string;
  status?: string;
  active?: boolean;

  profile?: {
    clinicName?: string;
    displayName?: string;
    fullName?: string;
    email?: string;
    phone?: string;

    owner?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  };

  clinic?: {
    type?: string;
  };
};

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  paymentMethod:
    | "mobile_money"
    | "card";
};


type PlanId =
  | "essential"
  | "professional"
  | "premium";

type BillingDuration =
  | 1
  | 3
  | 6
  | 12;

type PaymentPlan = {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  currency: "GHS";
  userLimit: number;
  description: string;
};

const PLANS: Record<PlanId, PaymentPlan> = {
  essential: {
    id: "essential",
    name: "Essential",
    monthlyPrice: 59,
    currency: "GHS",
    userLimit: 5,
    description:
      "Practical tools for growing clinic operations.",
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 129,
    currency: "GHS",
    userLimit: 10,
    description:
      "Business and care-management tools for active clinics.",
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPrice: 189,
    currency: "GHS",
    userLimit: 20,
    description:
      "Advanced tools, insights and priority services.",
  },
};

function s(value: unknown): string {
  return (value ?? "").toString().trim();
}

function o(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isPlanId(
  value: string
): value is PlanId {
  return (
    value === "essential" ||
    value === "professional" ||
    value === "premium"
  );
}

function parseMonths(
  value: string | null
): BillingDuration {
  const parsed = Number(value);

  if (
    parsed === 3 ||
    parsed === 6 ||
    parsed === 12
  ) {
    return parsed;
  }

  return 1;
}

function getDiscount(
  months: BillingDuration
): number {
  if (months === 3) return 1.5;
  if (months === 6) return 3;
  if (months === 12) return 5;
  return 0;
}

function pricing(
  monthlyPrice: number,
  months: BillingDuration
) {
  const regularTotal =
    monthlyPrice * months;

  const discountPercent =
    getDiscount(months);

  const discountAmount =
    regularTotal *
    (discountPercent / 100);

  const total =
    regularTotal -
    discountAmount;

  return {
    regularTotal,
    discountPercent,
    discountAmount,
    total,
    monthlyEquivalent:
      total / months,
  };
}

function money(
  amount: number,
  currency = "GHS"
): string {
  try {
    return new Intl.NumberFormat(
      "en-GH",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GH")} ${currency}`;
  }
}


export default function CheckoutClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

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
    clinicData,
    setClinicData,
  ] =
    useState<ClinicData | null>(
      null
    );

  const [
    submitting,
    setSubmitting,
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
    useState<string | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<CheckoutForm>({
      fullName: "",
      email: "",
      phone: "",
      paymentMethod:
        "mobile_money",
    });

  const rawPlan =
    s(
      searchParams.get("plan")
    ).toLowerCase();

  const months =
    parseMonths(
      searchParams.get("months")
    );

  const plan =
    isPlanId(rawPlan)
      ? PLANS[rawPlan]
      : null;

  const price =
    plan
      ? pricing(
          plan.monthlyPrice,
          months
        )
      : null;

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
      setLoading(false);
      return;
    }

    const firebaseAuthInstance =
      firebaseAuth;

    const firestoreInstance =
      firestore;

    let unsubscribeClinic:
      | (() => void)
      | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        firebaseAuthInstance,
        (user) => {
          unsubscribeClinic?.();
          unsubscribeClinic = null;

          if (!user?.uid) {
            router.replace(
              "/clinics/login"
            );
            return;
          }

          setUid(user.uid);

          unsubscribeClinic =
            onSnapshot(
              doc(
                firestoreInstance,
                "clinics",
                user.uid
              ),
              async (snapshot) => {
                if (!snapshot.exists()) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/clinics/login"
                  );
                  return;
                }

                const data =
                  snapshot.data() as ClinicData;

                const clinic =
                  o(data.clinic);

                const accountType =
                  s(
                    data.accountType ||
                      data.role ||
                      clinic.type
                  ).toLowerCase();

                if (
                  (
                    accountType &&
                    accountType !== "clinic"
                  ) ||
                  data.active === false ||
                  s(data.status).toLowerCase() ===
                    "disabled"
                ) {
                  try {
                    await signOut(
                      firebaseAuthInstance
                    );
                  } catch {}

                  router.replace(
                    "/clinics/login"
                  );
                  return;
                }

                const profile =
                  o(data.profile);

                const owner =
                  o(profile.owner);

                const ownerName =
                  s(owner.fullName) ||
                  `${s(owner.firstName)} ${s(owner.lastName)}`.trim();

                setClinicData(data);

                setForm((current) => ({
                  ...current,
                  fullName:
                    current.fullName ||
                    ownerName,
                  email:
                    current.email ||
                    s(
                      owner.email ||
                        profile.email ||
                        user.email
                    ),
                  phone:
                    current.phone ||
                    s(
                      owner.phone ||
                        profile.phone
                    ),
                }));

                setLoading(false);
              },
              (realtimeError) => {
                console.error(
                  "[ClinicSubscriptionCheckout] Clinic error:",
                  realtimeError
                );
                setError(
                  "Unable to load your clinic account."
                );
                setLoading(false);
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeClinic?.();
    };
  }, [router]);

  const clinicName =
    useMemo(() => {
      const profile =
        o(clinicData?.profile);

      return (
        s(profile.clinicName) ||
        s(profile.displayName) ||
        s(profile.fullName) ||
        "Clinic"
      );
    }, [clinicData]);

  function updateForm<
    K extends keyof CheckoutForm
  >(
    key: K,
    value: CheckoutForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  async function continuePayment() {
    const firestore =
      db;

    if (
      !firestore ||
      !uid ||
      !plan ||
      !price ||
      submitting
    ) {
      return;
    }

    const fullName =
      form.fullName.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const phone =
      form.phone.trim();

    if (fullName.length < 3) {
      setError(
        "Enter the payer full name."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    if (
      form.paymentMethod ===
        "mobile_money" &&
      phone.replace(/\D/g, "")
        .length < 9
    ) {
      setError(
        "Enter a valid Mobile Money phone number."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const requestRef =
        await addDoc(
          collection(
            firestore,
            "clinics",
            uid,
            "subscriptionPayments"
          ),
          {
            clinicId: uid,
            clinicName,
            planId: plan.id,
            planName: plan.name,
            monthlyPrice:
              plan.monthlyPrice,
            billingMonths:
              months,
            regularTotal:
              price.regularTotal,
            discountPercent:
              price.discountPercent,
            discountAmount:
              price.discountAmount,
            amount:
              price.total,
            currency:
              plan.currency,
            userLimit:
              plan.userLimit,
            paymentMethod:
              form.paymentMethod,
            customer: {
              fullName,
              email,
              phone:
                phone || null,
            },
            status:
              "checkout_created",
            paymentStatus:
              "pending",
            provider:
              null,
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
        `Checkout ${requestRef.id} created. Connect your secure payment-provider API to this request to start the actual charge.`
      );
    } catch (checkoutError) {
      console.error(
        "[ClinicSubscriptionCheckout] Checkout error:",
        checkoutError
      );

      setError(
        "Unable to create the subscription checkout."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[75vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </main>
        </div>
      </div>
    );
  }

  if (
    !plan ||
    !price
  ) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
        <ClinicSidebar />

        <div className="lg:pl-72">
          <Header />

          <main className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-7 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500" />

              <h1 className="mt-4 text-xl font-black dark:text-white">
                Invalid checkout
              </h1>

              <Link
                href="/clinics/dashboard/subscriptions"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to plans
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-black">
      <ClinicSidebar />

      <div className="lg:pl-72">
        <Header />

        <main>
          <section className="relative overflow-hidden border-b border-blue-950/20 bg-gradient-to-br from-[#06172f] via-[#0a2d5d] to-[#1767b5] text-white">
            <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              <Link
                href={`/clinics/dashboard/subscriptions/payments?plan=${plan.id}&months=${months}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />

                Payment summary
              </Link>

              <h1 className="mt-6 text-3xl font-black sm:text-4xl">
                Checkout
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Enter the billing contact and choose how the clinic wants to pay.
              </p>
            </div>
          </section>

          <section className="px-4 py-7 sm:px-6 lg:px-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mr-2 inline h-4 w-4" />

                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />

                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black dark:text-white">
                    Billing contact
                  </h2>

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Full name *
                      </span>

                      <div className="relative mt-2">
                        <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={form.fullName}
                          onChange={(event) =>
                            updateForm(
                              "fullName",
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Email *
                      </span>

                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            updateForm(
                              "email",
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Phone
                      </span>

                      <div className="relative mt-2">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                        <input
                          value={form.phone}
                          onChange={(event) =>
                            updateForm(
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="+233..."
                          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-black dark:text-white">
                    Payment method
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "paymentMethod",
                          "mobile_money"
                        )
                      }
                      className={`rounded-[22px] border p-4 text-left transition ${
                        form.paymentMethod ===
                        "mobile_money"
                          ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-950/20"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                      }`}
                    >
                      <Smartphone className="h-6 w-6 text-blue-600" />

                      <div className="mt-3 text-sm font-black dark:text-white">
                        Mobile Money
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        Use a supported Ghana Mobile Money account.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "paymentMethod",
                          "card"
                        )
                      }
                      className={`rounded-[22px] border p-4 text-left transition ${
                        form.paymentMethod ===
                        "card"
                          ? "border-violet-500 bg-violet-50 ring-4 ring-violet-500/10 dark:bg-violet-950/20"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                      }`}
                    >
                      <CreditCard className="h-6 w-6 text-violet-600" />

                      <div className="mt-3 text-sm font-black dark:text-white">
                        Bank card
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        Card data must be handled by the payment provider.
                      </p>
                    </button>
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <ReceiptText className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black dark:text-white">
                    Order summary
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Plan
                      </span>
                      <span className="text-xs font-black dark:text-white">
                        {plan.name}
                      </span>
                    </div>

                    <div className="flex justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Billing period
                      </span>
                      <span className="text-xs font-black dark:text-white">
                        {months} month{months === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                      <span className="text-xs text-zinc-500">
                        Discount
                      </span>
                      <span className="text-xs font-black text-emerald-600">
                        {price.discountPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                      Total
                    </div>

                    <div className="mt-1 text-3xl font-black dark:text-white">
                      {money(price.total)}
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <LockKeyhole className="h-6 w-6 text-emerald-600" />

                  <h3 className="mt-3 text-sm font-black dark:text-white">
                    Secure payment
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    This page creates the pending checkout request. The subscription must only become active after your server-side payment provider confirms payment.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void continuePayment()
                    }
                    disabled={submitting}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />

                        Preparing payment...
                      </>
                    ) : (
                      <>
                        <WalletCards className="h-4 w-4" />

                        Continue to secure payment
                      </>
                    )}
                  </button>
                </section>

                <section className="rounded-[28px] border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Building2 className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-3 text-sm font-black dark:text-white">
                    {clinicName}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    This checkout belongs only to the authenticated clinic.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}