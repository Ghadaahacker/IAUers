import { db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const savedName = localStorage.getItem("studentName") || "Student";
  const greetingText = document.getElementById("greetingText");

  const hour = new Date().getHours();
  let greeting = "";

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning";
  } else if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  greetingText.textContent = `${greeting}, ${savedName}`;

  // Highlight current page automatically
  const currentPage = window.location.pathname.split("/").pop() || "home.html";
  const navItems = document.querySelectorAll(".nav-menu .nav-item, .sidebar-bottom .nav-item");

  navItems.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    } else if (href !== "home.html") {
      link.classList.remove("active");
    }
  });

  const studentEventsList = document.getElementById("studentEventsList");

  async function loadPublishedEventsForStudents() {
    if (!studentEventsList) return;

    studentEventsList.innerHTML = "";

    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "published")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        studentEventsList.innerHTML = `
          <div class="feed-item no-border">
            <div class="feed-dot soft-dot"></div>
            <div class="feed-text">
              <p>No published events available right now.</p>
              <span>Check again later</span>
            </div>
          </div>
        `;
        return;
      }

      snapshot.forEach((eventDoc) => {
        const event = eventDoc.data();

        studentEventsList.innerHTML += `
          <div class="feed-item">
            <div class="feed-dot dark-dot"></div>

            <div class="feed-text">
              <p><strong>${event.title}</strong></p>
              <p>${event.description}</p>
              <span>
                ${new Date(event.dateTime).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
                ${
                  event.type === "announcement"
                    ? `<a href="${event.link}" target="_blank">Open Link</a>`
                    : event.location
                }
              </span>
            </div>
          </div>
        `;
      });

    } catch (error) {
      console.error("Error loading student events:", error);
    }
  }

  loadPublishedEventsForStudents();

});
