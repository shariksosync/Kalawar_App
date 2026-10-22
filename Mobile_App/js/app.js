/* ==============================================================================
   CORE APPLICATION INITIALIZATION & ROUTING CONTROLLER
   ============================================================================== */

// Toast System
window.showToast = function (message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "✓",
    danger: "✕",
    warning: "⚠️",
    info: "ℹ️",
  };

  toast.innerHTML = `
    <span style="font-weight: 700; color: var(--gold-primary);">${iconMap[type] || "•"}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Modal System
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
};

// Close modal when clicking on overlay background
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
    document.body.style.overflow = "";
  }
});

// App Router & View Controller
class AppRouter {
  constructor() {
    this.views = {
      home: document.getElementById("view-home"),
      gym: document.getElementById("view-gym"),
      gym_admin: document.getElementById("view-gym-admin"),
      academy: document.getElementById("view-academy"),
      academy_admin: document.getElementById("view-academy-admin"),
      media: document.getElementById("view-media"),
      super_admin: document.getElementById("view-super-admin"),
    };
  }

  init() {
    this.setupNavLinks();
    this.setupRoleSwitcher();
    this.setupMobileMenu();
    this.subscribeToState();

    // Handle hash on page load
    const hash = window.location.hash.replace("#", "") || "home";
    this.navigate(hash);
  }

  setupNavLinks() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        const target = link.dataset.target;
        if (target === "kalawar") {
          e.preventDefault();
          window.open("http://localhost:3000", "_blank");
          window.showToast("Opening Kalawar National Federation Website...", "info");
          return;
        }

        e.preventDefault();
        this.navigate(target);
      });
    });
  }

  navigate(viewName) {
    if (!this.views[viewName]) {
      viewName = "home";
    }

    // Hide all views
    Object.values(this.views).forEach((v) => {
      if (v) v.classList.remove("active");
    });

    // Show target view
    if (this.views[viewName]) {
      this.views[viewName].classList.add("active");
    }

    // Update nav link active states
    document.querySelectorAll(".nav-link").forEach((link) => {
      if (link.dataset.target === viewName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Carousel visibility: only show on Home view or scroll to content
    const heroSection = document.querySelector(".hero-carousel-section");
    if (heroSection) {
      if (viewName === "home") {
        heroSection.style.display = "block";
      } else {
        heroSection.style.display = "none";
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.hash = viewName;
    window.AppState.activeView = viewName;

    // Trigger admin refresh if entering super_admin
    if (viewName === "super_admin" && window.SuperAdminModuleInstance) {
      window.SuperAdminModuleInstance.renderAll();
    }
  }

  setupRoleSwitcher() {
    document.querySelectorAll(".role-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        window.AppState.setRole(role);
        
        document.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const user = window.AppState.currentUser;
        window.showToast(`Switched active profile: ${user.name} (${user.badge})`, "success");

        // If switched to gym partner, option to open gym admin
        if (role === "gym_partner") {
          this.navigate("gym_admin");
        } else if (role === "academy_partner") {
          this.navigate("academy_admin");
        } else if (role === "super_admin") {
          this.navigate("super_admin");
        }
      });
    });
  }

  setupMobileMenu() {
    const mobileBtn = document.querySelector(".mobile-toggle");
    const navMenu = document.querySelector(".nav-menu");
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener("click", () => {
        const isHidden = window.getComputedStyle(navMenu).display === "none";
        navMenu.style.display = isHidden ? "flex" : "none";
        if (isHidden) {
          navMenu.style.flexDirection = "column";
          navMenu.style.position = "absolute";
          navMenu.style.top = "76px";
          navMenu.style.left = "0";
          navMenu.style.width = "100%";
          navMenu.style.background = "#0a0c0f";
          navMenu.style.padding = "20px";
          navMenu.style.borderBottom = "1px solid var(--border-gold)";
        }
      });
    }
  }

  subscribeToState() {
    window.AppState.subscribe((event, payload) => {
      if (event === "roleChanged") {
        const user = payload;
        const nameEl = document.getElementById("current-user-display-name");
        const roleBadgeEl = document.getElementById("current-user-role-badge");
        if (nameEl) nameEl.innerText = user.name;
        if (roleBadgeEl) roleBadgeEl.innerText = user.badge;
      }
      if (event === "viewChanged") {
        this.navigate(payload);
      }
    });
  }
}

window.quickRegisterMediaUser = function () {
  window.AppState.setRole("media_creator");
  window.closeModal("media-gatekeeper-modal");
  window.showToast("Registered as Media User Rohan Kapoor! All actions unlocked.", "success");
};

window.quickRegisterKalawarUser = function () {
  window.AppState.setRole("kalawar_user");
  window.closeModal("media-gatekeeper-modal");
  window.showToast("Registered as Kalawar Athlete Arjun Verma! All actions unlocked.", "success");
};

window.addEventListener("DOMContentLoaded", () => {
  window.AppRouterInstance = new AppRouter();
  window.AppRouterInstance.init();
});
