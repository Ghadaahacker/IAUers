import { db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");

if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

const adminEmail = (sessionStorage.getItem("userEmail") || "").toLowerCase();

const addEventBtn = document.getElementById("addEventBtn");
const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");
const editContentBtn = document.getElementById("editContentBtn");

addEventBtn.addEventListener("click", function () {
  window.location.href = "../HTML/content.html";
});

addAnnouncementBtn.addEventListener("click", function () {
  window.location.href = "../HTML/content.html";
});

editContentBtn.addEventListener("click", function () {
  window.location.href = "../HTML/content.html";
});

const myEventsCount = document.getElementById("myEventsCount");
const myAnnouncementsCount = document.getElementById("myAnnouncementsCount");
const myDraftsCount = document.getElementById("myDraftsCount");

async function loadDashboardStats() {

  const [eventsSnapshot, announcementsSnapshot] = await Promise.all([
    getDocs(query(collection(db, "events"), where("createdBy", "==", adminEmail))),
    getDocs(query(collection(db, "announcements"), where("createdBy", "==", adminEmail)))
  ]);

  let events = 0;
  let announcements = 0;
  let drafts = 0;

  eventsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status === "published") events++;
    if (data.status === "draft") drafts++;
  });

  announcementsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status === "published") announcements++;
    if (data.status === "draft") drafts++;
  });

  myEventsCount.textContent = events;
  myAnnouncementsCount.textContent = announcements;
  myDraftsCount.textContent = drafts;
}

loadDashboardStats();
const recentActivityList = document.getElementById("recentActivityList");

function loadRecentActivity() {
  const q = query(
    collection(db, "activityLogs"),
    where("adminEmail", "==", adminEmail),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  onSnapshot(q, (snapshot) => {
    recentActivityList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const activity = docSnap.data();

      const item = document.createElement("div");
      item.className = "activity-item";

      item.innerHTML = `
        <span class="activity-dot light"></span>
        <div>
          <p>${activity.message}</p>
          <small>Latest update</small>
        </div>
      `;

      recentActivityList.appendChild(item);
    });
  });
}

loadRecentActivity();