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
  let currentStudentName = "Student";
  let selectedEvent = null;
  let selectedCollege = "all";
  let selectedSort = "all";
  let allEvents = [];

  injectToast();

  // Lightbox
  const imgLightbox   = document.getElementById("imgLightbox");
  const lightboxImg   = document.getElementById("lightboxImg");
  const closeLightbox = document.getElementById("closeLightbox");

  if (closeLightbox) closeLightbox.addEventListener("click", () => imgLightbox.classList.add("hidden"));
  if (imgLightbox)   imgLightbox.addEventListener("click", (e) => { if (e.target === imgLightbox) imgLightbox.classList.add("hidden"); });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") imgLightbox?.classList.add("hidden"); });

  // Notification panel
  const notifBtn      = document.getElementById("notifBtn");
  const notifPanel    = document.getElementById("notifPanel");
  const notifCloseBtn = document.getElementById("notifCloseBtn");
  const notifBadge    = document.getElementById("notifBadge");
  const notifList     = document.getElementById("notifList");

  if (notifBtn) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle("hidden");
    });
  }
  if (notifCloseBtn) notifCloseBtn.addEventListener("click", () => notifPanel.classList.add("hidden"));
  document.addEventListener("click", (e) => {
    if (!notifPanel?.contains(e.target) && e.target !== notifBtn) notifPanel?.classList.add("hidden");
  });

  const motivationText = document.getElementById("motivationText");
  const quotes = [
    "Make today another step toward the future you want.",
    "Every effort you make today shapes who you'll be tomorrow.",
    "Stay focused, stay driven — your journey is worth it.",
    "Small progress is still progress. Keep going.",
    "You're building something great, one day at a time.",
    "The best investment you can make is in yourself.",
    "Today's dedication is tomorrow's achievement.",
    "Believe in the work you're doing. It all adds up.",
  ];
  if (motivationText) {
    let quoteIndex = 0;
    setInterval(() => {
      motivationText.classList.add("quote-fade-out");
      setTimeout(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        motivationText.textContent = quotes[quoteIndex];
        motivationText.classList.remove("quote-fade-out");
      }, 450);
    }, 5000);
  }

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

  document.querySelectorAll(".sort-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".sort-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      selectedSort = this.dataset.sort;
      renderFilteredEvents();
    });
  });

  const filterTriggerBtn = document.getElementById("filterTriggerBtn");
  const filterPanel = document.getElementById("filterPanel");
  const filterSearch = document.getElementById("filterSearch");
  const filterLabel = document.getElementById("filterLabel");

  if (filterTriggerBtn && filterPanel) {
    filterTriggerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      filterPanel.classList.toggle("hidden");
      filterTriggerBtn.classList.toggle("open");
    });

    filterPanel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    document.querySelectorAll(".filter-option").forEach(option => {
      option.addEventListener("click", function () {
        document.querySelectorAll(".filter-option").forEach(o => o.classList.remove("active"));
        this.classList.add("active");
        selectedCollege = this.dataset.college;
        filterLabel.textContent = this.textContent.trim();
        filterPanel.classList.add("hidden");
        filterTriggerBtn.classList.remove("open");
        filterTriggerBtn.classList.toggle("active-filter", selectedCollege !== "all");
        if (filterSearch) filterSearch.value = "";
        document.querySelectorAll(".filter-option").forEach(o => o.style.display = "");
        renderFilteredEvents();
      });
    });

    if (filterSearch) {
      filterSearch.addEventListener("input", function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll(".filter-option").forEach(option => {
          option.style.display = option.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }

    document.addEventListener("click", function () {
      filterPanel.classList.add("hidden");
      filterTriggerBtn.classList.remove("open");
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
    await loadNotifications();
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
        currentStudentName = studentName;
        currentStudentInterests = Array.isArray(userData.interests)
          ? userData.interests
          : [];
      }

      const emoji = hour >= 5 && hour < 12 ? "☀️" : hour >= 12 && hour < 18 ? "✨" : "🌙";
      greetingText.textContent = `${greeting}, ${studentName} ${emoji}`;
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

      allEvents = events;
      renderFilteredEvents();

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

    const cardImg = card.querySelector(".event-image");
    if (cardImg) {
      cardImg.style.cursor = "zoom-in";
      cardImg.addEventListener("click", (e) => {
        e.stopPropagation();
        if (lightboxImg) lightboxImg.src = cardImg.src;
        imgLightbox?.classList.remove("hidden");
      });
    }

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
        studentName: currentStudentName,
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

  async function loadNotifications() {
    if (!notifList) return;
    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "published"),
        where("type", "==", "announcement")
      );
      const snap = await getDocs(q);
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));

      if (!items.length) {
        notifList.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
        return;
      }

      notifBadge?.classList.remove("hidden");
      if (notifBadge) notifBadge.textContent = items.length;

      notifList.innerHTML = "";
      items.slice(0, 8).forEach(item => {
        const el = document.createElement("div");
        el.className = "notif-item";
        el.innerHTML = `
          <div class="notif-dot"></div>
          <div>
            <div class="notif-item-title">${item.title || "Announcement"}</div>
            <div class="notif-item-sub">${(item.description || "").slice(0, 60)}${(item.description || "").length > 60 ? "…" : ""}</div>
          </div>`;
        notifList.appendChild(el);
      });
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  }

  function renderFilteredEvents() {
    if (!allEvents.length) {
      studentEventsList.innerHTML = `
        <div class="empty-card">
          <h3>No events available right now.</h3>
          <p>Check again later for new university events.</p>
        </div>
      `;
      return;
    }

    let filtered = selectedCollege === "all"
      ? [...allEvents]
      : allEvents.filter(e => (e.college || "CBA") === selectedCollege);

    if (selectedSort === "recommended") {
      filtered = filtered.filter(e => e.isRecommended);
    } else if (selectedSort === "upcoming") {
      const now = new Date();
      filtered = filtered
        .filter(e => new Date(e.dateTime || 0) >= now)
        .sort((a, b) => new Date(a.dateTime || 0) - new Date(b.dateTime || 0));
    } else if (selectedSort === "ending") {
      filtered = filtered
        .filter(e => {
          const seats = getRemainingSeats(e);
          return seats !== null && seats > 0 && seats <= 5;
        })
        .sort((a, b) => getRemainingSeats(a) - getRemainingSeats(b));
    }

    studentEventsList.innerHTML = "";

    if (!filtered.length) {
      const messages = {
        recommended: { title: "No recommended events yet.", sub: "Update your interests in Profile to get personalized suggestions." },
        upcoming:    { title: "No upcoming events.", sub: "Check back later for new events." },
        ending:      { title: "No events ending soon.", sub: "All events still have plenty of seats available." },
        all:         { title: "No events from this college yet.", sub: "Check back later for events." }
      };
      const msg = messages[selectedSort] || messages["all"];
      studentEventsList.innerHTML = `
        <div class="empty-card">
          <h3>${msg.title}</h3>
          <p>${msg.sub}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(event => {
      studentEventsList.appendChild(createEventCard(event));
    });
  }

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