import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PlayerModel } from "@/models/Player";
import { RefereeModel } from "@/models/Referee";
import { IdCardModel } from "@/models/IdCard";
import { CertificateModel } from "@/models/Certificate";
import { BeltExamModel } from "@/models/BeltExam";
import { DanExamSessionModel, DanCertificateModel } from "@/models/DanGrading";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";

export const dynamic = "force-dynamic";

const TARGET_DISCIPLINE = "Kalawar Martial Arts";

const LEGACY_DISCIPLINE_REGEX = /^(Martial Arts|Kalawar Kaya Yuddha|Sparsha Yuddha|Martial Arts & Combat Sports|General Martial Arts|Kalawar Martial Arts & Gup Grading|Kalawar Martial Arts & Combat Sports|Football|Cricket)?$/i;

const MIGRATION_FILTER: any = {
  $or: [
    { discipline: { $exists: false } },
    { discipline: null },
    { discipline: "" },
    { discipline: { $regex: LEGACY_DISCIPLINE_REGEX } },
  ],
};

export async function POST() {
  try {
    await connectToDatabase();

    const results: Record<string, any> = {};

    // 1. Players / Coaches / Clubs
    const playerUpdate = await PlayerModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.players = { matched: playerUpdate.matchedCount, modified: playerUpdate.modifiedCount };

    // 2. Referees
    const refUpdate = await RefereeModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.referees = { matched: refUpdate.matchedCount, modified: refUpdate.modifiedCount };

    // 3. ID Cards
    const idCardUpdate = await IdCardModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.idCards = { matched: idCardUpdate.matchedCount, modified: idCardUpdate.modifiedCount };

    // 4. Certificates
    const certUpdate = await CertificateModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.certificates = { matched: certUpdate.matchedCount, modified: certUpdate.modifiedCount };

    // 5. Belt Exams
    const beltExamUpdate = await BeltExamModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.beltExams = { matched: beltExamUpdate.matchedCount, modified: beltExamUpdate.modifiedCount };

    // 6. Dan Exam Sessions & Dan Certificates
    const danSessionUpdate = await DanExamSessionModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    const danCertUpdate = await DanCertificateModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.danGrading = {
      sessionsModified: danSessionUpdate.modifiedCount,
      certificatesModified: danCertUpdate.modifiedCount,
    };

    // 7. Championship Applications & Certificates
    const champAppUpdate = await ChampionshipApplicationModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    const champCertUpdate = await ChampionshipCertificateModel.updateMany(
      MIGRATION_FILTER,
      { $set: { discipline: TARGET_DISCIPLINE } }
    );
    results.championship = {
      applicationsModified: champAppUpdate.modifiedCount,
      certificatesModified: champCertUpdate.modifiedCount,
    };

    return NextResponse.json({
      success: true,
      message: `All existing database records successfully updated to '${TARGET_DISCIPLINE}'`,
      targetDiscipline: TARGET_DISCIPLINE,
      results,
    });
  } catch (error) {
    console.error("Discipline migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to migrate discipline",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
