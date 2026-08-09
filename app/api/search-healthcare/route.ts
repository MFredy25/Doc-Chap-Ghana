import {
  NextResponse,
} from "next/server";

import {
  adminDb,
} from "@/lib/firebase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type UnknownRecord =
  Record<
    string,
    unknown
  >;

function s(
  value: unknown
): string {
  return (value ?? "")
    .toString()
    .trim();
}

function o(
  value: unknown
): UnknownRecord {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as UnknownRecord;
  }

  return {};
}

function bool(
  value: unknown
): boolean {
  return value === true;
}

function isActiveAccount(
  data: UnknownRecord
): boolean {
  return (
    data.active !==
      false &&
    s(
      data.status
    ).toLowerCase() !==
      "disabled"
  );
}

function isGhanaAccount(
  data: UnknownRecord
): boolean {
  const profile =
    o(
      data.profile
    );

  const country =
    s(
      profile.country ||
        data.country
    ).toLowerCase();

  const iso2 =
    s(
      profile.countryIso2 ||
        data.countryIso2
    ).toUpperCase();

  if (
    !country &&
    !iso2
  ) {
    return true;
  }

  return (
    country ===
      "ghana" ||
    iso2 ===
      "GH"
  );
}

function doctorPublicData(
  id: string,
  data: UnknownRecord
) {
  const profile =
    o(
      data.profile
    );

  const professional =
    o(
      data.professional
    );

  const configuration =
    o(
      data.configuration
    );

  const professionalType =
    s(
      data.professionalType ||
        data.type ||
        professional.type ||
        data.role
    ).toLowerCase();

  if (
    professionalType !==
      "doctor" ||
    !isActiveAccount(
      data
    ) ||
    !isGhanaAccount(
      data
    ) ||
    configuration.profileVisible ===
      false
  ) {
    return null;
  }

  const firstName =
    s(
      profile.firstName
    );

  const lastName =
    s(
      profile.lastName
    );

  const fullName =
    s(
      data.name
    ) ||
    s(
      profile.displayName
    ) ||
    s(
      profile.fullName
    ) ||
    `${firstName} ${lastName}`.trim();

  if (
    !fullName
  ) {
    return null;
  }

  const verificationStatus =
    s(
      data.verificationStatus ||
        professional.verificationStatus
    ).toLowerCase();

  return {
    id,

    type:
      "doctor",

    name:
      fullName,

    specialty:
      s(
        data.specialty ||
          professional.specialty ||
          profile.specialty
      ) ||
      "Medical professional",

    bio:
      s(
        profile.bio ||
          data.bio
      ),

    consultationModes: {
      inPerson:
        configuration.inPersonEnabled !==
        false,

      teleconsultation:
        configuration.teleconsultationEnabled !==
        false,

      phone:
        configuration.phoneConsultationEnabled ===
        true,
    },

    acceptsNewPatients:
      configuration.acceptsNewPatients !==
      false,

    address:
      configuration.showPracticeAddress ===
        false
        ? ""
        : s(
            data.address ||
              profile.address
          ),

    city:
      s(
        data.city ||
          profile.city
      ),

    region:
      s(
        data.region ||
          profile.region
      ),

    phone:
      configuration.showWhatsApp ===
        false
        ? ""
        : s(
            data.phone ||
              profile.phone
          ),

    photoUrl:
      s(
        data.photoUrl ||
          profile.photoUrl ||
          profile.avatarUrl
      ),

    verified:
      bool(
        data.verified
      ) ||
      bool(
        professional.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    active:
      true,

    country:
      "Ghana",

    countryIso2:
      "GH",
  };
}

async function clinicPublicData(
  id: string,
  data: UnknownRecord
) {
  if (
    !isActiveAccount(
      data
    ) ||
    !isGhanaAccount(
      data
    )
  ) {
    return null;
  }

  const profile =
    o(
      data.profile
    );

  const clinic =
    o(
      data.clinic
    );

  const configurationSnapshot =
    await adminDb
      .doc(
        `clinics/${id}/configuration/general`
      )
      .get();

  const configuration =
    configurationSnapshot.exists
      ? o(
          configurationSnapshot.data()
        )
      : {};

  if (
    configuration.clinicVisible ===
    false
  ) {
    return null;
  }

  const name =
    s(
      data.name
    ) ||
    s(
      profile.clinicName
    ) ||
    s(
      profile.displayName
    ) ||
    s(
      profile.fullName
    );

  if (
    !name
  ) {
    return null;
  }

  const verificationStatus =
    s(
      data.verificationStatus ||
        clinic.verificationStatus
    ).toLowerCase();

  return {
    id,

    type:
      "clinic",

    name,

    specialty:
      s(
        data.specialty ||
          data.type ||
          clinic.type
      ) ||
      "Clinic",

    bio:
      s(
        profile.bio ||
          data.bio
      ),

    consultationModes: {
      inPerson:
        configuration.inPersonEnabled !==
        false,

      teleconsultation:
        configuration.teleconsultationEnabled !==
        false,

      phone:
        configuration.phoneConsultationEnabled ===
        true,
    },

    acceptsNewPatients:
      configuration.acceptsNewPatients !==
      false,

    address:
      configuration.showAddress ===
        false
        ? ""
        : s(
            data.address ||
              profile.address
          ),

    city:
      s(
        data.city ||
          profile.city
      ),

    region:
      s(
        data.region ||
          profile.region
      ),

    phone:
      configuration.showPhone ===
        false
        ? ""
        : s(
            data.phone ||
              profile.phone
          ),

    photoUrl:
      s(
        data.logoUrl ||
          data.photoUrl ||
          profile.logoUrl ||
          profile.photoUrl
      ),

    verified:
      bool(
        data.verified
      ) ||
      bool(
        clinic.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    active:
      true,

    country:
      "Ghana",

    countryIso2:
      "GH",
  };
}

function pharmacyPublicData(
  id: string,
  data: UnknownRecord
) {
  if (
    !isActiveAccount(
      data
    ) ||
    !isGhanaAccount(
      data
    )
  ) {
    return null;
  }

  const profile =
    o(
      data.profile
    );

  const pharmacy =
    o(
      data.pharmacy
    );

  const configuration =
    o(
      data.configuration
    );

  if (
    configuration.profileVisible ===
      false ||
    pharmacy.visible ===
      false
  ) {
    return null;
  }

  const name =
    s(
      profile.pharmacyName ||
        pharmacy.name ||
        data.name ||
        profile.displayName ||
        profile.fullName
    );

  if (
    !name
  ) {
    return null;
  }

  const verificationStatus =
    s(
      pharmacy.verificationStatus ||
        data.verificationStatus
    ).toLowerCase();

  return {
    id,

    type:
      "pharmacy",

    name,

    specialty:
      s(
        pharmacy.type ||
          data.type
      ) ||
      "Community pharmacy",

    bio:
      s(
        profile.bio ||
          data.bio
      ),

    address:
      s(
        profile.address ||
          data.address
      ),

    city:
      s(
        profile.city ||
          data.city
      ),

    region:
      s(
        profile.region ||
          data.region
      ),

    phone:
      s(
        profile.phone ||
          data.phone
      ),

    photoUrl:
      s(
        profile.logoUrl ||
          data.logoUrl
      ),

    verified:
      bool(
        pharmacy.verified
      ) ||
      bool(
        data.verified
      ) ||
      verificationStatus ===
        "verified" ||
      verificationStatus ===
        "approved",

    active:
      true,

    country:
      "Ghana",

    countryIso2:
      "GH",
  };
}

export async function GET() {
  try {
    const [
      professionalsSnapshot,
      clinicsSnapshot,
      pharmaciesSnapshot,
    ] =
      await Promise.all([
        adminDb
          .collection(
            "professionals"
          )
          .get(),

        adminDb
          .collection(
            "clinics"
          )
          .get(),

        adminDb
          .collection(
            "pharmacies"
          )
          .get(),
      ]);

    const doctors =
      professionalsSnapshot.docs
        .map(
          (
            snapshot
          ) =>
            doctorPublicData(
              snapshot.id,
              o(
                snapshot.data()
              )
            )
        )
        .filter(
          (
            item
          ) =>
            item !==
            null
        );

    const clinics =
      (
        await Promise.all(
          clinicsSnapshot.docs.map(
            (
              snapshot
            ) =>
              clinicPublicData(
                snapshot.id,
                o(
                  snapshot.data()
                )
              )
          )
        )
      ).filter(
        (
          item
        ) =>
          item !==
          null
      );

    const pharmacies =
      pharmaciesSnapshot.docs
        .map(
          (
            snapshot
          ) =>
            pharmacyPublicData(
              snapshot.id,
              o(
                snapshot.data()
              )
            )
        )
        .filter(
          (
            item
          ) =>
            item !==
            null
        );

    return NextResponse.json(
      {
        ok:
          true,

        doctors,

        clinics,

        pharmacies,

        counts: {
          doctors:
            doctors.length,

          clinics:
            clinics.length,

          pharmacies:
            pharmacies.length,
        },
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[SearchHealthcareAPI] GET error:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "Unable to load the healthcare directory.",
      },
      {
        status:
          500,
      }
    );
  }
}