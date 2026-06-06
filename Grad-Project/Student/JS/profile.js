import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentUserId = null;

  let profileData = {
    name: "",
    email: "",
    department: "",
    major: "",
    studentId: "",
    gpa: "",
    credits: "",
    totalCredits: "",
    certificates: 0,
  };

  document.body.insertAdjacentHTML("beforeend", `
    <div id="editModal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-solid fa-pen-to-square"></i> Edit Profile</h3>
          <button id="closeEditBtn" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <label>Full Name</label>
            <input type="text" id="inputName" />
          </div>

          <div class="modal-field">
            <label>IAU Email</label>
            <input type="email" id="inputEmail" />
          </div>

          <div class="modal-field">
            <label>Department</label>
            <input type="text" id="inputDept" />
          </div>

          <div class="modal-field">
            <label>Major</label>
            <input type="text" id="inputMajor" />
          </div>

        </div>

        <div class="modal-footer">
          <button id="cancelEditBtn" class="modal-btn cancel-btn">Cancel</button>
          <button id="saveEditBtn" class="modal-btn save-btn">
            <i class="fa-solid fa-check"></i> Save Changes
          </button>
        </div>
      </div>
    </div>

    <div id="recordModal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-solid fa-file-lines"></i> Academic Record</h3>
          <button id="closeRecordBtn" class="modal-close">&times;</button>
        </div>

        <div class="modal-body record-body">
          <div class="record-row"><span>Student ID</span><strong id="rec-id"></strong></div>
          <div class="record-row"><span>Full Name</span><strong id="rec-name"></strong></div>
          <div class="record-row"><span>Email</span><strong id="rec-email"></strong></div>
          <div class="record-row"><span>Department</span><strong id="rec-dept"></strong></div>
          <div class="record-row"><span>Major</span><strong id="rec-major"></strong></div>
          <div class="record-row"><span>GPA</span><strong id="rec-gpa"></strong></div>
          <div class="record-row"><span>Credits</span><strong id="rec-credits"></strong></div>
          <div class="record-row"><span>Academic Standing</span><strong id="rec-standing" class="record-badge-good">Excellent Standing</strong></div>
        </div>

        <div class="modal-footer">
          <button id="printRecordBtn" class="modal-btn save-btn">
            <i class="fa-solid fa-print"></i> Print Record
          </button>
        </div>
      </div>
    </div>

    <div id="logoutModal" class="modal-overlay hidden">
      <div class="modal-box modal-box-sm">
        <div class="modal-header">
          <h3><i class="fa-solid fa-right-from-bracket"></i> Logout</h3>
          <button id="closeLogoutBtn" class="modal-close">&times;</button>
        </div>

        <div class="modal-body logout-body">
          <div class="logout-icon-wrap">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <p class="logout-question">Are you sure you want to logout?</p>
          <p class="logout-sub">You will need to sign in again to access your portal.</p>
        </div>

        <div class="modal-footer">
          <button id="cancelLogoutBtn" class="modal-btn cancel-btn">Cancel</button>
          <button id="confirmLogoutBtn" class="modal-btn logout-confirm-btn">
            Yes, Logout
          </button>
        </div>
      </div>
    </div>

    <div id="toast" class="toast hidden">
      <i class="fa-solid fa-circle-check"></i>
      <span id="toastMsg"></span>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(16,24,48,0.48);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-overlay.hidden,
      .toast.hidden {
        display: none;
      }

      .modal-box {
        background: #fff;
        border-radius: 24px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 24px 60px rgba(16,24,48,0.18);
        overflow: hidden;
      }

      .modal-box-sm {
        max-width: 400px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 22px 26px 18px;
        border-bottom: 1px solid #e8edf5;
      }

      .modal-header h3 {
        font-size: 18px;
        font-weight: 800;
        color: #162044;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .modal-close {
        width: 34px;
        height: 34px;
        border: none;
        background: #f0f4fb;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      }

      .modal-body {
        padding: 22px 26px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .modal-field label {
        font-size: 11px;
        font-weight: 700;
        color: #96a1b4;
        text-transform: uppercase;
      }

      .modal-field input {
        height: 46px;
        border: 1.5px solid #d8dee8;
        border-radius: 12px;
        padding: 0 14px;
        font-size: 15px;
        outline: none;
      }

      .modal-footer {
        padding: 16px 26px 22px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid #e8edf5;
      }

      .modal-btn {
        border: none;
        border-radius: 12px;
        padding: 12px 22px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }

      .cancel-btn {
        background: #eef1f7;
        color: #162044;
      }

      .save-btn {
        background: linear-gradient(90deg,#253a84 0%,#2b58a8 100%);
        color: #fff;
      }

      .logout-confirm-btn {
        background: linear-gradient(90deg,#8b1a1a 0%,#c0392b 100%);
        color: #fff;
      }

      .record-body {
        gap: 0;
      }

      .record-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 0;
        border-bottom: 1px solid #f0f4fb;
        font-size: 14px;
      }

      .record-row span {
        color: #65728d;
      }

      .record-row strong {
        color: #162044;
        text-align: right;
      }

      .record-badge-good {
        background: #d6f0dc;
        color: #2a7a3b !important;
        padding: 4px 12px;
        border-radius: 999px;
      }

      .record-badge-neutral {
        background: #fff3d8;
        color: #9a6400 !important;
        padding: 4px 12px;
        border-radius: 999px;
      }

      .record-badge-warn {
        background: #fdeaea;
        color: #b42318 !important;
        padding: 4px 12px;
        border-radius: 999px;
      }

      .logout-body {
        align-items: center;
        text-align: center;
      }

      .logout-icon-wrap {
        width: 64px;
        height: 64px;
        background: #fdeaea;
        color: #c0392b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
      }

      .logout-question {
        font-size: 18px;
        font-weight: 800;
        color: #162044;
      }

      .logout-sub {
        font-size: 14px;
        color: #65728d;
      }

      .toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #162044;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 24px;
        border-radius: 16px;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 8px 28px rgba(16,24,48,0.22);
        z-index: 1100;
      }

      .toast i {
        color: #5dd08a;
      }
    </style>
  `);

  async function loadActivitySummary(userId) {
    try {
      const [regSnap, tasksSnap] = await Promise.all([
        getDocs(query(collection(db, "eventRegistrations"), where("studentId", "==", userId))),
        getDocs(query(collection(db, "tasks"), where("studentId", "==", userId)))
      ]);

      const registrations = regSnap.docs.map(d => d.data());
      const now = new Date();
      const upcoming = registrations.filter(r => new Date(r.eventDateTime || 0) >= now);
      const pending = tasksSnap.docs.filter(d => {
        const t = d.data();
        return new Date(t.dueDateTime || 0) >= now;
      });

      const totalEl    = document.getElementById("totalEventsRegistered");
      const upcomingEl = document.getElementById("upcomingEventsCount");
      const pendingEl  = document.getElementById("pendingTasksCount");

      if (totalEl)    totalEl.textContent    = registrations.length;
      if (upcomingEl) upcomingEl.textContent = upcoming.length;
      if (pendingEl)  pendingEl.textContent  = pending.length;
    } catch (e) {
      console.error("Error loading activity summary:", e);
    }
  }

  function getAcademicStanding(gpa) {
    const g = parseFloat(gpa) || 0;
    if (g >= 4.5) return { text: "Excellent Standing", cls: "record-badge-good" };
    if (g >= 3.75) return { text: "Very Good Standing", cls: "record-badge-good" };
    if (g >= 3.0) return { text: "Good Standing", cls: "record-badge-neutral" };
    if (g >= 2.0) return { text: "Satisfactory", cls: "record-badge-neutral" };
    return { text: "Academic Probation", cls: "record-badge-warn" };
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");

    toastMsg.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }

  function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
  }

  function renderProfileCard() {
    const mainName = document.querySelector(".info-value");
    if (mainName) mainName.textContent = profileData.name || "Student";

    const smallValues = document.querySelectorAll(".info-value-sm");
    if (smallValues[0]) smallValues[0].textContent = profileData.email || "No email";
    if (smallValues[1]) smallValues[1].textContent = profileData.department || "No department";
    if (smallValues[2]) smallValues[2].textContent = profileData.major || "No major";

    const idBadge = document.querySelector(".student-id-badge");
    if (idBadge) idBadge.textContent = `ID: ${profileData.studentId || "N/A"}`;

    const avatarInitials = document.getElementById("avatarInitials");
    if (avatarInitials && profileData.name) {
      const parts = profileData.name.trim().split(" ").filter(Boolean);
      avatarInitials.textContent = parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    const statNumbers = document.querySelectorAll(".stat-card h2");
    if (statNumbers[0]) statNumbers[0].textContent = profileData.gpa || "0.00";
    if (statNumbers[1]) statNumbers[1].textContent = profileData.credits || "0";
    if (statNumbers[2]) statNumbers[2].textContent = profileData.certificates ?? 0;

    const statLabels = document.querySelectorAll(".stat-card p");
    if (statLabels[2]) statLabels[2].textContent = "My Certificates";

    const gpa = parseFloat(profileData.gpa) || 0;
    const credits = parseInt(profileData.credits) || 0;
    const totalCredits = parseInt(profileData.totalCredits) || 132;
    const progressFills = document.querySelectorAll(".progress-fill");
    if (progressFills[0]) progressFills[0].style.width = `${Math.min((gpa / 5) * 100, 100).toFixed(1)}%`;
    if (progressFills[1]) progressFills[1].style.width = `${Math.min((credits / totalCredits) * 100, 100).toFixed(1)}%`;

  }

  function renderSelectedInterests() {
    const savedInterests = profileData.interests || [];
    const interestChips = document.querySelectorAll(".interest-chip");

    interestChips.forEach((chip) => {
      const interestName = chip.textContent.trim();

      if (savedInterests.includes(interestName)) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  async function loadProfileFromFirebase(user) {
    currentUserId = user.uid;

    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      profileData = {
        ...profileData,
        ...userSnap.data()
      };
    } else {
      await setDoc(userRef, profileData);
    }

    renderProfileCard();
    renderSelectedInterests();
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    try {
      await loadProfileFromFirebase(user);
      await loadActivitySummary(user.uid);
    } catch (error) {
      console.error("Error loading profile:", error);
      showToast("Could not load profile data.");
    }
  });

  const editProfileBtn = document.getElementById("editProfileBtn");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      document.getElementById("inputName").value = profileData.name || "";
      document.getElementById("inputEmail").value = profileData.email || "";
      document.getElementById("inputDept").value = profileData.department || "";
      document.getElementById("inputMajor").value = profileData.major || "";
      openModal("editModal");
    });
  }

  document.getElementById("closeEditBtn").addEventListener("click", () => closeModal("editModal"));
  document.getElementById("cancelEditBtn").addEventListener("click", () => closeModal("editModal"));

  document.getElementById("saveEditBtn").addEventListener("click", async () => {
    const name = document.getElementById("inputName").value.trim();
    const email = document.getElementById("inputEmail").value.trim();
    const department = document.getElementById("inputDept").value.trim();
    const major = document.getElementById("inputMajor").value.trim();
    if (!name || !email) {
      showToast("Name and email are required.");
      return;
    }

    profileData = { ...profileData, name, email, department, major };

    try {
      await updateDoc(doc(db, "users", currentUserId), {
        name, email, department, major
      });

      renderProfileCard();
      closeModal("editModal");
      showToast("Changes saved successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Could not save changes.");
    }
  });

  const academicBtn = document.querySelector(".primary-btn");

  if (academicBtn) {
    academicBtn.addEventListener("click", () => {
      document.getElementById("rec-id").textContent = profileData.studentId || "N/A";
      document.getElementById("rec-name").textContent = profileData.name || "N/A";
      document.getElementById("rec-email").textContent = profileData.email || "N/A";
      document.getElementById("rec-dept").textContent = profileData.department || "N/A";
      document.getElementById("rec-major").textContent = profileData.major || "N/A";
      document.getElementById("rec-gpa").textContent = `${profileData.gpa || "0.00"} / 5.00`;
      document.getElementById("rec-credits").textContent =
        `${profileData.credits || 0} / ${profileData.totalCredits || 132}`;

      const standing = getAcademicStanding(profileData.gpa);
      const standingEl = document.getElementById("rec-standing");
      if (standingEl) {
        standingEl.textContent = standing.text;
        standingEl.className = standing.cls;
      }

      openModal("recordModal");
    });
  }

  document.getElementById("closeRecordBtn").addEventListener("click", () => closeModal("recordModal"));

  document.getElementById("printRecordBtn").addEventListener("click", () => {
    closeModal("recordModal");
    setTimeout(() => window.print(), 200);
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("editModal");
      closeModal("recordModal");
      closeModal("logoutModal");
    }
  });

  document.querySelectorAll(".logout, .sidebar-bottom a, .nav-item").forEach((link) => {
    const text = link.textContent.trim().toLowerCase();

    if (text.includes("logout")) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("logoutModal");
      });
    }
  });

  document.getElementById("closeLogoutBtn").addEventListener("click", () => closeModal("logoutModal"));
  document.getElementById("cancelLogoutBtn").addEventListener("click", () => closeModal("logoutModal"));

  document.getElementById("confirmLogoutBtn").addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "../../Login/HTML/login.html";
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Logout failed. Try again.");
    }
  });

  const interestChips = document.querySelectorAll(".interest-chip");

  interestChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  const saveInterestsBtn = document.querySelector(".save-interests-btn");

  if (saveInterestsBtn) {
    saveInterestsBtn.addEventListener("click", async () => {
      try {
        if (!currentUserId) {
          showToast("User is not loaded yet.");
          return;
        }

        const selectedInterests = [];

        document.querySelectorAll(".interest-chip.active").forEach((chip) => {
          selectedInterests.push(chip.textContent.trim());
        });

        profileData.interests = selectedInterests;

        await updateDoc(doc(db, "users", currentUserId), {
          interests: selectedInterests
        });

        showToast("Interests saved successfully.");
      } catch (error) {
        console.error("Error saving interests:", error);
        showToast("Failed to save interests.");
      }
    });
  }
});
