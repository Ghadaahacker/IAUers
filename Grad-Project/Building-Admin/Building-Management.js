import { auth, db } from "../Shared/JS/firebase-config.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const currentUserRole = sessionStorage.getItem("userRole");
const currentUserEmail = sessionStorage.getItem("userEmail");

if (currentUserRole !== "buildingManager") {
  window.location.href = "../Login/HTML/login.html";
}

const requestList = document.getElementById("request-list");
const filterButtons = document.querySelectorAll(".filter-btn");

const detailTitle = document.getElementById("detail-title");
const detailOrganizer = document.getElementById("detail-organizer");
const detailHall = document.getElementById("detail-hall");
const detailCapacity = document.getElementById("detail-capacity");
const detailDate = document.getElementById("detail-date");
const detailStatus = document.getElementById("detail-status");

const pendingCount = document.getElementById("pending-count");
const acceptedCount = document.getElementById("accepted-count");
const rejectedCount = document.getElementById("rejected-count");

const acceptBtn = document.getElementById("accept-btn");
const rejectBtn = document.getElementById("reject-btn");
const rejectBox = document.getElementById("reject-box");
const rejectReasonInput = document.getElementById("reject-reason");
const submitRejectBtn = document.getElementById("submit-reject");

const viewCalendarBtn = document.getElementById("view-calendar-btn");
const calendarModal = document.getElementById("calendar-modal");
const closeCalendar = document.getElementById("close-calendar");

const settingsBtn = document.getElementById("settings-btn");
const profileBtn = document.getElementById("profile-btn");

const settingsModal = document.getElementById("settings-modal");
const profileModal = document.getElementById("profile-modal");

const closeSettings = document.getElementById("close-settings");
const closeProfile = document.getElementById("close-profile");

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");

let bookings = [];
let currentFilter = "All";
let selectedBookingId = null;

function normalizeStatus(status) {
  if (status === "Pending Building Approval") return "Pending";
  return status;
}

function getStatusClass(status) {
  return normalizeStatus(status).toLowerCase();
}

function updateStats() {
  pendingCount.textContent = bookings.filter(b => normalizeStatus(b.status) === "Pending").length;
  acceptedCount.textContent = bookings.filter(b => normalizeStatus(b.status) === "Accepted").length;
  rejectedCount.textContent = bookings.filter(b => normalizeStatus(b.status) === "Rejected").length;
}

function renderDetails(booking) {
  if (!booking) {
    detailTitle.textContent = "Select a request";
    detailOrganizer.textContent = "—";
    detailHall.textContent = "—";
    detailCapacity.textContent = "—";
    detailDate.textContent = "—";
    detailStatus.textContent = "—";
    return;
  }

  detailTitle.textContent = booking.title || "Untitled Event";
  detailOrganizer.textContent = booking.createdBy || "Admin";
  detailHall.textContent = booking.hall || "—";
  detailCapacity.textContent = booking.capacity || "—";

  detailDate.textContent = booking.dateTime
    ? new Date(booking.dateTime).toLocaleString()
    : "—";

  detailStatus.textContent = normalizeStatus(booking.status);
}

function renderRequests() {
  requestList.innerHTML = "";

  const filteredBookings =
    currentFilter === "All"
      ? bookings
      : bookings.filter(booking => normalizeStatus(booking.status) === currentFilter);

  if (filteredBookings.length === 0) {
    requestList.innerHTML = `
      <div class="empty-state">
        No booking requests found.
      </div>
    `;
    renderDetails(null);
    return;
  }

  filteredBookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "request-card";
    card.dataset.id = booking.id;

    if (booking.id === selectedBookingId) {
      card.classList.add("selected");
    }

    const shownStatus = normalizeStatus(booking.status);

    card.innerHTML = `
      <div>
        <h3>${booking.title}</h3>
        <p>${booking.createdBy || "Admin"} • ${booking.hall}</p>
      </div>
      <span class="status ${getStatusClass(booking.status)}">${shownStatus}</span>
    `;

    card.addEventListener("click", () => {
      selectedBookingId = booking.id;
      rejectBox.classList.remove("show");
      rejectReasonInput.value = "";
      renderDetails(booking);
      renderRequests();
    });

    requestList.appendChild(card);
  });

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  if (!selectedBooking && filteredBookings.length > 0) {
    selectedBookingId = filteredBookings[0].id;
    renderDetails(filteredBookings[0]);
  }
}

function setActiveFilterButton(clickedBtn) {
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  clickedBtn.classList.add("active");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    setActiveFilterButton(button);
    renderRequests();
  });
});

// ── Calendar Modal ────────────────────────────────────────────────────────────

function openCalendarModal(selectedBooking) {
  const hall = selectedBooking.hall || "—";
  const selectedDate = selectedBooking.dateTime ? new Date(selectedBooking.dateTime) : null;

  // Accepted bookings for this hall (excluding the current request)
  const hallBookings = bookings.filter(b =>
    b.id !== selectedBooking.id &&
    (b.hall || "").toLowerCase() === hall.toLowerCase() &&
    normalizeStatus(b.status) === "Accepted"
  );

  // Map: "YYYY-M-D" -> full booking info
  const bookedMap = {};
  hallBookings.forEach(b => {
    const d = new Date(b.dateTime);
    bookedMap[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = {
      title: b.title || "Untitled Event",
      dateTime: b.dateTime,
      createdBy: b.createdBy || "Admin"
    };
  });

  document.getElementById("calendar-modal-title").textContent = hall;
  document.getElementById("calendar-modal-subtitle").textContent = "Venue schedule";

  const container = document.getElementById("calendar-bookings-list");

  let viewYear  = selectedDate ? selectedDate.getFullYear()  : new Date().getFullYear();
  let viewMonth = selectedDate ? selectedDate.getMonth()     : new Date().getMonth();

  const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today    = new Date();

  function render() {
    const firstDay    = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDow    = firstDay.getDay();

    let cells = "";

    for (let i = 0; i < startDow; i++) {
      cells += `<div class="cal-cell other-month"><div class="cal-num"></div><div class="cal-dots"></div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key        = `${viewYear}-${viewMonth}-${day}`;
      const isToday    = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
      const isSelected = selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
      const isBooked   = key in bookedMap;
      const isConflict = isSelected && isBooked;

      let cls = "cal-cell";
      if (isToday)         cls += " is-today";
      if (isConflict)      cls += " is-conflict";
      else if (isSelected) cls += " is-selected";
      if (isBooked)        cls += " is-booked";

      let dots = "";
      if (isConflict)      dots = `<div class="cal-dot dot-conflict"></div>`;
      else if (isBooked)   dots = `<div class="cal-dot dot-booked"></div>`;
      else if (isSelected) dots = `<div class="cal-dot dot-selected"></div>`;

      cells += `
        <div class="${cls}" ${isBooked ? `data-key="${key}"` : ""}>
          <div class="cal-num">${day}</div>
          <div class="cal-dots">${dots}</div>
        </div>`;
    }

    container.innerHTML = `
      <div class="cal-nav">
        <button class="cal-nav-btn" id="cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="cal-month-label">${MONTHS[viewMonth]} ${viewYear}</span>
        <button class="cal-nav-btn" id="cal-next"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="cal-weekdays">
        ${WEEKDAYS.map(d => `<div class="cal-weekday">${d}</div>`).join("")}
      </div>
      <div class="cal-grid" id="cal-grid">${cells}</div>
      <div class="cal-booking-popup" id="cal-booking-popup">
        <div class="cal-popup-title" id="cal-popup-title"></div>
        <div class="cal-popup-meta">
          <span id="cal-popup-date"></span>
          <span id="cal-popup-organizer"></span>
        </div>
      </div>
      <div class="cal-legend">
        <div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:#1e3a8a;"></div>
          <span>Selected request</span>
        </div>
        <div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:#ef4444;"></div>
          <span>Already booked</span>
        </div>
        <div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:#f2f5f9; border:1px solid #ccc;"></div>
          <span>Today</span>
        </div>
      </div>
    `;

    document.getElementById("cal-prev").addEventListener("click", () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    });

    document.getElementById("cal-next").addEventListener("click", () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    });

    // Click a booked day to see booking details
    document.getElementById("cal-grid").addEventListener("click", e => {
      const cell = e.target.closest("[data-key]");
      const popup = document.getElementById("cal-booking-popup");
      if (!cell) { popup.style.display = "none"; return; }

      const booking = bookedMap[cell.dataset.key];
      if (!booking) return;

      const d = new Date(booking.dateTime);
      document.getElementById("cal-popup-title").textContent = booking.title;
      document.getElementById("cal-popup-date").textContent =
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
        " at " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      document.getElementById("cal-popup-organizer").textContent = "Organizer: " + booking.createdBy;
      popup.style.display = "block";
    });
  }

  render();
  calendarModal.classList.add("show");
}

viewCalendarBtn.addEventListener("click", () => {
  if (!selectedBookingId) {
    showNotification("No Request Selected", "Please select a request from the list first.", "error");
    return;
  }
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  if (selectedBooking) openCalendarModal(selectedBooking);
});

closeCalendar.addEventListener("click", () => calendarModal.classList.remove("show"));
calendarModal.addEventListener("click", e => {
  if (e.target === calendarModal) calendarModal.classList.remove("show");
});

// ─────────────────────────────────────────────────────────────────────────────

acceptBtn.addEventListener("click", async () => {
  if (!selectedBookingId) {
    showNotification("No Request Selected", "Please select a request from the list first.", "error");
    return;
  }

  const selectedBooking = bookings.find(
    booking => booking.id === selectedBookingId
  );

  // Block acceptance if same hall is already booked on the same day
  if (selectedBooking && selectedBooking.dateTime) {
    const requestedDate = new Date(selectedBooking.dateTime);
    const conflict = bookings.find(b =>
      b.id !== selectedBookingId &&
      normalizeStatus(b.status) === "Accepted" &&
      (b.hall || "").toLowerCase() === (selectedBooking.hall || "").toLowerCase() &&
      new Date(b.dateTime).toDateString() === requestedDate.toDateString()
    );

    if (conflict) {
      showNotification(
        "Booking Conflict",
        `<strong>${selectedBooking.hall}</strong> is already booked on
        <strong>${requestedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong>
        for <strong>"${conflict.title}"</strong>.`,
        "conflict"
      );
      return;
    }
  }

  try {

    await updateDoc(doc(db, "bookingRequests", selectedBookingId), {
      status: "Accepted",
      adminVisible: true,
      published: true,
      reviewedAt: serverTimestamp(),
      rejectionReason: ""
    });

    await addDoc(collection(db, "events"), {
      title: selectedBooking.title || "",
      description: selectedBooking.description || "",
      dateTime: selectedBooking.dateTime || "",
      location: selectedBooking.hall || "",
      hall: selectedBooking.hall || "",
      building: selectedBooking.building || "",
      capacity: Number(selectedBooking.capacity) || 0,
      image: selectedBooking.image || "",
      interests: selectedBooking.interests || [],
      type: "event",
      status: "published",
      createdBy: selectedBooking.createdBy || "Admin",
      bookingRequestId: selectedBookingId,
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "activityLogs"), {
      message: `Event "${selectedBooking.title}" was approved.`,
      type: "approved",
      adminEmail: (selectedBooking.createdBy || "").toLowerCase(),
      createdAt: serverTimestamp()
    });


    rejectBox.classList.remove("show");

    showNotification("Request Accepted", "The event has been approved and published.", "success");

  } catch (error) {
    console.error("Error accepting request:", error);
    showNotification("Accept Failed", "Could not accept the request. Please try again.", "error");
  }

});

rejectBtn.addEventListener("click", () => {
  if (!selectedBookingId) return;
  rejectBox.classList.toggle("show");
});

submitRejectBtn.addEventListener("click", async () => {
  if (!selectedBookingId) return;

  const reason = rejectReasonInput.value.trim();

  if (reason === "") {
    showNotification("Reason Required", "Please enter a reason for rejection.", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "bookingRequests", selectedBookingId), {
      status: "Rejected",
      rejectionReason: reason,
      reviewedAt: serverTimestamp()
    });


    const selectedBooking = bookings.find(
      booking => booking.id === selectedBookingId
    );

    await addDoc(collection(db, "activityLogs"), {
      message: `Event "${selectedBooking.title}" was rejected. Reason: ${reason}`,
      type: "rejected",
      adminEmail: (selectedBooking.createdBy || "").toLowerCase(),
      createdAt: serverTimestamp()
    });


    rejectBox.classList.remove("show");
    rejectReasonInput.value = "";

  } catch (error) {
    console.error("Error rejecting request:", error);
    showNotification("Reject Failed", "Could not reject the request. Please try again.", "error");
  }
});

/* Modals */
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("show");
});

profileBtn.addEventListener("click", () => {
  profileModal.classList.add("show");
});

closeSettings.addEventListener("click", () => {
  settingsModal.classList.remove("show");
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.remove("show");
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("show");
  }
});

profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.classList.remove("show");
  }
});

/* Firebase live requests */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    showNotification("Session Expired", "Please log in again to continue.", "error");
    window.location.href = "../Login/HTML/login.html";
    return;
  }

  const realEmail = user.email.toLowerCase();

  profileEmail.textContent = realEmail;
  profileName.textContent = realEmail.split("@")[0];

  const q = query(
    collection(db, "bookingRequests"),
    where("assignedToEmail", "==", realEmail)
  );


  onSnapshot(q, (snapshot) => {
    bookings = [];
  
    snapshot.forEach((docSnap) => {
  
      const data = docSnap.data();
  
      if (data.status !== "Deleted") {
  
        bookings.push({
          id: docSnap.id,
          ...data
        });
  
      }
  
    });
  
    updateStats();

    if (bookings.length > 0) {
      selectedBookingId = bookings[0].id;
      renderDetails(bookings[0]);
    } else {
      selectedBookingId = null;
      renderDetails(null);
    }

    renderRequests();
  });
});

// ── Notification Card ─────────────────────────────────────────────────────────

function showNotification(title, message, type = "error") {
  const existing = document.getElementById("bm-notification");
  if (existing) existing.remove();

  const config = {
    success:  { icon: "fa-circle-check",       color: "#22a24d" },
    error:    { icon: "fa-circle-exclamation",  color: "#ef4444" },
    conflict: { icon: "fa-circle-exclamation",  color: "#ef4444" },
    info:     { icon: "fa-circle-info",         color: "#3a5a96" }
  };
  const { icon, color } = config[type] || config.error;

  const card = document.createElement("div");
  card.id = "bm-notification";
  card.className = `bm-notification`;
  card.style.borderLeftColor = color;
  card.innerHTML = `
    <div class="bm-notif-icon" style="color:${color};">
      <i class="fa-solid ${icon}"></i>
    </div>
    <div class="bm-notif-body">
      <p class="bm-notif-title">${title}</p>
      ${message ? `<p class="bm-notif-message">${message}</p>` : ""}
    </div>
    <button class="bm-notif-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  document.body.appendChild(card);

  setTimeout(() => {
    card.style.opacity = "0";
    card.style.transform = "translateY(12px)";
    setTimeout(() => card.remove(), 400);
  }, 5000);
}