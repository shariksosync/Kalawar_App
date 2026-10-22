import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Radio,
  Send,
  UserPlus,
  UserCheck,
  Shield,
  Hash,
  Eye,
  Bell,
  BellRing,
  LogIn
} from "lucide-react";
import UserMenuDropdown from "../common/UserMenuDropdown";

export default function MediaFeed() {
  const {
    mediaPosts,
    currentUser,
    followStatuses,
    likedPosts,
    subscribedCreators,
    openModal,
    showToast,
    toggleFollow,
    toggleLike,
    toggleSubscribe,
    addComment,
    checkAuth
  } = useApp();

  const [activeCategory, setActiveCategory] = useState("All");
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [mutedVideoId, setMutedVideoId] = useState(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  // Categories
  const categories = [
    { id: "All", label: "All Reels & Feeds" },
    { id: "Kalawar", label: "Kalawar Athletes" },
    { id: "Gym", label: "Gym Partners" },
    { id: "Academy", label: "Academy Dojos" },
    { id: "Creator", label: "Media Creators" }
  ];

  // Filter posts
  const filteredPosts = mediaPosts.filter((post) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Kalawar") return post.authorRole?.toLowerCase().includes("kalawar");
    if (activeCategory === "Gym") return post.authorRole?.toLowerCase().includes("gym");
    if (activeCategory === "Academy") return post.authorRole?.toLowerCase().includes("academy");
    if (activeCategory === "Creator") return post.authorRole?.toLowerCase().includes("creator") || post.authorRole?.toLowerCase().includes("media");
    return true;
  });

  const handleTogglePlay = (id) => {
    setPlayingVideoId(playingVideoId === id ? null : id);
  };

  const handleToggleMute = (id) => {
    setMutedVideoId(mutedVideoId === id ? null : id);
  };

  const handleShare = (post) => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Direct link to "${post.title}" copied to clipboard!`, "info");
  };

  const handleCommentSubmit = (e, postId) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text);
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  // Featured Creators for sidebar
  const featuredCreators = [
    { id: "user-kalawar-01", name: "Arjun Verma (2nd Dan)", handle: "@arjun_karate_pro", role: "Kalawar Athlete", avatar: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80" },
    { id: "gym-001", name: "Titan Force Gym", handle: "@titanforce_official", role: "Gym Partner", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&q=80" },
    { id: "acad-001", name: "Vanguard Academy", handle: "@vanguard_academy", role: "Sports Academy", avatar: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=200&q=80" },
    { id: "user-media-01", name: "Rohan Kapoor", handle: "@rohan_sports_talk", role: "Media Creator", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" }
  ];

  const trendingTags = [
    { tag: "#KalawarMartialArts", count: "142.5K views" },
    { tag: "#DeadliftPR", count: "98.2K views" },
    { tag: "#BlackBeltGrading", count: "64.1K views" },
    { tag: "#OlympicFreestyle", count: "48.9K views" },
    { tag: "#YouthFootballScouting", count: "36.4K views" }
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Reel Upload Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-obsidian-900 via-obsidian-800 to-obsidian-900 border border-gold-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" /> Kalawar Media Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Athlete Showcase & Reels
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-bold text-white tracking-wide">
              Federation Media & Athlete Reels
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Watch official technique masterclasses, match highlights, training reels, and partner workouts. Connect with mutual athlete follows across India.
            </p>
          </div>

          {!currentUser || !currentUser.isRegistered ? (
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <button
                onClick={() => openModal("auth_modal", { defaultTab: "signin", defaultRole: "media_creator" })}
                className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-gold-500/30 hover:border-gold-500 hover:text-gold-400 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openModal("auth_modal", { defaultTab: "register", defaultRole: "media_creator" })}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 text-obsidian-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-gold-500/20"
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <button
                onClick={() => openModal("media_upload")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 font-bold text-xs shadow-xl shadow-gold-500/20 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" /> Publish Reel / Clip
              </button>
              <UserMenuDropdown />
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-md shadow-gold-500/20"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Feed + Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media Feed Posts (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-obsidian-900/60 border border-white/10 rounded-3xl p-12 text-center">
              <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No reels found in this category</h3>
              <p className="text-xs text-gray-400 mb-4">Be the first to upload a video or photo to this stream!</p>
              <button
                onClick={() => openModal("media_upload")}
                className="px-4 py-2 rounded-xl bg-gold-500 text-obsidian-950 text-xs font-bold"
              >
                Upload First Clip
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = likedPosts.has(post.id);
              const isPlaying = playingVideoId === post.id;
              const isMuted = mutedVideoId === post.id;
              const isCommentsOpen = openCommentsPostId === post.id;
              const followStatus = followStatuses[post.authorId] || "none";
              const isSubscribed = subscribedCreators.has(post.authorId);

              return (
                <div
                  key={post.id}
                  className="bg-obsidian-900/70 border border-white/10 hover:border-gold-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all"
                >
                  {/* Author Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-gold-500/30"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-obsidian-950" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate hover:text-gold-300 transition-colors cursor-pointer">
                            {post.authorName}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-semibold flex-shrink-0">
                            {post.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{post.authorHandle}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Follow / Mutual Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleFollow(post.authorId, post.authorName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          followStatus === "mutual"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                            : followStatus === "requested"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                            : "bg-white/5 hover:bg-gold-500/10 text-gray-300 hover:text-gold-300 border border-white/10 hover:border-gold-500/30"
                        }`}
                        title="Mutual follow system simulation"
                      >
                        {followStatus === "mutual" ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Mutual
                          </>
                        ) : followStatus === "requested" ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> Requested
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Follow
                          </>
                        )}
                      </button>

                      {/* Subscribe Channel Button */}
                      <button
                        onClick={() => toggleSubscribe(post.authorId, post.authorName)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isSubscribed
                            ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                            : "bg-white/5 text-gray-400 hover:text-white border-white/10"
                        }`}
                        title={isSubscribed ? "Subscribed to alerts" : "Subscribe to Channel"}
                      >
                        {isSubscribed ? <BellRing className="w-4 h-4 text-gold-400" /> : <Bell className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Media Content Container */}
                  <div className="relative aspect-video bg-black overflow-hidden group">
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isPlaying ? "scale-105" : "scale-100 group-hover:scale-102"
                      }`}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/30 pointer-events-none" />

                    {/* Live Reel Pill */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        LIVE REEL SIMULATION
                      </span>
                      {post.duration && (
                        <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-gray-300">
                          {post.duration}
                        </span>
                      )}
                    </div>

                    {/* Simulation Play / Pause Button Center */}
                    {post.mediaType === "video" && (
                      <button
                        onClick={() => handleTogglePlay(post.id)}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-obsidian-950/70 border border-gold-500/40 backdrop-blur-md text-gold-400 flex items-center justify-center hover:scale-110 hover:bg-gold-500 hover:text-obsidian-950 transition-all shadow-2xl"
                      >
                        {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                      </button>
                    )}

                    {/* Media Controls Bottom Bar */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMute(post.id)}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-gold-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Simulated playing timeline */}
                    {isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-gold-500 animate-pulse" style={{ width: "65%" }} />
                      </div>
                    )}
                  </div>

                  {/* Post Details & Title */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-white hover:text-gold-300 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {post.caption}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {post.hashtags.split(" ").map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium text-gold-400 hover:underline cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar (Like, Comment, Share, Views) */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                            isLiked
                              ? "text-red-400 scale-105"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                          <span>{post.likesCount + (isLiked ? 1 : 0)}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount + (post.comments ? post.comments.length : 0)} Comments</span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.viewsCount.toLocaleString()} views</span>
                      </div>
                    </div>

                    {/* Expandable Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="pt-4 mt-3 border-t border-white/5 space-y-3 animate-fadeIn">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Community Discussions
                        </h5>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((c, idx) => (
                              <div key={idx} className="bg-obsidian-950/60 rounded-xl p-3 border border-white/5 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-gold-300">{c.author}</span>
                                  <span className="text-[10px] text-gray-500">Just now</span>
                                </div>
                                <p className="text-gray-300">{c.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 italic py-2">No comments yet. Start the conversation!</p>
                          )}
                        </div>

                        {/* Comment Input Form */}
                        <form
                          onSubmit={(e) => handleCommentSubmit(e, post.id)}
                          className="flex items-center gap-2 pt-2"
                        >
                          <input
                            type="text"
                            placeholder="Add your technique feedback or cheer..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                            }
                            className="flex-1 bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                          />
                          <button
                            type="submit"
                            className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 transition-all flex items-center justify-center shadow-md shadow-gold-500/10"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Sticky Sidebar (1 col wide) */}
        <div className="space-y-6">
          {/* Featured Creators to Follow */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400" /> Featured Creators
              </h3>
              <span className="text-[11px] text-gray-400">Verified</span>
            </div>

            <div className="space-y-3">
              {featuredCreators.map((creator) => {
                const status = followStatuses[creator.id] || "none";
                return (
                  <div key={creator.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-gold-500/20"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{creator.name}</h4>
                        <p className="text-[11px] text-gray-400 truncate">{creator.handle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(creator.id, creator.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                        status === "mutual"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : status === "requested"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30"
                      }`}
                    >
                      {status === "mutual" ? "Mutual" : status === "requested" ? "Sent" : "+ Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Federation Hashtags */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-400" /> Trending Hashtags
            </h3>

            <div className="space-y-2.5">
              {trendingTags.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => showToast(`Filtered feed by ${t.tag}`, "info")}
                  className="p-2.5 rounded-xl bg-obsidian-950/50 hover:bg-gold-500/10 border border-white/5 hover:border-gold-500/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-xs font-semibold text-white">{t.tag}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Creator Program Callout */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500/20 via-obsidian-900 to-obsidian-950 border border-gold-500/30 p-6 shadow-xl">
            <Shield className="w-8 h-8 text-gold-400 mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Federation Creator Fund</h4>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              Are you an athletic trainer, combat athlete, or fitness vlogger? Get verified badges, sponsor matching, and tournament sideline passes.
            </p>
            <button
              onClick={() => showToast("Creator program application submitted for review!", "success")}
              className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-bold transition-all shadow-md shadow-gold-500/20"
            >
              Apply for Creator Badge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
