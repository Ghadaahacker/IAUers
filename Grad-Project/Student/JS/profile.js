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
    certificates: 0
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

    <div id="addCertModal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-solid fa-certificate"></i> Add Certification</h3>
          <button id="closeAddCertBtn" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <label>Certificate Name</label>
            <input type="text" id="inputCertName" placeholder="e.g. AWS Cloud Practitioner" />
          </div>

          <div class="modal-field">
            <label>Issuing Organization</label>
            <input type="text" id="inputCertOrg" placeholder="e.g. Amazon Web Services" />
          </div>

          <div class="modal-field">
            <label>Year</label>
            <input type="number" id="inputCertYear" placeholder="e.g. 2024" min="2000" max="${new Date().getFullYear()}" />
          </div>

          <div class="modal-field">
            <label>Certificate Photo <span style="font-weight:400;color:#aaa;">(Optional)</span></label>
            <label class="cert-img-upload-label" for="inputCertImage">
              <i class="fa-solid fa-image"></i>
              <span id="certImageName">Choose image…</span>
            </label>
            <input type="file" id="inputCertImage" accept="image/*" style="display:none;" />
          </div>
        </div>

        <div class="modal-footer">
          <button id="cancelAddCertBtn" class="modal-btn cancel-btn">Cancel</button>
          <button id="saveAddCertBtn" class="modal-btn save-btn">
            <i class="fa-solid fa-check"></i> Add Certification
          </button>
        </div>
      </div>
    </div>

    <div id="addResearchModal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-solid fa-flask"></i> Add Research</h3>
          <button id="closeAddResearchBtn" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-field">
            <label>Research Title</label>
            <input type="text" id="inputResearchTitle" placeholder="e.g. Deep Learning in Healthcare" />
          </div>

          <div class="modal-field">
            <label>Journal / Conference</label>
            <input type="text" id="inputResearchVenue" placeholder="e.g. IEEE EMBC 2024" />
          </div>

          <div class="modal-field">
            <label>Year</label>
            <input type="number" id="inputResearchYear" placeholder="e.g. 2024" min="2000" max="${new Date().getFullYear()}" />
          </div>

          <div class="modal-field">
            <label>Link <span style="font-weight:400;color:#aaa;">(Optional)</span></label>
            <input type="url" id="inputResearchLink" placeholder="https://doi.org/..." />
          </div>
        </div>

        <div class="modal-footer">
          <button id="cancelAddResearchBtn" class="modal-btn cancel-btn">Cancel</button>
          <button id="saveAddResearchBtn" class="modal-btn save-btn">
            <i class="fa-solid fa-check"></i> Add Research
          </button>
        </div>
      </div>
    </div>

    <div id="certImgViewer" class="modal-overlay hidden" style="z-index:1200;">
      <div style="position:relative;max-width:90vw;max-height:90vh;">
        <img id="certImgFull" src="" style="max-width:90vw;max-height:85vh;border-radius:16px;display:block;" />
        <button onclick="document.getElementById('certImgViewer').classList.add('hidden')"
          style="position:absolute;top:-14px;right:-14px;width:34px;height:34px;border:none;
          background:#fff;border-radius:50%;font-size:18px;cursor:pointer;
          box-shadow:0 2px 10px rgba(0,0,0,0.2);">✕</button>
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

      .cert-img-upload-label {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 46px;
        border: 1.5px dashed #d8dee8;
        border-radius: 12px;
        padding: 0 14px;
        font-size: 14px;
        color: #65728d;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
      }

      .cert-img-upload-label:hover {
        border-color: #253a84;
        background: #f4f7ff;
      }

      .cert-img-thumb {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        object-fit: cover;
        cursor: pointer;
        flex-shrink: 0;
        border: 2px solid #e0e7f0;
        transition: opacity 0.15s;
      }

      .cert-img-thumb:hover { opacity: 0.8; }
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

  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");
    const icon = toast.querySelector("i");

    toastMsg.textContent = message;
    toast.style.background = type === "error" ? "#b42318" : "#162044";
    if (icon) {
      icon.className = type === "error"
        ? "fa-solid fa-circle-xmark"
        : "fa-solid fa-circle-check";
      icon.style.color = type === "error" ? "#fca5a5" : "#5dd08a";
    }
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

    const certCountEl = document.getElementById("certCount");
    if (certCountEl) certCountEl.textContent = (profileData.certifications || []).length;

    const researchCountEl = document.getElementById("researchCount");
    if (researchCountEl) researchCountEl.textContent = (profileData.research || []).length;

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
    renderCertifications();
    renderResearch();
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

    profileData = {
      ...profileData,
      name,
      email,
      department,
      major
    };

    try {
      await updateDoc(doc(db, "users", currentUserId), {
        name,
        email,
        department,
        major
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
      closeModal("addCertModal");
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

  // ── Certifications ──

  function compressCertImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1000;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else       { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderCertifications() {
    const list = document.getElementById("certificationsList");
    if (!list) return;

    const certs = profileData.certifications || [];

    const certCountEl = document.getElementById("certCount");
    if (certCountEl) certCountEl.textContent = certs.length;

    if (!certs.length) {
      list.innerHTML = `<p class="certs-empty">No certifications added yet.</p>`;
      return;
    }

    list.innerHTML = "";
    certs.forEach((cert, index) => {
      const item = document.createElement("div");
      item.className = "cert-item";
      item.innerHTML = `
        ${cert.image
          ? `<img src="${cert.image}" class="cert-img-thumb" title="View certificate" />`
          : `<div class="cert-icon"><i class="fa-solid fa-certificate"></i></div>`
        }
        <div class="cert-info">
          <span class="cert-name">${cert.name}</span>
          <span class="cert-meta">${cert.organization}${cert.year ? " · " + cert.year : ""}</span>
        </div>
        <button class="cert-delete-btn" data-index="${index}" type="button" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      if (cert.image) {
        item.querySelector(".cert-img-thumb").addEventListener("click", () => {
          document.getElementById("certImgFull").src = cert.image;
          document.getElementById("certImgViewer").classList.remove("hidden");
        });
      }

      list.appendChild(item);
    });

    list.querySelectorAll(".cert-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.index);
        profileData.certifications.splice(idx, 1);
        await saveCertifications();
        renderCertifications();
        showToast("Certification removed.");
      });
    });
  }

  async function saveCertifications() {
    if (!currentUserId) return;
    await updateDoc(doc(db, "users", currentUserId), {
      certifications: profileData.certifications || []
    });
  }

  const addCertBtn = document.getElementById("addCertBtn");
  if (addCertBtn) {
    addCertBtn.addEventListener("click", () => openModal("addCertModal"));
  }

  document.getElementById("closeAddCertBtn").addEventListener("click",   () => closeModal("addCertModal"));
  document.getElementById("cancelAddCertBtn").addEventListener("click", () => closeModal("addCertModal"));

  // ── Research ──────────────────────────────────────────────────────────────────

  function renderResearch() {
    const list = document.getElementById("researchList");
    if (!list) return;

    const papers = profileData.research || [];

    const researchCountEl = document.getElementById("researchCount");
    if (researchCountEl) researchCountEl.textContent = papers.length;

    if (!papers.length) {
      list.innerHTML = `<p class="certs-empty">No research added yet.</p>`;
      return;
    }

    list.innerHTML = "";
    papers.forEach((paper, index) => {
      const item = document.createElement("div");
      item.className = "cert-item";
      item.innerHTML = `
        <div class="cert-icon" style="background:#eef3ff;color:#2b58a8;">
          <i class="fa-solid fa-flask"></i>
        </div>
        <div class="cert-info">
          <span class="cert-name">${paper.title}</span>
          <span class="cert-meta">${paper.venue}${paper.year ? " · " + paper.year : ""}</span>
          ${paper.link
            ? `<a href="${paper.link}" target="_blank" rel="noopener" class="research-link">
                 <i class="fa-solid fa-arrow-up-right-from-square"></i> View Paper
               </a>`
            : ""}
        </div>
        <button class="cert-delete-btn research-delete-btn" data-index="${index}" type="button" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll(".research-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.index);
        profileData.research.splice(idx, 1);
        await saveResearch();
        renderResearch();
        showToast("Research removed.");
      });
    });
  }

  async function saveResearch() {
    if (!currentUserId) return;
    await updateDoc(doc(db, "users", currentUserId), {
      research: profileData.research || []
    });
  }

  const addResearchBtn = document.getElementById("addResearchBtn");
  if (addResearchBtn) addResearchBtn.addEventListener("click", () => openModal("addResearchModal"));

  document.getElementById("closeAddResearchBtn").addEventListener("click",   () => closeModal("addResearchModal"));
  document.getElementById("cancelAddResearchBtn").addEventListener("click", () => closeModal("addResearchModal"));

  document.getElementById("saveAddResearchBtn").addEventListener("click", async () => {
    const title = document.getElementById("inputResearchTitle").value.trim();
    const venue = document.getElementById("inputResearchVenue").value.trim();
    const year  = document.getElementById("inputResearchYear").value.trim();
    const link  = document.getElementById("inputResearchLink").value.trim();

    if (!title || !venue) {
      showToast("Title and journal/conference are required.");
      return;
    }

    if (year && parseInt(year) > new Date().getFullYear()) {
      showToast(`Year cannot be later than ${new Date().getFullYear()}.`, "error");
      return;
    }

    if (!profileData.research) profileData.research = [];
    profileData.research.push({ title, venue, year, ...(link ? { link } : {}) });

    const saveBtn = document.getElementById("saveAddResearchBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving…`;

    try {
      await saveResearch();
      renderResearch();
      closeModal("addResearchModal");
      document.getElementById("inputResearchTitle").value = "";
      document.getElementById("inputResearchVenue").value = "";
      document.getElementById("inputResearchYear").value  = "";
      document.getElementById("inputResearchLink").value  = "";
      showToast("Research added.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save research.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> Add Research`;
    }
  });

  // ── Certificate image upload ───────────────────────────────────────────────

  document.getElementById("inputCertImage").addEventListener("change", function () {
    const file = this.files[0];
    document.getElementById("certImageName").textContent = file ? file.name : "Choose image…";
  });

  document.getElementById("saveAddCertBtn").addEventListener("click", async () => {
    const name         = document.getElementById("inputCertName").value.trim();
    const organization = document.getElementById("inputCertOrg").value.trim();
    const year         = document.getElementById("inputCertYear").value.trim();
    const fileInput    = document.getElementById("inputCertImage");

    if (!name || !organization) {
      showToast("Name and organization are required.");
      return;
    }

    if (year && parseInt(year) > new Date().getFullYear()) {
      showToast(`Year cannot be later than ${new Date().getFullYear()}.`, "error");
      return;
    }

    const saveBtn = document.getElementById("saveAddCertBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving…`;

    let image = null;
    if (fileInput.files[0]) {
      try { image = await compressCertImage(fileInput.files[0]); } catch (_) {}
    }

    if (!profileData.certifications) profileData.certifications = [];
    profileData.certifications.push({ name, organization, year, ...(image ? { image } : {}) });

    try {
      await saveCertifications();
      renderCertifications();
      closeModal("addCertModal");
      document.getElementById("inputCertName").value = "";
      document.getElementById("inputCertOrg").value = "";
      document.getElementById("inputCertYear").value = "";
      fileInput.value = "";
      document.getElementById("certImageName").textContent = "Choose image…";
      showToast("Certification added.");
    } catch (error) {
      console.error("Error saving certification:", error);
      showToast("Failed to save certification.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> Add Certification`;
    }
  });

});
