/* ==============================================================================
   GYM & FITNESS MODULE CONTROLLER
   Directory, Filters, Partner Onboarding, & Full Partner Admin Panel
   ============================================================================== */

// Pre-seeded Gym Admin Demo Data for Partner Panel
const INITIAL_GYM_MEMBERS = [
  { id: "MBR-101", name: "Rahul Deshmukh", plan: "Annual Platinum", joined: "2025-08-14", status: "Active", phone: "+91 98221 44001", expiry: "2026-08-14", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-102", name: "Sneha Kulkarni", plan: "Monthly Gold", joined: "2026-09-01", status: "Active", phone: "+91 98222 55112", expiry: "2026-11-01", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-103", name: "Aditya Nair", plan: "Quarterly Pro", joined: "2026-06-12", status: "Expiring Soon", phone: "+91 98230 66223", expiry: "2026-10-28", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-104", name: "Pooja Hegde", plan: "Annual VIP Pass", joined: "2025-11-20", status: "Active", phone: "+91 98240 77334", expiry: "2026-11-20", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
  { id: "MBR-105", name: "Tanmay Bhatia", plan: "Monthly Gold", joined: "2026-08-10", status: "Expired", phone: "+91 98250 88445", expiry: "2026-09-10", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" }
];

const INITIAL_GYM_EMPLOYEES = [
  { id: "EMP-01", name: "Devendra Rathore", role: "Head Strength Coach", shift: "Morning (06:00 - 14:00)", salary: "₹65,000", status: "Active", cert: "CSCS / KSMFI Coach Level 3" },
  { id: "EMP-02", name: "Simran Kaur", role: "Senior CrossFit Trainer", shift: "Evening (14:00 - 22:00)", salary: "₹52,000", status: "Active", cert: "CrossFit L2 / Kettlebell Pro" },
  { id: "EMP-03", name: "Dr. Alok Pandey", role: "In-house Sports Physio", shift: "General (10:00 - 18:00)", salary: "₹70,000", status: "Active", cert: "MPT Sports Rehabilitation" },
  { id: "EMP-04", name: "Nisha Patel", role: "Front Desk & Member Manager", shift: "Morning (07:00 - 15:00)", salary: "₹32,000", status: "Active", cert: "Hospitality & CPR Certified" }
];

const INITIAL_GYM_SUBSCRIPTIONS = [
  { id: "PLAN-01", name: "Monthly Gold Pass", price: "₹3,500", duration: "1 Month", activeUsers: 142, perks: ["All Strength Equipment", "Cardio Zone", "Steam & Locker"] },
  { id: "PLAN-02", name: "Quarterly Pro Combat", price: "₹9,500", duration: "3 Months", activeUsers: 98, perks: ["All Gold Perks", "Octagon MMA Classes", "CrossFit WOD Access"] },
  { id: "PLAN-03", name: "Annual Platinum Elite", price: "₹28,000", duration: "12 Months", activeUsers: 125, perks: ["Full 24/7 Access", "Monthly Physio Checkup", "Personal Trainer (2x/mo)", "VIP Locker"] }
];

class GymModule {
  constructor() {
    this.members = JSON.parse(localStorage.getItem("kalawar_gym_members") || JSON.stringify(INITIAL_GYM_MEMBERS));
    this.employees = JSON.parse(localStorage.getItem("kalawar_gym_employees") || JSON.stringify(INITIAL_GYM_EMPLOYEES));
    this.subscriptions = INITIAL_GYM_SUBSCRIPTIONS;
    this.selectedCity = "All";
    this.selectedCategory = "All";
    this.searchQuery = "";
  }

  init() {
    this.renderDirectory();
    this.setupListeners();
    this.renderDashboard();
  }

  setupListeners() {
    // City filter
    const cityFilter = document.getElementById("gym-city-filter");
    if (cityFilter) {
      cityFilter.addEventListener("change", (e) => {
        this.selectedCity = e.target.value;
        this.renderDirectory();
      });
    }

    // Category filter
    const catFilter = document.getElementById("gym-category-filter");
    if (catFilter) {
      catFilter.addEventListener("change", (e) => {
        this.selectedCategory = e.target.value;
        this.renderDirectory();
      });
    }

    // Search input
    const searchInput = document.getElementById("gym-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDirectory();
      });
    }

    // Join as Partner Buttons
    document.querySelectorAll(".join-gym-partner-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.openModal("gym-partner-modal");
      });
    });

    // Partner Registration Form Submit
    const gymRegForm = document.getElementById("gym-partner-reg-form");
    if (gymRegForm) {
      gymRegForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handlePartnerRegistration(new FormData(gymRegForm));
      });
    }

    // Partner Dashboard Tab Switching
    document.querySelectorAll(".gym-dash-tab").forEach((tabBtn) => {
      tabBtn.addEventListener("click", (e) => {
        document.querySelectorAll(".gym-dash-tab").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".gym-dash-pane").forEach((p) => p.classList.remove("active"));
        
        tabBtn.classList.add("active");
        const targetPane = document.getElementById(tabBtn.dataset.target);
        if (targetPane) targetPane.classList.add("active");
      });
    });

    // Add Member Form
    const addMemberForm = document.getElementById("gym-add-member-form");
    if (addMemberForm) {
      addMemberForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(addMemberForm);
        const newMember = {
          id: `MBR-${Math.floor(100 + Math.random() * 900)}`,
          name: fd.get("name") || "New Member",
          plan: fd.get("plan") || "Monthly Gold",
          joined: new Date().toISOString().split("T")[0],
          status: "Active",
          phone: fd.get("phone") || "+91 98000 00000",
          expiry: "2026-12-31",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
        };
        this.members.unshift(newMember);
        localStorage.setItem("kalawar_gym_members", JSON.stringify(this.members));
        this.renderMembersTable();
        window.closeModal("gym-add-member-modal");
        window.showToast(`Member ${newMember.name} enrolled successfully!`, "success");
        addMemberForm.reset();
      });
    }

    // Add Employee Form
    const addEmpForm = document.getElementById("gym-add-employee-form");
    if (addEmpForm) {
      addEmpForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(addEmpForm);
        const newEmp = {
          id: `EMP-0${this.employees.length + 1}`,
          name: fd.get("name") || "New Employee",
          role: fd.get("role") || "Fitness Trainer",
          shift: fd.get("shift") || "General (09:00 - 17:00)",
          salary: `₹${fd.get("salary") || "40,000"}`,
          status: "Active",
          cert: fd.get("cert") || "Certified Trainer"
        };
        this.employees.unshift(newEmp);
        localStorage.setItem("kalawar_gym_employees", JSON.stringify(this.employees));
        this.renderEmployeesTable();
        window.closeModal("gym-add-employee-modal");
        window.showToast(`Employee ${newEmp.name} registered on roster!`, "success");
        addEmpForm.reset();
      });
    }
  }

  handlePartnerRegistration(formData) {
    const gyms = window.MockStore.getGyms();
    const newGym = {
      id: `gym-${Date.now()}`,
      name: formData.get("name") || "Elite Athletic Gym",
      ownerName: formData.get("ownerName") || "Partner Owner",
      city: formData.get("city") || "Mumbai",
      address: formData.get("address") || "Commercial District",
      phone: formData.get("phone") || "+91 98000 12345",
      email: formData.get("email") || "partner@gym.com",
      category: formData.get("category") || "CrossFit & Strength",
      rating: 5.0,
      reviewsCount: 1,
      monthlyPrice: parseInt(formData.get("monthlyPrice") || "3000", 10),
      annualPrice: parseInt(formData.get("monthlyPrice") || "3000", 10) * 8,
      image: formData.get("image") || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      amenities: ["Strength Training", "Cardio Deck", "Locker Room", "Trainer Guidance"],
      status: "Approved",
      membersCount: 1,
      monthlyRevenue: 3000,
      trainersCount: 2,
      description: formData.get("description") || "Newly registered partner gym under Kalawar Federation."
    };

    gyms.unshift(newGym);
    window.MockStore.saveGyms(gyms);

    // Auto-login as Gym Partner
    window.AppState.currentUser = {
      role: "gym_partner",
      title: "Gym Partner Owner",
      name: newGym.ownerName,
      handle: `@${newGym.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatar: newGym.image,
      gymId: newGym.id,
      gymName: newGym.name,
      badge: "Partner Gym Admin",
      isRegistered: true
    };

    window.closeModal("gym-partner-modal");
    window.AppState.setView("gym_admin");
    window.showToast(`Registration Successful! Welcome ${newGym.ownerName} to your Gym Admin Panel.`, "success");
    this.renderDirectory();
    this.renderDashboard();
  }

  renderDirectory() {
    const grid = document.getElementById("gyms-directory-grid");
    if (!grid) return;

    let gyms = window.MockStore.getGyms();

    // Filter
    if (this.selectedCity !== "All") {
      gyms = gyms.filter((g) => g.city.toLowerCase() === this.selectedCity.toLowerCase());
    }
    if (this.selectedCategory !== "All") {
      gyms = gyms.filter((g) => g.category.toLowerCase().includes(this.selectedCategory.toLowerCase()));
    }
    if (this.searchQuery) {
      gyms = gyms.filter((g) =>
        g.name.toLowerCase().includes(this.searchQuery) ||
        g.city.toLowerCase().includes(this.searchQuery) ||
        g.address.toLowerCase().includes(this.searchQuery)
      );
    }

    if (gyms.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <h3 style="font-size: 1.4rem; color: var(--text-secondary); margin-bottom: 10px;">No partner gyms match your filter</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or city filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = gyms
      .map(
        (g) => `
        <div class="gym-card">
          <div class="gym-card-img-wrap">
            <img src="${g.image}" alt="${g.name}" class="gym-card-img" />
            <span class="gym-card-badge badge badge-gold">${g.category}</span>
            <div class="gym-card-rating">
              <span>★</span>
              <span>${g.rating} (${g.reviewsCount})</span>
            </div>
          </div>
          <div class="gym-card-body">
            <h3 class="gym-card-title">${g.name}</h3>
            <p class="gym-card-location">📍 ${g.address}, ${g.city}</p>
            <div class="gym-amenities-tags">
              ${g.amenities.map((a) => `<span class="amenity-tag">${a}</span>`).join("")}
            </div>
            <div class="gym-card-footer">
              <div class="gym-price-tag">
                <span class="price-sub">Starting From</span>
                <span class="price-val">₹${g.monthlyPrice.toLocaleString()}<span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">/mo</span></span>
              </div>
              <button class="btn btn-outline-gold btn-sm" onclick="window.viewGymDetails('${g.id}')">
                View Packages & Club
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  renderDashboard() {
    this.renderMembersTable();
    this.renderEmployeesTable();
    this.renderSubscriptionsList();
  }

  renderMembersTable() {
    const tbody = document.getElementById("gym-members-tbody");
    if (!tbody) return;

    tbody.innerHTML = this.members
      .map(
        (m) => `
      <tr>
        <td>
          <div class="table-user-cell">
            <img src="${m.avatar}" class="table-user-avatar" alt="${m.name}" />
            <div>
              <div style="font-weight: 700;">${m.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${m.id}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-gold">${m.plan}</span></td>
        <td>${m.joined}</td>
        <td>${m.expiry}</td>
        <td>
          <span class="badge ${m.status === 'Active' ? 'badge-success' : m.status === 'Expiring Soon' ? 'badge-warning' : 'badge-danger'}">
            ${m.status}
          </span>
        </td>
        <td>${m.phone}</td>
        <td>
          <div class="table-action-btns">
            <button class="btn btn-outline-gold btn-sm" onclick="window.renewMember('${m.id}')">Renew</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");

    const totalCount = document.getElementById("kpi-gym-total-members");
    if (totalCount) totalCount.innerText = this.members.length;
  }

  renderEmployeesTable() {
    const tbody = document.getElementById("gym-employees-tbody");
    if (!tbody) return;

    tbody.innerHTML = this.employees
      .map(
        (emp) => `
      <tr>
        <td>
          <div style="font-weight: 700;">${emp.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${emp.id}</div>
        </td>
        <td><span class="badge badge-info">${emp.role}</span></td>
        <td>${emp.shift}</td>
        <td>${emp.cert}</td>
        <td style="color: var(--gold-primary); font-weight: 700;">${emp.salary}</td>
        <td><span class="badge badge-success">${emp.status}</span></td>
      </tr>
    `
      )
      .join("");

    const empCount = document.getElementById("kpi-gym-staff-count");
    if (empCount) empCount.innerText = this.employees.length;
  }

  renderSubscriptionsList() {
    const container = document.getElementById("gym-subscriptions-container");
    if (!container) return;

    container.innerHTML = this.subscriptions
      .map(
        (sub) => `
      <div class="glass-card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 1.2rem; color: #fff;">${sub.name}</h4>
            <span class="badge badge-gold">${sub.duration}</span>
          </div>
          <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--gold-primary); margin-bottom: 14px;">
            ${sub.price}
          </div>
          <ul style="list-style: none; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
            ${sub.perks.map((p) => `<li style="font-size: 0.85rem; color: var(--text-secondary);">✓ ${p}</li>`).join("")}
          </ul>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
          <span style="font-size: 0.85rem; color: var(--text-muted);">${sub.activeUsers} Active Subscribers</span>
          <button class="btn btn-primary btn-sm" onclick="window.showToast('Promotional renewal campaign launched for ${sub.name}!', 'success')">Promote</button>
        </div>
      </div>
    `
      )
      .join("");
  }
}

window.GymModuleInstance = new GymModule();
window.addEventListener("DOMContentLoaded", () => {
  window.GymModuleInstance.init();
});

window.viewGymDetails = function(gymId) {
  const gym = window.MockStore.getGyms().find((g) => g.id === gymId);
  if (!gym) return;
  const modalBody = document.getElementById("gym-details-modal-body");
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <img src="${gym.image}" style="width: 100%; height: 260px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--border-gold);" />
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="font-size: 1.6rem;">${gym.name}</h3>
            <span class="badge badge-gold">${gym.category}</span>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 12px;">📍 ${gym.address}, ${gym.city}</p>
          <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;">${gym.description}</p>
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.95rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Equipped Amenities</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${gym.amenities.map(a => `<span class="badge badge-info">${a}</span>`).join("")}
            </div>
          </div>
          <div style="background: var(--bg-surface); padding: 18px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Partner Contact</div>
              <div style="font-weight: 700; color: #fff;">${gym.phone} | ${gym.email}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.showToast('Membership request sent to ${gym.name}!', 'success'); window.closeModal('gym-details-modal');">
              Book Free Trial
            </button>
          </div>
        </div>
      </div>
    `;
    window.openModal("gym-details-modal");
  }
};

window.renewMember = function(memberId) {
  const m = window.GymModuleInstance.members.find((x) => x.id === memberId);
  if (m) {
    m.status = "Active";
    m.expiry = "2027-10-22";
    localStorage.setItem("kalawar_gym_members", JSON.stringify(window.GymModuleInstance.members));
    window.GymModuleInstance.renderMembersTable();
    window.showToast(`Membership for ${m.name} renewed for 1 Year!`, "success");
  }
};
