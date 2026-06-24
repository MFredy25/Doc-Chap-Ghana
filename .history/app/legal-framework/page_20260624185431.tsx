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
                            Consulter la référence
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    ) : (
                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                            Référence mentionnée à titre informatif.
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
                                <Pill>Cadre légal</Pill>
                                <Pill>Ghana</Pill>
                                <Pill>Télémédecine</Pill>
                                <Pill>Exercice de la médecine</Pill>
                            </div>

                            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black dark:text-white">
                                Cadre légal de la soins numériques et de la télémédecine au Ghana
                            </h1>

                            <p className="mt-5 w-full text-sm sm:text-base leading-7 text-zinc-600 dark:text-zinc-400">
                                Doc Chap s’inscrit dans le respect strict de la réglementation en vigueur
                                au Ghana, notamment en matière de télémédecine, d’exercice médical,
                                de protection des données de santé, de secret médical et de consentement du patient.
                            </p>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <div className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                                    Une page pensée pour rassurer les patients, les professionnels de santé,
                                    les partenaires, les stores d’applications et les investisseurs.
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
                                    Ce que dit la réglementation
                                </h2>
                                <p className="mt-3 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    Au Ghana, aucun texte unique équivalent à un « décret de télémédecine » n’a été identifié dans les sources publiques consultées. La téléconsultation et les services numériques de santé doivent donc être organisés dans le respect cumulé des règles applicables à l’exercice des professions de santé, aux établissements de soins et aux données de santé.
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
                            title="1. La télémédecine s’inscrit dans la stratégie eHealth du Ghana"
                        >
                            <p>
                                La National eHealth Strategy du Ministry of Health présente les technologies numériques de santé et la télémédecine comme des outils destinés à améliorer l’accès aux soins et l’organisation du système de santé.
                            </p>

                            <p className="mt-3">
                                Cette stratégie est une orientation publique et non une autorisation autonome d’exercer. Pour proposer une téléconsultation, Doc Chap Ghana doit respecter les lois professionnelles, les exigences applicables aux établissements et la protection des données.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Stethoscope className="h-5 w-5" />}
                            title="2. Une pratique réservée aux professionnels de santé autorisés"
                        >
                            <p>
                                L’Act 857, section 29(1), interdit d’exercer comme médecin, dentiste, physician assistant ou certified registered anaesthetist sans inscription conformément au texte. L’acte médical à distance doit donc être assuré par un professionnel inscrit auprès de l’autorité compétente.
                            </p>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Diplôme reconnu
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        Le praticien doit détenir une qualification primaire reconnue par le Council (Act 857, section 30).
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Inscription ordinale
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        Le praticien doit figurer sur le registre tenu par le Medical and Dental Council.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                        Autorisation d’exercice
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        Les praticiens formés à l’étranger sont soumis aux règles des sections 31 à 33 d’Act 857.
                                    </p>
                                </div>
                            </div>

                            <p className="mt-4">
                                Le Medical and Dental Council a pour objet d’assurer les standards les plus élevés de formation et de pratique médicale et dentaire (section 26), et fixe les standards professionnels applicables (section 27).
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Lock className="h-5 w-5" />}
                            title="3. Protection des données de santé et secret médical"
                        >
                            <p>
                                Les données médicales sont des « special personal data » au sens de l’Act 843. Leur traitement est soumis à des conditions renforcées, au consentement ou à une nécessité légale ou médicale, et au respect de la confidentialité.
                            </p>

                            <p className="mt-3">
                                Les sections 28 à 31 de l’Act 843 imposent des mesures techniques et organisationnelles appropriées, un contrat écrit avec les sous-traitants et la notification de l’autorité ainsi que des personnes concernées en cas d’accès non autorisé. La section 37(6) vise expressément les finalités médicales réalisées par un professionnel de santé soumis à une obligation de confidentialité.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<FileCheck2 className="h-5 w-5" />}
                            title="4. Consentement du patient obligatoire"
                        >
                            <p>
                                L’Act 843 prévoit le consentement préalable au traitement des données personnelles, sauf exceptions prévues par la loi (section 20). Pour les données de santé, le consentement ou une base de nécessité prévue à la section 37 doit être documenté.
                            </p>

                            <ul className="mt-4 space-y-2 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>Le patient doit être informé de la finalité de la collecte et des données traitées (sections 22 et 23 d’Act 843).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>Le consentement à la téléconsultation et au traitement des données médicales doit être tracé dans le dossier patient.</span>
                                </li>
                            </ul>
                        </SectionCard>

                        <SectionCard
                            icon={<ShieldCheck className="h-5 w-5" />}
                            title="5. La responsabilité médicale demeure entière"
                        >
                            <p>
                                La plateforme ne remplace pas le jugement clinique. Le professionnel de santé reste responsable de la décision médicale et doit respecter les standards professionnels imposés par son Conseil de réglementation.
                            </p>

                            <p className="mt-3">
                                Doc Chap agit comme partenaire technologique. Le partenaire ghanéen doit assurer que chaque acte médical est délivré par un praticien autorisé, dans un cadre approprié, avec une orientation vers les soins physiques ou l’urgence lorsque la téléconsultation ne suffit pas.
                            </p>
                        </SectionCard>

                        <SectionCard
                            icon={<Building2 className="h-5 w-5" />}
                            title="6. Une organisation encadrée et structurée"
                        >
                            <p>
                                L’Act 829, section 11(1), interdit d’exploiter une structure de santé sans licence. Son First Schedule vise notamment les cliniques et hôpitaux médicaux et dentaires. Le partenaire local doit donc confirmer le statut réglementaire de sa structure auprès de HeFRA avant un déploiement opérationnel.
                            </p>

                            <p className="mt-3">
                                Le modèle recommandé est un partenariat : Doc Chap fournit et maintient la technologie ; le partenaire ghanéen porte l’activité médicale, les professionnels, la structure de soins et les autorisations locales nécessaires.
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
                                    Engagement de Doc Chap
                                </h2>

                                <p className="mt-3 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    Doc Chap a été conçu pour respecter pleinement les exigences légales,
                                    réglementaires et éthiques applicables à la médecine et à la télémédecine
                                    au Ghana.
                                </p>

                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {[
                                        "Accès réservé aux professionnels de santé autorisés",
                                        "Vérification des médecins et des structures médicales",
                                        "Respect du cadre légal ghanéen applicable",
                                        "Protection des données et confidentialité",
                                        "Mise en place du consentement patient",
                                        "Recherche d’une pratique médicale numérique responsable",
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
                            Notre mission
                        </h2>

                        <p className="mt-3 text-sm sm:text-[15px] leading-7 text-emerald-50">
                            Offrir un accès simple, sécurisé et conforme aux soins de santé,
                            tout en respectant les normes légales, les exigences de confidentialité
                            et les principes éthiques en vigueur au Ghana.
                        </p>

                        <div className="mt-5 rounded-2xl bg-white/10 px-4 py-4 text-sm sm:text-base">
                            <span className="font-semibold">Doc Chap</span> — Votre santé à portée main
                        </div>
                    </div>
                </section>

                {/* REFERENCES */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-10">
                    <div className="w-full">
                        <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                            Références juridiques et réglementaires
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            Les références ci-dessous constituent le socle du cadre applicable. Elles doivent être validées avec le partenaire local et un conseil juridique ghanéen avant lancement.
                        </p>
                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ReferenceItem title="Health Professions Regulatory Bodies Act, 2013 (Act 857) — sections 26 à 33"
                                description="Medical and Dental Council : standards de pratique, registre, qualification, praticiens formés à l’étranger et statuts d’inscription."
                                href="https://www.moh.gov.gh/wp-content/uploads/2016/02/HPRBA-ACT857-2013.pdf" />
                            <ReferenceItem title="Health Institutions and Facilities Act, 2011 (Act 829) — sections 11 à 13"
                                description="Licences des structures de santé ; le First Schedule inclut notamment les cliniques et hôpitaux médicaux et dentaires."
                                href="https://hefra.gov.gh/hefra-act/" />
                            <ReferenceItem title="Data Protection Act, 2012 (Act 843) — sections 17 à 31, 37 et 45"
                                description="Principes de traitement, consentement, information, sécurité, sous-traitance, incident de sécurité, données de santé et champ territorial."
                                href="https://ghalii.org/akn/gh/act/2012/843/eng@2012-05-18/source" />
                            <ReferenceItem title="Data Protection Commission — obligations des organisations"
                                description="La Commission indique que les organisations qui collectent ou traitent des données personnelles au Ghana doivent s’enregistrer."
                                href="https://dataprotection.org.gh/for-organisations/" />
                            <ReferenceItem title="National eHealth Strategy — Ministry of Health Ghana"
                                description="Document stratégique national qui soutient l’usage des technologies numériques de santé, y compris la télémédecine."
                                href="https://www.moh.gov.gh/wp-content/uploads/2016/02/Ghana-E-Health-120504121543.pdf" />
                            <ReferenceItem title="Health Facilities Regulatory Agency (HeFRA)"
                                description="Autorité compétente pour la délivrance et le suivi des licences de structures fournissant des services de santé publics ou privés."
                                href="https://hefra.gov.gh/" />
                        </div>
                    </div>
                </section>

                {/* CONTACT */}
                <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pt-6 pb-14">
                    <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="w-full">
                                <h2 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                                    Une question réglementaire ?
                                </h2>
                                <p className="mt-2 text-sm sm:text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                                    Pour toute question relative au cadre juridique, à la conformité ou à
                                    l’utilisation de la plateforme, vous pouvez nous contacter.
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