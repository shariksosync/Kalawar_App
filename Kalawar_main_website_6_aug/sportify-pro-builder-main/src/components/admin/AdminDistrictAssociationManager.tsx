"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Loader2,
  X,
  Save,
  Calendar,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";

interface DistrictAssociationUser {
  id: string;
  name: string;
  username?: string;
  password?: string;
  rawPassword?: string;
  email: string;
  phone: string;
  state: string;
  district?: string;
  city?: string;
  yearFounded?: string;
  dob?: string;
  gender?: string;
  idNumber?: string;
  emergencyContact?: string;
  pincode?: string;
  address?: string;
  presidentName?: string;
  secretaryName?: string;
  status: "Active" | "Pending" | "Incomplete" | "Suspended";
  registeredOn?: string;
  memberType?: string;
}

export function AdminDistrictAssociationManager() {
  const [associations, setAssociations] = useState<DistrictAssociationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<DistrictAssociationUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    state: "",
    district: "",
    yearFounded: "",
    dob: "",
    gender: "Male",
    idNumber: "",
    emergencyContact: "",
    pincode: "",
    address: "",
    presidentName: "",
    secretaryName: "",
    status: "Pending" as "Active" | "Pending" | "Incomplete" | "Suspended",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/district-associations");
      const data = await res.json();
      if (data.success && Array.isArray(data.associations)) {
        setAssociations(data.associations);
      }
    } catch (err) {
      console.error("Failed to load district associations:", err);
      toast.error("Failed to load district associations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssociations = useMemo(() => {
    return associations.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.city && a.city.toLowerCase().includes(q)) ||
        (a.state && a.state.toLowerCase().includes(q));

      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      const matchState = stateFilter === "All" || a.state === stateFilter;

      return matchSearch && matchStatus && matchState;
    });
  }, [associations, searchQuery, statusFilter, stateFilter]);

  // Status metrics
  const counts = useMemo(() => {
    const total = associations.length;
    const active = associations.filter((a) => a.status === "Active").length;
    const pending = associations.filter((a) => a.status === "Pending").length;
    const others = total - active - pending;
    return { total, active, pending, others };
  }, [associations]);

  const handleStatusChange = async (userId: string, newStatus: "Active" | "Pending" | "Incomplete" | "Suspended") => {
    try {
      setIsUpdatingStatus(userId);
      const res = await fetch("/api/district-associations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      setAssociations((prev) =>
        prev.map((a) => (a.id === userId ? { ...a, status: newStatus } : a))
      );

      if (newStatus === "Active") {
        toast.success(`District Association is now Active!`, {
          description: `Full access to Club, Coach, and Player governance pages unlocked.`,
        });
      } else {
        toast.info(`Status updated to ${newStatus}`, {
          description: `Access will remain locked until set to Active.`,
        });
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleOpenEdit = (user: DistrictAssociationUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      state: user.state || "Maharashtra",
      district: user.district || user.city || "",
      yearFounded: user.yearFounded || "",
      dob: user.dob || "",
      gender: user.gender || "Male",
      idNumber: user.idNumber || "",
      emergencyContact: user.emergencyContact || "",
      pincode: user.pincode || "",
      address: user.address || "",
      presidentName: user.presidentName || "",
      secretaryName: user.secretaryName || "",
      status: user.status || "Pending",
      password: user.rawPassword || user.password || "",
    });
    setShowPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        id: editingUser.id,
        name: editFormData.name.trim(),
        username: editFormData.username.trim().toLowerCase(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        state: editFormData.state.trim(),
        district: editFormData.district.trim(),
        city: editFormData.district.trim(),
        yearFounded: editFormData.yearFounded.trim(),
        address: editFormData.address.trim(),
        presidentName: editFormData.presidentName.trim(),
        secretaryName: editFormData.secretaryName.trim(),
        status: editFormData.status,
      };

      // Preserve existing legacy fields if present to guarantee zero data loss
      if (editingUser.dob) payload.dob = editingUser.dob;
      if (editingUser.gender) payload.gender = editingUser.gender;
      if (editingUser.idNumber) payload.idNumber = editingUser.idNumber;
      if (editingUser.emergencyContact) payload.emergencyContact = editingUser.emergencyContact;
      if (editingUser.pincode) payload.pincode = editingUser.pincode;

      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch("/api/district-associations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update district association");
      }

      toast.success("District Association profile updated successfully!");
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      console.error("Save edit error:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete District Association "${name}" (${id})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/district-associations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete district association");
      }

      toast.success(`District Association "${name}" deleted.`);
      await loadData();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete district association");
    }
  };

  const availableDistrictsForEdit = useMemo(() => {
    return getDistrictsByState(editFormData.state || "Maharashtra");
  }, [editFormData.state]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">District Association Directory</h2>
              <p className="text-xs text-stone-400">
                Manage registered district association administrative accounts and grant governance privileges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-2xl bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Total Accounts</p>
              <p className="text-lg font-black text-white">{counts.total}</p>
            </div>
            <Building2 className="size-5 text-stone-500" />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Active (Full Access)</p>
              <p className="text-lg font-black text-emerald-400">{counts.active}</p>
            </div>
            <CheckCircle2 className="size-5 text-emerald-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Pending Review</p>
              <p className="text-lg font-black text-amber-400">{counts.pending}</p>
            </div>
            <Clock className="size-5 text-amber-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Locked / Suspended</p>
              <p className="text-lg font-black text-rose-400">{counts.others}</p>
            </div>
            <Ban className="size-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, district, state, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-stone-400" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List View Table */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-900/90 text-stone-300 font-bold uppercase tracking-wider text-[11px] border-b border-stone-800">
              <tr>
                <th className="py-3.5 px-4">District Representative</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">District Unit</th>
                <th className="py-3.5 px-4">State Unit</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Status &amp; Access Control</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-6 animate-spin text-amber-400" />
                      <span className="text-xs text-stone-400">Loading district associations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAssociations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="size-8 text-stone-600" />
                      <p className="font-semibold text-sm text-stone-300">No District Associations Found</p>
                      <p className="text-xs text-stone-500 max-w-sm">
                        {searchQuery || statusFilter !== "All" || stateFilter !== "All"
                          ? "No district association accounts match your filter criteria."
                          : "No district association accounts have registered yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssociations.map((assoc) => {
                  const isUpdating = isUpdatingStatus === assoc.id;

                  return (
                    <tr key={assoc.id} className="hover:bg-stone-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center font-bold text-amber-400 shrink-0">
                            <UserCheck className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs">{assoc.name}</p>
                            <p className="text-[10px] text-stone-400">District Administrator</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {assoc.id}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <MapPin className="size-3 text-amber-400 shrink-0" />
                          <span>{assoc.district || assoc.city || "Designated District"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-stone-300">{assoc.state || "National Unit"}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-300">
                        <div>
                          <p className="text-xs font-medium text-white">{assoc.phone || "—"}</p>
                          <p className="text-[10px] text-stone-400">{assoc.email || "—"}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={assoc.status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(
                                assoc.id,
                                e.target.value as "Active" | "Pending" | "Incomplete" | "Suspended"
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              assoc.status === "Active"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                : assoc.status === "Pending"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                : assoc.status === "Incomplete"
                                ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                                : "bg-rose-500/15 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            <option value="Active">Active (Unlocked)</option>
                            <option value="Pending">Pending (Locked)</option>
                            <option value="Incomplete">Incomplete (Locked)</option>
                            <option value="Suspended">Suspended (Locked)</option>
                          </select>
                          {isUpdating && <Loader2 className="size-3.5 animate-spin text-amber-400" />}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(assoc)}
                            className="p-1.5 rounded-lg bg-stone-950 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
                            title="Edit User Details"
                          >
                            <Edit2 className="size-3.5" />
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDelete(assoc.id, assoc.name)}
                            className="p-1.5 rounded-lg bg-stone-950 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-800 transition cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT DISTRICT ASSOCIATION MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-6 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Edit District Association</h3>
                  <p className="text-xs font-mono text-amber-400">{editingUser.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">District Association Name *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="e.g. district123"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">State Association *</label>
                  <select
                    value={editFormData.state}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      const dists = getDistrictsByState(nextState);
                      setEditFormData({
                        ...editFormData,
                        state: nextState,
                        district: dists[0] || "",
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">Select District *</label>
                  <select
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">Select District</option>
                    {availableDistrictsForEdit.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Year Founded</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder=""
                    value={editFormData.yearFounded}
                    onChange={(e) => setEditFormData({ ...editFormData, yearFounded: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">President Name (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.presidentName}
                    onChange={(e) => setEditFormData({ ...editFormData, presidentName: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-300 mb-1">Secretary Name (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.secretaryName}
                    onChange={(e) => setEditFormData({ ...editFormData, secretaryName: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Full Residential Address</label>
                <textarea
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Account Status *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as "Active" | "Pending" | "Incomplete" | "Suspended",
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Active">Active (Full Governance Access)</option>
                  <option value="Pending">Pending (Verification Required)</option>
                  <option value="Incomplete">Incomplete (Locked)</option>
                  <option value="Suspended">Suspended (Locked)</option>
                </select>
              </div>

              {/* Password */}
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
                <label className="block font-bold text-stone-300">Account Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password or view current"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gold-gradient text-stone-950 font-black text-xs shadow-gold hover:opacity-95 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
