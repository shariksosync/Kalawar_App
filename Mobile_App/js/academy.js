/* ==============================================================================
   SPORTS ACADEMY MODULE CONTROLLER
   Directory, Sport Filters, Partner Onboarding, & Academy Partner Admin Panel
   ============================================================================== */

const INITIAL_ACADEMY_STUDENTS = [
  { id: "ATH-201", name: "Rohan Verma", age: 14, rank: "Red Belt (2nd Geup)", batch: "Cadet Squad", coach: "Master Rajesh", attendance: "96%", feesStatus: "Paid", parentPhone: "+91 98221 11223" },
  { id: "ATH-202", name: "Ananya Iyer", age: 16, rank: "Black Belt 1st Poom", batch: "Tournament Elite", coach: "Coach Arjun", attendance: "98%", feesStatus: "Paid", parentPhone: "+91 98222 33445" },
  { id: "ATH-203", name: "Devansh Patil", age: 11, rank: "Green Belt", batch: "Little Tigers", coach: "Master Rajesh", attendance: "88%", feesStatus: "Pending", parentPhone: "+91 98223 55667" },
  { id: "ATH-204", name: "Kavya Menon", age: 15, rank: "Blue Belt", batch: "Cadet Squad", coach: "Coach Arjun", attendance: "92%", feesStatus: "Paid", parentPhone: "+91 98224 77889" },
  { id: "ATH-205", name: "Siddharth Joshi", age: 18, rank: "Black Belt 2nd Dan", batch: "Weekend Masters Camp", coach: "Master Rajesh", attendance: "100%", feesStatus: "Paid", parentPhone: "+91 98225 99001" }
];

const INITIAL_ACADEMY_COACHES = [
  { id: "COA-01", name: "Grandmaster Rajesh Sharma", rank: "8th Dan Black Belt", spec: "Sparring (Kyorugi) & Dan Testing", batches: "Morning Champions, Masters Camp", exp: "22 Years", image: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=200&q=80" },
  { id: "COA-02", name: "Coach Arjun Kapoor", rank: "4th Dan Black Belt", spec: "Poomsae & Tactical Counter-Offense", batches: "Cadet Black Belt Squad", exp: "8 Years", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" },
  { id: "COA-03", name: "Sensei Sneha Deshmukh", rank: "3rd Dan Black Belt", spec: "Flexibility & Conditioning", batches: "Junior Little Tigers", exp: "6 Years", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80" }
];

const INITIAL_ACADEMY_BATCHES = [
  { id: "BAT-01", name: "Morning Champions Batch", time: "06:00 AM - 07:30 AM", days: "Mon, Wed, Fri", coach: "Master Rajesh", enrolled: 28, capacity: 30, level: "Advanced" },
  { id: "BAT-02", name: "Cadet Black Belt Squad", time: "05:00 PM - 06:30 PM", days: "Tue, Thu, Sat", coach: "Coach Arjun", enrolled: 24, capacity: 25, level: "Black Belt Pre-Dan" },
  { id: "BAT-03", name: "Grassroots Little Tigers", time: "04:00 PM - 05:00 PM", days: "Daily", coach: "Sensei Sneha", enrolled: 18, capacity: 20, level: "Beginner (White/Yellow)" },
  { id: "BAT-04", name: "Weekend Masters High-Performance", time: "08:00 AM - 10:30 AM", days: "Sat, Sun", coach: "Master Rajesh", enrolled: 35, capacity: 40, level: "Elite Tournament" }
];

class AcademyModule {
  constructor() {
    this.students = JSON.parse(localStorage.getItem("kalawar_acad_students") || JSON.stringify(INITIAL_ACADEMY_STUDENTS));
    this.coaches = JSON.parse(localStorage.getItem("kalawar_acad_coaches") || JSON.stringify(INITIAL_ACADEMY_COACHES));
    this.batches = JSON.parse(localStorage.getItem("kalawar_acad_batches") || JSON.stringify(INITIAL_ACADEMY_BATCHES));
    this.selectedSport = "All";
    this.searchQuery = "";
  }

  init() {
    this.renderDirectory();
    this.setupListeners();
    this.renderDashboard();
  }

  setupListeners() {
    // Sport filter
    const sportFilter = document.getElementById("acad-sport-filter");
    if (sportFilter) {
      sportFilter.addEventListener("change", (e) => {
        this.selectedSport = e.target.value;
        this.renderDirectory();
      });
    }

    // Search input
    const searchInput = document.getElementById("acad-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDirectory();
      });
    }

    // Join as Partner Buttons
    document.querySelectorAll(".join-acad-partner-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.openModal("acad-partner-modal");
      });
    });

    // Partner Registration Form Submit
    const acadRegForm = document.getElementById("acad-partner-reg-form");
    if (acadRegForm) {
      acadRegForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handlePartnerRegistration(new FormData(acadRegForm));
      });
    }

    // Dashboard Tab Switching
    document.querySelectorAll(".acad-dash-tab").forEach((tabBtn) => {
      tabBtn.addEventListener("click", (e) => {
        document.querySelectorAll(".acad-dash-tab").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".acad-dash-pane").forEach((p) => p.classList.remove("active"));

        tabBtn.classList.add("active");
        const targetPane = document.getElementById(tabBtn.dataset.target);
        if (targetPane) targetPane.classList.add("active");
      });
    });

    // Add Student Form
    const addStudentForm = document.getElementById("acad-add-student-form");
    if (addStudentForm) {
      addStudentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(addStudentForm);
        const newStudent = {
          id: `ATH-${Math.floor(200 + Math.random() * 800)}`,
          name: fd.get("name") || "New Athlete",
          age: parseInt(fd.get("age") || "14", 10),
          rank: fd.get("rank") || "White Belt",
          batch: fd.get("batch") || "Morning Champions",
          coach: "Master Rajesh",
          attendance: "100%",
          feesStatus: "Paid",
          parentPhone: fd.get("phone") || "+91 98000 00000"
        };
        this.students.unshift(newStudent);
        localStorage.setItem("kalawar_acad_students", JSON.stringify(this.students));
        this.renderStudentsTable();
        window.closeModal("acad-add-student-modal");
        window.showToast(`Athlete ${newStudent.name} enrolled in academy!`, "success");
        addStudentForm.reset();
      });
    }

    // Add Batch Form
    const addBatchForm = document.getElementById("acad-add-batch-form");
    if (addBatchForm) {
      addBatchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(addBatchForm);
        const newBatch = {
          id: `BAT-0${this.batches.length + 1}`,
          name: fd.get("name") || "Evening Elite",
          time: fd.get("time") || "06:00 PM - 07:30 PM",
          days: fd.get("days") || "Mon - Fri",
          coach: fd.get("coach") || "Head Coach",
          enrolled: 1,
          capacity: parseInt(fd.get("capacity") || "25", 10),
          level: fd.get("level") || "Intermediate"
        };
        this.batches.push(newBatch);
        localStorage.setItem("kalawar_acad_batches", JSON.stringify(this.batches));
        this.renderBatchesGrid();
        window.closeModal("acad-add-batch-modal");
        window.showToast(`New Batch "${newBatch.name}" created!`, "success");
        addBatchForm.reset();
      });
    }
  }

  handlePartnerRegistration(formData) {
    const academies = window.MockStore.getAcademies();
    const newAcad = {
      id: `acad-${Date.now()}`,
      name: formData.get("name") || "Pro Champions Academy",
      director: formData.get("director") || "Partner Director",
      sport: formData.get("sport") || "Martial Arts & Combat",
      city: formData.get("city") || "Pune",
      address: formData.get("address") || "Sports Complex Arena",
      phone: formData.get("phone") || "+91 98220 99887",
      email: formData.get("email") || "academy@sports.org",
      rating: 5.0,
      studentsCount: 20,
      coachesCount: 2,
      medalsWon: 0,
      monthlyFee: parseInt(formData.get("monthlyFee") || "2500", 10),
      image: formData.get("image") || "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      status: "Approved",
      ageGroups: ["Grassroots (6-12)", "Cadet (13-17)", "Senior (18+)"],
      batches: [
        { name: "Inaugural Batch", time: "06:00 AM - 07:30 AM", days: "Mon - Sat", coach: formData.get("director") || "Director", enrolled: 12, capacity: 25 }
      ],
      description: formData.get("description") || "Premier sports training academy affiliated with Kalawar National Federation."
    };

    academies.unshift(newAcad);
    window.MockStore.saveAcademies(academies);

    // Auto-login as Academy Partner
    window.AppState.currentUser = {
      role: "academy_partner",
      title: "Sports Academy Director",
      name: newAcad.director,
      handle: `@${newAcad.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatar: newAcad.image,
      academyId: newAcad.id,
      academyName: newAcad.name,
      badge: "Sports Academy Admin",
      isRegistered: true
    };

    window.closeModal("acad-partner-modal");
    window.AppState.setView("academy_admin");
    window.showToast(`Registration Successful! Welcome Director ${newAcad.director} to your Academy Admin Dashboard.`, "success");
    this.renderDirectory();
    this.renderDashboard();
  }

  renderDirectory() {
    const grid = document.getElementById("academies-directory-grid");
    if (!grid) return;

    let academies = window.MockStore.getAcademies();

    // Filter
    if (this.selectedSport !== "All") {
      academies = academies.filter((a) => a.sport.toLowerCase().includes(this.selectedSport.toLowerCase()));
    }
    if (this.searchQuery) {
      academies = academies.filter((a) =>
        a.name.toLowerCase().includes(this.searchQuery) ||
        a.city.toLowerCase().includes(this.searchQuery) ||
        a.sport.toLowerCase().includes(this.searchQuery) ||
        a.director.toLowerCase().includes(this.searchQuery)
      );
    }

    if (academies.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <h3 style="font-size: 1.4rem; color: var(--text-secondary); margin-bottom: 10px;">No sports academies found matching your filter</h3>
          <p style="color: var(--text-muted);">Try selecting "All Sports" or a different search keyword.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = academies
      .map(
        (a) => `
        <div class="academy-card">
          <div class="academy-card-img-wrap">
            <img src="${a.image}" alt="${a.name}" class="academy-card-img" />
            <span class="academy-sport-badge">${a.sport}</span>
          </div>
          <div class="academy-card-body">
            <h3 class="academy-card-title">${a.name}</h3>
            <div class="academy-coach-line">
              <span>🏅 Head: ${a.director}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">📍 ${a.address}, ${a.city}</p>
            
            <div class="academy-stats-row">
              <div class="academy-stat-item">
                <span class="stat-item-label">Athletes</span>
                <span class="stat-item-val">${a.studentsCount}+</span>
              </div>
              <div class="academy-stat-item">
                <span class="stat-item-label">Coaches</span>
                <span class="stat-item-val">${a.coachesCount}</span>
              </div>
              <div class="academy-stat-item">
                <span class="stat-item-label">Medals Won</span>
                <span class="stat-item-val" style="color:var(--gold-primary);">${a.medalsWon} 🥇</span>
              </div>
            </div>

            <div class="academy-batches-preview">
              <div class="batches-title">Age Groups & Squads:</div>
              ${a.ageGroups.map((grp) => `<span class="batch-pill">${grp}</span>`).join("")}
            </div>

            <div class="academy-card-footer">
              <div>
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Tuition Fee</span>
                <div style="font-family:var(--font-heading); font-size:1.25rem; font-weight:800; color:var(--gold-primary);">
                  ₹${a.monthlyFee.toLocaleString()}<span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">/mo</span>
                </div>
              </div>
              <button class="btn btn-outline-gold btn-sm" onclick="window.viewAcademyDetails('${a.id}')">
                View Academy & Trials
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  renderDashboard() {
    this.renderStudentsTable();
    this.renderBatchesGrid();
    this.renderCoachesList();
  }

  renderStudentsTable() {
    const tbody = document.getElementById("acad-students-tbody");
    if (!tbody) return;

    tbody.innerHTML = this.students
      .map(
        (s) => `
      <tr>
        <td>
          <div style="font-weight: 700;">${s.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.id} | Age: ${s.age}</div>
        </td>
        <td><span class="badge badge-gold">${s.rank}</span></td>
        <td>${s.batch}</td>
        <td>${s.coach}</td>
        <td><span style="font-weight:700; color:var(--success);">${s.attendance}</span></td>
        <td>
          <span class="badge ${s.feesStatus === 'Paid' ? 'badge-success' : 'badge-danger'}">
            ${s.feesStatus}
          </span>
        </td>
        <td>${s.parentPhone}</td>
      </tr>
    `
      )
      .join("");

    const countEl = document.getElementById("kpi-acad-students-count");
    if (countEl) countEl.innerText = this.students.length + 345;
  }

  renderBatchesGrid() {
    const container = document.getElementById("acad-batches-container");
    if (!container) return;

    container.innerHTML = this.batches
      .map((b) => {
        const pct = Math.round((b.enrolled / b.capacity) * 100);
        return `
        <div class="batch-card">
          <div class="batch-card-header">
            <span class="batch-card-name">${b.name}</span>
            <span class="badge badge-info">${b.level}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ⏰ ${b.time} (${b.days})
          </div>
          <div style="font-size: 0.82rem; color: var(--gold-primary); font-weight: 600;">
            🥋 Coach: ${b.coach}
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
              <span>Enrollment Capacity</span>
              <span>${b.enrolled} / ${b.capacity} Students (${pct}%)</span>
            </div>
            <div class="batch-capacity-bar">
              <div class="batch-capacity-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  renderCoachesList() {
    const container = document.getElementById("acad-coaches-container");
    if (!container) return;

    container.innerHTML = this.coaches
      .map(
        (c) => `
      <div class="coach-roster-card">
        <img src="${c.image}" class="coach-roster-avatar" alt="${c.name}" />
        <div class="coach-roster-info">
          <h4>${c.name}</h4>
          <span class="badge badge-gold" style="margin-bottom: 6px;">${c.rank}</span>
          <p>🎯 <strong>Specialization:</strong> ${c.spec}</p>
          <p>📋 <strong>Batches:</strong> ${c.batches}</p>
          <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px;">Experience: ${c.exp}</p>
        </div>
      </div>
    `
      )
      .join("");
  }
}

window.AcademyModuleInstance = new AcademyModule();
window.addEventListener("DOMContentLoaded", () => {
  window.AcademyModuleInstance.init();
});

window.viewAcademyDetails = function(acadId) {
  const acad = window.MockStore.getAcademies().find((a) => a.id === acadId);
  if (!acad) return;
  const modalBody = document.getElementById("acad-details-modal-body");
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <img src="${acad.image}" style="width: 100%; height: 260px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--border-gold);" />
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="font-size: 1.6rem;">${acad.name}</h3>
            <span class="badge badge-gold">${acad.sport}</span>
          </div>
          <p style="color: var(--gold-primary); font-weight: 600; margin-bottom: 8px;">Director / Master: ${acad.director}</p>
          <p style="color: var(--text-secondary); margin-bottom: 12px;">📍 ${acad.address}, ${acad.city}</p>
          <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;">${acad.description}</p>
          
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.95rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;">Available Batches</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${acad.batches.map(b => `
                <div style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; color: #fff;">${b.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${b.time} (${b.days})</div>
                  </div>
                  <span class="badge badge-info">${b.enrolled}/${b.capacity} Enrolled</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div style="background: var(--bg-surface); padding: 18px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Admissions & Trials Desk</div>
              <div style="font-weight: 700; color: #fff;">${acad.phone} | ${acad.email}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.showToast('Trial admission request lodged with ${acad.name}!', 'success'); window.closeModal('acad-details-modal');">
              Register for Free Trial
            </button>
          </div>
        </div>
      </div>
    `;
    window.openModal("acad-details-modal");
  }
};
