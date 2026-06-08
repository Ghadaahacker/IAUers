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

  const snapshot = await getDocs(
    query(collection(db, "events"), where("createdBy", "==", adminEmail))
  );

  let events = 0;
  let announcements = 0;
  let drafts = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const isAnnouncement = data.type === "announcement";

    if (data.status === "published") {
      isAnnouncement ? announcements++ : events++;
    }
    if (data.status === "draft") drafts++;
  });

  myEventsCount.textContent = events;
  myAnnouncementsCount.textContent = announcements;
  myDraftsCount.textContent = drafts;
}

loadDashboardStats();
