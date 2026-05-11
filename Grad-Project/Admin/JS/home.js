import { db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

  const eventsSnapshot =
    await getDocs(collection(db, "events"));

  const announcementsSnapshot =
    await getDocs(collection(db, "announcements"));

  let events = 0;
  let announcements = 0;
  let drafts = 0;

  eventsSnapshot.forEach((doc) => {

    const data = doc.data();

    if (data.status === "published") {
      events++;
    }

    if (data.status === "draft") {
      drafts++;
    }
  });

  announcementsSnapshot.forEach((doc) => {

    const data = doc.data();

    if (data.status === "published") {
      announcements++;
    }

    if (data.status === "draft") {
      drafts++;
    }
  });

  myEventsCount.textContent = events;
  myAnnouncementsCount.textContent = announcements;
  myDraftsCount.textContent = drafts;
}

loadDashboardStats();