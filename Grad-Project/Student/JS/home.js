import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const greetingText = document.getElementById("greetingText");
  const studentEventsList = document.getElementById("studentEventsList");
  const announcementsList = document.getElementById("announcementsList");

  const eventDetailsModal = document.getElementById("eventDetailsModal");
  const closeEventModal = document.getElementById("closeEventModal");

  const modalEventImage = document.getElementById("modalEventImage");
  const modalEventTitle = document.getElementById("modalEventTitle");
  const modalEventDescription = document.getElementById("modalEventDescription");
  const modalEventDate = document.getElementById("modalEventDate");
  const modalEventLocation = document.getElementById("modalEventLocation");
  const modalEventCapacity = document.getElementById("modalEventCapacity");
  const registerBtn = document.querySelector(".register-btn");

  let currentUser = null;
  let selectedEvent = null;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    currentUser = user;

    await loadStudentGreeting(user.uid);
    await loadPublishedEventsForStudents();
    await loadPublishedAnnouncementsForStudents();
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

      greetingText.textContent = `${greeting}, ${studentName}`;
    } catch (error) {
      console.error("Error loading student name:", error);
      greetingText.textContent = `${greeting}, Student`;
    }
  }

  async function loadPublishedEventsForStudents() {
    studentEventsList.innerHTML = "";

    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "published"),
        where("type", "==", "event")
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

        const eventWithId = {
          id: eventDoc.id,
          ...event
        };

        const card = document.createElement("article");
        card.className = "event-card";

        card.innerHTML = `
        ${
  event.image
    ? `<img src="${event.image}" class="event-image">`
    : ""
}

          <h3 class="event-title">${event.title || "Untitled Event"}</h3>

          <p class="event-location">
            <i class="fa-solid fa-location-dot"></i>
            ${event.location || event.hall || "IAU Campus"}
          </p>

          <p class="event-date">
            ${formatDateRange(event.dateTime)}
          </p>
        `;

        card.addEventListener("click", () => {
          openEventModal(eventWithId);
        });

        studentEventsList.appendChild(card);
      });

    } catch (error) {
      console.error("Error loading student events:", error);
    }
  }

  async function loadPublishedAnnouncementsForStudents() {
    announcementsList.innerHTML = "";

    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "published"),
        where("type", "==", "announcement")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        announcementsList.innerHTML = `
          <div class="announcement-card">
            <div class="announcement-top">Coming Soon</div>
            <h3>No announcements yet</h3>
            <p>New announcements will appear here.</p>
          </div>
        `;
        return;
      }

      snapshot.forEach((docSnap) => {
        const announcement = docSnap.data();

        const card = document.createElement("div");
        card.className = "announcement-card";

        card.innerHTML = `
          <div class="announcement-top">Announcement</div>
          <h3>${announcement.title || "Untitled Announcement"}</h3>
          <p>${announcement.description || "No description available."}</p>
          ${
            announcement.link
              ? `<a href="${announcement.link}" target="_blank">Open Link</a>`
              : ""
          }
        `;

        announcementsList.appendChild(card);
      });

    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  }

  function openEventModal(event) {
    selectedEvent = event;

    modalEventImage.src = event.imageUrl || "../../images/campus.jpg";
    modalEventTitle.textContent = event.title || "Untitled Event";
    modalEventDescription.textContent = event.description || "No description available.";
    modalEventDate.textContent = formatDateTime(event.dateTime);
    modalEventLocation.textContent = event.location || event.hall || "IAU Campus";
    modalEventCapacity.textContent = `${event.seatCapacity || 0} seats available`;

    registerBtn.textContent = "Register";
    registerBtn.disabled = false;

    eventDetailsModal.style.display = "flex";
  }

  registerBtn.addEventListener("click", async () => {
    if (!currentUser || !selectedEvent) return;

    try {
      const duplicateQuery = query(
        collection(db, "eventRegistrations"),
        where("studentId", "==", currentUser.uid),
        where("eventId", "==", selectedEvent.id)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        alert("You already registered for this event.");
        return;
      }

      await addDoc(collection(db, "eventRegistrations"), {
        studentId: currentUser.uid,
        studentEmail: currentUser.email,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title || "Untitled Event",
        eventDateTime: selectedEvent.dateTime || "",
        eventLocation: selectedEvent.location || selectedEvent.hall || "IAU Campus",
        description: selectedEvent.description || "",
        status: "approved",
        createdAt: serverTimestamp()
      });

      alert("Registered successfully. This event is now added to your schedule.");

      registerBtn.textContent = "Registered";
      registerBtn.disabled = true;

    } catch (error) {
      console.error("Error registering event:", error);
      alert("Failed to register. Please try again.");
    }
  });

  closeEventModal.addEventListener("click", () => {
    eventDetailsModal.style.display = "none";
  });

  eventDetailsModal.addEventListener("click", (e) => {
    if (e.target === eventDetailsModal) {
      eventDetailsModal.style.display = "none";
    }
  });

  function formatDateTime(value) {
    if (!value) return "Date not set";

    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

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
    if (isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }
});