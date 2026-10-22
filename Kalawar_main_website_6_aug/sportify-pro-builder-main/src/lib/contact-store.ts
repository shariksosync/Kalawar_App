import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { ContactModel } from "@/models/Contact";
export * from "@/types/contact";
import type { ContactRequest, ContactStatus, CreateContactInput } from "@/types/contact";

let cachedContacts: ContactRequest[] = [];

// Fallback JSON file storage helpers
async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "contacts.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "contacts.json");

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
        await fs.writeFile(primaryPath, JSON.stringify([], null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

export async function getFileContacts(): Promise<ContactRequest[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedContacts;
    const parsed = JSON.parse(raw) as ContactRequest[];
    if (Array.isArray(parsed)) {
      cachedContacts = parsed;
      return parsed;
    }
    return cachedContacts;
  } catch {
    return cachedContacts;
  }
}

export async function saveFileContacts(items: ContactRequest[]): Promise<void> {
  cachedContacts = items;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(items, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(items, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not save to contacts.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

export async function generateNextContactId(): Promise<string> {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^KAC-ENQ-${year}-(\\d+)$`, "i");
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await ContactModel.find({ id: { $regex: new RegExp(`^KAC-ENQ-${year}-\\d+$`, "i") } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    // Fallback
  }

  const fileList = await getFileContacts();
  for (const item of fileList) {
    const match = item.id.match(regex) || item.id.match(/^REQ-(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highestNum) highestNum = num;
    }
  }

  const nextNum = String(highestNum + 1).padStart(3, "0");
  return `KAC-ENQ-${year}-${nextNum}`;
}

export async function getContacts(options?: {
  status?: string;
  category?: string;
  q?: string;
}): Promise<ContactRequest[]> {
  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (options?.status && options.status !== "All") {
      filter.status = options.status;
    }
    if (options?.category && options.category !== "All") {
      filter.category = options.category;
    }
    if (options?.q && options.q.trim()) {
      const qRegex = new RegExp(options.q.trim(), "i");
      filter.$or = [
        { id: qRegex },
        { name: qRegex },
        { email: qRegex },
        { phone: qRegex },
        { subject: qRegex },
        { message: qRegex },
        { state: qRegex },
      ];
    }

    const docs = await ContactModel.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone || "",
      state: d.state || "",
      district: d.district || "",
      subject: d.subject,
      category: d.category || "General Enquiry",
      message: d.message,
      attachmentUrl: d.attachmentUrl || "",
      attachmentName: d.attachmentName || "",
      attachmentSize: d.attachmentSize || "",
      status: (d.status as ContactStatus) || "Submitted",
      assignedTo: d.assignedTo || "",
      adminReply: d.adminReply || "",
      repliedAt: d.repliedAt || "",
      repliedBy: d.repliedBy || "",
      internalNotes: d.internalNotes || "",
      eventId: d.eventId || "",
      eventName: d.eventName || "",
      eventDate: d.eventDate || "",
      division: d.division || "",
      beltRank: d.beltRank || "",
      academyName: d.academyName || "",
      tag: d.tag || "",
      history: d.history || [],
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.warn("MongoDB access note (contacts): Falling back to persistent file storage.", error instanceof Error ? error.message : "");
    const fileList = await getFileContacts();
    let filtered = fileList;

    if (options?.status && options.status !== "All") {
      filtered = filtered.filter((c) => c.status === options.status);
    }
    if (options?.category && options.category !== "All") {
      filtered = filtered.filter((c) => c.category === options.category);
    }
    if (options?.q && options.q.trim()) {
      const qLower = options.q.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(qLower) ||
          c.name.toLowerCase().includes(qLower) ||
          c.email.toLowerCase().includes(qLower) ||
          c.phone.toLowerCase().includes(qLower) ||
          c.subject.toLowerCase().includes(qLower) ||
          c.message.toLowerCase().includes(qLower) ||
          (c.state && c.state.toLowerCase().includes(qLower))
      );
    }

    return filtered;
  }
}

export async function getContactById(id: string): Promise<ContactRequest | null> {
  const cleanId = id.trim();
  try {
    await connectToDatabase();
    const d: any = await ContactModel.findOne({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    }).lean();

    if (d) {
      return {
        id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone || "",
        state: d.state || "",
        district: d.district || "",
        subject: d.subject,
        category: d.category || "General Enquiry",
        message: d.message,
        attachmentUrl: d.attachmentUrl || "",
        attachmentName: d.attachmentName || "",
        attachmentSize: d.attachmentSize || "",
        status: (d.status as ContactStatus) || "Submitted",
        assignedTo: d.assignedTo || "",
        adminReply: d.adminReply || "",
        repliedAt: d.repliedAt || "",
        repliedBy: d.repliedBy || "",
        internalNotes: d.internalNotes || "",
        eventId: d.eventId || "",
        eventName: d.eventName || "",
        eventDate: d.eventDate || "",
        division: d.division || "",
        beltRank: d.beltRank || "",
        academyName: d.academyName || "",
        tag: d.tag || "",
        history: d.history || [],
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      };
    }
  } catch {
    // Fallback
  }

  const fileList = await getFileContacts();
  return fileList.find((c) => c.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

export async function trackContactEnquiry(
  enquiryId: string,
  phoneOrEmail: string
): Promise<ContactRequest | null> {
  if (!enquiryId || !phoneOrEmail) return null;

  // 1. Normalize ID: remove all whitespace, hyphens, underscores, dots, lowercase
  const normalizeId = (s: string) =>
    (s || "").toLowerCase().replace(/[\s\-_.:]/g, "");

  const targetIdClean = normalizeId(enquiryId);

  // 2. Normalize Contact input (phone digits or email)
  const rawContact = phoneOrEmail.trim().toLowerCase();
  const isEmail = rawContact.includes("@");
  const queryPhoneDigits = rawContact.replace(/[^0-9]/g, "");
  const queryPhoneLast10 = queryPhoneDigits.length >= 10 ? queryPhoneDigits.slice(-10) : queryPhoneDigits;

  const contacts = await getContacts();
  const match = contacts.find((c) => {
    // Check ID match
    const currentIdClean = normalizeId(c.id);
    const idMatches =
      currentIdClean === targetIdClean ||
      currentIdClean.includes(targetIdClean) ||
      targetIdClean.includes(currentIdClean);

    if (!idMatches) return false;

    // Check Email or Phone match
    if (isEmail) {
      return (c.email || "").trim().toLowerCase() === rawContact;
    }

    // Phone matching
    const storedPhoneDigits = (c.phone || "").replace(/[^0-9]/g, "");
    const storedPhoneLast10 =
      storedPhoneDigits.length >= 10
        ? storedPhoneDigits.slice(-10)
        : storedPhoneDigits;

    const phoneMatches =
      (queryPhoneLast10.length >= 6 && storedPhoneLast10.includes(queryPhoneLast10)) ||
      (storedPhoneLast10.length >= 6 && queryPhoneLast10.includes(storedPhoneLast10)) ||
      storedPhoneDigits === queryPhoneDigits ||
      (c.email || "").trim().toLowerCase() === rawContact;

    return phoneMatches;
  });

  return match || null;
}

export async function createContact(input: CreateContactInput): Promise<ContactRequest> {
  if (!input.name || !input.name.trim()) {
    throw new Error("Full name is required");
  }
  if (!input.email || !input.email.trim()) {
    throw new Error("Email address is required");
  }
  if (!input.subject || !input.subject.trim()) {
    throw new Error("Subject is required");
  }
  if (!input.message || !input.message.trim()) {
    throw new Error("Message content is required");
  }

  const id = input.id?.trim() || (await generateNextContactId());
  const status: ContactStatus = (input.status as ContactStatus) || "Submitted";
  const now = new Date().toISOString();

  const contactData: ContactRequest = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || "",
    state: input.state?.trim() || "",
    district: input.district?.trim() || "",
    subject: input.subject.trim(),
    category: input.category || "General Enquiry",
    message: input.message.trim(),
    attachmentUrl: input.attachmentUrl || "",
    attachmentName: input.attachmentName || "",
    attachmentSize: input.attachmentSize || "",
    status,
    eventId: input.eventId || "",
    eventName: input.eventName || "",
    eventDate: input.eventDate || "",
    division: input.division || "",
    beltRank: input.beltRank || "",
    academyName: input.academyName || "",
    tag: input.tag || (input.eventName ? `Event: ${input.eventName}` : ""),
    history: [
      {
        action: input.category === "Event Registration" ? "Event Registration Submitted" : "Enquiry Submitted",
        date: now,
        by: input.name.trim(),
        notes: input.category === "Event Registration" 
          ? `Online registration submitted for ${input.eventName || "tournament"}.`
          : "Online enquiry submitted via official federation portal.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await connectToDatabase();
    await ContactModel.create(contactData);
  } catch (error) {
    console.warn("MongoDB create failed, writing to fallback file:", error);
  }

  const fileList = await getFileContacts();
  const nextList = [contactData, ...fileList.filter((c) => c.id !== id)];
  await saveFileContacts(nextList);

  return contactData;
}

export const saveContact = createContact;

export async function updateContact(
  id: string,
  updates: Partial<ContactRequest>,
  actionBy: string = "Admin Secretariat"
): Promise<ContactRequest> {
  const existing = await getContactById(id);
  if (!existing) {
    throw new Error(`Enquiry with reference "${id}" not found`);
  }

  const now = new Date().toISOString();
  const newHistory = existing.history ? [...existing.history] : [];

  if (updates.status && updates.status !== existing.status) {
    newHistory.push({
      action: `Status Changed to ${updates.status}`,
      date: now,
      by: actionBy,
      notes: updates.internalNotes || `Status updated from ${existing.status} to ${updates.status}`,
    });
  }

  if (updates.assignedTo && updates.assignedTo !== existing.assignedTo) {
    newHistory.push({
      action: `Assigned to ${updates.assignedTo}`,
      date: now,
      by: actionBy,
      notes: "Enquiry reallocated for processing.",
    });
  }

  if (updates.adminReply && updates.adminReply !== existing.adminReply) {
    newHistory.push({
      action: "Response Logged & Dispatched",
      date: now,
      by: actionBy,
      notes: updates.adminReply.slice(0, 100) + (updates.adminReply.length > 100 ? "..." : ""),
    });
  }

  const updatedData: ContactRequest = {
    ...existing,
    ...updates,
    history: newHistory,
    updatedAt: now,
  };

  try {
    await connectToDatabase();
    await ContactModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id.trim()}$`, "i") } },
      { $set: updatedData },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update failed, saving to fallback file:", error);
  }

  const fileList = await getFileContacts();
  const index = fileList.findIndex((c) => c.id.toLowerCase() === id.trim().toLowerCase());
  if (index >= 0) {
    fileList[index] = updatedData;
    await saveFileContacts(fileList);
  }

  return updatedData;
}

export async function deleteContact(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await ContactModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    });
    if (res) deleted = true;
  } catch (error) {
    console.warn("MongoDB delete error:", error);
  }

  const fileList = await getFileContacts();
  const nextList = fileList.filter((c) => c.id.toLowerCase() !== cleanId.toLowerCase());
  if (nextList.length !== fileList.length) {
    await saveFileContacts(nextList);
    deleted = true;
  }

  return deleted;
}
