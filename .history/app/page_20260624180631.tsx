"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";

function FeatureCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-8 transition hover:scale-[1.02] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>

        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
      </div>

      <p className="mt-4 text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function TrustCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>

        <div>
          <h4 className="text-sm font-semibold text-black dark:text-white sm:text-base">
            {title}
          </h4>

          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white">
          {number}
        </span>

        <Icon className="h-5 w-5 text-teal-700 dark:text-teal-400" />

        <h3 className="font-semibold text-black dark:text-white">{title}</h3>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [persons, setPersons] = useState(1);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();

    if (address.trim()) params.set("address", address.trim());
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (persons) params.set("persons", String(persons));

    router.push(`/search?${params.toString()}`);
  }, [address, date, persons, router, time]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />

      <section className="relative w-full overflow-hidden">
        <video
          src="/videos/doctor.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-[62vh] w-full object-cover object-[50%_40%] md:h-[72vh] lg:h-[77vh] lg:object-center"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-6xl px-4 sm:px-6 md:px-8">
            <div className="text-center text-white">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Book healthcare appointments easily
                <br className="hidden sm:block" />
                with a doctor or clinic
              </h1>

              <p className="mt-3 text-sm text-white/90 sm:text-base md:text-lg">
                Find a healthcare professional, book online and access care with
                confidence.
              </p>
            </div>

            <div className="mt-6 hidden justify-center md:flex">
              <div className="w-full max-w-5xl rounded-xl bg-white/90 shadow-lg backdrop-blur-md dark:bg-gray-800/90">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    <span>📅</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    <span>⏰</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    <span>👤</span>
                    <input
                      type="number"
                      min={1}
                      value={persons}
                      onChange={(event) =>
                        setPersons(Math.max(1, Number(event.target.value || 1)))
                      }
                      className="w-14 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                    />
                  </div>

                  <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    <Search className="h-4 w-4 text-gray-500" />

                    <input
                      type="text"
                      placeholder="City, area, clinic or doctor..."
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow transition hover:bg-emerald-700"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center md:hidden">
              <div className="w-full max-w-xl rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-md dark:bg-gray-800/90">
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    <Search className="h-4 w-4 text-gray-500" />

                    <input
                      type="text"
                      placeholder="City, area or doctor..."
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="bg-white py-20 dark:bg-zinc-950">
          <div className="w-full px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-black dark:text-white">
                Everything you need to manage your healthcare in one place
              </h2>

              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Appointments, secure online payments and virtual consultations
                in just a few clicks.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                title="Health records"
                description="Manage patient information, medical history, documents and care journeys."
                icon={FileText}
                iconBgClass="bg-blue-600"
              />

              <FeatureCard
                title="Integrated payments"
                description="Mobile Money, wallet and card payments with automated invoicing."
                icon={CreditCard}
                iconBgClass="bg-emerald-600"
              />

              <FeatureCard
                title="Teleconsultation"
                description="Secure video consultations integrated directly into the platform."
                icon={Video}
                iconBgClass="bg-purple-600"
              />

              <FeatureCard
                title="Clinics"
                description="Find a clinic, explore its services and book an appointment quickly."
                icon={Building2}
                iconBgClass="bg-orange-600"
              />
            </div>

            <section className="mt-16 rounded-[32px] border border-zinc-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
              <div className="px-6 pt-8 text-center sm:px-8 lg:px-10 lg:pt-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Trust · security · transparency
                </div>

                <h2 className="mt-4 text-3xl font-bold text-black dark:text-white">
                  Book your healthcare with confidence
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
                  Doc Chap Ghana helps patients access healthcare in a clear,
                  reliable and secure environment.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:px-8 lg:grid-cols-12 lg:px-10 lg:py-10">
                <div className="lg:col-span-6">
                  <div className="h-full rounded-[28px] bg-slate-900 p-7 text-white shadow-xl">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/20">
                      <ShieldCheck className="h-7 w-7 text-emerald-400" />
                    </div>

                    <h3 className="mt-6 text-2xl font-bold leading-tight">
                      Healthcare appointments designed to inspire confidence
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
                      Doc Chap makes it easier to find healthcare professionals,
                      book appointments and access services through one trusted
                      platform.
                    </p>

                    <div className="mt-6 space-y-4">
                      {[
                        "Clear information before booking an appointment.",
                        "A safer experience at every step of the patient journey.",
                        "A platform built for patients, doctors and clinics.",
                      ].map((text) => (
                        <div key={text} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                          <p className="text-sm text-white/85">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-6">
                  <TrustCard
                    title="Verified healthcare professionals"
                    description="Professionals can be reviewed and validated before becoming visible on the platform."
                    icon={ShieldCheck}
                    iconBgClass="bg-emerald-600"
                  />

                  <TrustCard
                    title="Secure patient experience"
                    description="Your booking journey is designed to be simple, clear and secure."
                    icon={Lock}
                    iconBgClass="bg-blue-600"
                  />

                  <TrustCard
                    title="Secure payments"
                    description="Integrated payment options make healthcare booking more reliable and convenient."
                    icon={BadgeCheck}
                    iconBgClass="bg-purple-600"
                  />
                </div>
              </div>
            </section>

            <section className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Find clinics near you
                </h2>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Search clinics by city, area or service. Explore their
                  information, location, available services and appointment
                  options directly from your phone.
                </p>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Doc Chap Ghana makes it easier to compare options and choose
                  the healthcare facility that best meets your needs.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/clinics")}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
                >
                  Explore clinics
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <img
                src="/images/doctor.jpg"
                alt="Healthcare clinic"
                className="h-auto w-full rounded-xl object-cover shadow-md"
              />
            </section>

            <section className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <img
                src="/images/docteur.png"
                alt="Doctor consultation"
                className="order-2 h-auto w-full rounded-xl object-cover shadow-md md:order-1"
              />

              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Find the right doctor for your needs
                </h2>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Search for doctors by specialty, location or availability.
                  Book a consultation without unnecessary calls or travel.
                </p>

                <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Whether you need an in-person consultation or a virtual
                  consultation, Doc Chap Ghana helps you access care more
                  easily.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/doctors")}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
                >
                  Find a doctor
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="mt-20">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  How it works
                </h2>

                <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                  Access healthcare in four simple steps.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StepCard
                  number="1"
                  title="Search"
                  description="Search for a doctor, clinic or healthcare service near you."
                  icon={Search}
                />

                <StepCard
                  number="2"
                  title="Choose"
                  description="Compare available options and select the professional or clinic that suits you."
                  icon={Stethoscope}
                />

                <StepCard
                  number="3"
                  title="Book"
                  description="Choose a convenient date and time, then confirm your appointment online."
                  icon={CalendarCheck}
                />

                <StepCard
                  number="4"
                  title="Manage"
                  description="Access your appointment information and healthcare journey from one place."
                  icon={ClipboardList}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="relative h-64 w-full overflow-hidden sm:h-72 md:h-80">
          <img
            src="/images/docteur.png"
            alt="Join Doc Chap Ghana"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/40" />

          <div className="relative flex h-full items-center">
            <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16">
              <div className="max-w-xl rounded-xl bg-slate-900/80 p-5 text-white shadow-lg backdrop-blur">
                <h2 className="text-xl font-extrabold leading-snug sm:text-2xl md:text-3xl">
                  Do you own or manage a clinic?
                </h2>

                <p className="mt-3 text-sm text-white/90 sm:text-base">
                  Join Doc Chap Ghana to improve your visibility, simplify
                  appointment management and offer a modern digital healthcare
                  experience to your patients.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/clinics/signup")}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}