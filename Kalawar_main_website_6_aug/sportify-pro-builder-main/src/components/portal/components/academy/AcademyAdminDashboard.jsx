import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Trophy,
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Send,
  Award,
  ChevronRight,
  Shield,
  Activity,
  Layers
} from "lucide-react";

export default function AcademyAdminDashboard() {
  const { academies, currentUser, showToast, setView } = useApp();

  // Find partner's academy or default to the first one
  const initialAcademyId = currentUser.academyId || (academies[0] && academies[0].id) || "acad-001";
  const [selectedAcademyId, setSelectedAcademyId] = useState(initialAcademyId);
  const [activeTab, setActiveTab] = useState("overview");

  const currentAcademy = academies.find((a) => a.id === selectedAcademyId) || academies[0];

  // Local state for dashboard sub-entities
  const [batchesList, setBatchesList] = useState(
    currentAcademy?.batches || [
      { name: "Morning Champions", time: "06:00 AM - 07:30 AM", days: "Mon, Wed, Fri", coach: "Head Coach", enrolled: 28, capacity: 30 },
      { name: "Cadet Black Belt Squad", time: "05:00 PM - 06:30 PM", days: "Tue, Thu, Sat", coach: "Coach Arjun", enrolled: 24, capacity: 25 },
      { name: "Weekend Masters Camp", time: "08:00 AM - 10:30 AM", days: "Sat, Sun", coach: "Master Rajesh", enrolled: 35, capacity: 40 }
    ]
  );

  const [athletes, setAthletes] = useState([
    { id: "ath-01", name: "Devansh Nair", age: 14, rank: "Red Belt (1st Gup)", batch: "Cadet Black Belt Squad", attendance: "Present", feeStatus: "Paid", phone: "+91 98201 11223", guardian: "Rajan Nair" },
    { id: "ath-02", name: "Ananya Iyer", age: 12, rank: "Blue Belt", batch: "Morning Champions", attendance: "Present", feeStatus: "Paid", phone: "+91 98202 22334", guardian: "Lakshmi Iyer" },
    { id: "ath-03", name: "Kabir Sengupta", age: 16, rank: "Black Belt 1st Dan", batch: "Cadet Black Belt Squad", attendance: "Excused", feeStatus: "Due", phone: "+91 98203 33445", guardian: "Amit Sengupta" },
    { id: "ath-04", name: "Zoya Merchant", age: 10, rank: "Yellow Belt", batch: "Morning Champions", attendance: "Present", feeStatus: "Paid", phone: "+91 98204 44556", guardian: "Farhan Merchant" },
    { id: "ath-05", name: "Aryan Deshmukh", age: 17, rank: "Senior Pro Squad", batch: "Weekend Masters Camp", attendance: "Late", feeStatus: "Due", phone: "+91 98205 55667", guardian: "Sunil Deshmukh" },
    { id: "ath-06", name: "Meera Kulkarni", age: 13, rank: "Green Belt", batch: "Morning Champions", attendance: "Present", feeStatus: "Paid", phone: "+91 98206 66778", guardian: "Radhika Kulkarni" }
  ]);

  const [coaches, setCoaches] = useState([
    { id: "c-01", name: currentAcademy?.director || "Master Rajesh Sharma", role: "Director & Grandmaster", cert: "8th Dan Kukkiwon Certified", exp: "24 Years", batches: 3, phone: "+91 98220 12345", salary: "₹85,000/mo", status: "Active" },
    { id: "c-02", name: "Arjun Verma", role: "Senior Sparring Coach", cert: "2nd Dan Black Belt / National Gold", exp: "7 Years", batches: 2, phone: "+91 98221 23456", salary: "₹45,000/mo", status: "Active" },
    { id: "c-03", name: "Pooja Hegde", role: "Conditioning & Agility Trainer", cert: "CSCS / Sports Physio Diploma", exp: "5 Years", batches: 2, phone: "+91 98222 34567", salary: "₹38,000/mo", status: "Active" }
  ]);

  const [financeRecords, setFinanceRecords] = useState([
    { id: "INV-9901", athlete: "Devansh Nair", batch: "Cadet Black Belt Squad", amount: 2500, date: "2026-10-20", mode: "UPI (GooglePay)", status: "Completed" },
    { id: "INV-9902", athlete: "Ananya Iyer", batch: "Morning Champions", amount: 2500, date: "2026-10-19", mode: "Card (HDFC)", status: "Completed" },
    { id: "INV-9903", athlete: "Zoya Merchant", batch: "Morning Champions", amount: 2500, date: "2026-10-18", mode: "Cash Receipt", status: "Completed" },
    { id: "INV-9904", athlete: "Meera Kulkarni", batch: "Morning Champions", amount: 2500, date: "2026-10-17", mode: "UPI (Paytm)", status: "Completed" }
  ]);

  // Modal forms state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: "", time: "", days: "Mon, Wed, Fri", coach: "", capacity: 25 });

  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: "", age: 14, rank: "White Belt", batch: "Morning Champions", phone: "", guardian: "" });

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [newFee, setNewFee] = useState({ athlete: "", amount: 2500, mode: "UPI (GooglePay)" });

  // Filters
  const [athleteSearch, setAthleteSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");

  // Handlers
  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.time) {
      showToast("Please fill in batch title and timings.", "error");
      return;
    }
    const created = {
      ...newBatch,
      enrolled: 0,
      capacity: parseInt(newBatch.capacity || "25", 10),
      coach: newBatch.coach || currentAcademy.director
    };
    setBatchesList([...batchesList, created]);
    setShowBatchModal(false);
    setNewBatch({ name: "", time: "", days: "Mon, Wed, Fri", coach: "", capacity: 25 });
    showToast(`Batch '${created.name}' successfully scheduled!`, "success");
  };

  const handleAddAthlete = (e) => {
    e.preventDefault();
    if (!newAthlete.name || !newAthlete.phone) {
      showToast("Please provide athlete name and contact phone.", "error");
      return;
    }
    const created = {
      id: `ath-${Date.now()}`,
      ...newAthlete,
      age: parseInt(newAthlete.age || "12", 10),
      attendance: "Present",
      feeStatus: "Paid"
    };
    setAthletes([created, ...athletes]);
    setShowAthleteModal(false);
    setNewAthlete({ name: "", age: 14, rank: "White Belt", batch: "Morning Champions", phone: "", guardian: "" });
    showToast(`Athlete ${created.name} successfully enrolled!`, "success");
  };

  const handleRecordFee = (e) => {
    e.preventDefault();
    if (!newFee.athlete) {
      showToast("Please choose an athlete.", "error");
      return;
    }
    const created = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      athlete: newFee.athlete,
      batch: "Cadet Squad",
      amount: parseInt(newFee.amount || "2500", 10),
      date: new Date().toISOString().split("T")[0],
      mode: newFee.mode,
      status: "Completed"
    };
    setFinanceRecords([created, ...financeRecords]);
    // update athlete status if was due
    setAthletes(athletes.map(a => a.name === newFee.athlete ? { ...a, feeStatus: "Paid" } : a));
    setShowFeeModal(false);
    showToast(`Payment of ₹${created.amount} recorded for ${created.athlete}!`, "success");
  };

  const handleSendReminder = (athleteName, phone) => {
    showToast(`WhatsApp reminder sent to ${athleteName} (${phone}) for outstanding dues.`, "info");
  };

  const handleToggleAttendance = (athleteId) => {
    setAthletes(athletes.map(a => {
      if (a.id === athleteId) {
        const next = a.attendance === "Present" ? "Late" : a.attendance === "Late" ? "Excused" : "Present";
        return { ...a, attendance: next };
      }
      return a;
    }));
    showToast("Attendance status updated.", "info");
  };

  // Calculations
  const totalEnrolled = athletes.length;
  const totalDueAthletes = athletes.filter(a => a.feeStatus === "Due");
  const monthlyRevenueTotal = financeRecords.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(athleteSearch.toLowerCase()) ||
                          a.guardian.toLowerCase().includes(athleteSearch.toLowerCase());
    const matchesBatch = batchFilter === "All" || a.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Academy Switcher */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-obsidian-900 via-obsidian-800 to-obsidian-900 border border-gold-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-lg shadow-gold-500/10 flex-shrink-0">
              <img
                src={currentAcademy?.image}
                alt={currentAcademy?.name}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Academy Partner Admin
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Federation Certified
                </span>
                <span className="text-xs text-gray-400">Sport: <span className="text-white font-medium">{currentAcademy?.sport}</span></span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
                {currentAcademy?.name}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Director: <span className="text-gold-300 font-medium">{currentAcademy?.director}</span> • {currentAcademy?.city}
              </p>
            </div>
          </div>

          {/* Quick Academy Switcher for Demo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-obsidian-950/70 border border-white/10 rounded-xl px-3 py-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                Switch Academy Branch
              </label>
              <select
                value={selectedAcademyId}
                onChange={(e) => setSelectedAcademyId(e.target.value)}
                className="bg-transparent text-sm text-gold-400 font-medium focus:outline-none cursor-pointer"
              >
                {academies.map((ac) => (
                  <option key={ac.id} value={ac.id} className="bg-obsidian-900 text-white">
                    {ac.name} ({ac.city})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setView("academy")}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Public Directory <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/5 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Executive Overview", icon: Activity },
            { id: "batches", label: `Batches & Schedules (${batchesList.length})`, icon: Calendar },
            { id: "athletes", label: `Athletes Roster (${athletes.length})`, icon: Users },
            { id: "coaches", label: `Coaching Staff (${coaches.length})`, icon: Award },
            { id: "finance", label: "Fee Collections & Dues", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-lg shadow-gold-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-obsidian-950" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Athletes</span>
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{totalEnrolled}</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> +14% enrollment this quarter
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Batches</span>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{batchesList.length}</div>
              <p className="text-xs text-blue-400 font-medium">
                87% Avg Batch Capacity Occupancy
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Coaches On Duty</span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{coaches.length}</div>
              <p className="text-xs text-purple-400 font-medium">
                Master Trainers & Kukkiwon Dan Holders
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Monthly Pipeline</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">
                ₹{(monthlyRevenueTotal + 22500).toLocaleString()}
              </div>
              <p className="text-xs text-amber-400 font-medium">
                {totalDueAthletes.length} athlete dues pending (₹{(totalDueAthletes.length * 2500).toLocaleString()})
              </p>
            </div>
          </div>

          {/* Batch Occupancy Breakdown & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Batch Occupancy Bars */}
            <div className="lg:col-span-2 bg-obsidian-900/60 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Batch Capacity & Enrollment</h3>
                  <p className="text-xs text-gray-400">Real-time occupancy per scheduled training session</p>
                </div>
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-gold-500 text-obsidian-950 text-xs font-bold hover:bg-gold-400 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New Batch
                </button>
              </div>

              <div className="space-y-5">
                {batchesList.map((b, idx) => {
                  const pct = Math.min(100, Math.round((b.enrolled / b.capacity) * 100));
                  return (
                    <div key={idx} className="bg-obsidian-950/50 border border-white/5 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-sm font-semibold text-white">{b.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({b.days} • {b.time})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gold-400">
                            {b.enrolled} / {b.capacity} athletes
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-300 font-medium">
                            {pct}% Full
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct >= 90
                              ? "bg-gradient-to-r from-red-500 to-amber-500"
                              : pct >= 70
                              ? "bg-gradient-to-r from-gold-500 to-emerald-500"
                              : "bg-gold-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                        <span>Coach: <span className="text-gray-200">{b.coach}</span></span>
                        <span>{b.capacity - b.enrolled} seats remaining</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Partner Operations</h3>
                <p className="text-xs text-gray-400 mb-6">Frequently used day-to-day federation actions</p>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowAthleteModal(true)}
                    className="w-full p-3.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-gold-400" /> Enroll New Athlete
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowFeeModal(true)}
                    className="w-full p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Record Fee Collection
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      totalDueAthletes.forEach(a => handleSendReminder(a.name, a.phone));
                      showToast(`Bulk payment alerts queued for ${totalDueAthletes.length} students!`, "success");
                    }}
                    className="w-full p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-amber-400" /> Send Reminders to All Dues ({totalDueAthletes.length})
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="bg-obsidian-950/80 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-gold-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Kalawar National Cup 2026</h4>
                    <p className="text-[11px] text-gray-400">Academy nominations open until Nov 15th.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCHES & SCHEDULES */}
      {activeTab === "batches" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Training Batches & Schedule Matrix</h2>
              <p className="text-xs text-gray-400">Configure timings, coach assignments, and maximum athlete caps</p>
            </div>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 text-xs font-bold transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batchesList.map((batch, index) => (
              <div key={index} className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-6 hover:border-gold-500/40 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
                        {batch.days}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 group-hover:text-gold-300 transition-colors">
                        {batch.name}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-300">
                      <Clock className="w-5 h-5 text-gold-400" />
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-gray-300 mb-6">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400">Timings:</span>
                      <span className="font-medium text-white">{batch.time}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400">Assigned Coach:</span>
                      <span className="font-medium text-gold-300">{batch.coach}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400">Enrolled:</span>
                      <span className="font-medium text-white">{batch.enrolled} / {batch.capacity} Athletes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                  </span>
                  <button
                    onClick={() => {
                      setBatchFilter(batch.name);
                      setActiveTab("athletes");
                    }}
                    className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1"
                  >
                    View Roster <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATHLETES ROSTER */}
      {activeTab === "athletes" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Athletes Roster & Daily Attendance</h2>
              <p className="text-xs text-gray-400">Track belt grading, active attendance, guardian contacts, and fee status</p>
            </div>
            <button
              onClick={() => setShowAthleteModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 text-xs font-bold hover:from-gold-400 transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Enroll New Athlete
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-obsidian-900/60 border border-white/10 rounded-2xl p-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search athlete by name or guardian..."
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-obsidian-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-obsidian-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
              >
                <option value="All">All Batches</option>
                {batchesList.map((b, i) => (
                  <option key={i} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Athletes Table */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-obsidian-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Athlete Name</th>
                    <th className="py-3.5 px-4 font-semibold">Rank / Belt</th>
                    <th className="py-3.5 px-4 font-semibold">Assigned Batch</th>
                    <th className="py-3.5 px-4 font-semibold">Daily Attendance</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Fee</th>
                    <th className="py-3.5 px-4 font-semibold">Guardian & Contact</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAthletes.map((ath) => (
                    <tr key={ath.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-500/10 text-gold-400 flex items-center justify-center font-bold text-xs">
                            {ath.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{ath.name}</span>
                            <span className="text-[11px] text-gray-400">{ath.age} yrs old</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gold-300 text-[11px] font-medium">
                          {ath.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-medium">
                        {ath.batch}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAttendance(ath.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            ath.attendance === "Present"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : ath.attendance === "Late"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                          title="Click to toggle status (Present / Late / Excused)"
                        >
                          {ath.attendance}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ath.feeStatus === "Paid"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}>
                          {ath.feeStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white block font-medium">{ath.guardian}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {ath.phone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ath.feeStatus === "Due" ? (
                          <button
                            onClick={() => handleSendReminder(ath.name, ath.phone)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Remind
                          </button>
                        ) : (
                          <button
                            onClick={() => showToast(`Profile opened for ${ath.name}.`, "info")}
                            className="text-gray-400 hover:text-gold-400 text-xs font-medium"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COACHING STAFF */}
      {activeTab === "coaches" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Coaching Faculty & Certified Trainers</h2>
              <p className="text-xs text-gray-400">Certified Dan holders, sports physiologists, and program leaders</p>
            </div>
            <button
              onClick={() => showToast("Coach onboarding form opened.", "info")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 text-xs font-bold hover:from-gold-400 transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Coach Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coaches.map((c) => (
              <div key={c.id} className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-6 hover:border-gold-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 flex-shrink-0">
                      <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center text-gold-400 font-bold text-lg">
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-gold-400 font-medium">{c.role}</p>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Exp: {c.exp}</span>
                    </div>
                  </div>

                  <div className="bg-obsidian-950/50 rounded-xl p-3 border border-white/5 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Certification:</span>
                      <span className="text-white font-medium text-right text-[11px]">{c.cert}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Assigned Batches:</span>
                      <span className="text-gold-300 font-medium">{c.batches} Batches</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Monthly Payout:</span>
                      <span className="text-emerald-400 font-semibold">{c.salary}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gold-400" /> {c.phone}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FEE COLLECTIONS & DUES */}
      {activeTab === "finance" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Fee Collections Ledger & Dues Management</h2>
              <p className="text-xs text-gray-400">Real-time receipts, overdue follow-ups, and automated reminder broadcasts</p>
            </div>
            <button
              onClick={() => setShowFeeModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold hover:from-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Record Manual Payment
            </button>
          </div>

          {/* Dues Alert Banner */}
          {totalDueAthletes.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    {totalDueAthletes.length} Athletes have Outstanding Dues for this cycle
                  </h4>
                  <p className="text-xs text-amber-200/80">
                    Total pending collection: ₹{(totalDueAthletes.length * 2500).toLocaleString()}. Send direct payment notifications.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  totalDueAthletes.forEach(a => handleSendReminder(a.name, a.phone));
                  showToast(`WhatsApp reminders dispatched to all ${totalDueAthletes.length} candidates!`, "success");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch All Payment Links
              </button>
            </div>
          )}

          {/* Recent Ledger Table */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Recent Payment Transactions</h3>
              <span className="text-xs text-gray-400">Total Collected: <strong className="text-emerald-400">₹{monthlyRevenueTotal.toLocaleString()}</strong></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-obsidian-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Receipt #</th>
                    <th className="py-3.5 px-4 font-semibold">Athlete Name</th>
                    <th className="py-3.5 px-4 font-semibold">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Payment Mode</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {financeRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-gold-400">{rec.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{rec.athlete}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">₹{rec.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300">{rec.mode}</td>
                      <td className="py-3 px-4 text-gray-400">{rec.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BATCH */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-obsidian-900 border border-gold-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Create Training Batch</h3>
            <p className="text-xs text-gray-400 mb-4">Set title, days, and time slot for training</p>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior High Performance Squad"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Timings *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM - 06:30 PM"
                    value={newBatch.time}
                    onChange={(e) => setNewBatch({ ...newBatch, time: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Days Schedule</label>
                  <input
                    type="text"
                    value={newBatch.days}
                    onChange={(e) => setNewBatch({ ...newBatch, days: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Assigned Coach</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Rajesh"
                    value={newBatch.coach}
                    onChange={(e) => setNewBatch({ ...newBatch, coach: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newBatch.capacity}
                    onChange={(e) => setNewBatch({ ...newBatch, capacity: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-bold transition-all"
                >
                  Schedule Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL ATHLETE */}
      {showAthleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-obsidian-900 border border-gold-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Enroll New Athlete</h3>
            <p className="text-xs text-gray-400 mb-4">Add athlete profile and allocate batch</p>
            <form onSubmit={handleAddAthlete} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Athlete Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siddharth Rao"
                  value={newAthlete.name}
                  onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Age</label>
                  <input
                    type="number"
                    value={newAthlete.age}
                    onChange={(e) => setNewAthlete({ ...newAthlete, age: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Rank / Belt</label>
                  <input
                    type="text"
                    value={newAthlete.rank}
                    onChange={(e) => setNewAthlete({ ...newAthlete, rank: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-300 block mb-1">Select Batch</label>
                <select
                  value={newAthlete.batch}
                  onChange={(e) => setNewAthlete({ ...newAthlete, batch: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {batchesList.map((b, i) => (
                    <option key={i} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Parent / Guardian</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Rao"
                    value={newAthlete.guardian}
                    onChange={(e) => setNewAthlete({ ...newAthlete, guardian: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newAthlete.phone}
                    onChange={(e) => setNewAthlete({ ...newAthlete, phone: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAthleteModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-bold transition-all"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FEE */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-obsidian-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Record Fee Collection</h3>
            <p className="text-xs text-gray-400 mb-4">Generate instant invoice and mark athlete account paid</p>
            <form onSubmit={handleRecordFee} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Select Athlete *</label>
                <select
                  required
                  value={newFee.athlete}
                  onChange={(e) => setNewFee({ ...newFee, athlete: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose Athlete --</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.feeStatus === "Due" ? "⚠️ DUE" : "PAID"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Payment Mode</label>
                  <select
                    value={newFee.mode}
                    onChange={(e) => setNewFee({ ...newFee, mode: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="UPI (GooglePay)">UPI (GooglePay)</option>
                    <option value="UPI (PhonePe)">UPI (PhonePe)</option>
                    <option value="Cash Receipt">Cash Receipt</option>
                    <option value="Card (POS)">Card (POS)</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all"
                >
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
