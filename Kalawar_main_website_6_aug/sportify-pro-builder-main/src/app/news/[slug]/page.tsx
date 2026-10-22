"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  User,
  Share2,
  Tag,
  MapPin,
  Download,
  FileText,
  BadgeCheck,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Pin,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { NewsCard } from "@/components/cards/Cards";
import type { NewsItem } from "@/data/content";
import { ShareModal } from "@/components/shop/ShareModal";
import { generateOfficialPDF } from "@/lib/pdf-generator";

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/news/${encodeURIComponent(resolvedParams.slug)}`);
        if (!res.ok) {
          setIsNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.success && data.article) {
          setArticle(data.article);

          // Fetch related articles from same category
          try {
            const relRes = await fetch(`/api/news?category=${encodeURIComponent(data.article.category)}`);
            const relData = await relRes.json();
            if (relData.success && Array.isArray(relData.news)) {
              setRelatedArticles(
                relData.news.filter((n: NewsItem) => n.id !== data.article.id).slice(0, 3)
              );
            }
          } catch (relErr) {
            console.warn("Could not fetch related articles");
          }
        } else {
          setIsNotFound(true);
        }
      } catch (error) {
        console.error("Failed to load article:", error);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticle();
  }, [resolvedParams.slug]);

  const handleDownloadAttachment = () => {
    if (!article) return;
    if (article.documentUrl) {
      window.open(article.documentUrl, "_blank");
      toast.success("Document Download Started", {
        description: article.documentName || article.title,
      });
    } else {
      // Generate standard official announcement document PDF
      generateOfficialPDF({
        title: article.title,
        category: `Official Release: ${article.category}`,
        docCode: `K-PRESS-${article.id}`,
        date: article.date,
        sections: [
          {
            heading: "1. EXECUTIVE SUMMARY",
            body: article.excerpt,
          },
          {
            heading: "2. STATUTORY COMMUNIQUÉ",
            body: Array.isArray(article.body) ? article.body : [article.body || article.excerpt],
          },
          {
            heading: "3. ISSUING AUTHORITY",
            body: [
              `Official Directorate: ${article.author}`,
              `Date of Promulgation: ${article.date}`,
              `Jurisdiction / Venue: ${article.location || "National Headquarters, India"}`,
              "Certified by the National Media & Regulatory Secretariat of KALAWAR Sports & Martial Arts Federation of India.",
            ],
          },
        ],
      });
      toast.success("Official PDF Generated", {
        description: `${article.title}.pdf`,
      });
    }
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Loading official release details...</p>
        </div>
      </SiteLayout>
    );
  }

  if (isNotFound || !article) {
    return (
      <SiteLayout>
        <div className="pt-40 pb-24 text-center">
          <div className="shell max-w-lg">
            <h1 className="text-3xl font-bold text-foreground">Announcement Not Found</h1>
            <p className="text-muted-foreground text-sm mt-3">
              The announcement or circular you are looking for does not exist or has been archived.
            </p>
            <Link
              href="/news"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 px-6 py-2.5 text-xs font-semibold hover:border-primary transition-colors"
            >
              <ArrowLeft className="size-4" /> Return to News & Announcements
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const formattedDate = new Date(article.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paragraphs = Array.isArray(article.body)
    ? article.body
    : typeof article.body === "string"
    ? (article.body as string).split(/\n+/).filter(Boolean)
    : [article.excerpt];

  const isPinned = article.pinned || article.tag === "Urgent" || article.tag === "Pinned";

  return (
    <SiteLayout>
      <article className="pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-44 w-full max-w-full overflow-hidden">
        <div className="shell max-w-3xl min-w-0 space-y-8">
          {/* 1. Header & Back Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/news"
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors truncate"
            >
              <ArrowLeft className="size-3.5 sm:size-4 shrink-0" />{" "}
              <span className="truncate">Back to News & Announcements</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-bold text-primary tracking-wider uppercase">
                {article.category}
              </span>
              {isPinned && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2.5 py-1 text-xs font-extrabold uppercase">
                  ★ Pinned
                </span>
              )}
            </div>
          </div>

          {/* 2. Headline & Metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
              {article.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-muted-foreground border-b border-border/60 pb-5">
              <span className="flex items-center gap-1.5 font-medium text-foreground/90 truncate">
                <User className="size-3.5 text-primary shrink-0" /> {article.author}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Calendar className="size-3.5 text-emerald-400 shrink-0" /> {formattedDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Clock className="size-3.5 shrink-0" /> {article.readTime || "3 min read"}
              </span>
              {article.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-foreground/80 truncate">
                    <MapPin className="size-3.5 text-amber-400 shrink-0" /> {article.location}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 3. Lead Summary Excerpt */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 border-l-4 border-l-primary">
            <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed italic">
              {article.excerpt}
            </p>
          </div>

          {/* 4. Cover Banner Image */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-accent/20 w-full max-w-full shadow-lg">
            <img
              src={article.image || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80"}
              alt={article.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80";
              }}
              className="h-64 sm:h-80 md:h-96 w-full object-cover"
            />
          </div>

          {/* 5. Article Content Paragraphs */}
          <div className="space-y-4 sm:space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90 break-words [overflow-wrap:anywhere]">
            {paragraphs.map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* 6. Official Documents & Circulars Attachment Box */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 grid place-items-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {article.documentName || `${article.title} (Official Dossier)`}
                    </h3>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold uppercase">
                      Official Seal
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official ratified document · {article.documentSize || "PDF National Format"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAttachment}
                className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Download className="size-4" />
                <span>Download Attached Document</span>
              </button>
            </div>
          </div>

          {/* 7. Action Link (Direct CTA to Event / Results / Registration / Rules) */}
          {article.actionLink && (
            <div className="rounded-2xl border border-primary/30 bg-card/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Related Portal Link</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Access official tournament entries, verified results, or downloads related to this release.
                </p>
              </div>
              <Link
                href={article.actionLink}
                className="border-border/80 hover:border-primary/60 hover:bg-primary/5 text-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-colors shrink-0"
              >
                <span>{article.actionText || "View Related Section"}</span>
                <ArrowRight className="size-3.5 text-primary" />
              </Link>
            </div>
          )}

          {/* 8. Share Story & Bottom Navigation */}
          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              href="/news"
              className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-3.5 sm:size-4 shrink-0" /> Explore all announcements
            </Link>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="bg-card/60 border border-border/80 hover:border-primary/60 text-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all hover:bg-accent/40 cursor-pointer"
            >
              <Share2 className="size-3.5 text-primary shrink-0" />
              <span>Share Story</span>
            </button>
          </div>

          {/* 9. Related Announcements & Releases */}
          {relatedArticles.length > 0 && (
            <div className="pt-12 border-t border-border/60 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Related {article.category} Releases
                  </h3>
                  <p className="text-xs text-muted-foreground">More notices from the same category</p>
                </div>
                <Link
                  href="/news"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {relatedArticles.map((rel) => (
                  <NewsCard key={rel.id} item={rel} />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Share Modal */}
      {article && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          data={{
            title: article.title,
            text: article.excerpt,
            image: article.image,
            category: article.category,
          }}
        />
      )}
    </SiteLayout>
  );
}

