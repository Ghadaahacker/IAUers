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

acceptBtn.addEventListener("click", async () => {
  if (!selectedBookingId) {
    alert("Please select a request first.");
    return;
  }

  const selectedBooking = bookings.find(
    booking => booking.id === selectedBookingId
  );

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

    alert("Request accepted successfully.");

  } catch (error) {
    console.error("Error accepting request:", error);
    alert("Could not accept request.");
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
    alert("Please enter a reason for rejection.");
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
    alert("Could not reject request.");
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
    alert("Please login first.");
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