const bookings = [
  {
    id: 1,
    title: "Annual Research Symposium",
    organizer: "Faculty of Engineering",
    hall: "Main Auditorium",
    capacity: 450,
    date: "Oct 24",
    status: "Pending",
    rejectionReason: ""
  },
  {
    id: 2,
    title: "International Student Gala",
    organizer: "Student Affairs",
    hall: "Central Hall",
    capacity: 300,
    date: "Nov 12",
    status: "Accepted",
    rejectionReason: ""
  },
  {
    id: 3,
    title: "Basketball Finals",
    organizer: "Athletics Department",
    hall: "Sports Complex",
    capacity: 600,
    date: "Oct 30",
    status: "Pending",
    rejectionReason: ""
  },
  {
    id: 4,
    title: "Physics Lab Workshop",
    organizer: "College of Science",
    hall: "Lab Room 402",
    capacity: 80,
    date: "Nov 05",
    status: "Rejected",
    rejectionReason: "The hall is already reserved for another event."
  }
];

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

let currentFilter = "All";
let selectedBookingId = null;

function updateStats() {
  pendingCount.textContent = bookings.filter(b => b.status === "Pending").length;
  acceptedCount.textContent = bookings.filter(b => b.status === "Accepted").length;
  rejectedCount.textContent = bookings.filter(b => b.status === "Rejected").length;
}

function getStatusClass(status) {
  return status.toLowerCase();
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

  detailTitle.textContent = booking.title;
  detailOrganizer.textContent = booking.organizer;
  detailHall.textContent = booking.hall;
  detailCapacity.textContent = booking.capacity;
  detailDate.textContent = booking.date;
  detailStatus.textContent = booking.status;
}

function renderRequests() {
  requestList.innerHTML = "";

  const filteredBookings =
    currentFilter === "All"
      ? bookings
      : bookings.filter(booking => booking.status === currentFilter);

  filteredBookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "request-card";
    card.dataset.id = booking.id;

    if (booking.id === selectedBookingId) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <div>
        <h3>${booking.title}</h3>
        <p>${booking.organizer} • ${booking.hall}</p>
      </div>
      <span class="status ${getStatusClass(booking.status)}">${booking.status}</span>
    `;

    card.addEventListener("click", () => {
      selectedBookingId = booking.id;
      renderDetails(booking);
      renderRequests();
    });

    requestList.appendChild(card);
  });

  const selectedStillVisible = filteredBookings.some(b => b.id === selectedBookingId);
  if (!selectedStillVisible && filteredBookings.length > 0) {
    selectedBookingId = filteredBookings[0].id;
    renderDetails(filteredBookings[0]);
  } else if (!selectedStillVisible && filteredBookings.length === 0) {
    selectedBookingId = null;
    renderDetails(null);
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

acceptBtn.addEventListener("click", () => {
  if (selectedBookingId === null) return;

  const booking = bookings.find(b => b.id === selectedBookingId);
  if (!booking) return;

  booking.status = "Accepted";
  booking.rejectionReason = "";

  renderDetails(booking);
  updateStats();
  renderRequests();
});

rejectBtn.addEventListener("click", () => {
  if (selectedBookingId === null) return;

  const reason = prompt("Write the reason for rejection:");
  if (reason === null) return;

  const trimmedReason = reason.trim();
  if (trimmedReason === "") {
    alert("Please enter a reason for rejection.");
    return;
  }

  const booking = bookings.find(b => b.id === selectedBookingId);
  if (!booking) return;

  booking.status = "Rejected";
  booking.rejectionReason = trimmedReason;

  renderDetails(booking);
  updateStats();
  renderRequests();
});

// first load
updateStats();

if (bookings.length > 0) {
  selectedBookingId = bookings[0].id;
  renderDetails(bookings[0]);
}

renderRequests();