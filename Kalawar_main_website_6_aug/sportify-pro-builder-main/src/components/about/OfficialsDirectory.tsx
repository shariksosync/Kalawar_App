"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Crown,
  MapPin,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { OfficialItem } from "@/lib/officials-store";

const DEFAULT_CATEGORIES = [
  "Founder & President",
  "Director / Working President",
  "National Officials",
  "Technical Committee",
  "State Officials",
  "District Officials",
];

export function OfficialsDirectory() {
  const [officials, setOfficials] = useState<OfficialItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialItem | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [offRes, catRes] = await Promise.all([
          fetch("/api/officials?all=true"),
          fetch("/api/officials/categories").catch(() => null),
        ]);

        const offJson = await offRes.json();
        if (offJson.success && Array.isArray(offJson.officials)) {
          setOfficials(offJson.officials);
        }

        if (catRes) {
          const catJson = await catRes.json();
          if (catJson.success && Array.isArray(catJson.categories) && catJson.categories.length > 0) {
            setCategoriesList(catJson.categories);
          }
        }
      } catch (err) {
        console.error("Failed to load officials & categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = useMemo(() => {
    const list = ["All", ...categoriesList];
    // Also include any categories present in officials not in list
    officials.forEach((o) => {
      if (o.category && !list.includes(o.category)) {
        list.push(o.category);
      }
    });
    return list;
  }, [categoriesList, officials]);

  const filteredOfficials = useMemo(() => {
    if (activeCategory === "All") return officials;
    return officials.filter((o) => o.category === activeCategory);
  }, [officials, activeCategory]);

  return (
    <section id="officials" className="section-pad relative">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Federation Governance & Leadership"
          title="Founder, President & Federation Officials"
          description="Governing council steering martial arts standards, championship execution, Dan accreditation, and state development across India."
        />

        {/* Category Tabs */}
        <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {categories.map((cat) => {
            const count =
              cat === "All"
                ? officials.length
                : officials.filter((o) => o.category === cat).length;
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer",
                  isSelected
                    ? "bg-gold-gradient text-background shadow-gold font-bold"
                    : "border border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    "size-4.5 sm:size-5 rounded-full text-[9px] sm:text-[10px] flex items-center justify-center font-bold",
                    isSelected
                      ? "bg-background/25 text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Officials Grid */}
        {loading ? (
          <div className="mt-8 sm:mt-14 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="luxe-card h-80 sm:h-96 animate-pulse bg-card/40 rounded-2xl p-5" />
            ))}
          </div>
        ) : filteredOfficials.length === 0 ? (
          <div className="mt-8 sm:mt-14 luxe-card p-8 sm:p-12 text-center text-muted-foreground max-w-md mx-auto">
            <User className="size-10 mx-auto text-primary/60 mb-3" />
            <p className="text-sm font-semibold">No officials found in this category.</p>
            <p className="text-xs mt-1">Officials can be updated directly from the admin panel.</p>
          </div>
        ) : (
          <Stagger className="mt-8 sm:mt-14 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOfficials.map((official) => {
              const hasPhoto = !!official.image;

              return (
                <StaggerItem key={official.id}>
                  <article className="luxe-card hover-lift group overflow-hidden border border-border/80 bg-card/60 h-full flex flex-col justify-between">
                    <div>
                      {/* Photo Container */}
                      <div className="h-56 sm:h-64 lg:h-72 overflow-hidden relative bg-muted/40 flex items-center justify-center">
                        {hasPhoto ? (
                          <img
                            src={official.image}
                            alt={official.name}
                            loading="lazy"
                            className="size-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center">
                            <div className="size-16 sm:size-20 rounded-full bg-accent/40 border border-border/80 flex items-center justify-center mb-2 text-primary">
                              <User className="size-8 sm:size-10" />
                            </div>
                            <span className="text-[11px] font-semibold">Official Portrait</span>
                          </div>
                        )}

                        {/* Top Tier Badge */}
                        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 rounded-full bg-background/90 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-primary border border-primary/25 shadow-sm">
                          {official.category}
                        </div>

                        {/* Verified badge */}
                        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 size-6 sm:size-7 rounded-full bg-background/90 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary shadow-sm" title="Verified Official">
                          <ShieldCheck className="size-3.5 sm:size-4" />
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-4 sm:p-5">
                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {official.name}
                        </h3>
                        <p className="text-primary text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mt-1">
                          {official.role}
                        </p>

                        {(official.state || official.district) && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="size-3 text-primary/70 shrink-0" />
                            <span className="truncate">
                              {[official.district, official.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {official.bio && (
                          <p className="text-muted-foreground mt-2.5 sm:mt-3 text-xs leading-relaxed line-clamp-3">
                            {official.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="p-4 sm:p-5 pt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedOfficial(official)}
                        className="w-full mt-1 sm:mt-2 rounded-xl border border-border/80 bg-accent/30 py-2 sm:py-2.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-background hover:border-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        View Official Profile <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}

        {/* Profile Details Modal Dialog */}
        <Dialog
          open={!!selectedOfficial}
          onOpenChange={(open) => {
            if (!open) setSelectedOfficial(null);
          }}
        >
          <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/80 bg-card rounded-2xl max-h-[90vh] overflow-y-auto w-[94vw] sm:w-full">
            {selectedOfficial && (
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Left Portrait Column */}
                <div className="relative w-full md:w-72 shrink-0 bg-muted/40 border-b md:border-b-0 md:border-r border-border/60 overflow-hidden flex items-center justify-center min-h-[220px] sm:min-h-[280px] md:min-h-[380px]">
                  {selectedOfficial.image ? (
                    <img
                      src={selectedOfficial.image}
                      alt={selectedOfficial.name}
                      className="size-full object-cover object-top"
                    />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center p-8 text-primary/70 bg-accent/30">
                      <User className="size-16 sm:size-20" />
                      <span className="text-xs font-semibold text-muted-foreground mt-2">Official Portrait</span>
                    </div>
                  )}

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-primary border border-primary/20 shadow-sm">
                    {selectedOfficial.category}
                  </div>

                  {/* Bottom verification watermark */}
                  <div className="absolute bottom-3 inset-x-3 rounded-lg bg-background/85 backdrop-blur-md border border-border/70 py-1.5 px-2.5 flex items-center justify-between text-[10px] text-muted-foreground shadow-sm">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <ShieldCheck className="size-3.5" /> Verified Official
                    </span>
                    <span className="font-mono text-[9px] text-primary">{selectedOfficial.id}</span>
                  </div>
                </div>

                {/* Right Details Column */}
                <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between space-y-4 sm:space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2.5 sm:px-3 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                        {selectedOfficial.category}
                      </span>
                    </div>

                    <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground mt-2 leading-snug">
                      {selectedOfficial.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm font-semibold text-primary mt-1">
                      {selectedOfficial.role}
                    </DialogDescription>

                    {/* Location & Contact Meta */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs text-muted-foreground border-y border-border/60 my-3 sm:my-4 py-2.5">
                      {(selectedOfficial.district || selectedOfficial.state) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span>{[selectedOfficial.district, selectedOfficial.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      {selectedOfficial.email && (
                        <a
                          href={`mailto:${selectedOfficial.email}`}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors truncate max-w-[200px]"
                          title={selectedOfficial.email}
                        >
                          <Mail className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{selectedOfficial.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Profile Bio */}
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
                        Official Biography & Profile
                      </h4>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                        {selectedOfficial.bio ||
                          "Official appointment within the KALAWAR Sports & Martial Arts Federation of India governing council. Leading athletic development, referee standards, and grassroots operations."}
                      </p>
                    </div>
                  </div>

                  {/* Federation credential footer */}
                  <div className="rounded-xl bg-accent/30 border border-border/80 p-2.5 sm:p-3 flex items-center justify-between gap-3 text-[10.5px] sm:text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <span className="truncate">KALAWAR Sports & Martial Arts Federation of India</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
