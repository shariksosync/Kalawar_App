"use client";

import { useState, useEffect } from "react";
import { Quote, Award, User } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { LeadershipItem } from "@/lib/leadership-store";

export function LeadershipMessages() {
  const [leaders, setLeaders] = useState<LeadershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeadership() {
      try {
        setLoading(true);
        const res = await fetch("/api/leadership");
        const json = await res.json();
        if (json.success && Array.isArray(json.leadership)) {
          setLeaders(json.leadership);
        }
      } catch (err) {
        console.error("Failed to load visionary leadership:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeadership();
  }, []);

  if (!loading && leaders.length === 0) {
    return null;
  }

  return (
    <section className="section-pad border-y border-border/60 bg-card/40 relative overflow-hidden">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Visionary Leadership"
          title="Founder & President Messages"
          description="Guiding philosophies steering the national growth, discipline, and authentic empowerment of martial arts across India."
        />

        {loading ? (
          <div className="mt-10 sm:mt-14 space-y-8 sm:space-y-12">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="luxe-card p-5 sm:p-8 lg:p-10 border border-border/80 bg-card/60 animate-pulse"
              >
                <div className="grid items-center gap-6 lg:gap-8 lg:grid-cols-[0.75fr_1.25fr]">
                  <div className="h-64 sm:h-80 lg:h-96 w-full rounded-2xl bg-muted/40" />
                  <div className="space-y-4">
                    <div className="h-4 w-32 bg-muted/40 rounded-full" />
                    <div className="h-8 w-3/4 bg-muted/40 rounded-lg" />
                    <div className="h-3 w-full bg-muted/30 rounded" />
                    <div className="h-3 w-full bg-muted/30 rounded" />
                    <div className="h-3 w-2/3 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 sm:mt-14 space-y-8 sm:space-y-12">
            {leaders.map((leader, index) => {
              const isEven = index % 2 === 0;
              const hasPhoto = !!leader.image;
              const paragraphs = (leader.message || "")
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean);

              return (
                <div
                  key={leader.id}
                  className={`luxe-card p-5 sm:p-8 lg:p-10 border ${
                    index === 0 ? "border-primary/40 bg-card/80" : "border-border/80 bg-card/60"
                  }`}
                >
                  <div
                    className={`grid items-center gap-6 lg:gap-8 ${
                      isEven ? "lg:grid-cols-[0.75fr_1.25fr]" : "lg:grid-cols-[1.25fr_0.75fr]"
                    }`}
                  >
                    {/* Photo Container */}
                    <Reveal
                      delay={isEven ? 0 : 0.16}
                      className={isEven ? "" : "order-1 lg:order-2"}
                    >
                      <div className="overflow-hidden rounded-2xl border border-primary/30 relative group">
                        <div className="h-64 sm:h-80 lg:h-96 w-full overflow-hidden bg-muted flex items-center justify-center">
                          {hasPhoto ? (
                            <img
                              src={leader.image}
                              alt={`${leader.name} — ${leader.role}`}
                              loading="lazy"
                              className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center">
                              <div className="size-20 rounded-full bg-accent/40 border border-border/80 flex items-center justify-center mb-2 text-primary">
                                <User className="size-10" />
                              </div>
                              <p className="text-xs font-semibold text-foreground">{leader.name}</p>
                              <p className="text-[11px] text-muted-foreground">{leader.role}</p>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 sm:p-5">
                          {leader.tag && (
                            <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                              {leader.tag}
                            </span>
                          )}
                          <h3 className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold text-foreground">
                            {leader.name}
                          </h3>
                          <p className="text-muted-foreground text-[11px] sm:text-xs">{leader.role}</p>
                        </div>
                      </div>
                    </Reveal>

                    {/* Text / Message Content */}
                    <Reveal
                      delay={isEven ? 0.1 : 0.08}
                      className={`space-y-3.5 sm:space-y-4 ${isEven ? "" : "order-2 lg:order-1"}`}
                    >
                      <div className="space-y-3.5 sm:space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Quote className="size-5 sm:size-6 rotate-180 shrink-0" />
                          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-primary">
                            {leader.addressTitle || "Leadership Address"}
                          </span>
                        </div>

                        {leader.quote && (
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug text-foreground">
                            {leader.quote}
                          </h2>
                        )}

                        <div className="gold-rule" />

                        <div className="text-muted-foreground text-xs sm:text-sm space-y-2.5 sm:space-y-3 leading-relaxed">
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p, pIdx) => <p key={pIdx}>{p}</p>)
                          ) : (
                            <p>{leader.message}</p>
                          )}
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <Award className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{leader.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {leader.organization || leader.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
