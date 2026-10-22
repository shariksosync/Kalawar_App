import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import {
  IdCardModel,
  type IdCardEntry,
  type IdCardType,
  type IdCardStatus,
  type IdCardHistoryEntry,
  type IdCardRequestEntry,
} from "@/models/IdCard";
import { getPlayers } from "./players-store";
import { normalizeRefereeLevel, getRefereeDesignation } from "@/types/referee";
import { withRedisCache, invalidateIdCardCache } from "./redis";

export { normalizeRefereeLevel, getRefereeDesignation };

export type { IdCardType, IdCardStatus, IdCardHistoryEntry, IdCardEntry, IdCardRequestEntry };

// ── Fallback Seed Data ───────────────────────────────────────────────────────

export const SEED_ID_CARDS: IdCardEntry[] = [];

// ── Document Formatting Helper ───────────────────────────────────────────────

function formatIdCardDoc(d: any): IdCardEntry {
  const idStr = String(d.id || "").toUpperCase();
  const isCoach =
    d.cardType === "Coach" ||
    d.memberType === "Coach" ||
    idStr.startsWith("KSM-CO-") ||
    idStr.startsWith("WSF-CO-") ||
    idStr.startsWith("KAC-CO-") ||
    (d.designation && String(d.designation).toLowerCase().includes("coach"));

  const isClub =
    d.cardType === "Club" ||
    d.memberType === "Club" ||
    idStr.startsWith("KSM-CL-") ||
    idStr.startsWith("WSF-CL-") ||
    idStr.startsWith("KAC-CL-") ||
    (d.designation && String(d.designation).toLowerCase().includes("club"));

  const isReferee =
    d.cardType === "Referee" ||
    d.memberType === "Referee" ||
    idStr.startsWith("KSM-RF-") ||
    idStr.startsWith("WSF-RF-") ||
    idStr.startsWith("KAC-RF-") ||
    (d.designation && String(d.designation).toLowerCase().includes("referee")) ||
    !!d.refereeLevel;

  let refLevel = d.refereeLevel ? normalizeRefereeLevel(d.refereeLevel) : undefined;
  let desig = d.designation;

  if (isReferee) {
    if (!refLevel && desig) {
      refLevel = normalizeRefereeLevel(desig);
    }
    if (refLevel && (!desig || desig === "Technical Official" || desig === "Referee" || desig.toLowerCase().includes("referee"))) {
      desig = getRefereeDesignation(refLevel);
    }
  }

  const resolvedCardType: IdCardType =
    (d.cardType as IdCardType) ||
    (isReferee ? "Referee" : isCoach ? "Coach" : isClub ? "Club" : "Athlete");

  return {
    id: d.id,
    cardType: resolvedCardType,
    source: (d.source as "account" | "manual") || "manual",
    holderName: d.holderName,
    holderPhoto: d.holderPhoto,
    designation: desig || (isCoach ? "Accredited Coach" : undefined),
    refereeLevel: isReferee ? (refLevel || "Level 0 – Trainee Referee") : undefined,
    discipline: d.discipline,
    beltRank: d.beltRank,
    academyName: d.academyName,
    state: d.state,
    district: d.district,
    dob: d.dob,
    bloodGroup: d.bloodGroup,
    emergencyContact: d.emergencyContact,
    phone: d.phone,
    email: d.email,
    issueDate: d.issueDate,
    validUntil: d.validUntil,
    status: (d.status as IdCardStatus) || "Active",
    qrCodeUrl: d.qrCodeUrl || (d.cardType === "Championship" ? `/id-cards/championship/${encodeURIComponent(d.id)}` : `/id-cards/${encodeURIComponent(d.id)}`),
    barcodeNumber: d.barcodeNumber,
    championshipApplicationId: d.championshipApplicationId,
    bibNumber: d.bibNumber,
    eventTitle: d.eventTitle,
    tournamentTier: d.tournamentTier,
    ageDivision: d.ageDivision,
    weightCategory: d.weightCategory,
    authorizedSignatory: d.authorizedSignatory || "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: d.authorizedSignatoryRole || "Founder & President – India",
    cardVersion: d.cardVersion || "2026.1",
    history: Array.isArray(d.history) ? d.history : [],
  };
}

// ── Storage Path Resolution (JSON Fallback) ──────────────────────────────────

let cachedIdCards: IdCardEntry[] = [...SEED_ID_CARDS];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(
    process.cwd(),
    "src",
    "data",
    "storage",
    "id-cards.json"
  );
  const nestedPath = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    "id-cards.json"
  );

  try {
    await fs.access(primaryPath);
    return primaryPath;
  } catch {
    try {
      await fs.access(nestedPath);
      return nestedPath;
    } catch {
      try {
        await fs.mkdir(path.dirname(primaryPath), { recursive: true });
        await fs.writeFile(primaryPath, JSON.stringify(SEED_ID_CARDS, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileIdCards(): Promise<IdCardEntry[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as IdCardEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedIdCards = parsed;
        return parsed;
      }
    }
  } catch {
    // Return seed
  }
  return cachedIdCards.length > 0 ? cachedIdCards : SEED_ID_CARDS;
}

export async function saveIdCards(cards: IdCardEntry[]): Promise<void> {
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(cards, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(cards, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Could not save to id-cards.json fallback:", error instanceof Error ? error.message : "");
  }
  await invalidateIdCardCache();
}

// ── Store API ────────────────────────────────────────────────────────────────

export async function getIdCards(): Promise<IdCardEntry[]> {
  return withRedisCache("cache:idcard:list:all", 300, fetchRawIdCards);
}

async function fetchRawIdCards(): Promise<IdCardEntry[]> {
  try {
    await connectToDatabase();
    const docs = await IdCardModel.find().sort({ createdAt: -1 }).lean();
    if (docs) {
      return docs.map(formatIdCardDoc);
    }
  } catch (error) {
    console.warn(
      "MongoDB fetch note: Falling back to local storage for ID cards.",
      error instanceof Error ? error.message : ""
    );
  }

  const fileCards = await getFileIdCards();
  return fileCards || [];
}

export async function getIdCardById(idOrSearch: string): Promise<IdCardEntry | null> {
  const clean = (idOrSearch || "").trim();
  if (!clean) return null;
  return withRedisCache(`cache:idcard:lookup:${clean.toLowerCase()}`, 1800, () => fetchRawIdCardById(clean));
}

async function fetchRawIdCardById(clean: string): Promise<IdCardEntry | null> {
  let resultCard: IdCardEntry | null = null;
  try {
    await connectToDatabase();
    const doc: any = await IdCardModel.findOne({
      $or: [
        { id: { $regex: new RegExp("^" + clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
        { holderName: { $regex: new RegExp("^" + clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
        { barcodeNumber: { $regex: new RegExp("^" + clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      ],
    }).lean();

    if (doc) {
      resultCard = formatIdCardDoc(doc);
    }
  } catch {
    // Fallback to in-memory / JSON search
  }

  if (!resultCard) {
    const cards = await getIdCards();
    const cleanLower = clean.toLowerCase();
    resultCard =
      cards.find(
        (c) =>
          c.id.toLowerCase() === cleanLower ||
          c.holderName.toLowerCase() === cleanLower ||
          c.barcodeNumber.toLowerCase() === cleanLower
      ) || null;
  }

  if (resultCard) {
    // Dynamically mirror player profile blood group and details if linked to an active player/coach
    try {
      const { getPlayerById } = await import("./players-store");
      const player = await getPlayerById(resultCard.id);
      if (player) {
        if (player.bloodGroup !== undefined) {
          resultCard.bloodGroup = player.bloodGroup || "";
        }
        if (player.dob) {
          resultCard.dob = player.dob;
        }
      }
    } catch {}

    // Dynamically sync latest referee level and status if this is a referee card
    if (
      resultCard.cardType === "Referee" ||
      resultCard.id.toUpperCase().startsWith("KSM-RF-") ||
      resultCard.id.toUpperCase().startsWith("WSF-RF-") ||
      resultCard.refereeLevel
    ) {
      try {
        const { getRefereeById } = await import("./referees-store");
        const ref = await getRefereeById(resultCard.id);
        if (ref && ref.level) {
          const normLvl = normalizeRefereeLevel(ref.level);
          if (normLvl) {
            resultCard.refereeLevel = normLvl as any;
            resultCard.designation = getRefereeDesignation(normLvl);
          }
          if (ref.currentRank && ref.currentRank !== "None / Unranked") {
            resultCard.beltRank = ref.currentRank;
          }
          if (ref.status === "Active" || ref.status === "Certified" || ref.licenseNumber) {
            resultCard.status = "Active";
          }
        }
      } catch {}
    }
  }

  return resultCard;
}

export async function createIdCard(cardData: Partial<IdCardEntry>): Promise<IdCardEntry> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const idType = cardData.cardType || "Athlete";
  const idPrefix =
    idType === "Coach"
      ? "KSM-CO"
      : idType === "Referee"
      ? "KSM-RF"
      : idType === "Club"
      ? "KSM-CL"
      : idType === "Official"
      ? "KAC-OFF"
      : "KSM-PL";

  const newId = cardData.id || `${idPrefix}-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCard: IdCardEntry = {
    id: newId,
    cardType: idType,
    source: cardData.source || "manual",
    holderName: cardData.holderName || "Registered Member",
    holderPhoto: cardData.holderPhoto || "",
    designation: cardData.designation || `${idType} Credential`,
    discipline: cardData.discipline || "Kalawar Martial Arts",
    beltRank: cardData.beltRank || (idType === "Club" ? undefined : "Standard Division"),
    academyName: cardData.academyName || "Affiliated Dojo Club",
    state: cardData.state || "Maharashtra",
    district: cardData.district || "Pune",
    bloodGroup: cardData.bloodGroup || "",
    emergencyContact: cardData.emergencyContact || "+91 98765 43210",
    phone: cardData.phone || "",
    email: cardData.email || "",
    issueDate: cardData.issueDate || now.toISOString().split("T")[0],
    validUntil: cardData.validUntil || new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split("T")[0],
    status: (cardData.status as IdCardStatus) || "Active",
    qrCodeUrl: `/id-cards/${encodeURIComponent(newId)}`,
    barcodeNumber: `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
    authorizedSignatory: cardData.authorizedSignatory || "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: cardData.authorizedSignatoryRole || "Founder & President – India",
    cardVersion: cardData.cardVersion || "2026.1",
    history: [
      {
        action: "Card Created",
        date: new Date().toISOString().split("T")[0],
        by: "Administrator",
        notes: "Direct issue from Official ID Cards Hub",
      },
    ],
  };

  try {
    await connectToDatabase();
    const created = await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + newId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      { $set: newCard },
      { upsert: true, returnDocument: "after" }
    ).lean();

    // Mirror to JSON fallback
    const fileCards = await getFileIdCards();
    const existingIdx = fileCards.findIndex((c) => c.id.toLowerCase() === newId.toLowerCase());
    if (existingIdx !== -1) {
      fileCards[existingIdx] = newCard;
    } else {
      fileCards.unshift(newCard);
    }
    await saveIdCards(fileCards);

    return created ? formatIdCardDoc(created) : newCard;
  } catch (error) {
    console.warn("MongoDB create note for ID Card: Saved to persistent storage fallback.", error instanceof Error ? error.message : "");
    const fileCards = await getFileIdCards();
    const existingIdx = fileCards.findIndex((c) => c.id.toLowerCase() === newId.toLowerCase());
    if (existingIdx !== -1) {
      fileCards[existingIdx] = newCard;
    } else {
      fileCards.unshift(newCard);
    }
    await saveIdCards(fileCards);
    return newCard;
  }
}

export async function updateIdCard(
  id: string,
  updates: Partial<IdCardEntry>
): Promise<IdCardEntry | null> {
  const cleanId = (id || "").trim();
  if (!cleanId) return null;

  const historyEntry: IdCardHistoryEntry = {
    action: "Details Updated",
    date: new Date().toISOString().split("T")[0],
    by: "Administrator",
    notes: updates.status ? `Status changed to ${updates.status}` : "Profile credentials modified.",
  };

  const updateFields: Record<string, any> = { ...updates };
  delete updateFields.id;
  delete updateFields._id;
  delete updateFields.__v;
  delete updateFields.createdAt;
  delete updateFields.updatedAt;
  delete updateFields.history;

  const isReferee =
    updateFields.cardType === "Referee" ||
    cleanId.toUpperCase().startsWith("KSM-RF-") ||
    cleanId.toUpperCase().startsWith("WSF-RF-") ||
    !!updateFields.refereeLevel ||
    (updateFields.designation && String(updateFields.designation).toLowerCase().includes("referee"));

  if (isReferee) {
    updateFields.cardType = "Referee";
    const rawLevel = updateFields.refereeLevel || updates.refereeLevel;
    if (rawLevel) {
      updateFields.refereeLevel = normalizeRefereeLevel(rawLevel);
      updateFields.designation = getRefereeDesignation(updateFields.refereeLevel);
    }
  }

  try {
    await connectToDatabase();
    const doc: any = await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      },
      { returnDocument: "after", new: true }
    ).lean();

    let resultCard: IdCardEntry | null = null;
    if (doc) {
      // Mirror to local file
      const fileCards = await getFileIdCards();
      const idx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) {
        fileCards[idx] = formatIdCardDoc(doc);
        await saveIdCards(fileCards);
      }
      resultCard = formatIdCardDoc(doc);
    } else {
      const fileCards = await getFileIdCards();
      const idx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) {
        const current = fileCards[idx];
        const updated: IdCardEntry = {
          ...current,
          ...updates,
          history: [...current.history, historyEntry],
        };
        fileCards[idx] = updated;
        await saveIdCards(fileCards);
        resultCard = updated;
      }
    }

    if (resultCard) {
      // Synchronize to PlayerModel if applicable
      try {
        const { updatePlayer } = await import("./players-store");
        await updatePlayer(cleanId, {
          ...(resultCard.holderName ? { name: resultCard.holderName } : {}),
          ...(resultCard.holderPhoto ? { image: resultCard.holderPhoto } : {}),
          ...(resultCard.discipline ? { discipline: resultCard.discipline as any } : {}),
          ...(resultCard.beltRank ? { beltRank: resultCard.beltRank } : {}),
          ...(resultCard.academyName ? { club: resultCard.academyName } : {}),
          ...(resultCard.state ? { state: resultCard.state } : {}),
          ...(resultCard.district ? { district: resultCard.district, city: resultCard.district } : {}),
          ...(resultCard.status ? { status: (resultCard.status === "Active" || resultCard.status === "Approved" ? "Active" : resultCard.status === "Suspended" ? "Suspended" : "Pending") as any } : {}),
          ...(resultCard.phone ? { phone: resultCard.phone } : {}),
          ...(resultCard.email ? { email: resultCard.email } : {}),
          ...(resultCard.cardType ? { memberType: resultCard.cardType === "Referee" ? "Referee" : resultCard.cardType === "Coach" ? "Coach" : resultCard.cardType === "Club" ? "Club" : "Player" } : {}),
        });
      } catch (playerErr) {
        console.warn("Could not sync ID card update to player store:", playerErr);
      }

      // Synchronize to RefereeModel if this is a Referee card
      if (
        resultCard.cardType === "Referee" ||
        cleanId.toUpperCase().startsWith("KSM-RF-") ||
        cleanId.toUpperCase().startsWith("WSF-RF-") ||
        resultCard.refereeLevel
      ) {
        try {
          const { updateReferee } = await import("./referees-store");
          await updateReferee(cleanId, {
            ...(resultCard.refereeLevel ? { level: resultCard.refereeLevel as any } : {}),
            ...(resultCard.holderName ? { name: resultCard.holderName } : {}),
            ...(resultCard.holderPhoto ? { photo: resultCard.holderPhoto } : {}),
            ...(resultCard.academyName ? { academy: resultCard.academyName } : {}),
            ...(resultCard.state ? { state: resultCard.state } : {}),
            ...(resultCard.district ? { district: resultCard.district } : {}),
            ...(resultCard.phone ? { phone: resultCard.phone } : {}),
            ...(resultCard.email ? { email: resultCard.email } : {}),
            ...(resultCard.beltRank && resultCard.beltRank !== "None / Unranked" ? { currentRank: resultCard.beltRank } : {}),
            ...(resultCard.status ? { status: (resultCard.status === "Active" || resultCard.status === "Approved" ? "Active" : resultCard.status === "Suspended" ? "Suspended" : "Pending") as any } : {}),
          });
        } catch (refErr) {
          console.warn("Could not sync ID card update to referee store:", refErr);
        }
      }
    }

    return resultCard;
  } catch {
    // Fallback to file update
  }

  const fileCards = await getFileIdCards();
  const idx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
  if (idx === -1) return null;

  const current = fileCards[idx];
  const updated: IdCardEntry = {
    ...current,
    ...updates,
    history: [...current.history, historyEntry],
  };

  fileCards[idx] = updated;
  await saveIdCards(fileCards);
  return updated;
}

export async function updateIdCardByMemberId(
  memberId: string,
  updates: Partial<IdCardEntry>
): Promise<void> {
  const cleanId = (memberId || "").trim();
  if (!cleanId) return;

  const updateFields: Record<string, any> = { ...updates };
  delete updateFields.id;
  delete updateFields._id;
  delete updateFields.__v;
  delete updateFields.createdAt;
  delete updateFields.updatedAt;

  try {
    await connectToDatabase();
    await IdCardModel.updateMany(
      {
        $or: [
          { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { qrCodeUrl: { $regex: new RegExp(cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
        ],
      },
      { $set: updateFields }
    );
  } catch (err) {
    console.warn("MongoDB updateIdCardByMemberId warning:", err);
  }

  try {
    const fileCards = await getFileIdCards();
    let changed = false;
    for (let i = 0; i < fileCards.length; i++) {
      if (
        fileCards[i].id.toLowerCase() === cleanId.toLowerCase() ||
        (fileCards[i].qrCodeUrl && fileCards[i].qrCodeUrl.toLowerCase().includes(cleanId.toLowerCase()))
      ) {
        fileCards[i] = { ...fileCards[i], ...updateFields };
        changed = true;
      }
    }
    if (changed) {
      await saveIdCards(fileCards);
    }
  } catch (err) {
    console.warn("File updateIdCardByMemberId warning:", err);
  }
}

export async function updateIdCardStatus(
  id: string,
  status: IdCardStatus,
  notes?: string
): Promise<IdCardEntry | null> {
  const cleanId = (id || "").trim();
  const historyEntry: IdCardHistoryEntry = {
    action: `Status: ${status}`,
    date: new Date().toISOString().split("T")[0],
    by: "Security & Verification Committee",
    notes: notes || `Card status updated to ${status}.`,
  };

  try {
    await connectToDatabase();
    const doc: any = await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      {
        $set: { status },
        $push: { history: historyEntry },
      },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const fileCards = await getFileIdCards();
      const idx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) {
        fileCards[idx] = formatIdCardDoc(doc);
        await saveIdCards(fileCards);
      }
      return formatIdCardDoc(doc);
    }
  } catch {
    // Fallback
  }

  return await updateIdCard(id, {
    status,
    history: [historyEntry],
  });
}

export async function renewIdCard(
  id: string,
  newValidUntil?: string
): Promise<IdCardEntry | null> {
  const now = new Date();
  const validUntil =
    newValidUntil ||
    new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split("T")[0];

  const historyEntry: IdCardHistoryEntry = {
    action: "ID Card Renewed",
    date: new Date().toISOString().split("T")[0],
    by: "Federation Secretariat",
    notes: `Validity extended until ${validUntil}.`,
  };

  try {
    await connectToDatabase();
    const doc: any = await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + id.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      {
        $set: { status: "Active", validUntil },
        $push: { history: historyEntry },
      },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const fileCards = await getFileIdCards();
      const idx = fileCards.findIndex((c) => c.id.toLowerCase() === id.trim().toLowerCase());
      if (idx !== -1) {
        fileCards[idx] = formatIdCardDoc(doc);
        await saveIdCards(fileCards);
      }
      return formatIdCardDoc(doc);
    }
  } catch {
    // Fallback
  }

  return await updateIdCard(id, {
    status: "Active",
    validUntil,
    history: [historyEntry],
  });
}

export async function deleteIdCard(identifier: string): Promise<boolean> {
  const cleanId = (identifier || "").trim();
  if (!cleanId) return false;

  let deletedFromMongo = false;
  try {
    await connectToDatabase();
    const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}$`, "i");
    const res = await IdCardModel.deleteMany({
      $or: [
        { id: regex },
        { memberId: regex },
        { barcodeNumber: regex },
        { championshipApplicationId: regex },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    });
    deletedFromMongo = (res?.deletedCount ?? 0) > 0;

    // Also clean up matching DanCertificate if this was a Dan card
    try {
      const { DanCertificateModel } = await import("@/models/DanGrading");
      await DanCertificateModel.deleteMany({
        $or: [
          { idCardNumber: regex },
          { certificateNumber: regex },
          { athleteId: regex },
        ],
      });
    } catch {}
  } catch (err) {
    console.warn("MongoDB deleteIdCard error:", err);
  }

  let deletedFromFile = false;
  try {
    const fileCards = await getFileIdCards();
    const lowerClean = cleanId.toLowerCase();
    const filtered = fileCards.filter(
      (c: any) =>
        c.id?.toLowerCase() !== lowerClean &&
        (c.memberId ? c.memberId.toLowerCase() !== lowerClean : true) &&
        (c.championshipApplicationId ? c.championshipApplicationId.toLowerCase() !== lowerClean : true)
    );
    if (filtered.length !== fileCards.length) {
      await saveIdCards(filtered);
      deletedFromFile = true;
    }
    cachedIdCards = cachedIdCards.filter(
      (c: any) =>
        c.id?.toLowerCase() !== lowerClean &&
        (c.memberId ? c.memberId.toLowerCase() !== lowerClean : true)
    );
  } catch (fileErr) {
    console.warn("deleteIdCard file error:", fileErr);
  }

  await invalidateIdCardCache(cleanId);
  return deletedFromMongo || deletedFromFile;
}

// ── ID Card Requests Pipeline: Users with accounts & Dan registrations awaiting Admin Approval ──

export async function getIdCardRequests(): Promise<IdCardRequestEntry[]> {
  try {
    const rawPlayers = await getPlayers();
    const issuedCards = await getIdCards();

    // Map of issued cards by clean ID
    const issuedMap = new Map<string, IdCardEntry>();
    issuedCards.forEach((c) => issuedMap.set(c.id.toLowerCase(), c));

    const pendingRequests: IdCardRequestEntry[] = [];

    // 1. Standard Account Registrations (Athletes, Coaches, Referees, Clubs)
    for (const p of rawPlayers) {
      if (!p.id) continue;

      // Exclude State & District Association users from ID Card Hub requests
      const isAssociationUser =
        p.memberType === "StateAssociation" ||
        p.memberType === "DistrictAssociation" ||
        (p as any).role === "state_association" ||
        (p as any).role === "state_admin" ||
        (p as any).role === "district_association" ||
        (p as any).role === "district_admin" ||
        p.id.toUpperCase().startsWith("KSM-SA-") ||
        p.id.toUpperCase().startsWith("WSF-SA-") ||
        p.id.toUpperCase().startsWith("KSM-SA") ||
        p.id.toUpperCase().startsWith("WSF-SA") ||
        p.id.toUpperCase().startsWith("KSM-DA-") ||
        p.id.toUpperCase().startsWith("WSF-DA-") ||
        p.id.toUpperCase().startsWith("KSM-DA") ||
        p.id.toUpperCase().startsWith("WSF-DA");

      if (isAssociationUser) {
        continue;
      }

      const idKey = p.id.toLowerCase();
      const existingCard = issuedMap.get(idKey);

      // If card already exists and is active / approved / suspended / expired, it is in Issued section
      if (
        existingCard &&
        (existingCard.status === "Active" ||
          existingCard.status === "Approved" ||
          existingCard.status === "Suspended" ||
          existingCard.status === "Expired")
      ) {
        continue;
      }

      const isRejected = existingCard?.status === "Rejected";

      pendingRequests.push({
        id: p.id,
        name: p.name,
        memberType: p.memberType || "Athlete",
        discipline: p.discipline || "Kalawar Martial Arts",
        beltRank: p.beltRank || (p.memberType === "Club" ? undefined : "1st Dan Black Belt"),
        club: p.club || "Independent Dojo",
        state: p.state || "Maharashtra",
        district: p.district || p.city || "",
        city: p.city || p.district || "",
        phone: p.phone,
        email: p.email,
        image: p.image,
        bloodGroup: p.bloodGroup,
        emergencyContact: p.emergencyContact,
        dob: p.dob,
        age: p.age,
        gender: p.gender,
        address: p.address,
        registeredOn: p.registeredOn || "2026-01-01",
        requestStatus: isRejected ? "Rejected" : "Pending",
        rejectionReason: isRejected
          ? existingCard?.history?.slice(-1)[0]?.notes || "Application under review"
          : undefined,
      });
    }

    // Sort: newest registrations first
    return pendingRequests.sort((a, b) => (b.registeredOn || "").localeCompare(a.registeredOn || ""));
  } catch (err) {
    console.error("Error fetching ID card requests:", err);
    return [];
  }
}

export async function approveIdCardRequest(
  playerId: string,
  overrides?: Partial<IdCardEntry>
): Promise<IdCardEntry | null> {
  const cleanId = (playerId || "").trim();
  if (!cleanId) return null;

  const rawPlayers = await getPlayers();
  const player = rawPlayers.find((p) => p.id && p.id.toLowerCase() === cleanId.toLowerCase());

  // Check if this is a Dan application request
  let danApp: any = null;
  try {
    const { getDanApplicationById, getAllDanApplications } = await import("./dan-grading-store");
    danApp = await getDanApplicationById(cleanId);
    if (!danApp) {
      const allApps = await getAllDanApplications();
      danApp = allApps.find(
        (a) =>
          a.id.toLowerCase() === cleanId.toLowerCase() ||
          (a.athleteId && a.athleteId.toLowerCase() === cleanId.toLowerCase())
      );
    }
  } catch (err) {
    console.warn("Could not check Dan applications during approval:", err);
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const isDan = overrides?.cardType === "Dan" || !!danApp;
  const isClub = !isDan && (player ? player.memberType === "Club" : overrides?.cardType === "Club");
  const isCoach = !isDan && (player ? player.memberType === "Coach" : overrides?.cardType === "Coach");
  const isReferee = !isDan && (player ? player.memberType === "Referee" : overrides?.cardType === "Referee");

  const cardType: IdCardType = overrides?.cardType || (
    isDan ? "Dan" : isClub ? "Club" : isCoach ? "Coach" : isReferee ? "Referee" : "Athlete"
  );

  const issueDate = overrides?.issueDate || now.toISOString().split("T")[0];
  const validUntilDate = new Date(now);
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
  const defaultValidUntil = isDan ? "Lifetime Holder" : validUntilDate.toISOString().split("T")[0];
  const validUntil = overrides?.validUntil || defaultValidUntil;

  // ── Dan ID Card Workflow ──────────────────────────────────────────────────
  if (isDan) {
    const danRank = Number(overrides?.danRank) || danApp?.appliedDanGrade || 1;
    const danRankTitle =
      overrides?.danRankTitle ||
      overrides?.beltRank ||
      danApp?.appliedDanTitle ||
      `${danRank}st Dan Black Belt`;

    const certSuffix = Math.floor(1000 + Math.random() * 9000);
    const certNumber = danApp?.certificateNumber || `KAC-DAN-${currentYear}-${certSuffix}`;
    const idCardNumber = danApp?.idCardNumber || `KAC-DAN-ID-${certSuffix}`;
    const targetCardId = danApp?.athleteId || player?.id || cleanId;

    try {
      const { updateDanApplicationStatus } = await import("./dan-grading-store");
      const { DanCertificateModel } = await import("@/models/DanGrading");

      if (danApp?.id) {
        await updateDanApplicationStatus(danApp.id, "Passed", undefined, {
          certificateNumber: certNumber,
          idCardNumber: idCardNumber,
          certificateIssuedDate: issueDate,
        });
      }

      await connectToDatabase();
      await DanCertificateModel.findOneAndUpdate(
        { certificateNumber: certNumber },
        {
          $set: {
            certificateNumber: certNumber,
            idCardNumber: idCardNumber,
            candidateName: overrides?.holderName || danApp?.fullName || player?.name || "Dan Athlete",
            athleteId: targetCardId,
            danRank: danRank,
            danRankTitle: danRankTitle,
            japaneseTitle: danRank === 1 ? "Sho Dan" : danRank === 2 ? "Ni Dan" : danRank === 3 ? "San Dan" : "Yon Dan",
            koreanTitle: danRank === 1 ? "Il Dan" : danRank === 2 ? "Ee Dan" : danRank === 3 ? "Sam Dan" : "Sa Dan",
            discipline: overrides?.discipline || danApp?.discipline || player?.discipline || "Kalawar Martial Arts",
            academyName: overrides?.academyName || danApp?.academyName || player?.club || "Independent Dojo",
            state: overrides?.state || danApp?.state || player?.state || "Maharashtra",
            photoUrl: overrides?.holderPhoto || danApp?.athletePhoto || player?.image,
            dob: danApp?.dob || player?.dob || "15/08/1998",
            issueDate: issueDate,
            examDate: danApp?.examDate || issueDate,
            score: 95,
            grade: "Distinction (90%+)",
            presidentName: overrides?.authorizedSignatory || "Mr. Santosh Uddhav Kasabe",
            presidentRole: overrides?.authorizedSignatoryRole || "Founder & President – India",
            chiefExaminer: "Grandmaster Santosh Kasbe (9th Dan)",
            chiefExaminerRank: "Founder & President – India | Head – Technical Committee, India",
            qrCodeUrl: `/certificates/dan/${encodeURIComponent(certNumber)}`,
            status: "Valid",
          },
        },
        { upsert: true }
      );
    } catch (danErr) {
      console.warn("Could not sync Dan certificate during approval:", danErr);
    }

    const newDanCard: IdCardEntry = {
      id: targetCardId,
      cardType: "Dan",
      source: "account",
      holderName: overrides?.holderName || danApp?.fullName || player?.name || "Dan Athlete",
      holderPhoto: overrides?.holderPhoto || danApp?.athletePhoto || player?.image || "",
      designation: overrides?.designation || danRankTitle || "Black Belt Holder",
      danRank,
      danRankTitle,
      danApplicationId: danApp?.id,
      certificateNumber: certNumber,
      idCardNumber,
      discipline: overrides?.discipline || danApp?.discipline || player?.discipline || "Kalawar Martial Arts",
      beltRank: danRankTitle,
      academyName: overrides?.academyName || danApp?.academyName || player?.club || "Independent Dojo",
      state: overrides?.state || danApp?.state || player?.state || "Maharashtra",
      district: overrides?.district || danApp?.district || player?.district || "Pune",
      bloodGroup: overrides?.bloodGroup || danApp?.bloodGroup || player?.bloodGroup || "",
      emergencyContact: overrides?.emergencyContact || danApp?.phone || player?.emergencyContact || player?.phone || "+91 98765 43210",
      phone: overrides?.phone || danApp?.phone || player?.phone || "",
      email: overrides?.email || danApp?.email || player?.email || "",
      issueDate,
      validUntil: "Lifetime Holder",
      status: "Active",
      qrCodeUrl: `/id-cards/dan/${encodeURIComponent(targetCardId)}`,
      barcodeNumber: overrides?.barcodeNumber || `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
      authorizedSignatory: overrides?.authorizedSignatory || "Mr. Santosh Uddhav Kasabe",
      authorizedSignatoryRole: overrides?.authorizedSignatoryRole || "Founder & President – India",
      cardVersion: overrides?.cardVersion || "2026.1",
      history: [
        {
          action: "Dan ID Card Approved & Issued",
          date: new Date().toISOString().split("T")[0],
          by: "Technical Committee / Admin",
          notes: `Official ${danRankTitle} ID Card issued from Official ID Card Requests Hub.`,
        },
      ],
    };

    try {
      await connectToDatabase();
      await IdCardModel.findOneAndUpdate(
        { id: { $regex: new RegExp("^" + targetCardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") }, cardType: "Dan" },
        { $set: newDanCard },
        { upsert: true, returnDocument: "after" }
      );
    } catch (err) {
      console.warn("MongoDB Dan ID card approval warning:", err);
    }

    const fileCards = await getFileIdCards();
    const existingIdx = fileCards.findIndex(
      (c) => c.id.toLowerCase() === targetCardId.toLowerCase() && c.cardType === "Dan"
    );
    if (existingIdx !== -1) {
      fileCards[existingIdx] = newDanCard;
    } else {
      fileCards.unshift(newDanCard);
    }
    await saveIdCards(fileCards);

    // Update Player's belt rank
    try {
      const { updatePlayer } = await import("./players-store");
      await updatePlayer(targetCardId, {
        beltRank: danRankTitle,
      });
    } catch (playerErr) {
      console.warn("Could not sync approved Dan rank to player store:", playerErr);
    }

    return newDanCard;
  }

  // ── Standard Member / Referee / Coach / Club ID Card Workflow ─────────────
  let resolvedRefereeLevel: string = "Level 0 – Trainee Referee";
  if (isReferee) {
    if (overrides?.refereeLevel) {
      resolvedRefereeLevel = overrides.refereeLevel;
    } else {
      try {
        const { getRefereeById } = await import("./referees-store");
        const refRecord = await getRefereeById(cleanId);
        if (refRecord?.level) {
          resolvedRefereeLevel = refRecord.level;
        } else if ((player as any)?.level) {
          resolvedRefereeLevel = (player as any).level;
        }
      } catch {
        if ((player as any)?.level) resolvedRefereeLevel = (player as any).level;
      }
    }
  }

  // Map authoritative level → human-readable designation label
  const LEVEL_TO_DESIGNATION: Record<string, string> = {
    "Level 0 – Trainee Referee": "Trainee Referee (Level 0)",
    "Level 1 – Junior Referee": "Junior Referee (Level 1)",
    "Level 2 – State Referee": "State Referee (Level 2)",
    "Level 3 – National Referee": "National Referee (Level 3)",
    "International / Chief Referee": "International Chief Referee",
  };

  const defaultRefDesignation = LEVEL_TO_DESIGNATION[resolvedRefereeLevel] || "Trainee Referee (Level 0)";

  const defaultDesignation = isClub
    ? "Affiliated Martial Arts Dojo"
    : isCoach
    ? "Certified Coach"
    : isReferee
    ? defaultRefDesignation
    : "Registered Athlete";

  const designation =
    overrides?.designation && overrides.designation !== "Technical Official"
      ? overrides.designation
      : defaultDesignation;

  const newCard: IdCardEntry = {
    id: cleanId,
    cardType,
    source: "account",
    holderName: overrides?.holderName || player?.name || "Registered Member",
    holderPhoto: overrides?.holderPhoto || player?.image || "",
    designation,
    // Store the authoritative level so it is never lost on future syncs
    refereeLevel: isReferee ? resolvedRefereeLevel : undefined,
    discipline: overrides?.discipline || player?.discipline || "Kalawar Martial Arts",
    beltRank: overrides?.beltRank || player?.beltRank || (isClub ? undefined : "1st Dan Black Belt"),
    academyName: overrides?.academyName || player?.club || "Independent Dojo",
    state: overrides?.state || player?.state || "Maharashtra",
    district: overrides?.district || player?.city || player?.district || "Pune",
    bloodGroup: overrides?.bloodGroup || player?.bloodGroup || "",
    emergencyContact: overrides?.emergencyContact || player?.emergencyContact || player?.phone || "+91 98765 43210",
    phone: overrides?.phone || player?.phone || "",
    email: overrides?.email || player?.email || "",
    issueDate,
    validUntil,
    status: "Active",
    qrCodeUrl: `/id-cards/${encodeURIComponent(cleanId)}`,
    barcodeNumber: overrides?.barcodeNumber || `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
    authorizedSignatory: overrides?.authorizedSignatory || "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: overrides?.authorizedSignatoryRole || "Founder & President – India",
    cardVersion: overrides?.cardVersion || "2026.1",
    history: [
      {
        action: "ID Card Approved & Issued",
        date: new Date().toISOString().split("T")[0],
        by: "Technical Committee / Admin",
        notes: "Approved and issued from Official ID Card Requests Hub.",
      },
    ],
  };

  try {
    await connectToDatabase();
    await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      { $set: newCard },
      { upsert: true, returnDocument: "after" }
    );
  } catch (err) {
    console.warn("MongoDB ID card approval warning:", err);
  }

  const fileCards = await getFileIdCards();
  const existingIdx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
  if (existingIdx !== -1) {
    fileCards[existingIdx] = newCard;
  } else {
    fileCards.unshift(newCard);
  }
  await saveIdCards(fileCards);

  // Synchronize to Player store
  try {
    const { updatePlayer } = await import("./players-store");
    await updatePlayer(cleanId, {
      status: "Active" as any,
      ...(newCard.holderName ? { name: newCard.holderName } : {}),
      ...(newCard.holderPhoto ? { image: newCard.holderPhoto } : {}),
      ...(newCard.discipline ? { discipline: newCard.discipline as any } : {}),
      ...(newCard.beltRank ? { beltRank: newCard.beltRank } : {}),
      ...(newCard.academyName ? { club: newCard.academyName } : {}),
      ...(newCard.state ? { state: newCard.state } : {}),
      ...(newCard.district ? { district: newCard.district, city: newCard.district } : {}),
      ...(newCard.phone ? { phone: newCard.phone } : {}),
      ...(newCard.email ? { email: newCard.email } : {}),
      ...(newCard.cardType ? { memberType: newCard.cardType === "Referee" ? "Referee" : newCard.cardType === "Coach" ? "Coach" : newCard.cardType === "Club" ? "Club" : "Player" } : {}),
    });
  } catch (playerErr) {
    console.warn("Could not sync approved ID card to player store:", playerErr);
  }

  return newCard;
}

export async function rejectIdCardRequest(
  playerId: string,
  reason?: string
): Promise<boolean> {
  const cleanId = (playerId || "").trim();
  if (!cleanId) return false;

  const rawPlayers = await getPlayers();
  const player = rawPlayers.find((p) => p.id && p.id.toLowerCase() === cleanId.toLowerCase());

  // Check if Dan application
  try {
    const { getDanApplicationById, updateDanApplicationStatus } = await import("./dan-grading-store");
    const danApp = await getDanApplicationById(cleanId);
    if (danApp?.id) {
      await updateDanApplicationStatus(danApp.id, "Rejected", reason || "Request rejected by Technical Committee.");
    }
  } catch (err) {
    console.warn("Could not update Dan application during rejection:", err);
  }

  const notes = reason || "Request rejected by Technical Committee.";
  const historyEntry: IdCardHistoryEntry = {
    action: "Request Rejected",
    date: new Date().toISOString().split("T")[0],
    by: "Technical Committee / Admin",
    notes,
  };

  const cardRecord: IdCardEntry = {
    id: cleanId,
    cardType: player?.memberType === "Coach" ? "Coach" : player?.memberType === "Referee" ? "Referee" : player?.memberType === "Club" ? "Club" : "Athlete",
    source: "account",
    holderName: player?.name || "Registered Member",
    holderPhoto: player?.image,
    designation: "Registration Under Review",
    discipline: player?.discipline || "Kalawar Martial Arts",
    beltRank: player?.beltRank,
    academyName: player?.club || "Independent Dojo",
    state: player?.state || "Maharashtra",
    district: player?.city || player?.district || "Pune",
    phone: player?.phone,
    email: player?.email,
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: new Date().toISOString().split("T")[0],
    status: "Rejected",
    qrCodeUrl: `/id-cards/${encodeURIComponent(cleanId)}`,
    barcodeNumber: `8902026${Math.floor(100000 + Math.random() * 900000)}`,
    authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: "Founder & President – India",
    cardVersion: "2026.1",
    history: [historyEntry],
  };

  try {
    await connectToDatabase();
    await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      { $set: cardRecord },
      { upsert: true }
    );
  } catch (err) {
    console.warn("MongoDB reject ID card request note:", err);
  }

  const fileCards = await getFileIdCards();
  const idx = fileCards.findIndex((c) => c.id.toLowerCase() === cleanId.toLowerCase());
  if (idx !== -1) {
    fileCards[idx] = cardRecord;
  } else {
    fileCards.push(cardRecord);
  }
  await saveIdCards(fileCards);

  return true;
}

// ── Sync Pipeline: Maintains Seed & Issued Cards without Auto-Generating Unapproved ──

export async function syncMembersToIdCards(): Promise<IdCardEntry[]> {
  const currentCards = await getIdCards();
  const cardMap = new Map<string, IdCardEntry>();
  currentCards.forEach((c) => cardMap.set(c.id.toLowerCase(), c));

  // Seed fallback cards with source: "account"
  SEED_ID_CARDS.forEach((c) => {
    if (!cardMap.has(c.id.toLowerCase())) {
      cardMap.set(c.id.toLowerCase(), { ...c, source: "account" });
    }
  });

  // Sync all officially passed Dan applications as active Dan ID cards
  try {
    const { getAllDanApplications } = await import("./dan-grading-store");
    const danApps = await getAllDanApplications();
    const passedDanApps = danApps.filter(
      (a) => a.status === "Passed" && (a.certificateNumber || a.idCardNumber)
    );

    for (const app of passedDanApps) {
      const cardId =
        app.idCardNumber ||
        `KAC-DAN-ID-${app.certificateNumber?.split("-").pop() || app.id.split("-").pop() || "1001"}`;
      const certNumber =
        app.certificateNumber || `KAC-DAN-${new Date().getFullYear()}-${cardId.split("-").pop()}`;

      if (!cardMap.has(cardId.toLowerCase())) {
        const danRank = app.appliedDanGrade || 1;
        const danRankTitle = app.appliedDanTitle || `${danRank}st Dan Black Belt`;

        const danCard: IdCardEntry = {
          id: cardId,
          cardType: "Dan",
          source: "account",
          holderName: app.fullName || "Dan Black Belt Holder",
          holderPhoto: app.athletePhoto,
          designation: `${danRankTitle} Holder`,
          danRank,
          danRankTitle,
          danApplicationId: app.id,
          certificateNumber: certNumber,
          idCardNumber: cardId,
          discipline: app.discipline || "Kalawar Martial Arts",
          beltRank: danRankTitle,
          academyName: app.academyName || "Independent Dojo",
          state: app.state || "Maharashtra",
          district: app.district || "Pune",
          bloodGroup: app.bloodGroup,
          emergencyContact: app.phone,
          phone: app.phone || "",
          email: app.email || "",
          issueDate: app.certificateIssuedDate || "2026-01-01",
          validUntil: "Lifetime Holder",
          status: "Active",
          qrCodeUrl: `/id-cards/dan/${encodeURIComponent(certNumber || cardId)}`,
          barcodeNumber: `8902026${Math.floor(10000 + Math.random() * 90000)}`,
          authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
          authorizedSignatoryRole: "Founder & President – India",
          cardVersion: "2026.1",
          history: [
            {
              action: "Dan ID Card Synchronized",
              date: app.certificateIssuedDate || "2026-01-01",
              by: "Dan Examination System",
              notes: `Official ${danRankTitle} credential auto-issued upon exam result publication.`,
            },
          ],
        };
        cardMap.set(cardId.toLowerCase(), danCard);
      }
    }
  } catch (danSyncErr) {
    console.warn("Could not sync passed Dan applications to ID cards:", danSyncErr);
  }

  // Cross-check referee promotions from referees-store so promoted levels are never lost
  try {
    const { getFileReferees } = await import("./referees-store");
    const referees = await getFileReferees();
    for (const ref of referees) {
      if (!ref.level) continue;
      const normLevel = normalizeRefereeLevel(ref.level);
      const targetKey = (ref.kalawarId || ref.id || "").toLowerCase();
      let existing = targetKey ? cardMap.get(targetKey) : null;
      if (!existing && ref.email) {
        existing = Array.from(cardMap.values()).find(
          (c) => c.cardType === "Referee" && c.email?.toLowerCase() === ref.email.toLowerCase()
        ) || null;
      }
      if (existing && existing.cardType === "Referee") {
        existing.refereeLevel = normLevel as any;
        existing.designation = getRefereeDesignation(normLevel);
        if (ref.status === "Active" || ref.status === "Certified" || ref.licenseNumber) {
          existing.status = "Active";
        }
        if (ref.photo) existing.holderPhoto = ref.photo;
        if (ref.name) existing.holderName = ref.name;
      }
    }
  } catch (refSyncErr) {
    console.warn("Could not sync referee promotions to ID cards:", refSyncErr);
  }

  const allCards = Array.from(cardMap.values());

  // Upsert all into MongoDB efficiently
  try {
    await connectToDatabase();
    const bulkOps = allCards.map((card) => ({
      updateOne: {
        filter: { id: card.id },
        update: { $set: card },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      await IdCardModel.bulkWrite(bulkOps, { ordered: false });
    }
  } catch (err) {
    console.warn("MongoDB bulk sync warning:", err);
  }

  await saveIdCards(allCards);
  return allCards;
}

export async function upsertRefereeIdCard(
  referee: {
    id: string;
    kalawarId?: string;
    name: string;
    dob?: string;
    gender?: string;
    email?: string;
    phone?: string;
    state?: string;
    district?: string;
    academy?: string;
    discipline?: string;
    currentRank?: string;
    level?: string;
    status?: string;
    photo?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  },
  cardStatus: IdCardStatus = "Active"
): Promise<IdCardEntry> {
  const refereeId = (referee.id || "").trim();
  const kalawarId = (referee.kalawarId || "").trim();
  const email = (referee.email || "").trim().toLowerCase();
  const phone = (referee.phone || "").trim();

  // Find existing card: check kalawarId, refereeId, email, or phone
  const allCurrentCards = await getFileIdCards();
  let existingCard: IdCardEntry | null = null;

  if (kalawarId) {
    existingCard = allCurrentCards.find((c) => c.id.toLowerCase() === kalawarId.toLowerCase()) || null;
  }
  if (!existingCard && refereeId) {
    existingCard = allCurrentCards.find((c) => c.id.toLowerCase() === refereeId.toLowerCase()) || null;
  }
  if (!existingCard && email) {
    existingCard = allCurrentCards.find((c) => c.cardType === "Referee" && c.email?.toLowerCase() === email) || null;
  }
  if (!existingCard && phone) {
    existingCard = allCurrentCards.find((c) => c.cardType === "Referee" && c.phone === phone) || null;
  }
  if (!existingCard) {
    existingCard = await getIdCardById(kalawarId || refereeId);
  }

  // Determine primary target card ID:
  // Prefer the member account ID (e.g. KSM-RF-...), or existing card ID, or kalawarId, or refereeId
  const targetCardId =
    existingCard?.id ||
    (kalawarId && (kalawarId.toUpperCase().startsWith("KSM-RF-") || kalawarId.toUpperCase().startsWith("WSF-RF-")) ? kalawarId : "") ||
    (refereeId && (refereeId.toUpperCase().startsWith("KSM-RF-") || refereeId.toUpperCase().startsWith("WSF-RF-")) ? refereeId : "") ||
    kalawarId ||
    refereeId;

  const rawLevel = normalizeRefereeLevel(referee.level || "Level 0 – Trainee Referee");
  const designation = getRefereeDesignation(rawLevel);

  const now = new Date();
  const currentYear = now.getFullYear();

  const isUpgraded = existingCard && existingCard.refereeLevel !== rawLevel;
  const historyEntry: IdCardHistoryEntry = {
    action: isUpgraded
      ? `Referee Level Promoted: ${rawLevel}`
      : existingCard
      ? `Details Synced: ${rawLevel}`
      : "Referee ID Card Issued",
    date: now.toISOString().split("T")[0],
    by: "Technical Committee / Admin",
    notes: `ID Card synchronized with Referee Module (${rawLevel} - ${designation}).`,
  };

  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);

  const cardRecord: IdCardEntry = {
    id: targetCardId,
    cardType: "Referee",
    source: "account",
    refereeLevel: rawLevel as any,
    holderName: referee.name || existingCard?.holderName || "Official Referee",
    holderPhoto: referee.photo || existingCard?.holderPhoto,
    designation,
    discipline: referee.discipline || existingCard?.discipline || "Kalawar Martial Arts",
    beltRank:
      referee.currentRank && referee.currentRank !== "None / Unranked"
        ? referee.currentRank
        : existingCard?.beltRank || "1st Dan Black Belt",
    academyName: referee.academy || existingCard?.academyName || "National Technical Committee",
    state: referee.state || existingCard?.state || "Maharashtra",
    district: referee.district || existingCard?.district || "Pune",
    bloodGroup: referee.bloodGroup || existingCard?.bloodGroup,
    emergencyContact: referee.emergencyContact || existingCard?.emergencyContact,
    phone: referee.phone || existingCard?.phone || "",
    email: referee.email || existingCard?.email || "",
    issueDate: existingCard?.issueDate || now.toISOString().split("T")[0],
    validUntil: existingCard?.validUntil || defaultExpiry.toISOString().split("T")[0],
    status: cardStatus,
    qrCodeUrl: `/id-cards/${encodeURIComponent(targetCardId)}`,
    barcodeNumber: existingCard?.barcodeNumber || `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
    authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: "Founder & President – India",
    cardVersion: "2026.1",
    history: existingCard?.history ? [...existingCard.history, historyEntry] : [historyEntry],
  };

  const setRecord: any = { ...cardRecord };
  delete setRecord._id;
  delete setRecord.__v;
  delete setRecord.createdAt;
  delete setRecord.updatedAt;
  delete setRecord.history;

  try {
    await connectToDatabase();
    await IdCardModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + targetCardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
      { 
        $set: setRecord,
        $push: { history: historyEntry }
      },
      { upsert: true, returnDocument: "after", new: true }
    );

    // If referee.id (e.g. KAC-REF-2026-012) is different from targetCardId (e.g. WSF-RF-2026-7919),
    // delete any duplicate phantom card created with referee.id
    if (refereeId && refereeId.toLowerCase() !== targetCardId.toLowerCase()) {
      await IdCardModel.deleteOne({ id: { $regex: new RegExp("^" + refereeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } });
    }
  } catch (err) {
    console.warn("MongoDB upsert referee ID card note:", err);
  }

  const fileCards = await getFileIdCards();
  // Filter out any duplicate phantom cards matching refereeId if different from targetCardId
  let filteredCards = fileCards;
  if (refereeId && refereeId.toLowerCase() !== targetCardId.toLowerCase()) {
    filteredCards = fileCards.filter((c) => c.id.toLowerCase() !== refereeId.toLowerCase());
  }

  const idx = filteredCards.findIndex((c) => c.id.toLowerCase() === targetCardId.toLowerCase());
  if (idx !== -1) {
    filteredCards[idx] = cardRecord;
  } else {
    filteredCards.unshift(cardRecord);
  }
  await saveIdCards(filteredCards);

  return cardRecord;
}

export async function upsertDanIdCard(
  danApp: {
    id: string;
    athleteId?: string;
    fullName?: string;
    athletePhoto?: string;
    appliedDanGrade?: number;
    appliedDanTitle?: string;
    discipline?: string;
    academyName?: string;
    state?: string;
    district?: string;
    phone?: string;
    email?: string;
    bloodGroup?: string;
    dob?: string;
    certificateNumber?: string;
    idCardNumber?: string;
    certificateIssuedDate?: string;
  },
  certData?: {
    certificateNumber?: string;
    idCardNumber?: string;
    candidateName?: string;
    photoUrl?: string;
    danRank?: number;
    danRankTitle?: string;
    discipline?: string;
    academyName?: string;
    state?: string;
    issueDate?: string;
    presidentName?: string;
    presidentRole?: string;
  },
  cardStatus: IdCardStatus = "Active"
): Promise<IdCardEntry> {
  const cleanId = (danApp.idCardNumber || certData?.idCardNumber || danApp.athleteId || danApp.id || "").trim();
  const certNumber =
    danApp.certificateNumber ||
    certData?.certificateNumber ||
    `KAC-DAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const idCardNumber =
    danApp.idCardNumber || certData?.idCardNumber || cleanId || `KAC-DAN-ID-${certNumber.split("-").pop()}`;
  const targetCardId = idCardNumber;
  const now = new Date();
  const currentYear = now.getFullYear();
  const issueDate = certData?.issueDate || danApp.certificateIssuedDate || now.toISOString().split("T")[0];

  const danRank = danApp.appliedDanGrade || certData?.danRank || 1;
  const danRankTitle = danApp.appliedDanTitle || certData?.danRankTitle || `${danRank}st Dan Black Belt`;

  const historyEntry: IdCardHistoryEntry = {
    action: "Dan ID Card Issued",
    date: issueDate,
    by: "Dan Grading Examination System",
    notes: `Official ${danRankTitle} credential auto-issued upon exam result publication (Certificate No: ${certNumber}).`,
  };

  const cardRecord: IdCardEntry = {
    id: targetCardId,
    cardType: "Dan",
    source: "account",
    holderName: danApp.fullName || certData?.candidateName || "Dan Black Belt Holder",
    holderPhoto: danApp.athletePhoto || certData?.photoUrl,
    designation: `${danRankTitle} Holder`,
    danRank,
    danRankTitle,
    danApplicationId: danApp.id,
    certificateNumber: certNumber,
    idCardNumber: targetCardId,
    discipline: certData?.discipline || danApp.discipline || "Kalawar Martial Arts",
    beltRank: danRankTitle,
    academyName: danApp.academyName || certData?.academyName || "Independent Dojo",
    state: danApp.state || certData?.state || "Maharashtra",
    district: danApp.district || "Pune",
    bloodGroup: danApp.bloodGroup,
    emergencyContact: danApp.phone,
    phone: danApp.phone || "",
    email: danApp.email || "",
    issueDate,
    validUntil: "Lifetime Holder",
    status: cardStatus,
    qrCodeUrl: `/id-cards/dan/${encodeURIComponent(certNumber || targetCardId)}`,
    barcodeNumber: `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
    authorizedSignatory: certData?.presidentName || "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: certData?.presidentRole || "Founder & President – India",
    cardVersion: "2026.1",
    history: [historyEntry],
  };

  const setRecord: any = { ...cardRecord };
  delete setRecord._id;
  delete setRecord.__v;
  delete setRecord.createdAt;
  delete setRecord.updatedAt;
  delete setRecord.history;

  try {
    await connectToDatabase();
    await IdCardModel.findOneAndUpdate(
      {
        $or: [
          { id: { $regex: new RegExp("^" + targetCardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { idCardNumber: { $regex: new RegExp("^" + targetCardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { certificateNumber: { $regex: new RegExp("^" + certNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { danApplicationId: danApp.id },
        ],
      },
      {
        $set: setRecord,
        $push: { history: historyEntry },
      },
      { upsert: true, returnDocument: "after", new: true }
    );
  } catch (err) {
    console.warn("MongoDB upsert Dan ID card note:", err);
  }

  const fileCards = await getFileIdCards();
  const idx = fileCards.findIndex(
    (c) =>
      c.id.toLowerCase() === targetCardId.toLowerCase() ||
      (c.idCardNumber && c.idCardNumber.toLowerCase() === targetCardId.toLowerCase()) ||
      (certNumber && c.certificateNumber?.toLowerCase() === certNumber.toLowerCase()) ||
      (danApp.id && c.danApplicationId?.toLowerCase() === danApp.id.toLowerCase())
  );
  if (idx !== -1) {
    fileCards[idx] = cardRecord;
  } else {
    fileCards.unshift(cardRecord);
  }
  await saveIdCards(fileCards);

  return cardRecord;
}

export async function syncChampionshipApplicationToIdCard(
  app: any
): Promise<IdCardEntry | null> {
  if (!app) return null;
  const appId = (app.id || app.applicationId || "").trim();
  const athleteId = (app.athleteId || appId || "").trim();
  const targetCardId = appId ? `CHAMP-${appId.replace(/^CHAMP-?/i, "")}` : athleteId || `CHAMP-${Date.now()}`;

  const now = new Date();
  const currentYear = now.getFullYear();
  const issueDate = app.approvalDate ? String(app.approvalDate).split("T")[0] : now.toISOString().split("T")[0];

  const bibNumber = app.bibNumber || "BIB-001";
  const tier = app.level || (app.result as any)?.level || "District";
  const applicantName = app.applicantName || app.athleteName || "Competitor";
  const eventTitle = app.eventTitle || app.eventName || "Championship";
  const discipline = app.discipline || "Kalawar Martial Arts";
  const beltRank = app.beltRank || "Competitor";
  const academy = app.clubName || app.club || "Independent Athlete";
  const state = app.state || "Maharashtra";
  const district = app.district || app.city || "Pune";
  const photo = app.photo || app.athletePhoto;

  const historyEntry: IdCardHistoryEntry = {
    action: "Championship Competitor Pass Issued",
    date: issueDate,
    by: "Championship Secretariat",
    notes: `Accredited pass generated for ${eventTitle} (${bibNumber}).`,
  };

  const cardRecord: IdCardEntry = {
    id: targetCardId,
    cardType: "Championship",
    source: "manual",
    holderName: applicantName,
    holderPhoto: photo,
    designation: `Competitor (${bibNumber})`,
    championshipApplicationId: appId,
    bibNumber: bibNumber,
    eventTitle: eventTitle,
    tournamentTier: tier,
    ageDivision: app.ageDivision,
    weightCategory: app.weightCategory,
    discipline: discipline,
    beltRank: beltRank,
    academyName: academy,
    state: state,
    district: district,
    bloodGroup: app.bloodGroup || "",
    emergencyContact: app.emergencyContactPhone || app.emergencyContact?.phone || app.phone,
    phone: app.phone || "",
    email: app.email || "",
    issueDate,
    validUntil: app.eventDate || `${currentYear}-12-31`,
    status: "Active",
    qrCodeUrl: `/id-cards/championship/${encodeURIComponent(targetCardId)}`,
    barcodeNumber: `890${currentYear}${Math.floor(10000 + Math.random() * 90000)}`,
    authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: "Founder & President – India",
    cardVersion: "2026.1",
    history: [historyEntry],
  };

  const setRecord: any = { ...cardRecord };
  delete setRecord._id;
  delete setRecord.__v;
  delete setRecord.createdAt;
  delete setRecord.updatedAt;
  delete setRecord.history;

  try {
    await connectToDatabase();
    await IdCardModel.findOneAndUpdate(
      {
        $or: [
          { id: { $regex: new RegExp("^" + targetCardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { championshipApplicationId: appId },
        ],
      },
      {
        $set: setRecord,
        $push: { history: historyEntry },
      },
      { upsert: true, returnDocument: "after", new: true }
    );
  } catch (err) {
    console.warn("MongoDB upsert Championship ID card note:", err);
  }

  const fileCards = await getFileIdCards();
  const idx = fileCards.findIndex(
    (c) =>
      c.id.toLowerCase() === targetCardId.toLowerCase() ||
      (appId && c.championshipApplicationId?.toLowerCase() === appId.toLowerCase())
  );
  if (idx !== -1) {
    fileCards[idx] = cardRecord;
  } else {
    fileCards.unshift(cardRecord);
  }
  await saveIdCards(fileCards);

  return cardRecord;
}



