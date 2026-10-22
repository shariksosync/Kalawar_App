import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_GYMS, INITIAL_ACADEMIES, INITIAL_MEDIA_POSTS, INITIAL_USERS } from "../data/mockData";

export const PRESET_ROLES = {
  anonymous: {
    role: "anonymous",
    title: "Anonymous Visitor",
    name: "Guest Explorer",
    handle: "@guest",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    badge: "Guest Mode (Read Only)",
    isRegistered: false,
  },
  kalawar_user: {
    role: "kalawar_user",
    title: "Kalawar Athlete / Coach",
    name: "Arjun Verma (2nd Dan)",
    handle: "@arjun_karate_pro",
    avatar: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80",
    badge: "Kalawar Verified Player",
    isRegistered: true,
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
    isRegistered: true,
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
    isRegistered: true,
  },
  media_creator: {
    role: "media_creator",
    title: "Registered Media User",
    name: "Rohan Kapoor",
    handle: "@rohan_sports_talk",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    badge: "Media Creator",
    isRegistered: true,
  },
  super_admin: {
    role: "super_admin",
    title: "Super Administrator",
    name: "Federation Overseer",
    handle: "@superadmin",
    avatar: "/assets/logo.png",
    badge: "System Super Admin",
    isRegistered: true,
  },
};

const AppContext = createContext();

export function AppContextProvider({ children }) {
  // Current user & view
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_active_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved session", e);
        }
      }
    }
    return PRESET_ROLES.anonymous;
  });
  const [activeView, setActiveView] = useState("home");

  // Persistent storage datasets
  const [gyms, setGyms] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_gyms");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_GYMS;
  });

  const [academies, setAcademies] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_academies");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_ACADEMIES;
  });

  const [mediaPosts, setMediaPosts] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_media");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_MEDIA_POSTS;
  });

  const [users, setUsers] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_users");
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_USERS;
  });

  const [followStatuses, setFollowStatuses] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_follows");
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  const [likedPosts, setLikedPosts] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_likes");
      if (saved) return new Set(JSON.parse(saved));
    }
    return new Set();
  });

  const [subscribedCreators, setSubscribedCreators] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kalawar_react_subs");
      if (saved) return new Set(JSON.parse(saved));
    }
    return new Set();
  });

  // Toasts & Modals
  const [toasts, setToasts] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_gyms", JSON.stringify(gyms));
    }
  }, [gyms]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_academies", JSON.stringify(academies));
    }
  }, [academies]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_media", JSON.stringify(mediaPosts));
    }
  }, [mediaPosts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_users", JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_follows", JSON.stringify(followStatuses));
    }
  }, [followStatuses]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_likes", JSON.stringify(Array.from(likedPosts)));
    }
  }, [likedPosts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_react_subs", JSON.stringify(Array.from(subscribedCreators)));
    }
  }, [subscribedCreators]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_active_session", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Toast dispatch
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Modals
  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  // Login handler with role or credentials
  const loginUser = (roleKey, customUserData = null) => {
    let userObj = PRESET_ROLES[roleKey] ? { ...PRESET_ROLES[roleKey] } : { ...PRESET_ROLES.kalawar_user };
    if (customUserData) {
      userObj = { ...userObj, ...customUserData };
    }
    userObj.isRegistered = true;
    setCurrentUser(userObj);
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_active_session", JSON.stringify(userObj));
    }
    closeModal();
    showToast(`Signed in successfully as ${userObj.name} (${userObj.badge})`, "success");

    if (roleKey === "gym_partner") {
      setView("gym_admin");
    } else if (roleKey === "academy_partner") {
      setView("academy_admin");
    } else if (roleKey === "super_admin") {
      setView("super_admin");
    }
  };

  // Logout handler
  const logoutUser = () => {
    const guest = { ...PRESET_ROLES.anonymous };
    setCurrentUser(guest);
    if (typeof window !== "undefined") {
      localStorage.setItem("kalawar_active_session", JSON.stringify(guest));
    }
    showToast("Signed out. You are now browsing in Guest Explorer mode.", "info");
    if (activeView === "gym_admin") setView("gym");
    else if (activeView === "academy_admin") setView("academy");
    else if (activeView === "super_admin") setView("home");
  };

  // Switch role
  const setRole = (roleKey) => {
    if (PRESET_ROLES[roleKey]) {
      const selected = { ...PRESET_ROLES[roleKey] };
      setCurrentUser(selected);
      if (typeof window !== "undefined") {
        localStorage.setItem("kalawar_active_session", JSON.stringify(selected));
      }
      showToast(`Switched active profile: ${selected.name} (${selected.badge})`, "success");
      if (roleKey === "gym_partner") setActiveView("gym_admin");
      else if (roleKey === "academy_partner") setActiveView("academy_admin");
      else if (roleKey === "super_admin") setActiveView("super_admin");
    }
  };

  // Switch view
  const setView = (viewName) => {
    setActiveView(viewName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auth Gatekeeper Check
  const checkAuth = (actionDescription) => {
    if (!currentUser || !currentUser.isRegistered) {
      openModal("auth_modal", { defaultTab: "signin", action: actionDescription });
      return false;
    }
    return true;
  };

  // Follow / Mutual Follow Handler
  const toggleFollow = (targetId, targetName) => {
    if (!checkAuth("send follow requests")) return;

    const currentStatus = followStatuses[targetId] || "none";
    let nextStatus = "none";
    let message = "";

    if (currentStatus === "none") {
      nextStatus = "requested";
      message = `Follow request sent to ${targetName}!`;
    } else if (currentStatus === "requested") {
      nextStatus = "mutual";
      message = `You and ${targetName} are now Mutual Followers!`;
    } else {
      nextStatus = "none";
      message = `Unfollowed ${targetName}.`;
    }

    setFollowStatuses((prev) => ({ ...prev, [targetId]: nextStatus }));
    showToast(message, nextStatus === "mutual" ? "success" : "info");
  };

  // Like handler
  const toggleLike = (postId) => {
    if (!checkAuth("like this video")) return;

    const newLiked = new Set(likedPosts);
    let liked = false;
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
      liked = false;
    } else {
      newLiked.add(postId);
      liked = true;
    }
    setLikedPosts(newLiked);
    showToast(liked ? "Liked post! ❤️" : "Unliked post", "info");
  };

  // Subscribe handler
  const toggleSubscribe = (creatorId, creatorName) => {
    if (!checkAuth("subscribe to creator channels")) return;

    const newSubs = new Set(subscribedCreators);
    let subbed = false;
    if (newSubs.has(creatorId)) {
      newSubs.delete(creatorId);
      subbed = false;
    } else {
      newSubs.add(creatorId);
      subbed = true;
    }
    setSubscribedCreators(newSubs);
    showToast(subbed ? `Subscribed to ${creatorName}! 🔔` : `Unsubscribed from ${creatorName}`, "info");
  };

  // Add comment
  const addComment = (postId, text) => {
    if (!checkAuth("comment on posts")) return;

    setMediaPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, { author: currentUser.name, text }],
          };
        }
        return p;
      })
    );
    showToast("Comment posted!", "success");
  };

  // Upload new media post
  const uploadMedia = (postData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.handle || "user-self",
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorRole: currentUser.title,
      authorAvatar: currentUser.avatar,
      title: postData.title,
      caption: postData.caption,
      hashtags: postData.hashtags || "#KalawarSports #AthleticExcellence",
      mediaType: postData.mediaType || "video",
      mediaUrl: postData.mediaUrl,
      duration: postData.mediaType === "video" ? "0:42" : null,
      likesCount: 1,
      commentsCount: 0,
      viewsCount: 18,
      timestamp: "Just now",
      comments: [],
    };

    setMediaPosts((prev) => [newPost, ...prev]);
    setLikedPosts((prev) => new Set([...prev, newPost.id]));
    closeModal();
    showToast("Your media has been published to the community feed!", "success");
  };

  // Gym Partner Onboarding
  const registerGym = (gymData) => {
    const newGym = {
      id: `gym-${Date.now()}`,
      name: gymData.name,
      ownerName: gymData.ownerName,
      city: gymData.city,
      address: gymData.address,
      phone: gymData.phone,
      email: gymData.email,
      category: gymData.category,
      rating: 5.0,
      reviewsCount: 1,
      monthlyPrice: parseInt(gymData.monthlyPrice || "3500", 10),
      annualPrice: parseInt(gymData.monthlyPrice || "3500", 10) * 8,
      image: gymData.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      amenities: ["Strength Training", "Cardio Deck", "Locker Room", "Trainer Guidance"],
      status: "Approved",
      membersCount: 1,
      monthlyRevenue: parseInt(gymData.monthlyPrice || "3500", 10),
      trainersCount: 2,
      description: gymData.description || "Newly onboarded partner club under Kalawar Federation.",
    };

    setGyms((prev) => [newGym, ...prev]);

    // Switch to Gym Partner session
    setCurrentUser({
      role: "gym_partner",
      title: "Gym Partner Owner",
      name: newGym.ownerName,
      handle: `@${newGym.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatar: newGym.image,
      gymId: newGym.id,
      gymName: newGym.name,
      badge: "Partner Gym Admin",
      isRegistered: true,
    });

    closeModal();
    setActiveView("gym_admin");
    showToast(`Welcome ${newGym.ownerName}! Your Gym Admin Panel is ready.`, "success");
  };

  // Academy Partner Onboarding
  const registerAcademy = (acadData) => {
    const newAcad = {
      id: `acad-${Date.now()}`,
      name: acadData.name,
      director: acadData.director,
      sport: acadData.sport,
      city: acadData.city,
      address: acadData.address,
      phone: acadData.phone,
      email: acadData.email,
      rating: 5.0,
      studentsCount: 25,
      coachesCount: 2,
      medalsWon: 0,
      monthlyFee: parseInt(acadData.monthlyFee || "2500", 10),
      image: acadData.image || "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      status: "Approved",
      ageGroups: ["Grassroots (6-12)", "Cadet (13-17)", "Senior (18+)"],
      batches: [
        { name: "Inaugural Batch", time: "06:00 AM - 07:30 AM", days: "Mon - Sat", coach: acadData.director, enrolled: 15, capacity: 25 },
      ],
      description: acadData.description || "Premier sports academy affiliated with Kalawar National Federation.",
    };

    setAcademies((prev) => [newAcad, ...prev]);

    // Switch to Academy Partner session
    setCurrentUser({
      role: "academy_partner",
      title: "Sports Academy Director",
      name: newAcad.director,
      handle: `@${newAcad.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatar: newAcad.image,
      academyId: newAcad.id,
      academyName: newAcad.name,
      badge: "Sports Academy Admin",
      isRegistered: true,
    });

    closeModal();
    setActiveView("academy_admin");
    showToast(`Welcome Director ${newAcad.director}! Your Academy Admin Panel is active.`, "success");
  };

  // Super Admin Action Handlers
  const approveGym = (id) => {
    setGyms((prev) => prev.map((g) => (g.id === id ? { ...g, status: "Approved" } : g)));
    showToast("Gym approved on public directory!", "success");
  };

  const suspendGym = (id) => {
    setGyms((prev) => prev.map((g) => (g.id === id ? { ...g, status: "Suspended" } : g)));
    showToast("Gym suspended.", "warning");
  };

  const deleteGym = (id) => {
    setGyms((prev) => prev.filter((g) => g.id !== id));
    showToast("Gym record removed.", "info");
  };

  const approveAcademy = (id) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Approved" } : a)));
    showToast("Sports Academy verified & approved!", "success");
  };

  const suspendAcademy = (id) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Suspended" } : a)));
    showToast("Sports Academy suspended.", "warning");
  };

  const deleteAcademy = (id) => {
    setAcademies((prev) => prev.filter((a) => a.id !== id));
    showToast("Sports Academy record removed.", "info");
  };

  const deletePost = (id) => {
    setMediaPosts((prev) => prev.filter((p) => p.id !== id));
    showToast("Post removed by moderation.", "info");
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeView,
        gyms,
        academies,
        mediaPosts,
        users,
        followStatuses,
        likedPosts,
        subscribedCreators,
        toasts,
        activeModal,
        modalData,
        setRole,
        loginUser,
        logoutUser,
        setView,
        openModal,
        closeModal,
        showToast,
        checkAuth,
        toggleFollow,
        toggleLike,
        toggleSubscribe,
        addComment,
        uploadMedia,
        registerGym,
        registerAcademy,
        approveGym,
        suspendGym,
        deleteGym,
        approveAcademy,
        suspendAcademy,
        deleteAcademy,
        deletePost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
