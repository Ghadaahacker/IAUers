import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  const settingsName   = document.getElementById("settingsName");
  const settingsEmail  = document.getElementById("settingsEmail");
  const settingsAvatar = document.getElementById("settingsAvatar");

  const notifNewEvents      = document.getElementById("notifNewEvents");
  const notifReminders      = document.getElementById("notifReminders");
  const notifTasks          = document.getElementById("notifTasks");
  const notifAnnouncements  = document.getElementById("notifAnnouncements");

  const saveNotifBtn       = document.getElementById("saveNotifBtn");
  const settingsLogoutBtn  = document.getElementById("settingsLogoutBtn");
  const toast              = document.getElementById("toast");
  const toastMsg           = document.getElementById("toastMsg");

  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  function getInitials(name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    try {
      const userRef  = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        if (settingsName)   settingsName.textContent  = data.name  || "Student";
        if (settingsEmail)  settingsEmail.textContent = data.email || user.email || "—";
        if (settingsAvatar) settingsAvatar.textContent = data.name ? getInitials(data.name) : "?";

        const notif = data.notifications || {};
        if (notifNewEvents)     notifNewEvents.checked     = notif.newEvents     !== false;
        if (notifReminders)     notifReminders.checked     = notif.reminders     !== false;
        if (notifTasks)         notifTasks.checked         = notif.tasks         === true;
        if (notifAnnouncements) notifAnnouncements.checked = notif.announcements !== false;

      } else {
        await setDoc(userRef, { notifications: {} }, { merge: true });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }

    if (saveNotifBtn) {
      saveNotifBtn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            notifications: {
              newEvents:     notifNewEvents?.checked     ?? true,
              reminders:     notifReminders?.checked     ?? true,
              tasks:         notifTasks?.checked         ?? false,
              announcements: notifAnnouncements?.checked ?? true,
            }
          });
          showToast("Notification preferences saved.");
        } catch (err) {
          console.error(err);
          showToast("Failed to save. Try again.");
        }
      });
    }

    if (settingsLogoutBtn) {
      settingsLogoutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "../../Login/HTML/login.html";
        } catch (err) {
          console.error(err);
          showToast("Logout failed. Try again.");
        }
      });
    }
  });
});
