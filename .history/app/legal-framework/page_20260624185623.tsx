"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import {
    ShieldCheck,
    Scale,
    HeartPulse,
    Stethoscope,
    Lock,
    FileCheck2,
    Building2,
    Landmark,
    CheckCircle2,
    ArrowRight,
    Mail,
} from "lucide-react";

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200">
            {children}
        </span>
    );
}

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-sm h-full">
            <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-700 dark:text-emerald-300">
                    {icon}
                </div>

                <div className="min-w-0 w-full">
                    <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                        {title}
                    </h2>

                    <div className="mt-3 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReferenceItem({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href?: string;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 h-full">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-200">
                    <Landmark className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-black dark:text-white">
                        {title}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {description}
                    </p>

                    {href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
                        >
                            View reference
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    ) : (
                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                            Reference provided for information purposes.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CadreLegalMedecineGhanaPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <Header />

            <main className="w-full">
                {/* HERO */}
                <section className="border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-10 sm:py-14">
                        <div className="w-full">
                            <div className="flex flex-wrap gap-2">
                                <Pill>Legal framework</Pill>
                                <Pill>Ghana</Pill>
                                <Pill>Telemedicine</Pill>
                                <Pill>Medical practice</Pill>
                            </div>

                            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black dark:text-white">
                                Legal framework for digital health and telemedicine in Ghana
                            </h1>

                            <p className="mt-5 w-full text-sm sm:text-base leading-7 text-zinc-600 dark:text-zinc-400">
                                Doc Chap is committed to strict compliance with the regulations in force in Ghana,
                                including those relating to telemedicine, medical practice, health-data protection,
                                medical confidentiality and patient consent.
                            </p>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <div className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                                    A page designed to reassure patients, healthcare professionals, partners,
                                    app stores and investors.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* INTRO */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-8 sm:py-10">
                    <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-700 dark:text-emerald-300">
                                <Scale className="h-6 w-6" />
                            </div>

                            <div className="w-full">
                                <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                                    What the regulatory framework says
                                </h2>

                                <p className="mt-3 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    In Ghana, no single instrument equivalent to a standalone “telemedicine decree”
                                    has been identified in the public sources reviewed. Teleconsultations and digital
                                    health services must therefore be organised in compliance with the combined rules
                                    governing healthcare professions, health facilities and health data.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MAIN CONTENT */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-10">
                    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <SectionCard
                            icon={<HeartPulse className="h-5 w-5" />}
                            title="1. Telemedicine is part of Ghana’s eHealth strategy"
                        >
                            <p>
                                The Ministry of Health’s National eHealth Strategy presents digital health
                                technologies and telemedicine as tools to improve access to care and strengthen
                                the organisation of the health system.
                            </p>

                            <p className="mt-3">
                                This strategy is a public policy direction, not an independent authorisation
                                to practise medicine. To provide teleconsultations, Doc Chap Ghana must comply
                                with professional laws, health-facility requirements and data-protection obligations.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Stethoscope className="h-5 w-5" />}
                            title="2. A practice reserved for authorised healthcare professionals"
                        >
                            <p>
                                Act 857, section 29(1), prohibits a person from practising as a medical practitioner,
                                dentist, physician assistant or certified registered anaesthetist unless registered
                                in accordance with the Act. Medical care delivered remotely must therefore be provided
                                by a professional registered with the competent authority.
                            </p>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Recognised qualification
                                    </div>

                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        The practitioner must hold a primary qualification recognised by the Council
                                        under Act 857, section 30.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Professional registration
                                    </div>

                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        The practitioner must appear on the register maintained by the Medical and
                                        Dental Council.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Authorisation to practise
                                    </div>

                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        Practitioners trained abroad are subject to the rules set out in sections
                                        31 to 33 of Act 857.
                                    </p>
                                </div>
                            </div>

                            <p className="mt-4">
                                The Medical and Dental Council is responsible for ensuring the highest standards
                                of training and medical and dental practice under section 26, and for setting
                                applicable professional standards under section 27.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Lock className="h-5 w-5" />}
                            title="3. Health-data protection and medical confidentiality"
                        >
                            <p>
                                Medical data are “special personal data” under Act 843. Their processing is subject
                                to enhanced conditions, including consent or a legal or medical necessity, and to
                                confidentiality requirements.
                            </p>

                            <p className="mt-3">
                                Sections 28 to 31 of Act 843 require appropriate technical and organisational
                                measures, a written agreement with data processors, and notification to the authority
                                and affected individuals in the event of unauthorised access. Section 37(6) expressly
                                covers medical purposes carried out by a healthcare professional subject to a duty
                                of confidentiality.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<FileCheck2 className="h-5 w-5" />}
                            title="4. Patient consent is required"
                        >
                            <p>
                                Act 843 requires prior consent for the processing of personal data, except where
                                an exception provided by law applies under section 20. For health data, consent or
                                a necessity basis under section 37 must be documented.
                            </p>

                            <ul className="mt-4 space-y-2 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        The patient must be informed of the purpose of data collection and of the
                                        data being processed under sections 22 and 23 of Act 843.
                                    </span>
                                </li>

                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        Consent to teleconsultation and to the processing of medical data must be
                                        recorded in the patient’s file.
                                    </span>
                                </li>
                            </ul>
                        </SectionCard>

                        <SectionCard
                            icon={<ShieldCheck className="h-5 w-5" />}
                            title="5. Medical responsibility remains fully applicable"
                        >
                            <p>
                                The platform does not replace clinical judgement. The healthcare professional remains
                                responsible for medical decisions and must comply with the professional standards
                                imposed by the relevant regulatory Council.
                            </p>

                            <p className="mt-3">
                                Doc Chap acts as a technology partner. The Ghanaian partner must ensure that every
                                medical service is delivered by an authorised practitioner, in an appropriate setting,
                                with referral to in-person or emergency care whenever teleconsultation is not sufficient.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Building2 className="h-5 w-5" />}
                            title="6. A regulated and structured operating model"
                        >
                            <p>
                                Act 829, section 11(1), prohibits the operation of a health facility without a licence.
                                Its First Schedule includes medical and dental clinics and hospitals. The local partner
                                must therefore confirm the regulatory status of its facility with HeFRA before operational
                                deployment.
                            </p>

                            <p className="mt-3">
                                The recommended model is a partnership: Doc Chap provides and maintains the technology;
                                the Ghanaian partner is responsible for the medical activity, healthcare professionals,
                                care facility and required local authorisations.
                            </p>
                        </SectionCard>
                    </div>
                </section>

                {/* ENGAGEMENT */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-10">
                    <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck className="h-6 w-6" />
                            </div>

                            <div className="min-w-0 w-full">
                                <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                                    Doc Chap’s commitment
                                </h2>

                                <p className="mt-3 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    Doc Chap is designed to fully comply with the legal, regulatory and ethical
                                    requirements applicable to medical practice and telemedicine in Ghana.
                                </p>

                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {[
                                        "Access restricted to authorised healthcare professionals",
                                        "Verification of doctors and healthcare facilities",
                                        "Compliance with the applicable Ghanaian legal framework",
                                        "Data protection and confidentiality",
                                        "Implementation of patient consent",
                                        "Commitment to responsible digital healthcare practice",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 text-sm text-zinc-700 dark:text-zinc-300"
                                        >
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                                <span>{item}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MISSION */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-10">
                    <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 sm:p-8 text-white shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-semibold">
                            Our mission
                        </h2>

                        <p className="mt-3 text-sm sm:text-[15px] leading-7 text-emerald-50">
                            To provide simple, secure and compliant access to healthcare while respecting the legal
                            standards, confidentiality requirements and ethical principles in force in Ghana.
                        </p>

                        <div className="mt-5 rounded-2xl bg-white/10 px-4 py-4 text-sm sm:text-base">
                            <span className="font-semibold">Doc Chap</span> — Your health within reach
                        </div>
                    </div>
                </section>

                {/* REFERENCES */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-10">
                    <div className="w-full">
                        <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                            Legal and regulatory references
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            The references below form the foundation of the applicable framework. They should be
                            validated with the local partner and Ghanaian legal counsel before launch.
                        </p>

                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ReferenceItem
                                title="Health Professions Regulatory Bodies Act, 2013 (Act 857) — sections 26 to 33"
                                description="Medical and Dental Council: practice standards, register, qualifications, practitioners trained abroad and registration statuses."
                                href="https://www.moh.gov.gh/wp-content/uploads/2016/02/HPRBA-ACT857-2013.pdf"
                            />

                            <ReferenceItem
                                title="Health Institutions and Facilities Act, 2011 (Act 829) — sections 11 to 13"
                                description="Licensing of health facilities; the First Schedule includes, in particular, medical and dental clinics and hospitals."
                                href="https://hefra.gov.gh/hefra-act/"
                            />

                            <ReferenceItem
                                title="Data Protection Act, 2012 (Act 843) — sections 17 to 31, 37 and 45"
                                description="Processing principles, consent, information, security, data processing, security incidents, health data and territorial scope."
                                href="https://ghalii.org/akn/gh/act/2012/843/eng@2012-05-18/source"
                            />

                            <ReferenceItem
                                title="Data Protection Commission — obligations of organisations"
                                description="The Commission states that organisations collecting or processing personal data in Ghana must register."
                                href="https://dataprotection.org.gh/for-organisations/"
                            />

                            <ReferenceItem
                                title="National eHealth Strategy — Ministry of Health Ghana"
                                description="National strategy document supporting the use of digital health technologies, including telemedicine."
                                href="https://www.moh.gov.gh/wp-content/uploads/2016/02/Ghana-E-Health-120504121543.pdf"
                            />

                            <ReferenceItem
                                title="Health Facilities Regulatory Agency (HeFRA)"
                                description="The authority responsible for issuing and supervising licences for facilities providing public or private health services."
                                href="https://hefra.gov.gh/"
                            />
                        </div>
                    </div>
                </section>

                {/* CONTACT */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pt-6 pb-14">
                    <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="w-full">
                                <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                                    A regulatory question?
                                </h2>

                                <p className="mt-2 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    For any questions about the legal framework, compliance or use of the platform,
                                    please contact us.
                                </p>
                            </div>

                            <a
                                href="mailto:contact@doc-chap.com"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-sm font-semibold shadow transition whitespace-nowrap"
                            >
                                <Mail className="h-4 w-4" />
                                contact@doc-chap.com
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}