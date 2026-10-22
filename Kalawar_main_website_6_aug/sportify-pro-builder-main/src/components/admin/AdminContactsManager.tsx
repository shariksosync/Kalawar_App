"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Send,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Filter,
  ExternalLink,
  Paperclip,
  Trash2,
  X,
  Sparkles,
  Trophy,
  Tag,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { ContactRequest, ContactStatus, ContactCategory } from "@/types/contact";
import { CONTACT_CATEGORIES } from "@/types/contact";

const STATUS_TABS = [
  { key: "All", label: "All Enquiries" },
  { key: "Submitted", label: "New / Submitted" },
  { key: "Under Review", label: "Under Review" },
  { key: "Replied", label: "Replied" },
  { key: "Closed", label: "Closed" },
] as const;

export function AdminContactsManager() {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Enquiry for Inspector Modal
  const [inspectItem, setInspectItem] = useState<ContactRequest | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sendEmailCheck, setSendEmailCheck] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contact");
      const json = await res.json();
      if (json.success && Array.isArray(json.contacts)) {
        setContacts(json.contacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error("Admin fetch contacts error:", err);
      toast.error("Could not load contact enquiries from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Filtered List
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchStatus =
        activeTab === "All" ||
        (activeTab === "Submitted" && (c.status === "Submitted" || c.status === "New")) ||
        (activeTab === "Under Review" && (c.status === "Under Review" || c.status === "In Progress")) ||
        (activeTab === "Replied" && c.status === "Replied") ||
        (activeTab === "Closed" && (c.status === "Closed" || c.status === "Resolved"));

      const matchCategory =
        selectedCategory === "All" || c.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        (c.eventName && c.eventName.toLowerCase().includes(q)) ||
        (c.division && c.division.toLowerCase().includes(q)) ||
        (c.academyName && c.academyName.toLowerCase().includes(q)) ||
        (c.tag && c.tag.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q));

      return matchStatus && matchCategory && matchSearch;
    });
  }, [contacts, activeTab, selectedCategory, searchQuery]);

  // Counts for KPI
  const stats = useMemo(() => {
    const total = contacts.length;
    const submitted = contacts.filter((c) => c.status === "Submitted" || c.status === "New").length;
    const underReview = contacts.filter((c) => c.status === "Under Review" || c.status === "In Progress").length;
    const replied = contacts.filter((c) => c.status === "Replied").length;
    const closed = contacts.filter((c) => c.status === "Closed" || c.status === "Resolved").length;
    return { total, submitted, underReview, replied, closed };
  }, [contacts]);

  // Open Inspection Modal
  const handleOpenInspect = (item: ContactRequest) => {
    setInspectItem(item);
    setReplyText(item.adminReply || "");
    setAssignedOfficer(item.assignedTo || "");
    setInternalNote(item.internalNotes || "");
    setSendEmailCheck(true);
  };

  // Update Status / Reply in Modal
  const handleSaveInspect = async (newStatus?: ContactStatus) => {
    if (!inspectItem) return;

    try {
      setSavingStatus(true);
      const updates: Partial<ContactRequest> & { sendEmailToUser?: boolean; actionBy?: string } = {
        assignedTo: assignedOfficer.trim(),
        adminReply: replyText.trim(),
        internalNotes: internalNote.trim(),
        sendEmailToUser: sendEmailCheck && !!replyText.trim(),
        actionBy: "Admin Secretariat",
      };

      if (newStatus) {
        updates.status = newStatus;
      }
      if (replyText.trim() && !newStatus) {
        updates.status = "Replied";
        updates.repliedAt = new Date().toISOString();
      }

      const res = await fetch(`/api/contact/${encodeURIComponent(inspectItem.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update enquiry");
      }

      toast.success("Enquiry updated successfully", {
        description: `Reference ${inspectItem.id} marked as ${json.contact.status}`,
      });

      setInspectItem(json.contact);
      fetchContacts();
    } catch (err: any) {
      console.error("Update enquiry error:", err);
      toast.error(err.message || "Failed to update enquiry.");
    } finally {
      setSavingStatus(false);
    }
  };

  // Delete Handler
  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete enquiry reference ${id}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete");
      }
      toast.success("Enquiry deleted");
      if (inspectItem?.id === id) setInspectItem(null);
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete enquiry");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "ID,Name,Email,Phone,State,District,Category,EventName,EventDate,Division,BeltRank,AcademyName,Tag,Subject,Message,Status,AssignedTo,AdminReply,CreatedAt\n";
    const rows = filteredContacts
      .map((c) =>
        `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.state || ""}","${c.district || ""}","${c.category}","${(c.eventName || "").replace(/"/g, '""')}","${(c.eventDate || "").replace(/"/g, '""')}","${(c.division || "").replace(/"/g, '""')}","${(c.beltRank || "").replace(/"/g, '""')}","${(c.academyName || "").replace(/"/g, '""')}","${(c.tag || "").replace(/"/g, '""')}","${c.subject.replace(/"/g, '""')}","${c.message.replace(/"/g, '""')}","${c.status}","${c.assignedTo || ""}","${(c.adminReply || "").replace(/"/g, '""')}","${c.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kalawar_Enquiries_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Enquiries exported to CSV!");
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider shadow-gold">
            <MessageSquare className="size-3.5" /> Secretariat Helpdesk &amp; Inquiries
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">
            Contact Requests &amp; Enquiries Hub
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Manage, assign, and respond to incoming federation enquiries, athlete questions, club affiliation requests, and support tickets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchContacts}
            className="px-4 py-2 rounded-full border border-border/70 hover:bg-accent/40 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="size-3.5 text-primary" /> Reload
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card/40 border border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Total Enquiries</div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-border/70 space-y-1">
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Clock className="size-3" /> New / Submitted
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.submitted}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-border/70 space-y-1">
          <div className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <UserCheck className="size-3" /> Under Review
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.underReview}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-border/70 space-y-1">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Replied
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.replied}</div>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <XCircle className="size-3" /> Closed
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.closed}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-5 rounded-3xl border border-border/70 bg-card/40 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-gold-gradient text-background border-transparent shadow-gold"
                      : "bg-card/60 border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-card border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="All">All Categories</option>
              {CONTACT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search enquiries by ID (KAC-ENQ-...), Name, Email, Phone, Subject, State, or Message keyword..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-card border border-border/80 focus:outline-none focus:border-primary text-sm font-medium text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Enquiries Stream Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Loading enquiries database...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 rounded-3xl border border-border/70 bg-card/30 text-center space-y-2">
            <MessageSquare className="size-8 text-muted-foreground mx-auto" />
            <h4 className="text-base font-bold text-foreground">No Enquiries Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No enquiries matched the selected status tab, category filter, or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredContacts.map((c) => {
              const isNew = c.status === "Submitted" || c.status === "New";
              const isUnderReview = c.status === "Under Review" || c.status === "In Progress";
              const isReplied = c.status === "Replied";
              const isClosed = c.status === "Closed" || c.status === "Resolved";

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-border/70 bg-card/60 hover:border-primary/50 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                        {c.id}
                      </span>
                      {c.category === "Event Registration" || c.eventName ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 inline-flex items-center gap-1">
                          <Trophy className="size-3" /> {c.eventName ? `Event: ${c.eventName}` : "Event Registration"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/40 border border-border/60 text-xs font-semibold text-foreground">
                          {c.category}
                        </span>
                      )}
                      {c.division && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
                          🥋 {c.division}
                        </span>
                      )}
                      {c.tag && !c.tag.startsWith("Event:") && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/50 text-[10px] font-mono font-semibold text-muted-foreground">
                          🏷️ {c.tag}
                        </span>
                      )}
                      {c.state && (
                        <span className="text-[11px] text-muted-foreground">
                          📍 {c.state} {c.district ? `(${c.district})` : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isNew
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : isUnderReview
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : isReplied
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-stone-500/15 text-stone-400 border border-stone-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-8 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3 text-primary" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            <Phone className="size-3 text-primary" /> {c.phone}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-foreground">
                        Subject: <span className="text-muted-foreground font-medium">{c.subject}</span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-background/40 p-2 rounded-xl border border-border/40">
                        “{c.message}”
                      </p>

                      {c.adminReply && (
                        <div className="text-xs text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          <span>Official Reply: {c.adminReply}</span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-4 flex flex-wrap items-center justify-end gap-2">
                      {c.attachmentUrl && (
                        <a
                          href={c.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full bg-accent/30 border border-border/70 hover:border-primary/60 text-foreground text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Paperclip className="size-3.5 text-primary" /> View Doc
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenInspect(c)}
                        className="px-4 py-1.5 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all flex items-center gap-1.5"
                      >
                        <Eye className="size-3.5" /> Review / Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEnquiry(c.id)}
                        className="p-2 rounded-full border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete enquiry"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Enquiry Inspector Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border/80 rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b border-border/60 p-5 sm:p-6 shrink-0 bg-card/95 backdrop-blur z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {inspectItem.id}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-accent/40 text-xs font-semibold text-foreground">
                    {inspectItem.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground pt-1">{inspectItem.subject}</h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-full hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Content ("Slider") */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
              {/* Submitter Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-card/60 border border-border/70 text-xs">
                <div>
                  <div className="text-muted-foreground font-medium">Full Name</div>
                  <div className="font-bold text-foreground text-sm">{inspectItem.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Email</div>
                  <div className="font-semibold text-foreground break-all">{inspectItem.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Phone / Location</div>
                  <div className="font-semibold text-foreground">
                    {inspectItem.phone || "Not provided"} • {inspectItem.state || "India"}
                  </div>
                </div>
              </div>

              {/* Event Registration Details Box */}
              {(inspectItem.category === "Event Registration" || inspectItem.eventName || inspectItem.division) && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Trophy className="size-3.5" /> Tournament Entry Details
                    </span>
                    {inspectItem.tag && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                        {inspectItem.tag}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tournament</span>
                      <span className="font-bold text-foreground">{inspectItem.eventName || "Event Entry"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Division / Category</span>
                      <span className="font-bold text-primary">{inspectItem.division || "Standard Entry"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Belt / Rank</span>
                      <span className="font-semibold text-foreground">{inspectItem.beltRank || "Not Specified"}</span>
                    </div>
                    {inspectItem.academyName && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Club / Dojo / Academy</span>
                        <span className="font-semibold text-foreground">{inspectItem.academyName}</span>
                      </div>
                    )}
                    {inspectItem.eventDate && (
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Scheduled Date</span>
                        <span className="font-mono text-muted-foreground">{inspectItem.eventDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Enquiry Message Content
                </div>
                <div className="p-4 rounded-2xl bg-background border border-border/70 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {inspectItem.message}
                </div>
              </div>

              {/* Attachment, if any */}
              {inspectItem.attachmentUrl && (
                <div className="p-3 rounded-2xl bg-accent/20 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Paperclip className="size-4 text-primary" />
                    <span>Attached File: <strong>{inspectItem.attachmentName || "Document"}</strong></span>
                  </div>
                  <a
                    href={inspectItem.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="size-3.5" /> Open File
                  </a>
                </div>
              )}

              {/* Officer Assignment & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Assign Secretariat Officer
                  </label>
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    placeholder="e.g. Officer Vikramaditya Patil"
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Quick Status Action
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveInspect("Under Review")}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-bold border border-blue-500/40"
                    >
                      Set Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveInspect("Closed")}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-500/20 text-stone-300 hover:bg-stone-500/30 text-xs font-bold border border-stone-500/40"
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Response Composer */}
              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Send className="size-3.5" /> Official Reply / Response to User
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailCheck}
                      onChange={(e) => setSendEmailCheck(e.target.checked)}
                      className="rounded border-border accent-primary"
                    />
                    <span>Dispatch via Email to {inspectItem.email}</span>
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official secretariat response here... (The user will see this on the live tracking portal and receive an email notification)"
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 focus:outline-none focus:border-primary text-xs text-foreground leading-relaxed resize-none"
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Internal Administrative Notes (Private)
                </label>
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Private secretariat notes, phone discussion summary, or committee remarks..."
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-between border-t border-border/60 p-4 sm:p-5 shrink-0 bg-card/95 backdrop-blur z-10 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-full border border-border/70 hover:bg-accent/40 text-xs font-semibold text-muted-foreground transition-colors"
              >
                Close Inspector
              </button>

              <button
                type="button"
                onClick={() => handleSaveInspect()}
                disabled={savingStatus}
                className="px-6 py-2.5 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {savingStatus ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Saving &amp; Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" /> Save &amp; Dispatch Response
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
