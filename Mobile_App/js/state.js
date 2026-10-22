/* ==============================================================================
   GLOBAL APPLICATION STATE MANAGEMENT
   Handles Active Session, Role Switching, Mutual Follows, & Navigation
   ============================================================================== */

const PRESET_ROLES = {
  anonymous: {
    role: "anonymous",
    title: "Anonymous Visitor",
    name: "Guest Explorer",
    handle: "@guest",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    badge: "Guest Mode (Read Only)",
    isRegistered: false
  },
  kalawar_user: {
    role: "kalawar_user",
    title: "Kalawar Athlete / Coach",
    name: "Arjun Verma (2nd Dan)",
    handle: "@arjun_karate_pro",
    avatar: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80",
    badge: "Kalawar Verified Player",
    isRegistered: true
  },
  gym_partner: {
    role: "gym_partner",
    title: "Gym Partner Owner",
    name: "Vikram Malhotra",
    handle: "@titanforce_official",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&q=80",
    gymId: "gym-001",
    gymName: "Titan Force Elite Fitness & Combat",
    badge: "Partner Gym Admin",
    isRegistered: true
  },
  academy_partner: {
    role: "academy_partner",
    title: "Sports Academy Director",
    name: "Master Rajesh Sharma",
    handle: "@vanguard_academy",
    avatar: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=200&q=80",
    academyId: "acad-001",
    academyName: "Vanguard Martial Arts & Taekwondo Academy",
    badge: "Sports Academy Admin",
    isRegistered: true
  },
  media_creator: {
    role: "media_creator",
    title: "Registered Media User",
    name: "Rohan Kapoor",
    handle: "@rohan_sports_talk",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    badge: "Media Creator",
    isRegistered: true
  },
  super_admin: {
    role: "super_admin",
    title: "Super Administrator",
    name: "Federation Overseer",
    handle: "@superadmin",
    avatar: "assets/logo.png",
    badge: "System Super Admin",
    isRegistered: true
  }
};

class AppState {
  constructor() {
    this.currentUser = PRESET_ROLES.anonymous;
    this.activeView = "home";
    this.listeners = [];
    
    // Mutual Follows tracking (Instagram model)
    // Saved in localStorage
    this.followStatuses = JSON.parse(localStorage.getItem("kalawar_demo_follows") || "{}");
    this.likedPosts = new Set(JSON.parse(localStorage.getItem("kalawar_demo_likes") || "[]"));
    this.subscribedCreators = new Set(JSON.parse(localStorage.getItem("kalawar_demo_subs") || "[]"));
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(event, payload) {
    this.listeners.forEach((fn) => fn(event, payload));
  }

  setRole(roleKey) {
    if (PRESET_ROLES[roleKey]) {
      this.currentUser = { ...PRESET_ROLES[roleKey] };
      this.notify("roleChanged", this.currentUser);
    }
  }

  setView(viewName) {
    this.activeView = viewName;
    this.notify("viewChanged", viewName);
  }

  // Follow logic: 'none' -> 'requested' -> 'mutual'
  getFollowStatus(targetId) {
    return this.followStatuses[targetId] || "none";
  }

  toggleFollow(targetId, targetName) {
    const current = this.getFollowStatus(targetId);
    let nextStatus = "none";
    let message = "";

    if (current === "none") {
      // Send Follow Request just like Instagram
      nextStatus = "requested";
      message = `Follow request sent to ${targetName}!`;
    } else if (current === "requested") {
      // In demo simulation, clicking again accepts reciprocal request and becomes mutual!
      nextStatus = "mutual";
      message = `You and ${targetName} are now Mutual Followers!`;
    } else {
      nextStatus = "none";
      message = `Unfollowed ${targetName}.`;
    }

    this.followStatuses[targetId] = nextStatus;
    localStorage.setItem("kalawar_demo_follows", JSON.stringify(this.followStatuses));
    this.notify("followChanged", { targetId, status: nextStatus, message });
    return { status: nextStatus, message };
  }

  isLiked(postId) {
    return this.likedPosts.has(postId);
  }

  toggleLike(postId) {
    let liked = false;
    if (this.likedPosts.has(postId)) {
      this.likedPosts.delete(postId);
      liked = false;
    } else {
      this.likedPosts.add(postId);
      liked = true;
    }
    localStorage.setItem("kalawar_demo_likes", JSON.stringify(Array.from(this.likedPosts)));
    this.notify("likeChanged", { postId, liked });
    return liked;
  }

  isSubscribed(creatorId) {
    return this.subscribedCreators.has(creatorId);
  }

  toggleSubscribe(creatorId) {
    let subscribed = false;
    if (this.subscribedCreators.has(creatorId)) {
      this.subscribedCreators.delete(creatorId);
      subscribed = false;
    } else {
      this.subscribedCreators.add(creatorId);
      subscribed = true;
    }
    localStorage.setItem("kalawar_demo_subs", JSON.stringify(Array.from(this.subscribedCreators)));
    this.notify("subChanged", { creatorId, subscribed });
    return subscribed;
  }
}

window.AppState = new AppState();
