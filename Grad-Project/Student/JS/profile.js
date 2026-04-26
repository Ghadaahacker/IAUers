document.addEventListener("DOMContentLoaded", () => {

  /*DATA — Profile*/
  
  let profileData = {
    name:         "Walaa",
    email:        "Wallaa223@iau.edu.sa",
    department:   "College of Business Administration",
    major:        "Information Systems and Business Analytics",
    id:           "2230002023",
    gpa:          4.62,
    credits:      102,
    totalCredits: 132
  };

  /*DATA — Courses*/
  const coursesData = [
    {
      code:        "CS301",
      name:        "Advanced Algorithms",
      doctor:      "Dr. Ahmed Al-Qahtani",
      section:     "Section 1",
      credits:     3,
      location:    "Building A — Room 204",
      schedule:    "Sun / Tue / Thu  •  9:00 – 9:50 AM",
      absences:    1,
      maxAbsences: 6,
      status:      "On Track",
      statusClass: "status-good"
    },
    {
      code:        "CS312",
      name:        "Database Systems",
      doctor:      "Dr. Sara Al-Hamdan",
      section:     "Section 2",
      credits:     3,
      location:    "Building B — Room 110",
      schedule:    "Mon / Wed  •  11:00 AM – 12:15 PM",
      absences:    3,
      maxAbsences: 6,
      status:      "Warning",
      statusClass: "status-warn"
    },
    {
      code:        "CS450",
      name:        "Cyber Security",
      doctor:      "Dr. Khalid Al-Otaibi",
      section:     "Section 4",
      credits:     3,
      location:    "Building C — Lab 3",
      schedule:    "Sun / Tue  •  1:00 – 2:15 PM",
      absences:    0,
      maxAbsences: 6,
      status:      "Excellent",
      statusClass: "status-good"
    },
    {
      code:        "CS208",
      name:        "Networking",
      doctor:      "Dr. Abdullah Assiri",
      section:     "Section 2",
      credits:     3,
      location:    "Building D — Room 302",
      schedule:    "Mon / Wed / Thu  •  8:00 – 10:00AM",
      absences:    2,
      maxAbsences: 6,
      status:      "On Track",
      statusClass: "status-good"
    }
  ];

  /*INJECT ALL MODALS + STYLES*/
  document.body.insertAdjacentHTML("beforeend", `

    <!-- ── EDIT PROFILE MODAL ── -->
    <div id="editModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="editModalTitle"><i class="fa-solid fa-pen-to-square"></i> Edit Profile</h3>
          <button id="closeEditBtn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-field">
            <label for="inputName">Full Name</label>
            <input type="text" id="inputName" placeholder="Your full name" />
          </div>
          <div class="modal-field">
            <label for="inputEmail">IAU Email</label>
            <input type="email" id="inputEmail" placeholder="email@iau.edu.sa" />
          </div>
          <div class="modal-field">
            <label for="inputDept">Department</label>
            <input type="text" id="inputDept" placeholder="Department" />
          </div>
          <div class="modal-field">
            <label for="inputMajor">Major</label>
            <input type="text" id="inputMajor" placeholder="Major" />
          </div>
        </div>
        <div class="modal-footer">
          <button id="cancelEditBtn" class="modal-btn cancel-btn">Cancel</button>
          <button id="saveEditBtn"   class="modal-btn save-btn">
            <i class="fa-solid fa-check"></i> Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- ── ACADEMIC RECORD MODAL ── -->
    <div id="recordModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="recordModalTitle">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="recordModalTitle"><i class="fa-solid fa-file-lines"></i> Academic Record</h3>
          <button id="closeRecordBtn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body record-body">
          <div class="record-row"><span class="record-label">Student ID</span>      <span class="record-value" id="rec-id"></span></div>
          <div class="record-row"><span class="record-label">Full Name</span>       <span class="record-value" id="rec-name"></span></div>
          <div class="record-row"><span class="record-label">Cumulative GPA</span>  <span class="record-value" id="rec-gpa"></span></div>
          <div class="record-row"><span class="record-label">Credits Earned</span>  <span class="record-value" id="rec-credits"></span></div>
          <div class="record-row"><span class="record-label">Department</span>      <span class="record-value" id="rec-dept"></span></div>
          <div class="record-row"><span class="record-label">Major</span>           <span class="record-value" id="rec-major"></span></div>
          <div class="record-row"><span class="record-label">Academic Standing</span><span class="record-value record-badge-good">Excellent Standing</span></div>
        </div>
        <div class="modal-footer">
          <button id="printRecordBtn" class="modal-btn save-btn">
            <i class="fa-solid fa-print"></i> Print Record
          </button>
        </div>
      </div>
    </div>

    <!-- ── COURSE DETAIL MODAL ── -->
    <div id="courseModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="courseModalTitle">
      <div class="modal-box modal-box-wide">
        <div class="modal-header">
          <h3 id="courseModalTitle"><i class="fa-solid fa-book-open"></i> Course Details</h3>
          <button id="closeCourseBtn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body course-modal-body">
          <div class="course-modal-top">
            <div id="cm-icon" class="course-modal-icon"></div>
            <div>
              <div id="cm-code" class="cm-code"></div>
              <h2 id="cm-name" class="cm-name"></h2>
              <span id="cm-status" class="cm-status-badge"></span>
            </div>
          </div>
          <div class="cm-grid">
            <div class="cm-item">
              <div class="cm-item-icon"><i class="fa-solid fa-user-tie"></i></div>
              <div>
                <div class="cm-item-label">Doctor</div>
                <div id="cm-doctor" class="cm-item-value"></div>
              </div>
            </div>
            <div class="cm-item">
              <div class="cm-item-icon"><i class="fa-solid fa-location-dot"></i></div>
              <div>
                <div class="cm-item-label">Location</div>
                <div id="cm-location" class="cm-item-value"></div>
              </div>
            </div>
            <div class="cm-item">
              <div class="cm-item-icon"><i class="fa-regular fa-clock"></i></div>
              <div>
                <div class="cm-item-label">Schedule</div>
                <div id="cm-schedule" class="cm-item-value"></div>
              </div>
            </div>
            <div class="cm-item">
              <div class="cm-item-icon"><i class="fa-solid fa-layer-group"></i></div>
              <div>
                <div class="cm-item-label">Section & Credits</div>
                <div id="cm-section" class="cm-item-value"></div>
              </div>
            </div>
          </div>
          <div class="cm-absence-block">
            <div class="cm-absence-header">
              <span class="cm-item-label">Absence Tracker</span>
              <span id="cm-abs-count" class="cm-abs-count"></span>
            </div>
            <div class="cm-absence-bar-wrap">
              <div id="cm-absence-bar" class="cm-absence-bar"></div>
            </div>
            <p id="cm-abs-note" class="cm-abs-note"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── LOGOUT CONFIRM MODAL ── -->
    <div id="logoutModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
      <div class="modal-box modal-box-sm">
        <div class="modal-header">
          <h3 id="logoutModalTitle"><i class="fa-solid fa-right-from-bracket"></i> Logout</h3>
          <button id="closeLogoutBtn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body logout-body">
          <div class="logout-icon-wrap">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <p class="logout-question">Are you sure you want to logout?</p>
          <p class="logout-sub">You'll need to sign in again to access your portal.</p>
        </div>
        <div class="modal-footer">
          <button id="cancelLogoutBtn"  class="modal-btn cancel-btn">Cancel</button>
          <button id="confirmLogoutBtn" class="modal-btn logout-confirm-btn">
            <i class="fa-solid fa-right-from-bracket"></i> Yes, Logout
          </button>
        </div>
      </div>
    </div>

    <!-- ── TOAST ── -->
    <div id="toast" class="toast hidden">
      <i class="fa-solid fa-circle-check"></i>
      <span id="toastMsg"></span>
    </div>

    <!-- ── STYLES ── -->
    <style>
      .modal-overlay {
        position: fixed; inset: 0;
        background: rgba(16,24,48,0.48);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000; padding: 20px;
        animation: fadeIn 0.18s ease;
      }
      .modal-overlay.hidden { display: none; }

      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }

      .modal-box {
        background: #fff; border-radius: 24px; width: 100%; max-width: 480px;
        box-shadow: 0 24px 60px rgba(16,24,48,0.18);
        overflow: hidden; animation: slideUp 0.22s ease;
      }
      .modal-box-wide { max-width: 560px; }
      .modal-box-sm   { max-width: 400px; }

      .modal-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 22px 26px 18px; border-bottom: 1px solid #e8edf5;
      }
      .modal-header h3 { font-size: 18px; font-weight: 800; color: #162044; display: flex; align-items: center; gap: 10px; }
      .modal-header h3 i { color: #2b58a8; }
      .modal-close { width: 34px; height: 34px; border: none; background: #f0f4fb; border-radius: 50%; font-size: 20px; color: #65728d; cursor: pointer; line-height: 1; transition: 0.18s; }
      .modal-close:hover { background: #dce7f7; color: #162044; }

      .modal-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; }

      .modal-field { display: flex; flex-direction: column; gap: 6px; }
      .modal-field label { font-size: 11px; font-weight: 700; color: #96a1b4; text-transform: uppercase; letter-spacing: 0.07em; }
      .modal-field input { height: 46px; border: 1.5px solid #d8dee8; border-radius: 12px; padding: 0 14px; font-size: 15px; color: #162044; outline: none; transition: 0.18s; font-family: "Inter", sans-serif; }
      .modal-field input:focus { border-color: #2b58a8; box-shadow: 0 0 0 3px rgba(43,88,168,0.12); }

      .modal-footer { padding: 16px 26px 22px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e8edf5; }
      .modal-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 12px; padding: 12px 22px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.18s; font-family: "Inter", sans-serif; }
      .cancel-btn { background: #eef1f7; color: #162044; }
      .cancel-btn:hover { background: #dce7f7; }
      .save-btn { background: linear-gradient(90deg,#253a84 0%,#2b58a8 100%); color: #fff; }
      .save-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .logout-confirm-btn { background: linear-gradient(90deg,#8b1a1a 0%,#c0392b 100%); color: #fff; }
      .logout-confirm-btn:hover { opacity: 0.9; transform: translateY(-1px); }

      /* Record */
      .record-body { gap: 0; padding: 0 26px; }
      .record-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f0f4fb; font-size: 14px; }
      .record-row:last-child { border-bottom: none; }
      .record-label { color: #65728d; font-weight: 500; }
      .record-value { color: #162044; font-weight: 700; }
      .record-badge-good { background: #d6f0dc; color: #2a7a3b; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; }

      /* Course modal */
      .course-modal-body { gap: 20px; }
      .course-modal-top { display: flex; align-items: flex-start; gap: 18px; padding-bottom: 18px; border-bottom: 1px solid #edf2f8; }
      .course-modal-icon { width: 56px; height: 56px; flex-shrink: 0; background: #dce7f7; color: #2b58a8; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
      .cm-code  { font-size: 12px; font-weight: 700; color: #96a1b4; letter-spacing: 0.07em; margin-bottom: 4px; }
      .cm-name  { font-size: 20px; font-weight: 800; color: #162044; margin-bottom: 8px; }
      .cm-status-badge { display: inline-block; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .status-good   { background: #d6f0dc; color: #2a7a3b; }
      .status-warn   { background: #fdecd4; color: #a05b10; }
      .status-danger { background: #fdd8d8; color: #b91c1c; }

      .cm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .cm-item { display: flex; align-items: flex-start; gap: 12px; background: #f7f9fd; border: 1px solid #e8eef6; border-radius: 14px; padding: 14px; }
      .cm-item-icon { width: 36px; height: 36px; flex-shrink: 0; background: #dce7f7; color: #2b58a8; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
      .cm-item-label { font-size: 11px; font-weight: 700; color: #96a1b4; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
      .cm-item-value { font-size: 14px; font-weight: 600; color: #162044; line-height: 1.4; }

      .cm-absence-block { background: #f7f9fd; border: 1px solid #e8eef6; border-radius: 16px; padding: 16px 18px; }
      .cm-absence-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .cm-abs-count { font-size: 14px; font-weight: 700; color: #162044; }
      .cm-absence-bar-wrap { width: 100%; height: 10px; background: #e2e8f4; border-radius: 999px; overflow: hidden; margin-bottom: 10px; }
      .cm-absence-bar { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
      .cm-abs-note { font-size: 13px; color: #65728d; line-height: 1.5; }

      /* Logout */
      .logout-body { align-items: center; text-align: center; padding: 28px 26px 20px; }
      .logout-icon-wrap { width: 64px; height: 64px; background: #fdeaea; color: #c0392b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px; }
      .logout-question { font-size: 18px; font-weight: 800; color: #162044; margin-bottom: 8px; }
      .logout-sub      { font-size: 14px; color: #65728d; line-height: 1.5; }

      /* Toast */
      .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #162044; color: #fff; display: flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: 16px; font-size: 15px; font-weight: 600; box-shadow: 0 8px 28px rgba(16,24,48,0.22); z-index: 1100; animation: slideUp 0.22s ease; white-space: nowrap; }
      .toast.hidden { display: none; }
      .toast i { color: #5dd08a; font-size: 18px; }

      @media (max-width: 600px) {
        .cm-grid { grid-template-columns: 1fr; }
        .course-modal-top { flex-direction: column; }
      }
    </style>
  `);

  /*HELPERS */
  function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  function openModal(id)  { document.getElementById(id).classList.remove("hidden"); }
  function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      ["editModal","recordModal","courseModal","logoutModal"].forEach(closeModal);
    }
  });

  /*RENDER PROFILE CARD*/
  function renderProfileCard() {
    const nameEl = document.querySelector(".info-value");
    if (nameEl) nameEl.textContent = profileData.name;
    const smEls = document.querySelectorAll(".info-value-sm");
    if (smEls[0]) smEls[0].textContent = profileData.email;
    if (smEls[1]) smEls[1].textContent = profileData.department;
    if (smEls[2]) smEls[2].textContent = profileData.major;
  }

  /*EDIT PROFILE */
  document.getElementById("editProfileBtn").addEventListener("click", () => {
    document.getElementById("inputName").value  = profileData.name;
    document.getElementById("inputEmail").value = profileData.email;
    document.getElementById("inputDept").value  = profileData.department;
    document.getElementById("inputMajor").value = profileData.major;
    openModal("editModal");
  });

  document.getElementById("closeEditBtn").addEventListener("click",  () => closeModal("editModal"));
  document.getElementById("cancelEditBtn").addEventListener("click", () => closeModal("editModal"));

  document.getElementById("saveEditBtn").addEventListener("click", () => {
    const name  = document.getElementById("inputName").value.trim();
    const email = document.getElementById("inputEmail").value.trim();
    const dept  = document.getElementById("inputDept").value.trim();
    const major = document.getElementById("inputMajor").value.trim();

    if (!name || !email) { showToast("⚠️ Name and email are required."); return; }

    profileData.name       = name;
    profileData.email      = email;
    profileData.department = dept;
    profileData.major      = major;

    renderProfileCard();
    closeModal("editModal");
    showToast("Profile updated successfully!");
  });

  /*ACADEMIC RECORD*/
  const academicBtn = document.querySelector(".primary-btn");
  if (academicBtn) {
    academicBtn.addEventListener("click", () => {
      document.getElementById("rec-id").textContent      = profileData.id;
      document.getElementById("rec-name").textContent    = profileData.name;
      document.getElementById("rec-gpa").textContent     = profileData.gpa + " / 5.00";
      document.getElementById("rec-credits").textContent = profileData.credits + " / " + profileData.totalCredits;
      document.getElementById("rec-dept").textContent    = profileData.department;
      document.getElementById("rec-major").textContent   = profileData.major;
      openModal("recordModal");
    });
  }

  document.getElementById("closeRecordBtn").addEventListener("click", () => closeModal("recordModal"));
  document.getElementById("printRecordBtn").addEventListener("click", () => {
    closeModal("recordModal");
    setTimeout(() => window.print(), 200);
  });

  /*COURSE CARDS → DETAIL MODAL */
  const courseIconsMap = {
    "CS301": "fa-microchip",
    "CS312": "fa-database",
    "CS450": "fa-shield-halved",
    "CS208": "fa-network-wired"
  };

  document.querySelectorAll(".course-card").forEach((card, idx) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const course = coursesData[idx];
      if (!course) return;

      document.getElementById("cm-icon").innerHTML =
        `<i class="fa-solid ${courseIconsMap[course.code] || "fa-book-open"}"></i>`;

      document.getElementById("cm-code").textContent     = course.code;
      document.getElementById("cm-name").textContent     = course.name;
      document.getElementById("cm-doctor").textContent   = course.doctor;
      document.getElementById("cm-location").textContent = course.location;
      document.getElementById("cm-schedule").textContent = course.schedule;
      document.getElementById("cm-section").textContent  = `${course.section}  •  ${course.credits} Credits`;

      const statusEl = document.getElementById("cm-status");
      statusEl.textContent = course.status;
      statusEl.className   = "cm-status-badge " + course.statusClass;

      const pct = Math.min((course.absences / course.maxAbsences) * 100, 100);
      const bar = document.getElementById("cm-absence-bar");
      bar.style.width = pct + "%";
      bar.style.background =
        pct >= 75 ? "linear-gradient(90deg,#b91c1c,#ef4444)" :
        pct >= 50 ? "linear-gradient(90deg,#a05b10,#f59e0b)" :
                    "linear-gradient(90deg,#173a76,#2b58a8)";

      document.getElementById("cm-abs-count").textContent =
        `${course.absences} / ${course.maxAbsences} absences`;

      const remaining = course.maxAbsences - course.absences;
      document.getElementById("cm-abs-note").textContent =
        remaining > 0
          ? `You have ${remaining} absence${remaining > 1 ? "s" : ""} remaining before academic warning.`
          : "⚠️ You have reached the maximum allowed absences. Please contact your advisor.";

      openModal("courseModal");
    });
  });

  document.getElementById("closeCourseBtn").addEventListener("click", () => closeModal("courseModal"));

  /*SOCIAL BUTTONS */
  const socialActions = {
    "Instagram": () => window.open("https://instagram.com", "_blank"),
    "Phone":     () => window.open("tel:+966500000000"),
    "Message":   () => window.open("mailto:" + profileData.email),
  };
  document.querySelectorAll(".social-btn").forEach(btn => {
    const label = btn.getAttribute("aria-label");
    if (socialActions[label]) btn.addEventListener("click", socialActions[label]);
  });

  /*LOGOUT — Confirm Dialog */
  document.querySelectorAll(".nav-item, .sidebar-bottom a").forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    if (text.includes("logout")) {
      link.addEventListener("click", e => {
        e.preventDefault();
        openModal("logoutModal");
      });
    }
  });

  document.getElementById("closeLogoutBtn").addEventListener("click",  () => closeModal("logoutModal"));
  document.getElementById("cancelLogoutBtn").addEventListener("click", () => closeModal("logoutModal"));

  document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("studentName");
    sessionStorage.clear();
    window.location.href = "../login/login.html";
  });

  /*INIT */
  renderProfileCard();

});
