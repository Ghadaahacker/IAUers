document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "studentTickets";

  const confirmedCount = document.getElementById("confirmedCount");
  const pendingCount = document.getElementById("pendingCount");
  const confirmedListCount = document.getElementById("confirmedListCount");
  const pendingListCount = document.getElementById("pendingListCount");

  const confirmedTicketsList = document.getElementById("confirmedTicketsList");
  const pendingTicketsList = document.getElementById("pendingTicketsList");

  const ticketSearch = document.getElementById("ticketSearch");
  
  const ticketModal = document.getElementById("ticketModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModalBtn = document.getElementById("closeModalBtn");

  const modalStatusTag = document.getElementById("modalStatusTag");
  const modalEventTitle = document.getElementById("modalEventTitle");
  const modalTicketId = document.getElementById("modalTicketId");
  const modalEventDate = document.getElementById("modalEventDate");
  const modalEventTime = document.getElementById("modalEventTime");
  const modalEventLocation = document.getElementById("modalEventLocation");
  const modalEventCategory = document.getElementById("modalEventCategory");
  const qrCodeContainer = document.getElementById("qrCodeContainer");

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function loadTickets() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse studentTickets:", error);
      return [];
    }
  }

  function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }

  function generateQrPayload(ticket) {
    return JSON.stringify({
      ticketId: ticket.ticketId,
      studentId: ticket.studentId,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      status: ticket.status
    });
  }

  function clearQrCode() {
    qrCodeContainer.innerHTML = "";
  }

  function openTicketModal(ticket) {
    modalStatusTag.textContent = ticket.status === "confirmed" ? "Confirmed" : "Pending";
    modalStatusTag.className = `modal-status-tag ${ticket.status}`;
    modalEventTitle.textContent = ticket.eventTitle;
    modalTicketId.textContent = ticket.ticketId || "No Ticket ID";
    modalEventDate.textContent = formatDate(ticket.eventDate);
    modalEventTime.textContent = ticket.eventTime || "Time not available";
    modalEventLocation.textContent = ticket.eventLocation || "Location not available";
    modalEventCategory.textContent = ticket.category || "Uncategorized";

    clearQrCode();

    if (ticket.status === "confirmed") {
      new QRCode(qrCodeContainer, {
        text: generateQrPayload(ticket),
        width: 180,
        height: 180
      });
    } else {
      qrCodeContainer.innerHTML = `
        <div style="text-align:center; color:#65728d; line-height:1.8;">
          QR code is available only after confirmation.
        </div>
      `;
    }

    ticketModal.classList.remove("hidden");
  }

  function closeTicketModal() {
    ticketModal.classList.add("hidden");
    clearQrCode();
  }

  function createTicketCard(ticket) {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const isConfirmed = ticket.status === "confirmed";

    card.innerHTML = `
      <div class="ticket-card-head">
        <div class="ticket-id">
          <i class="fa-solid fa-ticket"></i>
          <span>${ticket.ticketId || "Request Pending"}</span>
        </div>

        <span class="status-badge ${ticket.status}">
          ${isConfirmed ? "Confirmed" : "Pending"}
        </span>
      </div>

      <div class="ticket-card-body">
        <h3>${ticket.eventTitle}</h3>

        <div class="meta-stack">
          <div class="meta-row">
            <i class="fa-regular fa-calendar"></i>
            <span>${formatDate(ticket.eventDate)}</span>
          </div>

          <div class="meta-row">
            <i class="fa-regular fa-clock"></i>
            <span>${ticket.eventTime || "Time not available"}</span>
          </div>

          <div class="meta-row">
            <i class="fa-solid fa-location-dot"></i>
            <span>${ticket.eventLocation || "Location not available"}</span>
          </div>
        </div>

        <div class="ticket-footer">
          <span class="ticket-category">${ticket.category || "Uncategorized"}</span>

          <div class="ticket-actions">
            <button class="ticket-btn secondary view-details-btn" type="button">View Details</button>
            ${isConfirmed ? `<button class="ticket-btn primary show-qr-btn" type="button">Show QR</button>` : ""}
          </div>
        </div>
      </div>
    `;

    const viewDetailsBtn = card.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", function () {
      openTicketModal(ticket);
    });

    const showQrBtn = card.querySelector(".show-qr-btn");
    if (showQrBtn) {
      showQrBtn.addEventListener("click", function () {
        openTicketModal(ticket);
      });
    }

    return card;
  }

  function renderEmptyState(container, message) {
    container.innerHTML = `
      <div class="empty-state">${message}</div>
    `;
  }

  function renderTickets() {
    const searchValue = ticketSearch ? ticketSearch.value.trim().toLowerCase() : "";
    const tickets = loadTickets();

    const filteredTickets = tickets.filter(ticket => {
      const haystack = [
        ticket.ticketId,
        ticket.eventTitle,
        ticket.eventLocation,
        ticket.category,
        ticket.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchValue);
    });

    const confirmedTickets = filteredTickets
      .filter(ticket => ticket.status === "confirmed")
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    const pendingTickets = filteredTickets
      .filter(ticket => ticket.status === "pending")
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    confirmedCount.textContent = tickets.filter(ticket => ticket.status === "confirmed").length;
    pendingCount.textContent = tickets.filter(ticket => ticket.status === "pending").length;

    confirmedListCount.textContent = `${confirmedTickets.length} ${confirmedTickets.length === 1 ? "ticket" : "tickets"}`;
    pendingListCount.textContent = `${pendingTickets.length} ${pendingTickets.length === 1 ? "request" : "requests"}`;

    confirmedTicketsList.innerHTML = "";
    pendingTicketsList.innerHTML = "";

    if (!confirmedTickets.length) {
      renderEmptyState(
        confirmedTicketsList,
        "No confirmed tickets yet. Once your registration is approved, your ticket will appear here."
      );
    } else {
      confirmedTickets.forEach(ticket => {
        confirmedTicketsList.appendChild(createTicketCard(ticket));
      });
    }

    if (!pendingTickets.length) {
      renderEmptyState(
        pendingTicketsList,
        "No pending requests right now."
      );
    } else {
      pendingTickets.forEach(ticket => {
        pendingTicketsList.appendChild(createTicketCard(ticket));
      });
    }
  }

  if (ticketSearch) {
    ticketSearch.addEventListener("input", renderTickets);
  }

  closeModalBtn.addEventListener("click", closeTicketModal);
  modalOverlay.addEventListener("click", closeTicketModal);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !ticketModal.classList.contains("hidden")) {
      closeTicketModal();
    }
  });

  renderTickets();
});
