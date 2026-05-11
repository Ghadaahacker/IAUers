import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const greetingText = document.getElementById("greetingText");
  const studentEventsList = document.getElementById("studentEventsList");

  const eventDetailsModal = document.getElementById("eventDetailsModal");
  const closeEventModal = document.getElementById("closeEventModal");

  const modalEventImage = document.getElementById("modalEventImage");
  const modalEventTitle = document.getElementById("modalEventTitle");
  const modalEventDescription = document.getElementById("modalEventDescription");
  const modalEventDate = document.getElementById("modalEventDate");
  const modalEventLocation = document.getElementById("modalEventLocation");
  const modalEventCapacity = document.getElementById("modalEventCapacity");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    await loadStudentGreeting(user.uid);
    await loadPublishedEventsForStudents();
  });

  async function loadStudentGreeting(uid) {
    const hour = new Date().getHours();
    let greeting = "";

    if (hour >= 5 && hour < 12) {
      greeting = "Good morning";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Good afternoon";
    } else {
      greeting = "Good evening";
    }

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let studentName = "Student";

      if (userSnap.exists()) {
        const userData = userSnap.data();
        studentName = userData.name || "Student";
      }

      if (greetingText) {
        greetingText.textContent = `${greeting}, ${studentName}`;
      }

    } catch (error) {
      console.error("Error loading student name:", error);

      if (greetingText) {
        greetingText.textContent = `${greeting}, Student`;
      }
    }
  }

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
          <div class="empty-card">
            <h3>No events available right now.</h3>
            <p>Check again later for new university events.</p>
          </div>
        `;
        return;
      }

      snapshot.forEach((eventDoc) => {
        const event = eventDoc.data();

        const card = document.createElement("article");
        card.className = "event-card";

        card.innerHTML = `
          <img
            src="${event.imageUrl || "../../images/campus.jpg"}"
            alt="${event.title || "Event"}"
            class="event-image"
          />

          <h3 class="event-title">${event.title || "Untitled Event"}</h3>

          <p class="event-location">
            <i class="fa-solid fa-location-dot"></i>
            ${event.location || "IAU Campus"}
          </p>

          <p class="event-date">
            ${formatDateRange(event.dateTime)}
          </p>
        `;

        card.addEventListener("click", () => {
          openEventModal(event);
        });

        studentEventsList.appendChild(card);
      });

    } catch (error) {
      console.error("Error loading student events:", error);

      studentEventsList.innerHTML = `
        <div class="empty-card">
          <h3>Failed to load events.</h3>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }

  function openEventModal(event) {
    modalEventImage.src = event.imageUrl || "../../images/campus.jpg";
    modalEventTitle.textContent = event.title || "Untitled Event";
    modalEventDescription.textContent = event.description || "No description available.";
    modalEventDate.textContent = formatDateTime(event.dateTime);
    modalEventLocation.textContent = event.location || "IAU Campus";

    if (event.unlimitedSeats) {
      modalEventCapacity.textContent = "Unlimited seats";
    } else {
      modalEventCapacity.textContent = `${event.seatCapacity || 0} seats available`;
    }

    eventDetailsModal.style.display = "flex";
  }

  if (closeEventModal) {
    closeEventModal.addEventListener("click", () => {
      eventDetailsModal.style.display = "none";
    });
  }

  if (eventDetailsModal) {
    eventDetailsModal.addEventListener("click", (e) => {
      if (e.target === eventDetailsModal) {
        eventDetailsModal.style.display = "none";
      }
    });
  }

  function formatDateTime(value) {
    if (!value) return "Date not set";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDateRange(value) {
    if (!value) return "Date not set";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }
});
