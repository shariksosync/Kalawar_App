/* ==============================================================================
   SUPER ADMIN CONTROL PANEL CONTROLLER
   Oversee Partner Gyms, Academies, Media Moderation, & System Users
   ============================================================================== */

class SuperAdminModule {
  constructor() {
    this.currentAdminTab = "overview";
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    // Admin Sidebar Tab Navigation
    document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-nav-item").forEach((it) => it.classList.remove("active"));
        document.querySelectorAll(".admin-view-tab").forEach((p) => p.classList.remove("active"));

        btn.parentElement.classList.add("active");
        const tabTarget = document.getElementById(btn.dataset.target);
        if (tabTarget) tabTarget.classList.add("active");
      });
    });

    // Admin Login Form
    const loginForm = document.getElementById("admin-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.AppState.setRole("super_admin");
        window.closeModal("admin-login-modal");
        window.AppState.setView("super_admin");
        window.showToast("Super Administrator Access Granted!", "success");
        this.renderAll();
      });
    }

    // Direct Footer Admin Link
    const footerAdminLink = document.getElementById("footer-admin-link");
    if (footerAdminLink) {
      footerAdminLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.AppState.currentUser.role === "super_admin") {
          window.AppState.setView("super_admin");
        } else {
          window.openModal("admin-login-modal");
        }
      });
    }
  }

  renderAll() {
    this.renderOverviewKPIs();
    this.renderGymsApprovalTable();
    this.renderAcademiesApprovalTable();
    this.renderMediaModeration();
    this.renderUsersTable();
  }

  renderOverviewKPIs() {
    const gyms = window.MockStore.getGyms();
    const academies = window.MockStore.getAcademies();
    const media = window.MockStore.getMediaPosts();
    const users = window.MockStore.getUsers();

    const gEl = document.getElementById("admin-kpi-gyms");
    const aEl = document.getElementById("admin-kpi-academies");
    const mEl = document.getElementById("admin-kpi-media");
    const uEl = document.getElementById("admin-kpi-users");

    if (gEl) gEl.innerText = gyms.length;
    if (aEl) aEl.innerText = academies.length;
    if (mEl) mEl.innerText = media.length;
    if (uEl) uEl.innerText = users.length;
  }

  renderGymsApprovalTable() {
    const tbody = document.getElementById("admin-gyms-tbody");
    if (!tbody) return;

    const gyms = window.MockStore.getGyms();
    tbody.innerHTML = gyms
      .map(
        (g) => `
      <tr>
        <td>
          <div style="font-weight: 700;">${g.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${g.id} • ${g.city}</div>
        </td>
        <td>${g.ownerName}</td>
        <td><span class="badge badge-gold">${g.category}</span></td>
        <td>${g.membersCount}</td>
        <td>
          <span class="badge ${g.status === 'Approved' ? 'badge-success' : g.status === 'Pending' ? 'badge-warning' : 'badge-danger'}">
            ${g.status}
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            ${
              g.status !== 'Approved'
                ? `<button class="btn btn-primary btn-sm" onclick="window.adminApproveGym('${g.id}')">Approve</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="window.adminSuspendGym('${g.id}')">Suspend</button>`
            }
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="window.adminDeleteGym('${g.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  renderAcademiesApprovalTable() {
    const tbody = document.getElementById("admin-academies-tbody");
    if (!tbody) return;

    const academies = window.MockStore.getAcademies();
    tbody.innerHTML = academies
      .map(
        (a) => `
      <tr>
        <td>
          <div style="font-weight: 700;">${a.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${a.id} • ${a.city}</div>
        </td>
        <td>${a.director}</td>
        <td><span class="badge badge-info">${a.sport}</span></td>
        <td>${a.studentsCount} Athletes</td>
        <td>
          <span class="badge ${a.status === 'Approved' ? 'badge-success' : 'badge-warning'}">
            ${a.status}
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            ${
              a.status !== 'Approved'
                ? `<button class="btn btn-primary btn-sm" onclick="window.adminApproveAcademy('${a.id}')">Approve</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="window.adminSuspendAcademy('${a.id}')">Suspend</button>`
            }
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="window.adminDeleteAcademy('${a.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  renderMediaModeration() {
    const container = document.getElementById("admin-media-moderation-grid");
    if (!container) return;

    const posts = window.MockStore.getMediaPosts();
    container.innerHTML = posts
      .map(
        (p) => `
      <div class="mod-post-card">
        <img src="${p.mediaUrl}" class="mod-post-thumb" alt="${p.title}" />
        <div class="mod-post-body">
          <div class="mod-post-author">${p.authorName} (${p.authorRole})</div>
          <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">${p.title}</div>
          <p class="mod-post-caption">${p.caption.substring(0, 80)}...</p>
        </div>
        <div class="mod-post-footer">
          <span style="font-size: 0.75rem; color: var(--text-muted);">${p.likesCount} Likes • ${p.commentsCount} Comments</span>
          <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="window.adminDeletePost('${p.id}')">
            Remove Post
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  renderUsersTable() {
    const tbody = document.getElementById("admin-users-tbody");
    if (!tbody) return;

    const users = window.MockStore.getUsers();
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>
          <div style="font-weight: 700;">${u.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${u.id}</div>
        </td>
        <td>${u.email}</td>
        <td><span class="badge badge-gold">${u.role}</span></td>
        <td><span class="badge badge-success">${u.status}</span></td>
        <td>
          <div class="table-action-btns">
            <button class="btn btn-outline-gold btn-sm" onclick="window.showToast('Password reset link sent to ${u.email}', 'info')">Reset Auth</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }
}

window.SuperAdminModuleInstance = new SuperAdminModule();
window.addEventListener("DOMContentLoaded", () => {
  window.SuperAdminModuleInstance.init();
});

// Admin global action triggers
window.adminApproveGym = function(gymId) {
  const gyms = window.MockStore.getGyms();
  const g = gyms.find((x) => x.id === gymId);
  if (g) {
    g.status = "Approved";
    window.MockStore.saveGyms(gyms);
    window.SuperAdminModuleInstance.renderGymsApprovalTable();
    window.GymModuleInstance.renderDirectory();
    window.showToast(`Gym "${g.name}" approved on public directory!`, "success");
  }
};

window.adminSuspendGym = function(gymId) {
  const gyms = window.MockStore.getGyms();
  const g = gyms.find((x) => x.id === gymId);
  if (g) {
    g.status = "Suspended";
    window.MockStore.saveGyms(gyms);
    window.SuperAdminModuleInstance.renderGymsApprovalTable();
    window.GymModuleInstance.renderDirectory();
    window.showToast(`Gym "${g.name}" suspended.`, "warning");
  }
};

window.adminDeleteGym = function(gymId) {
  let gyms = window.MockStore.getGyms();
  gyms = gyms.filter((x) => x.id !== gymId);
  window.MockStore.saveGyms(gyms);
  window.SuperAdminModuleInstance.renderGymsApprovalTable();
  window.GymModuleInstance.renderDirectory();
  window.showToast("Gym record removed.", "info");
};

window.adminApproveAcademy = function(acadId) {
  const academies = window.MockStore.getAcademies();
  const a = academies.find((x) => x.id === acadId);
  if (a) {
    a.status = "Approved";
    window.MockStore.saveAcademies(academies);
    window.SuperAdminModuleInstance.renderAcademiesApprovalTable();
    window.AcademyModuleInstance.renderDirectory();
    window.showToast(`Academy "${a.name}" verified & approved!`, "success");
  }
};

window.adminSuspendAcademy = function(acadId) {
  const academies = window.MockStore.getAcademies();
  const a = academies.find((x) => x.id === acadId);
  if (a) {
    a.status = "Suspended";
    window.MockStore.saveAcademies(academies);
    window.SuperAdminModuleInstance.renderAcademiesApprovalTable();
    window.AcademyModuleInstance.renderDirectory();
    window.showToast(`Academy "${a.name}" suspended.`, "warning");
  }
};

window.adminDeleteAcademy = function(acadId) {
  let academies = window.MockStore.getAcademies();
  academies = academies.filter((x) => x.id !== acadId);
  window.MockStore.saveAcademies(academies);
  window.SuperAdminModuleInstance.renderAcademiesApprovalTable();
  window.AcademyModuleInstance.renderDirectory();
  window.showToast("Academy record removed.", "info");
};

window.adminDeletePost = function(postId) {
  let posts = window.MockStore.getMediaPosts();
  posts = posts.filter((x) => x.id !== postId);
  window.MockStore.saveMediaPosts(posts);
  window.MediaModuleInstance.posts = posts;
  window.SuperAdminModuleInstance.renderMediaModeration();
  window.MediaModuleInstance.renderFeed();
  window.showToast("Media post deleted by moderation.", "info");
};
