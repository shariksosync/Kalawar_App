"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Landmark,
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

interface StateAssociationUser {
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

export function AdminStateAssociationManager() {
  const [associations, setAssociations] = useState<StateAssociationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<StateAssociationUser | null>(null);
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
      const res = await fetch("/api/state-associations");
      const data = await res.json();
      if (data.success && Array.isArray(data.associations)) {
        setAssociations(data.associations);
      }
    } catch (err) {
      console.error("Failed to load state associations:", err);
      toast.error("Failed to load state associations.");
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
      const res = await fetch("/api/state-associations", {
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
        toast.success(`State Association is now Active!`, {
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

  const handleOpenEdit = (user: StateAssociationUser) => {
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

      const res = await fetch("/api/state-associations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save state association");
      }

      toast.success("State Association updated successfully!");
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: StateAssociationUser) => {
    if (!confirm(`Are you sure you want to permanently delete State Association "${user.name}" (${user.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/state-associations?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete state association");
      }

      toast.success(`State Association ${user.name} removed.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Incomplete":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Suspended":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-stone-800 text-stone-300 border-stone-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">State Association Module</h2>
            <p className="text-xs text-stone-400">
              Manage State Association accounts, verify registrations, and control governance access.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-2xl text-xs font-bold text-stone-200 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Associations</span>
          <span className="text-2xl font-black text-white mt-1 block">{counts.total}</span>
        </div>
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Active (Verified)</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{counts.active}</span>
        </div>
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Pending Approval</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{counts.pending}</span>
        </div>
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Incomplete / Suspended</span>
          <span className="text-2xl font-black text-stone-300 mt-1 block">{counts.others}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search association name, ID, email, state..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-stone-500 focus:border-amber-400 outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending (New)</option>
            <option value="Active">Active</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
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

      {/* Table List View */}
      <div className="bg-stone-900/40 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-semibold">Loading State Associations...</span>
          </div>
        ) : filteredAssociations.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="p-3 bg-stone-800/80 rounded-2xl text-stone-500">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">No State Associations Found</h3>
            <p className="text-xs text-stone-400 max-w-md">
              No registered state associations match the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-4">Association ID &amp; Name</th>
                  <th className="py-4 px-4">State Association Unit</th>
                  <th className="py-4 px-4">Contact Info</th>
                  <th className="py-4 px-4">Registered Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {filteredAssociations.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-bold text-white text-sm">{assoc.name}</div>
                        <div className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">{assoc.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-200">{assoc.state}</div>
                      <div className="text-[11px] text-stone-400">{assoc.district || assoc.city || "Headquarters"}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-stone-300 font-semibold">{assoc.email || "No email"}</div>
                      <div className="text-stone-400 text-[11px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>{assoc.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-400 font-mono text-[11px]">
                      {assoc.registeredOn || "2026"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={assoc.status}
                          disabled={isUpdatingStatus === assoc.id}
                          onChange={(e) =>
                            handleStatusChange(
                              assoc.id,
                              e.target.value as "Active" | "Pending" | "Incomplete" | "Suspended"
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border outline-none cursor-pointer bg-stone-950 transition ${getStatusBadge(
                            assoc.status
                          )}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Incomplete">Incomplete</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                        {isUpdatingStatus === assoc.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(assoc)}
                          className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 transition"
                          title="Edit Association Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(assoc)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          title="Delete State Association"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Edit State Association</h3>
                  <p className="text-xs text-stone-400 font-mono">ID: {editingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    State Association Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. state123"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Select State *
                  </label>
                  <select
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Year Founded
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder=""
                    value={editFormData.yearFounded}
                    onChange={(e) => setEditFormData({ ...editFormData, yearFounded: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Governance Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as "Active" | "Pending" | "Incomplete" | "Suspended",
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  >
                    <option value="Active">Active (Full Access)</option>
                    <option value="Pending">Pending (Under Verification)</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    President Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={editFormData.presidentName}
                    onChange={(e) => setEditFormData({ ...editFormData, presidentName: e.target.value })}
                    placeholder=""
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Secretary Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={editFormData.secretaryName}
                    onChange={(e) => setEditFormData({ ...editFormData, secretaryName: e.target.value })}
                    placeholder=""
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Full Residential Address
                </label>
                <textarea
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none resize-none"
                />
              </div>

                <div>
                  <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password or view current"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:border-amber-400 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save State Association</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
