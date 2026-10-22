import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { UploadCloud, Video, Image, X, Sparkles, Hash, Tag } from "lucide-react";

export default function MediaUploadModal() {
  const { activeModal, closeModal, uploadMedia, currentUser } = useApp();

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    hashtags: "#KalawarSports #AthleticExcellence #CombatTraining",
    mediaType: "video",
    mediaUrl: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1000&q=80"
  });

  if (activeModal !== "media_upload" && activeModal !== "mediaUpload") return null;

  const sampleMediaUrls = [
    { label: "High Kick Martial Arts Drill", url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1000&q=80", type: "video" },
    { label: "Heavy Barbell Strength Set", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80", type: "video" },
    { label: "Black Belt Podium Ceremony", url: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1000&q=80", type: "photo" },
    { label: "Athlete Speed & Agility Ladders", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80", type: "video" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadMedia(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-obsidian-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl shadow-gold-500/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">Publish Athletic Reel / Clip</h3>
            <p className="text-xs text-gray-400">
              Posting as: <span className="text-gold-400 font-semibold">{currentUser.name}</span> ({currentUser.badge})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Media Type Toggle */}
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
              Media Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mediaType: "video" })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  formData.mediaType === "video"
                    ? "bg-gold-500 text-obsidian-950 border-gold-500 shadow-md shadow-gold-500/20"
                    : "bg-obsidian-950/70 border-white/10 text-gray-300 hover:border-white/20"
                }`}
              >
                <Video className="w-4 h-4" /> Video Reel (0:45)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mediaType: "photo" })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  formData.mediaType === "photo"
                    ? "bg-gold-500 text-obsidian-950 border-gold-500 shadow-md shadow-gold-500/20"
                    : "bg-obsidian-950/70 border-white/10 text-gray-300 hover:border-white/20"
                }`}
              >
                <Image className="w-4 h-4" /> Athletic Photo
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-300 block mb-1 font-medium">Reel Headline / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 540 Spinning Hook Kick Masterclass 🥋💥"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs text-gray-300 block mb-1 font-medium">Caption & Technique Breakdown *</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the drill, form cues, reps, sets, or competition highlights..."
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full bg-obsidian-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 resize-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-xs text-gray-300 block mb-1 font-medium flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-gold-400" /> Federation Hashtags
            </label>
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Preset Media Samples */}
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
              Select Demo Media Clip
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sampleMediaUrls.map((sample, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setFormData({ ...formData, mediaUrl: sample.url, mediaType: sample.type })}
                  className={`p-2.5 rounded-xl border text-left text-[11px] transition-all flex items-center gap-2 ${
                    formData.mediaUrl === sample.url
                      ? "bg-gold-500/10 border-gold-500 text-gold-300 font-medium"
                      : "bg-obsidian-950/50 border-white/5 text-gray-400 hover:border-white/15"
                  }`}
                >
                  <img src={sample.url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  <span className="truncate">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 text-obsidian-950 text-xs font-bold transition-all shadow-lg shadow-gold-500/20"
            >
              Publish to Federation Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
