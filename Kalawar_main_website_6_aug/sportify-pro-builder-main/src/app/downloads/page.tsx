"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Search,
  Eye,
  X,
  BookOpen,
  ClipboardList,
  FileCheck2,
  BadgeCheck,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Printer,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Stagger, StaggerItem } from "@/components/common/Reveal";
import {
  OFFICIAL_DOWNLOADS,
  PRIMARY_DOWNLOAD_CATEGORIES,
  PrimaryDownloadCategory,
  YEARS_LIST,
  EVENT_FILTERS,
  DownloadItem,
} from "@/data/downloads-data";
import { IMAGES } from "@/data/images";
import { generateOfficialPDF } from "@/lib/pdf-generator";

const CATEGORY_ICONS: Record<string, any> = {
  All: FileText,
  "Rule Book & Regulations": BookOpen,
  "Registration Forms": ClipboardList,
  "Official Forms": Scale,
  "Certificates & Documents": FileCheck2,
};

export default function DownloadsPage() {
  const [downloadsList, setDownloadsList] = useState<DownloadItem[]>(OFFICIAL_DOWNLOADS);
  const [activeCategory, setActiveCategory] = useState<PrimaryDownloadCategory>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All Years");
  const [selectedEvent, setSelectedEvent] = useState<string>("All Events");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "title">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DownloadItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dynamic records if available from /api/downloads
  useEffect(() => {
    async function loadDynamicDownloads() {
      try {
        const res = await fetch("/api/downloads");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.downloads) && data.downloads.length > 0) {
            setDownloadsList(data.downloads);
          }
        }
      } catch (e) {
        console.warn("Using pre-loaded official downloads dataset.");
      }
    }
    loadDynamicDownloads();
  }, []);

  // Filter & Sort Logic
  const filteredDownloads = useMemo(() => {
    const result = downloadsList.filter((item) => {
      // Exclude drafts or archived unless specific
      if (item.status === "Draft" || item.status === "Archived") return false;

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesYear =
        selectedYear === "All Years" || item.year === selectedYear;
      const matchesEvent =
        selectedEvent === "All Events" || item.event === selectedEvent;
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.docCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.version.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesYear && matchesEvent && matchesSearch;
    });

    if (sortBy === "latest") {
      result.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => (b.order || 0) - (a.order || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [downloadsList, activeCategory, selectedYear, selectedEvent, searchQuery, sortBy]);

  const handleDownload = (item: DownloadItem) => {
    if ((item as any).fileUrl) {
      const link = document.createElement("a");
      link.href = (item as any).fileUrl;
      link.target = "_blank";
      link.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${item.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download Started", {
        description: `${item.title} (${item.version}) opened for download.`,
      });
      return;
    }

    const toastId = toast.loading(`Preparing ${item.title}...`, {
      description: `Document Ref: ${item.docCode} · Version ${item.version}`,
    });

    try {
      generateOfficialPDF({
        title: item.title,
        category: item.category,
        docCode: item.docCode,
        date: `${item.updatedDate}`,
        sections: [
          {
            heading: "1. OFFICIAL DOCUMENT OVERVIEW",
            body: item.description,
          },
          {
            heading: "2. STATUTORY VERSION & GOVERNANCE DIRECTIVE",
            body: [
              `Official Publication Version: ${item.version}`,
              `Initial Promulgation Date: ${item.publishedDate}`,
              `Latest Technical Revision: ${item.updatedDate}`,
              `Governing Jurisdiction: ${item.event}`,
              "This document is officially ratified by the KALAWAR National Board. All affiliated state associations, clubs, certified coaches, and technical officials must comply with these guidelines.",
            ],
          },
          {
            heading: "3. AUTHENTICITY & LEGAL DISCLOSURE",
            body: [
              `Official Serialized Code: ${item.docCode}`,
              `Format Classification: ${item.type} National Standard`,
              "Digitally encrypted and archived in the KALAWAR Central Regulatory Registry.",
              "Unauthorized alteration or tampering constitutes an offense under federation rules.",
            ],
          },
        ],
      });

      toast.success("Download Ready", {
        id: toastId,
        description: `${item.title} (${item.version}) has been downloaded.`,
      });
    } catch (e) {
      toast.error("Failed to compile document PDF. Please retry.", {
        id: toastId,
      });
    }
  };

  const resetFilters = () => {
    setActiveCategory("All");
    setSelectedYear("All Years");
    setSelectedEvent("All Events");
    setSearchQuery("");
    setSortBy("latest");
  };

  return (
    <SiteLayout>
      {/* 1. Page Hero */}
      <PageHero
        eyebrow="Official Federation Repository"
        title="KALAWAR DOWNLOAD CENTER"
        description="Official Forms, Rules, Notices, Documents & Resources. Download approved competition rulebooks, registration forms, ringside medical sheets, and legal circulars."
        image={IMAGES.training}
      />

      {/* 2. Top Stats Bar */}
      <section className="relative -mt-10 mb-8 z-20">
        <div className="shell">
          <div className="rounded-2xl border border-primary/30 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Repository</p>
                  <p className="text-sm font-bold text-primary">KALAWAR Portal</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Active Files</p>
                  <p className="text-sm font-bold text-foreground">{downloadsList.length} Verified Docs</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Versioning</p>
                  <p className="text-sm font-bold text-amber-400">2026-27 Active</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Verification</p>
                  <p className="text-sm font-bold text-emerald-400">Official Seals</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/rules"
                  className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BookOpen className="size-4" /> View Full Rules Page (Page 5) <ArrowRight className="size-3.5" />
                </Link>
                {/*
                <Link
                  href="/verify"
                  className="border-border/70 hover:border-primary/60 hover:bg-primary/5 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition-colors"
                >
                  <BadgeCheck className="size-4 text-primary" /> Verify Certificate Online
                </Link>
                */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 5️⃣ Search & Filters Section */}
      <section className="pb-8">
        <div className="shell space-y-6">
          {/* Main Search Bar & Multi-Select Filters */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6 backdrop-blur-md">
            <div className="grid gap-4 md:grid-cols-12 items-center">
              {/* Search input */}
              <div className="relative md:col-span-5">
                <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by document name, code (e.g. FORM-A1), or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background/90 border-border/80 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-2.5 pl-10 pr-8 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Year Filter */}
              <div className="md:col-span-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                >
                  {YEARS_LIST.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                >
                  {EVENT_FILTERS.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-medium"
                >
                  <option value="latest">Sort: Latest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="title">Sort: Title A–Z</option>
                </select>
              </div>
            </div>

            {/* 4 Core Category Tabs */}
            <div className="mt-5 border-t border-border/50 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {PRIMARY_DOWNLOAD_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] || FileText;
                  const isSelected = activeCategory === cat;
                  const count =
                    cat === "All"
                      ? downloadsList.filter((d) => d.status === "Published").length
                      : downloadsList.filter((d) => d.category === cat && d.status === "Published").length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-gold-gradient text-background shadow-gold scale-105"
                          : "border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{cat}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                          isSelected ? "bg-background/25 text-background" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                {(activeCategory !== "All" ||
                  selectedYear !== "All Years" ||
                  selectedEvent !== "All Events" ||
                  searchQuery !== "") && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <RefreshCw className="size-3" /> Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 6️⃣ Document Details Grid (View / Download Cards) */}
      <section className="pb-24">
        <div className="shell">
          {filteredDownloads.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center">
              <Search className="mx-auto size-10 text-muted-foreground/50" />
              <h3 className="mt-3 text-base font-bold text-foreground">No official documents found</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                No matching files found under the selected filters. Try clearing your search or filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDownloads.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || FileText;
                return (
                  <StaggerItem key={item.id}>
                    <article className="luxe-card hover-lift flex h-full flex-col justify-between p-6 relative overflow-hidden group border border-border/70 hover:border-primary/50 transition-all">
                      <div>
                        {/* Card Header: Icon, Official Stamp, Version & File Type */}
                        <div className="flex items-start justify-between gap-3">
                          <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl border border-primary/20 group-hover:scale-110 transition-transform">
                            <Icon className="size-5" />
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            {item.officialStamp && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                <BadgeCheck className="size-3" /> Official
                              </span>
                            )}
                            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 font-mono text-[10px] font-bold px-2 py-0.5 text-amber-400">
                              {item.version}
                            </span>
                            <span className="rounded-md border border-border/60 bg-muted/50 font-mono text-[10px] px-2 py-0.5 text-muted-foreground">
                              {item.type}
                            </span>
                          </div>
                        </div>

                        {/* Category & Doc Reference Code */}
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-primary text-[10px] font-bold tracking-widest uppercase">
                            {item.category}
                          </p>
                          <span className="font-mono text-[10px] text-muted-foreground/70">{item.docCode}</span>
                        </div>

                        {/* Document Name */}
                        <h2 className="mt-1.5 text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h2>

                        {/* Description */}
                        <p className="text-muted-foreground mt-2 text-xs leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      {/* Document Metadata Details */}
                      <div className="mt-6 border-t border-border/40 pt-4">
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mb-4">
                          <div>
                            <span className="block text-[10px] text-muted-foreground/70 uppercase">Published</span>
                            <strong className="text-foreground font-medium">{item.publishedDate}</strong>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground/70 uppercase">Updated</span>
                            <strong className="text-emerald-400 font-medium">{item.updatedDate}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-muted-foreground/70 uppercase">Scope</span>
                            <strong className="text-foreground truncate block">{item.event}</strong>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground/70 uppercase">File Size</span>
                            <strong className="text-foreground">{item.size}</strong>
                          </div>
                        </div>

                        {/* Action Buttons: View Details & Download */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(item)}
                            className="border-border/70 hover:border-primary/60 hover:bg-primary/5 text-foreground inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold border transition-colors"
                          >
                            <Eye className="size-3.5 text-primary" /> View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="bg-gold-gradient text-background inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Download className="size-3.5" /> Download
                          </button>
                        </div>
                      </div>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>
      </section>

      {/* 5. Document Details & Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-400">
                {previewDoc.version}
              </span>
              <span className="rounded-md border border-border/60 bg-muted/40 font-mono text-[11px] px-2 py-0.5 text-muted-foreground">
                {previewDoc.type} · {previewDoc.size}
              </span>
              {previewDoc.officialStamp && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <BadgeCheck className="size-3.5" /> Verified Official Release
                </span>
              )}
            </div>

            <p className="mt-3 text-xs font-bold tracking-wider text-primary uppercase">
              {previewDoc.category}
            </p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-foreground">{previewDoc.title}</h2>
            <p className="text-muted-foreground mt-3 text-xs sm:text-sm leading-relaxed">
              {previewDoc.description}
            </p>

            {/* Metadata Table */}
            <div className="mt-6 rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-bold text-foreground uppercase mb-3">Technical Document Specifications</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Doc Code</span>
                  <strong className="font-mono text-primary font-bold">{previewDoc.docCode}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Published Date</span>
                  <strong className="text-foreground">{previewDoc.publishedDate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Last Updated</span>
                  <strong className="text-emerald-400 font-semibold">{previewDoc.updatedDate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Applicable Year</span>
                  <strong className="text-foreground">{previewDoc.year}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Tournament Scope</span>
                  <strong className="text-foreground">{previewDoc.event}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase block">Authentication</span>
                  <strong className="text-emerald-400">Digital Seal & Sign</strong>
                </div>
              </div>
            </div>

            {/* Statutory Notice */}
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-primary font-bold block mb-1">Official Governance Mandate:</strong>
              This document is released under the direct authority of the National Executive Secretariat of KALAWAR Sports & Martial Arts Federation of India. Any unauthorized reproduction, alteration, or distribution of unapproved drafts is strictly prohibited under national regulations.
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border/40 pt-4">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-border/60 px-4 py-2.5 text-xs font-semibold hover:bg-muted/40 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="size-4" /> Download Official {previewDoc.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bottom Governance & Sanctions Banner */}
      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" /> Approved Documents Only
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Version Control & Regulatory Assurance
              </h2>
              <p className="text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">
                Only officially approved and signed documents are promulgated through the KALAWAR Download Center. Every document features an explicit version number and update timestamp. Archived revisions are preserved in the National Secretariat archives.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-card/90 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-foreground">Need Full In-Depth Statutory Rules?</h3>
              <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                Detailed breakdowns for all 12 sections (Discipline combat rules, 3-tier penalties, referee commands, and protest rules) are available on our dedicated Rules & Regulations Page.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/rules"
                  className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-gold"
                >
                  Go to Rules & Regulations (Page 5)
                </Link>
                <Link
                  href="/contact"
                  className="border-border/70 hover:border-primary inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold"
                >
                  Contact Secretariat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
