import { db } from "../../Shared/JS/firebase-config.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const discardBtn = document.getElementById("discardBtn");
  const sendMessageBtn = document.getElementById("sendMessageBtn");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("emailAddress");
  const departmentSelect = document.getElementById("department");

  const userId = sessionStorage.getItem("userId");

  let originalData = {};

  if (!userId) {
    alert("User not logged in.");
    return;
  }

  const userRef = doc(db, "users", userId);

  async function loadUserProfile() {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User data not found.");
      return;
    }

    const userData = userSnap.data();
    originalData = userData;

    fullNameInput.value = userData.name || "";
    emailInput.value = userData.email || "";
    departmentSelect.value = userData.department || "Student Affairs";
  }

  saveProfileBtn.addEventListener("click", async () => {
    await updateDoc(userRef, {
      name: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      department: departmentSelect.value
    });

    alert("Profile updated successfully.");
    loadUserProfile();
  });

  discardBtn.addEventListener("click", () => {
    fullNameInput.value = originalData.name || "";
    emailInput.value = originalData.email || "";
    departmentSelect.value = originalData.department || "Student Affairs";
  });

  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", () => {
      window.location.href = "mailto:organg67@gmail.com";
    });
  }

  loadUserProfile();
});