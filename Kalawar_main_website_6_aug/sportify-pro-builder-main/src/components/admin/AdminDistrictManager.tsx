"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Lock,
  Building2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import type { DistrictAdminItem } from "@/lib/district-admin-store";

export function AdminDistrictManager() {
  const [selectedState, setSelectedState] = useState<string>(states[0] || "Uttar Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [currentAdmin, setCurrentAdmin] = useState<DistrictAdminItem | null>(null);
  const [allAdmins, setAllAdmins] = useState<DistrictAdminItem[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Edit Password States
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Copy Feedback States
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Search & Filter for Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryStateFilter, setDirectoryStateFilter] = useState("All");

  const districtsForSelectedState = useMemo(() => {
    return getDistrictsByState(selectedState);
  }, [selectedState]);

  // Set default district when state changes
  useEffect(() => {
    if (districtsForSelectedState.length > 0) {
      // If current district not in list, pick first or Varanasi if UP
      if (!districtsForSelectedState.includes(selectedDistrict)) {
        if (selectedState === "Uttar Pradesh" && districtsForSelectedState.includes("Varanasi")) {
          setSelectedDistrict("Varanasi");
        } else {
          setSelectedDistrict(districtsForSelectedState[0]);
        }
      }
    } else {
      setSelectedDistrict("");
    }
  }, [selectedState, districtsForSelectedState]);

  // Fetch or generate credentials for the selected state and district
  useEffect(() => {
    if (!selectedState || !selectedDistrict) return;

    let isMounted = true;
    async function loadDistrictAdmin() {
      setIsLoadingCredentials(true);
      try {
        const res = await fetch(
          `/api/admin/districts?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`
        );
        const data = await res.json();
        if (isMounted && data.success && data.admin) {
          setCurrentAdmin(data.admin);
          setNewPassword(data.admin.password);
          setIsEditingPassword(false);
        }
      } catch (err) {
        console.error("Failed to load district admin:", err);
      } finally {
        if (isMounted) setIsLoadingCredentials(false);
      }
    }

    loadDistrictAdmin();

    return () => {
      isMounted = false;
    };
  }, [selectedState, selectedDistrict]);

  // Load all generated district admins for directory
  const loadDirectory = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/admin/districts");
      const data = await res.json();
      if (data.success && Array.isArray(data.admins)) {
        setAllAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to load district admins directory:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  const handleCopy = (text: string, fieldKey: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyFullCredentials = () => {
    if (!currentAdmin) return;
    const credText = `🥋 KALAWAR SPORTS FEDERATION — DISTRICT SECRETARIAT ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 State: ${currentAdmin.state}
🏛️ District: ${currentAdmin.district}
🌐 Login URL: ${typeof window !== "undefined" ? window.location.origin : ""}/admin/login
👤 User ID: ${currentAdmin.userId}
🔑 Password: ${currentAdmin.password}
🛡️ Scope: Club Affiliation Module Only (Scoped exclusively to ${currentAdmin.district})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    handleCopy(credText, "full", "Full Credentials Summary");
  };

  const handleSavePassword = async () => {
    if (!currentAdmin || !newPassword.trim()) return;
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/admin/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentAdmin.userId,
          password: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.admin) {
        setCurrentAdmin(data.admin);
        setIsEditingPassword(false);
        toast.success("District Password Updated!", {
          description: `Permanent password for ${currentAdmin.district} updated successfully.`,
        });
        await loadDirectory();
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const filteredDirectory = useMemo(() => {
    return allAdmins.filter((adm) => {
      if (directoryStateFilter !== "All" && adm.state.toLowerCase() !== directoryStateFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          adm.district.toLowerCase().includes(q) ||
          adm.state.toLowerCase().includes(q) ||
          adm.userId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allAdmins, directoryStateFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-gold-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>District Security &amp; Access Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>District Administration Hub</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            Generate and manage permanent credentials for District Administrators. District Admins receive isolated login access restricted exclusively to the <strong>Club Affiliation</strong> module for their specific district.
          </p>
        </div>

        <button
          onClick={loadDirectory}
          disabled={isLoadingList}
          className="relative z-10 self-start md:self-auto px-4 py-2.5 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Main Grid: Selector & Credentials Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: State & District Selector Form */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Select Administrative Territory
              </h3>
            </div>

            {/* State Association Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300">
                State / Union Territory *
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-700 hover:border-amber-400/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
              >
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-stone-500 block">
                {districtsForSelectedState.length} constituent districts available
              </span>
            </div>

            {/* District Dropdown (Cascading) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300">
                District Name *
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-700 hover:border-amber-400/60 text-amber-300 font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
              >
                {districtsForSelectedState.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 text-[11px] text-stone-400 space-y-1 mt-4">
            <p className="font-semibold text-stone-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permanent Database Storage</span>
            </p>
            <p>
              Credentials allocated to <strong>{selectedDistrict || "the selected district"}</strong> are permanent in MongoDB and will remain active across restarts.
            </p>
          </div>
        </div>

        {/* Right Column: Generated Credentials Display Card */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900/95 to-amber-950/20 border border-amber-500/40 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Permanent District Admin Credentials
              </h3>
            </div>
            {currentAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {currentAdmin.status}
              </span>
            )}
          </div>

          {isLoadingCredentials ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Synchronizing credentials for {selectedDistrict}...</p>
            </div>
          ) : currentAdmin ? (
            <div className="space-y-4">
              {/* Territory Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{currentAdmin.district} District</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs">
                  {currentAdmin.state}
                </span>
                <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Club Affiliation Scope</span>
                </span>
              </div>

              {/* User ID Box */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    District Admin User ID
                  </label>
                  <button
                    onClick={() => handleCopy(currentAdmin.userId, "userId", "User ID")}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "userId" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy User ID</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wide select-all break-all">
                  {currentAdmin.userId}
                </div>
              </div>

              {/* Password Box */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Security Password
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-bold text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(currentAdmin.password, "password", "Password")}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedField === "password" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isEditingPassword ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new permanent password..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-400/60 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                    <button
                      onClick={handleSavePassword}
                      disabled={isSavingPassword || !newPassword.trim()}
                      className="px-4 py-2 rounded-xl bg-gold-gradient text-stone-950 font-extrabold text-xs shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingPassword ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPassword(false);
                        setNewPassword(currentAdmin.password);
                      }}
                      className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="font-mono text-base sm:text-lg font-black text-white tracking-wider select-all">
                      {showPassword ? currentAdmin.password : "••••••••••••"}
                    </div>
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCopyFullCredentials}
                  className="flex-1 bg-gold-gradient text-stone-950 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-gold hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedField === "full" ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Full Credentials!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Credentials Card</span>
                    </>
                  )}
                </button>
                <a
                  href="/admin/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Admin Login</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Directory Table of All Created District Admins */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Allocated District Administrators Directory</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Overview of all generated district accounts and credentials stored in the national database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400/60 w-44 sm:w-56"
              />
            </div>
            <select
              value={directoryStateFilter}
              onChange={(e) => setDirectoryStateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-amber-400/60 cursor-pointer"
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

        {/* Directory List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Territory</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Role / Scope</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredDirectory.length > 0 ? (
                filteredDirectory.map((adm) => (
                  <tr key={adm.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{adm.district}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 block ml-5">{adm.state}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-300">
                      {adm.userId}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-stone-300">
                      {adm.password}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        Club Affiliation Only
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedState(adm.state);
                            setSelectedDistrict(adm.district);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Select &amp; Edit
                        </button>
                        <button
                          onClick={() => {
                            handleCopy(
                              `User ID: ${adm.userId} | Password: ${adm.password} | District: ${adm.district}, ${adm.state}`,
                              adm.id,
                              `${adm.district} Credentials`
                            );
                          }}
                          className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 transition-colors cursor-pointer"
                          title="Copy Credentials"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500 italic">
                    No district admin records matching filter. Select a territory above to allocate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
