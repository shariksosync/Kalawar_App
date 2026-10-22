import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { DistrictAdminModel, type IDistrictAdminDocument } from "@/models/DistrictAdmin";
import { INDIA_STATES_DISTRICTS } from "@/data/india-districts";

export interface DistrictAdminItem {
  id: string;
  userId: string;
  password: string;
  state: string;
  district: string;
  role: "district_admin";
  status: "Active" | "Disabled";
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

let cachedDistrictAdmins: DistrictAdminItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "district-admins.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "district-admins.json");

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
        // Read-only filesystem fallback
      }
      return primaryPath;
    }
  }
}

async function readFileStorage(): Promise<DistrictAdminItem[]> {
  try {
    const filePath = await ensureFileStorage();
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return cachedDistrictAdmins;
  }
}

async function writeFileStorage(items: DistrictAdminItem[]): Promise<void> {
  cachedDistrictAdmins = items;
  try {
    const filePath = await ensureFileStorage();
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write district admins to file storage:", err);
  }
}

export function generateDefaultDistrictUserId(state: string, district: string): string {
  const cleanDistrict = district
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  
  return `admin_${cleanDistrict}`;
}

export function generateDefaultDistrictPassword(district: string): string {
  const cleanDistrict = district
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();
  const capitalized = cleanDistrict.charAt(0).toUpperCase() + cleanDistrict.slice(1).toLowerCase();
  return `${capitalized}@2026`;
}

/**
 * Retrieves an existing District Admin or creates and permanently saves a new one.
 */
export async function getOrCreateDistrictAdmin(
  state: string,
  district: string
): Promise<DistrictAdminItem> {
  const cleanState = state.trim();
  const cleanDistrict = district.trim();

  try {
    await connectToDatabase();
    const existing = await DistrictAdminModel.findOne({
      state: { $regex: new RegExp(`^${cleanState}$`, "i") },
      district: { $regex: new RegExp(`^${cleanDistrict}$`, "i") },
    }).lean();

    if (existing) {
      return {
        id: (existing as any).id || (existing as any)._id?.toString(),
        userId: existing.userId,
        password: existing.password,
        state: existing.state,
        district: existing.district,
        role: "district_admin",
        status: existing.status,
        lastLogin: existing.lastLogin ? new Date(existing.lastLogin).toISOString() : undefined,
        createdAt: (existing as any).createdAt ? new Date((existing as any).createdAt).toISOString() : undefined,
        updatedAt: (existing as any).updatedAt ? new Date((existing as any).updatedAt).toISOString() : undefined,
      };
    }

    // Generate new permanent credentials
    const defaultUserId = generateDefaultDistrictUserId(cleanState, cleanDistrict);
    const defaultPassword = generateDefaultDistrictPassword(cleanDistrict);
    const newId = `DIST-ADM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const createdDoc = await DistrictAdminModel.create({
      id: newId,
      userId: defaultUserId,
      password: defaultPassword,
      state: cleanState,
      district: cleanDistrict,
      role: "district_admin",
      status: "Active",
    });

    const item: DistrictAdminItem = {
      id: createdDoc.id,
      userId: createdDoc.userId,
      password: createdDoc.password,
      state: createdDoc.state,
      district: createdDoc.district,
      role: "district_admin",
      status: createdDoc.status,
      createdAt: createdDoc.createdAt?.toISOString(),
      updatedAt: createdDoc.updatedAt?.toISOString(),
    };

    // Also sync to file cache
    const fileItems = await readFileStorage();
    const idx = fileItems.findIndex(
      (f) => f.state.toLowerCase() === cleanState.toLowerCase() && f.district.toLowerCase() === cleanDistrict.toLowerCase()
    );
    if (idx >= 0) {
      fileItems[idx] = item;
    } else {
      fileItems.push(item);
    }
    await writeFileStorage(fileItems);

    return item;
  } catch (error) {
    console.error("Database error in getOrCreateDistrictAdmin, using file fallback:", error);
    const fileItems = await readFileStorage();
    const existing = fileItems.find(
      (f) => f.state.toLowerCase() === cleanState.toLowerCase() && f.district.toLowerCase() === cleanDistrict.toLowerCase()
    );

    if (existing) return existing;

    const newItem: DistrictAdminItem = {
      id: `DIST-ADM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: generateDefaultDistrictUserId(cleanState, cleanDistrict),
      password: generateDefaultDistrictPassword(cleanDistrict),
      state: cleanState,
      district: cleanDistrict,
      role: "district_admin",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fileItems.push(newItem);
    await writeFileStorage(fileItems);
    return newItem;
  }
}

/**
 * Updates a District Admin's password or status.
 */
export async function updateDistrictAdmin(
  userId: string,
  updates: { password?: string; status?: "Active" | "Disabled" }
): Promise<DistrictAdminItem | null> {
  const cleanUserId = userId.trim().toLowerCase();

  try {
    await connectToDatabase();
    const updated = await DistrictAdminModel.findOneAndUpdate(
      { userId: cleanUserId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) return null;

    const item: DistrictAdminItem = {
      id: (updated as any).id || (updated as any)._id?.toString(),
      userId: updated.userId,
      password: updated.password,
      state: updated.state,
      district: updated.district,
      role: "district_admin",
      status: updated.status,
      lastLogin: updated.lastLogin ? new Date(updated.lastLogin).toISOString() : undefined,
      createdAt: (updated as any).createdAt ? new Date((updated as any).createdAt).toISOString() : undefined,
      updatedAt: (updated as any).updatedAt ? new Date((updated as any).updatedAt).toISOString() : undefined,
    };

    // Sync file cache
    const fileItems = await readFileStorage();
    const idx = fileItems.findIndex((f) => f.userId.toLowerCase() === cleanUserId);
    if (idx >= 0) {
      fileItems[idx] = item;
      await writeFileStorage(fileItems);
    }

    return item;
  } catch (error) {
    console.error("Database error in updateDistrictAdmin, using file fallback:", error);
    const fileItems = await readFileStorage();
    const idx = fileItems.findIndex((f) => f.userId.toLowerCase() === cleanUserId);
    if (idx < 0) return null;

    fileItems[idx] = {
      ...fileItems[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await writeFileStorage(fileItems);
    return fileItems[idx];
  }
}

/**
 * Retrieves all District Admins from database.
 */
export async function getAllDistrictAdmins(stateFilter?: string): Promise<DistrictAdminItem[]> {
  try {
    await connectToDatabase();
    const filter: any = {};
    if (stateFilter && stateFilter !== "All") {
      filter.state = { $regex: new RegExp(`^${stateFilter.trim()}$`, "i") };
    }

    const docs = await DistrictAdminModel.find(filter).sort({ state: 1, district: 1 }).lean();
    if (docs.length > 0) {
      return docs.map((d: any) => ({
        id: d.id || d._id?.toString(),
        userId: d.userId,
        password: d.password,
        state: d.state,
        district: d.district,
        role: "district_admin",
        status: d.status || "Active",
        lastLogin: d.lastLogin ? new Date(d.lastLogin).toISOString() : undefined,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      }));
    }
  } catch (err) {
    console.error("Database error in getAllDistrictAdmins:", err);
  }

  const fileItems = await readFileStorage();
  if (stateFilter && stateFilter !== "All") {
    return fileItems.filter((f) => f.state.toLowerCase() === stateFilter.toLowerCase());
  }
  return fileItems;
}

/**
 * Validates District Admin login credentials.
 */
export async function verifyDistrictAdminLogin(
  userIdOrEmail: string,
  passwordAttempt: string
): Promise<DistrictAdminItem | null> {
  const cleanInput = userIdOrEmail.trim().toLowerCase();
  const cleanPass = passwordAttempt.trim();

  try {
    await connectToDatabase();
    const adminDoc = await DistrictAdminModel.findOne({
      $or: [
        { userId: cleanInput },
        { userId: cleanInput.replace(/@kalawar(\.org|\.in|\.com)?$/, "") },
        { userId: `admin_${cleanInput.replace(/^admin_/, "")}` },
      ],
      password: cleanPass,
      status: "Active",
    }).lean();

    if (adminDoc) {
      // Update lastLogin asynchronously
      DistrictAdminModel.updateOne({ _id: (adminDoc as any)._id }, { $set: { lastLogin: new Date() } }).catch(
        () => {}
      );

      return {
        id: (adminDoc as any).id || (adminDoc as any)._id?.toString(),
        userId: adminDoc.userId,
        password: adminDoc.password,
        state: adminDoc.state,
        district: adminDoc.district,
        role: "district_admin",
        status: adminDoc.status,
      };
    }
  } catch (err) {
    console.error("Database error verifying district admin login:", err);
  }

  // File fallback check
  const fileItems = await readFileStorage();
  const match = fileItems.find(
    (f) =>
      (f.userId.toLowerCase() === cleanInput ||
        f.userId.toLowerCase() === cleanInput.replace(/@kalawar(\.org|\.in|\.com)?$/, "") ||
        f.userId.toLowerCase() === `admin_${cleanInput.replace(/^admin_/, "")}`) &&
      f.password === cleanPass &&
      f.status === "Active"
  );

  if (match) return match;

  // Auto-provision from official district dataset if matching standard credentials
  const slugInput = cleanInput.replace(/@.*$/, "").replace(/^admin_/, "").replace(/[^a-z0-9]/g, "");
  if (slugInput) {
    for (const [stateName, districtList] of Object.entries(INDIA_STATES_DISTRICTS)) {
      const matchedDistrict = districtList.find((d) => {
        const dSlug = d.toLowerCase().replace(/[^a-z0-9]/g, "");
        return dSlug === slugInput;
      });

      if (matchedDistrict) {
        const generated = await getOrCreateDistrictAdmin(stateName, matchedDistrict);
        if (generated && generated.password === cleanPass && generated.status === "Active") {
          return generated;
        }
      }
    }
  }

  return null;
}
