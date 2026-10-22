import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  Plus,
  ArrowLeft,
  DollarSign,
  Download,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Modal from "../common/Modal";

const INITIAL_MEMBERS = [
  { id: "MBR-101", name: "Rahul Deshmukh", plan: "Annual Platinum", joined: "2025-08-14", status: "Active", phone: "+91 98221 44001", expiry: "2026-08-14", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-102", name: "Sneha Kulkarni", plan: "Monthly Gold", joined: "2026-09-01", status: "Active", phone: "+91 98222 55112", expiry: "2026-11-01", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-103", name: "Aditya Nair", plan: "Quarterly Pro", joined: "2026-06-12", status: "Expiring Soon", phone: "+91 98230 66223", expiry: "2026-10-28", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-104", name: "Pooja Hegde", plan: "Annual VIP Pass", joined: "2025-11-20", status: "Active", phone: "+91 98240 77334", expiry: "2026-11-20", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-105", name: "Tanmay Bhatia", plan: "Monthly Gold", joined: "2026-08-10", status: "Expired", phone: "+91 98250 88445", expiry: "2026-09-10", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" }
];

const INITIAL_EMPLOYEES = [
  { id: "EMP-01", name: "Devendra Rathore", role: "Head Strength Coach", shift: "Morning (06:00 - 14:00)", salary: "₹65,000", status: "Active", cert: "CSCS / KSMFI Coach Level 3" },
  { id: "EMP-02", name: "Simran Kaur", role: "Senior CrossFit Trainer", shift: "Evening (14:00 - 22:00)", salary: "₹52,000", status: "Active", cert: "CrossFit L2 / Kettlebell Pro" },
  { id: "EMP-03", name: "Dr. Alok Pandey", role: "In-house Sports Physio", shift: "General (10:00 - 18:00)", salary: "₹70,000", status: "Active", cert: "MPT Sports Rehabilitation" },
  { id: "EMP-04", name: "Nisha Patel", role: "Front Desk & Member Manager", shift: "Morning (07:00 - 15:00)", salary: "₹32,000", status: "Active", cert: "Hospitality & CPR Certified" }
];

const PLANS = [
  { id: "p1", name: "Monthly Gold Pass", price: "₹3,500", duration: "1 Month", active: 142, perks: ["All Strength Equipment", "Cardio Deck", "Steam & Sauna", "Locker Room"] },
  { id: "p2", name: "Quarterly Pro Combat", price: "₹9,500", duration: "3 Months", active: 98, perks: ["All Gold Perks", "Octagon MMA Classes", "CrossFit WOD Access", "Physio Assessment"] },
  { id: "p3", name: "Annual Platinum Elite", price: "₹28,000", duration: "12 Months", active: 125, perks: ["Full 24/7 Access", "Monthly Physio Checkup", "Personal Trainer (2x/mo)", "VIP Private Locker"] },
];

export default function GymAdminDashboard() {
  const { setView, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);

  // Modals inside dashboard
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  const [newMember, setNewMember] = useState({ name: "", plan: "Monthly Gold", phone: "" });
  const [newStaff, setNewStaff] = useState({ name: "", role: "Fitness Trainer", shift: "Morning (06:00 - 14:00)", salary: "40,000", cert: "Level 2 Certified" });

  const handleAddMember = (e) => {
    e.preventDefault();
    const created = {
      id: `MBR-${Math.floor(100 + Math.random() * 900)}`,
      name: newMember.name,
      plan: newMember.plan,
      joined: new Date().toISOString().split("T")[0],
      status: "Active",
      phone: newMember.phone || "+91 98000 00000",
      expiry: "2026-12-31",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    };
    setMembers([created, ...members]);
    setAddMemberOpen(false);
    setNewMember({ name: "", plan: "Monthly Gold", phone: "" });
    showToast(`Member ${created.name} enrolled successfully!`, "success");
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    const created = {
      id: `EMP-0${employees.length + 1}`,
      name: newStaff.name,
      role: newStaff.role,
      shift: newStaff.shift,
      salary: `₹${newStaff.salary}`,
      status: "Active",
      cert: newStaff.cert,
    };
    setEmployees([created, ...employees]);
    setAddStaffOpen(false);
    setNewStaff({ name: "", role: "Fitness Trainer", shift: "Morning (06:00 - 14:00)", salary: "40,000", cert: "Level 2 Certified" });
    showToast(`Staff member ${created.name} added to roster!`, "success");
  };

  const renewMember = (id) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, status: "Active", expiry: "2027-10-22" } : m))
    );
    showToast("Membership renewed for 1 full year!", "success");
  };

  return (
    <div className="py-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20 inline-block mb-2">
            Self-Service Partner Portal
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Gym Partner <span className="gold-gradient-text">Admin Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your registered gym members, recurring subscription plans, employee shifts, and sales revenue.
          </p>
        </div>
        <button
          onClick={() => setView("gym")}
          className="bg-dark-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Main Dashboard Card */}
      <div className="bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header Info */}
        <div className="bg-dark-850 p-6 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&q=80"
              alt="Club Avatar"
              className="w-14 h-14 rounded-xl object-cover border-2 border-gold-500 shrink-0"
            />
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Titan Force Elite Fitness & Combat</h3>
              <p className="text-xs text-slate-400">
                📍 Bandra West, Mumbai • Partner ID: <span className="text-slate-300">GYM-PARTNER-001</span> • Status:{" "}
                <span className="text-emerald-400 font-bold">Verified Active</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setAddMemberOpen(true)}
              className="bg-gold-gradient text-black font-heading font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-gold-500/20 hover:shadow-gold-500/40"
            >
              <Plus size={14} />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => setAddStaffOpen(true)}
              className="bg-dark-700 text-slate-200 hover:text-white border border-white/10 font-heading font-semibold text-xs px-3.5 py-2 rounded-lg"
            >
              <Plus size={14} />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-dark-800 px-6 border-b border-white/10 flex gap-2 overflow-x-auto">
          {[
            { key: "overview", label: "Executive Overview", icon: TrendingUp },
            { key: "members", label: "Members Data", icon: Users },
            { key: "subscriptions", label: "Subscriptions Data", icon: CreditCard },
            { key: "employees", label: "Employee Data", icon: UserCheck },
            { key: "sales", label: "Sales & Revenue Reports", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-4 font-heading font-semibold text-xs transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "text-gold-400 border-gold-500 bg-gold-500/10"
                    : "text-slate-400 hover:text-slate-200 border-transparent"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-dark-850 border border-white/10 rounded-xl p-5">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Active Members</span>
                  <div className="font-heading font-black text-2xl text-white mt-1">{members.length + 415}</div>
                  <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">↑ 22 new this month</span>
                </div>
                <div className="bg-dark-850 border border-white/10 rounded-xl p-5">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Monthly Gross Revenue</span>
                  <div className="font-heading font-black text-2xl text-gold-400 mt-1">₹12,40,000</div>
                  <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">↑ 8.4% vs last month</span>
                </div>
                <div className="bg-dark-850 border border-white/10 rounded-xl p-5">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Active Subscriptions</span>
                  <div className="font-heading font-black text-2xl text-white mt-1">395</div>
                  <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">94% renewal rate</span>
                </div>
                <div className="bg-dark-850 border border-white/10 rounded-xl p-5">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Certified Trainers</span>
                  <div className="font-heading font-black text-2xl text-white mt-1">{employees.length}</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">All shifts staffed</span>
                </div>
              </div>

              {/* Revenue Bars */}
              <div className="bg-dark-850 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-heading font-bold text-base text-white">Monthly Sales Revenue Trend (FY 2026)</h4>
                    <p className="text-xs text-slate-400">Cash flow across membership fees, PT packs, and locker fees</p>
                  </div>
                  <span className="bg-gold-500/10 text-gold-400 text-xs font-bold px-3 py-1 rounded border border-gold-500/20">
                    Annual Target: ₹1.5 Cr
                  </span>
                </div>

                <div className="flex items-end justify-between gap-4 h-48 pt-6 border-b border-white/10">
                  {[
                    { month: "May", rev: "₹9.2L", h: "45%" },
                    { month: "Jun", rev: "₹10.1L", h: "55%" },
                    { month: "Jul", rev: "₹10.8L", h: "65%" },
                    { month: "Aug", rev: "₹11.4L", h: "75%" },
                    { month: "Sep", rev: "₹11.9L", h: "85%" },
                    { month: "Oct (Now)", rev: "₹12.4L", h: "95%", highlight: true },
                  ].map((bar) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className={`text-[11px] font-bold ${bar.highlight ? "text-gold-400" : "text-slate-400"}`}>
                        {bar.rev}
                      </span>
                      <div
                        style={{ height: bar.h }}
                        className={`w-full max-w-[48px] rounded-t-md transition-all duration-500 ${
                          bar.highlight ? "bg-gold-gradient shadow-[0_0_12px_rgba(240,185,11,0.3)]" : "bg-dark-700 hover:bg-gold-500/50"
                        }`}
                      ></div>
                      <span className={`text-[10px] ${bar.highlight ? "text-gold-400 font-bold" : "text-slate-500"}`}>
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-white">Registered Members Roster ({members.length})</h4>
                <button
                  onClick={() => setAddMemberOpen(true)}
                  className="bg-gold-gradient text-black font-heading font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Enroll Member</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-xl bg-dark-850">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Member Name</th>
                      <th className="p-3.5">Subscription Plan</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5">Expiry</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <div className="font-semibold text-white">{m.name}</div>
                              <div className="text-[10px] text-slate-500">{m.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-gold-400">{m.plan}</td>
                        <td className="p-3.5 text-slate-400">{m.joined}</td>
                        <td className="p-3.5 text-slate-400">{m.expiry}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : m.status === "Expiring Soon"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{m.phone}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => renewMember(m.id)}
                            className="bg-dark-700 text-gold-400 hover:bg-gold-500 hover:text-black px-2.5 py-1 rounded font-bold border border-gold-500/30 transition-all text-[11px]"
                          >
                            Renew
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS */}
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              <h4 className="font-heading font-bold text-base text-white">Configured Subscription Tiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <div key={plan.id} className="bg-dark-850 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-heading font-bold text-base text-white">{plan.name}</h5>
                        <span className="bg-gold-500/10 text-gold-400 border border-gold-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                          {plan.duration}
                        </span>
                      </div>
                      <div className="font-heading font-black text-2xl text-gold-400 mb-4">{plan.price}</div>
                      <ul className="space-y-2 mb-6">
                        {plan.perks.map((p) => (
                          <li key={p} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{plan.active} Active Subscribers</span>
                      <button
                        onClick={() => showToast(`Discount broadcast sent to ${plan.name} subscribers!`, "success")}
                        className="bg-gold-gradient text-black px-3 py-1.5 rounded font-bold hover:shadow-md"
                      >
                        Promote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EMPLOYEES */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-white">Staff Roster & Payroll ({employees.length})</h4>
                <button
                  onClick={() => setAddStaffOpen(true)}
                  className="bg-gold-gradient text-black font-heading font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Staff Member</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-xl bg-dark-850">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Employee Name</th>
                      <th className="p-3.5">Role / Designation</th>
                      <th className="p-3.5">Assigned Shift</th>
                      <th className="p-3.5">Certifications</th>
                      <th className="p-3.5">Monthly Salary</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-semibold text-white">{emp.name}</td>
                        <td className="p-3.5 text-gold-400 font-medium">{emp.role}</td>
                        <td className="p-3.5 text-slate-400">{emp.shift}</td>
                        <td className="p-3.5 text-slate-300">{emp.cert}</td>
                        <td className="p-3.5 text-white font-bold">{emp.salary}</td>
                        <td className="p-3.5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SALES */}
          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-base text-white">Financial Transaction Ledger</h4>
                  <p className="text-xs text-slate-400">All membership renewals, personal training packs, and locker rentals</p>
                </div>
                <button
                  onClick={() => showToast("Exporting Sales Report (CSV)...", "info")}
                  className="bg-dark-800 text-gold-400 border border-gold-500/30 hover:bg-gold-500 hover:text-black font-heading font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-xl bg-dark-850">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Txn ID</th>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">Package</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { id: "TXN-9021", member: "Rahul Deshmukh", pkg: "Annual Platinum Membership", date: "2026-10-21", amt: "₹28,000", method: "UPI / Razorpay", status: "Completed" },
                      { id: "TXN-9020", member: "Sneha Kulkarni", pkg: "Monthly Gold Pass", date: "2026-10-20", amt: "₹3,500", method: "Credit Card", status: "Completed" },
                      { id: "TXN-9019", member: "Aditya Nair", pkg: "Personal Training (10 Sessions)", date: "2026-10-18", amt: "₹12,000", method: "Net Banking", status: "Completed" },
                      { id: "TXN-9018", member: "Pooja Hegde", pkg: "Annual VIP Pass", date: "2026-10-15", amt: "₹36,000", method: "UPI", status: "Completed" },
                    ].map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-mono text-slate-400">{tx.id}</td>
                        <td className="p-3.5 font-semibold text-white">{tx.member}</td>
                        <td className="p-3.5 text-slate-300">{tx.pkg}</td>
                        <td className="p-3.5 text-slate-400">{tx.date}</td>
                        <td className="p-3.5 font-bold text-gold-400">{tx.amt}</td>
                        <td className="p-3.5 text-slate-400">{tx.method}</td>
                        <td className="p-3.5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Modals */}
      <Modal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Enroll New Member" icon={Users}>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Plan</label>
            <select
              value={newMember.plan}
              onChange={(e) => setNewMember({ ...newMember, plan: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
            >
              <option value="Monthly Gold">Monthly Gold (₹3,500)</option>
              <option value="Quarterly Pro">Quarterly Pro (₹9,500)</option>
              <option value="Annual Platinum">Annual Platinum (₹28,000)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
            <input
              type="tel"
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="+91 98000 00000"
              className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
            />
          </div>
          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddMemberOpen(false)}
              className="bg-dark-800 text-slate-300 px-3 py-1.5 rounded text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="bg-gold-gradient text-black font-bold px-4 py-1.5 rounded text-xs">
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Add Staff Member" icon={UserCheck}>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Name *</label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
              <input
                type="text"
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shift</label>
              <input
                type="text"
                value={newStaff.shift}
                onChange={(e) => setNewStaff({ ...newStaff, shift: e.target.value })}
                className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Salary (₹)</label>
            <input
              type="text"
              value={newStaff.salary}
              onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg p-2 text-xs text-white"
            />
          </div>
          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddStaffOpen(false)}
              className="bg-dark-800 text-slate-300 px-3 py-1.5 rounded text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="bg-gold-gradient text-black font-bold px-4 py-1.5 rounded text-xs">
              Save Staff
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
