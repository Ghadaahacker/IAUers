import { db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");

if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const totalUsersCount = document.getElementById("totalUsersCount");
  const activeUsersCount = document.getElementById("activeUsersCount");
  const inactiveUsersCount = document.getElementById("inactiveUsersCount");

  let total = 0;
  let active = 0;
  let inactive = 0;

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    const snapshot = await getDocs(collection(db, "users"));

    snapshot.forEach((userDoc) => {
      const user = userDoc.data();
      total++;

      if (user.lastLogin && user.lastLogin.toDate() >= twoDaysAgo) {
        active++;
      } else {
        inactive++;
      }
    });

    totalUsersCount.textContent = total;
    activeUsersCount.textContent = active;
    inactiveUsersCount.textContent = inactive;

  } catch (error) {
    console.error("Error loading users:", error);
  }
});