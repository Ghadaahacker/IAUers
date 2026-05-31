import { db } from "../../Shared/JS/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");
if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".settings-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "settings-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 28px; right: 28px;
    background: ${type === "success" ? "#22a24d" : "#c84a2f"};
    color: #fff; padding: 14px 24px; border-radius: 12px;
    font-size: 15px; font-weight: 600; z-index: 9999;
    box-shadow: 0 8px 28px rgba(0,0,0,0.15);
    opacity: 0; transition: opacity 0.25s ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const discardBtn = document.getElementById("discardBtn");
  const sendMessageBtn = document.getElementById("sendMessageBtn");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("emailAddress");
  const departmentSelect = document.getElementById("department");
  const avatarInitial = document.getElementById("avatarInitial");

  const notifEventReg = document.getElementById("notifEventRegistration");
  const notifVenueReq = document.getElementById("notifVenueRequest");

  const userId = sessionStorage.getItem("userId");
  let originalData = {};

  if (!userId) {
    showToast("User not logged in.", "error");
    return;
  }

  const userRef = doc(db, "users", userId);

  async function loadUserProfile() {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      showToast("User data not found.", "error");
      return;
    }

    const userData = userSnap.data();
    originalData = userData;

    fullNameInput.value = userData.name || "";
    emailInput.value = userData.email || "";
    departmentSelect.value = userData.department || "Student Affairs";

    // Dynamic avatar initial from name
    const initial = (userData.name || "?").trim().charAt(0).toUpperCase();
    if (avatarInitial) avatarInitial.textContent = initial;

    // Load notification preferences (default to true if not set)
    const notifs = userData.notifications || {};
    notifEventReg.checked = notifs.eventRegistration !== false;
    notifVenueReq.checked = notifs.venueRequest !== false;
  }

  saveProfileBtn.addEventListener("click", async () => {
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving…";

    try {
      await updateDoc(userRef, {
        name: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        department: departmentSelect.value
      });
      showToast("Profile updated successfully.");
      await loadUserProfile();
    } catch {
      showToast("Failed to save profile.", "error");
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Changes";
    }
  });

  discardBtn.addEventListener("click", () => {
    fullNameInput.value = originalData.name || "";
    emailInput.value = originalData.email || "";
    departmentSelect.value = originalData.department || "Student Affairs";
  });

  // Persist notification toggles on change
  async function saveNotificationPrefs() {
    try {
      await updateDoc(userRef, {
        notifications: {
          eventRegistration: notifEventReg.checked,
          venueRequest: notifVenueReq.checked
        }
      });
      showToast("Notification preferences saved.");
    } catch {
      showToast("Failed to save preferences.", "error");
    }
  }

  notifEventReg.addEventListener("change", saveNotificationPrefs);
  notifVenueReq.addEventListener("change", saveNotificationPrefs);

  sendMessageBtn.addEventListener("click", () => {
    const subject = document.getElementById("supportSubject").value.trim();
    const message = document.getElementById("supportMessage").value.trim();

    if (!subject || !message) {
      showToast("Please fill in both subject and message.", "error");
      return;
    }

    const mailto = `mailto:organg67@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
  });

  await loadUserProfile();
});
