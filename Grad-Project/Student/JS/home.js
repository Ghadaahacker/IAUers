import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
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
  let currentStudentInterests = [];
  let selectedEvent = null;

  injectToast();

  const showAllBtns = document.querySelectorAll(".show-all-btn");
  if (showAllBtns[0]) {
    showAllBtns[0].addEventListener("click", function () {
      studentEventsList.classList.toggle("expanded");
      this.querySelector("i").style.transform =
        studentEventsList.classList.contains("expanded") ? "rotate(90deg)" : "";
    });
  }
  if (showAllBtns[1]) {
    showAllBtns[1].addEventListener("click", function () {
      announcementsList.classList.toggle("expanded");
      this.querySelector("i").style.transform =
        announcementsList.classList.contains("expanded") ? "rotate(90deg)" : "";
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    currentUser = user;

    await loadStudentProfile(user.uid);
    await loadPublishedEventsForStudents();
    await loadPublishedAnnouncementsForStudents();
  });

  async function loadStudentProfile(uid) {
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
      currentStudentInterests = [];

      if (userSnap.exists()) {
        const userData = userSnap.data();

        studentName = userData.name || "Student";
        currentStudentInterests = Array.isArray(userData.interests)
          ? userData.interests
          : [];
      }

      greetingText.textContent = `${greeting}, ${studentName}`;
    } catch (error) {
      console.error("Error loading student profile:", error);
      greetingText.textContent = `${greeting}, Student`;
      currentStudentInterests = [];
    }
  }

  async function loadPublishedEventsForStudents() {
    studentEventsList.innerHTML = `
      <div class="empty-card">
        <h3>Loading events...</h3>
        <p>Please wait while we prepare available events.</p>
      </div>
    `;

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

      const events = [];

      snapshot.forEach((eventDoc) => {
        const event = eventDoc.data();

        events.push({
          id: eventDoc.id,
          ...event,
          isRecommended: isRecommendedEvent(event)
        });
      });

      events.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return new Date(a.dateTime || 0) - new Date(b.dateTime || 0);
      });

      studentEventsList.innerHTML = "";

      events.forEach((event) => {
        studentEventsList.appendChild(createEventCard(event));
      });

    } catch (error) {
      console.error("Error loading student events:", error);

      studentEventsList.innerHTML = `
        <div class="empty-card">
          <h3>Could not load events.</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      `;
    }
  }

  function isRecommendedEvent(event) {
    const eventInterests = Array.isArray(event.interests)
      ? event.interests
      : [];

    if (!currentStudentInterests.length || !eventInterests.length) {
      return false;
    }

    return eventInterests.some((interest) =>
      currentStudentInterests.includes(interest)
    );
  }

  function createEventCard(event) {
    const card = document.createElement("article");
    card.className = event.isRecommended
      ? "event-card recommended-event-card"
      : "event-card";

    const remainingSeats = getRemainingSeats(event);

    card.innerHTML = `
      ${
        event.image
          ? `<img src="${event.image}" class="event-image" alt="Event Image">`
          : ""
      }

      <div class="event-card-badges">
        ${
          event.isRecommended
            ? `<span class="recommended-badge"><i class="fa-solid fa-star"></i> Recommended for you</span>`
            : ""
        }

        ${renderSeatsBadge(remainingSeats)}
      </div>

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
      openEventModal(event);
    });

    return card;
  }

  function getRemainingSeats(event) {
    const capacity = Number(event.capacity || event.seatCapacity || 0);
    const registeredCount = Number(event.registeredCount || 0);

    if (!capacity) return null;

    return capacity - registeredCount;
  }

  function renderSeatsBadge(remainingSeats) {
    if (remainingSeats === null) return "";

    if (remainingSeats <= 0) {
      return `<span class="seats-badge sold-out">Sold out</span>`;
    }

    if (remainingSeats <= 5) {
      return `<span class="seats-badge few-left">${remainingSeats} seats left</span>`;
    }

    return `<span class="seats-badge available">${remainingSeats} seats available</span>`;
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

    modalEventImage.src = event.image || event.imageUrl || "../../images/campus.jpg";
    modalEventTitle.textContent = event.title || "Untitled Event";
    modalEventDescription.textContent = event.description || "No description available.";
    modalEventDate.textContent = formatDateTime(event.dateTime);
    modalEventLocation.textContent = event.location || event.hall || "IAU Campus";

    const remainingSeats = getRemainingSeats(event);

    if (remainingSeats === null) {
      modalEventCapacity.textContent = `${event.capacity || event.seatCapacity || 0} seats`;
    } else if (remainingSeats <= 0) {
      modalEventCapacity.textContent = "Sold out";
    } else if (remainingSeats <= 5) {
      modalEventCapacity.textContent = `${remainingSeats} seats left`;
    } else {
      modalEventCapacity.textContent = `${remainingSeats} seats available`;
    }

    if (remainingSeats !== null && remainingSeats <= 0) {
      registerBtn.textContent = "Sold Out";
      registerBtn.disabled = true;
    } else {
      registerBtn.textContent = "Register";
      registerBtn.disabled = false;
    }

    eventDetailsModal.style.display = "flex";
  }

  registerBtn.addEventListener("click", async () => {
    if (!currentUser || !selectedEvent) return;

    try {
      registerBtn.disabled = true;
      registerBtn.textContent = "Registering...";

      const duplicateQuery = query(
        collection(db, "eventRegistrations"),
        where("studentId", "==", currentUser.uid),
        where("eventId", "==", selectedEvent.id)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        showToast("You are already registered for this event.");
        registerBtn.textContent = "Registered";
        registerBtn.disabled = true;
        return;
      }

      const remainingSeats = getRemainingSeats(selectedEvent);

      if (remainingSeats !== null && remainingSeats <= 0) {
        showToast("This event is fully booked.");
        registerBtn.textContent = "Sold Out";
        registerBtn.disabled = true;
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

      await updateDoc(doc(db, "events", selectedEvent.id), {
        registeredCount: increment(1)
      });
      selectedEvent.registeredCount = (selectedEvent.registeredCount || 0) + 1;

      showToast("You are registered successfully. Your ticket is now available in My Tickets.");

      registerBtn.textContent = "Registered";
      registerBtn.disabled = true;

    } catch (error) {
      console.error("Error registering event:", error);
      showToast("Failed to register. Please try again.");
      registerBtn.textContent = "Register";
      registerBtn.disabled = false;
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

  function injectToast() {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="homeToast" class="home-toast hidden">
        <i class="fa-solid fa-circle-check"></i>
        <span id="homeToastMessage"></span>
      </div>
    `);
  }

  function showToast(message) {
    const toast = document.getElementById("homeToast");
    const toastMessage = document.getElementById("homeToastMessage");

    toastMessage.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3200);
  }
});