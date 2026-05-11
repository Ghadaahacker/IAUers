import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const confirmedCount = document.getElementById("confirmedCount");
  const pendingCount = document.getElementById("pendingCount");
  const confirmedListCount = document.getElementById("confirmedListCount");
  const pendingListCount = document.getElementById("pendingListCount");

  const confirmedTicketsList = document.getElementById("confirmedTicketsList");
  const pendingTicketsList = document.getElementById("pendingTicketsList");

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

  let tickets = [];

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    await loadTicketsFromFirebase(user.uid);
    renderTickets();
  });

  async function loadTicketsFromFirebase(uid) {
    tickets = [];

    const collectionsToCheck = ["registrations", "eventRegistrations"];
    const userFieldsToCheck = ["userId", "studentId"];

    for (const collectionName of collectionsToCheck) {
      for (const userField of userFieldsToCheck) {
        try {
          const q = query(
            collection(db, collectionName),
            where(userField, "==", uid)
          );

          const snapshot = await getDocs(q);

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const ticket = normalizeTicket(docSnap.id, data);

            if (!tickets.some(t => t.ticketId === ticket.ticketId)) {
              tickets.push(ticket);
            }
          });

        } catch (error) {
          console.warn(`Could not read ${collectionName} by ${userField}:`, error);
        }
      }
    }
  }

  function normalizeTicket(id, data) {
    const rawStatus = (data.status || "registered").toLowerCase();

    let status = "confirmed";

    if (rawStatus.includes("pending") || rawStatus.includes("request")) {
      status = "pending";
    }

    if (rawStatus.includes("approved") || rawStatus.includes("confirmed") || rawStatus.includes("registered")) {
      status = "confirmed";
    }

    return {
      ticketId: data.ticketId || `TKT-${id.slice(0, 6).toUpperCase()}`,
      registrationId: id,
      eventId: data.eventId || "",
      studentId: data.studentId || data.userId || "",
      eventTitle: data.eventTitle || data.title || "Untitled Event",
      eventDate: data.eventDate || data.eventDateTime || data.dateTime || data.date || "",
      eventTime: data.eventTime || getTimeOnly(data.eventDateTime || data.dateTime || data.eventDate),
      eventLocation: data.eventLocation || data.location || "IAU Campus",
      category: data.category || "University Event",
      status
    };
  }

  function formatDate(value) {
    if (!value) return "Date not available";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function getTimeOnly(value) {
    if (!value) return "Time not available";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "Time not available";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function generateQrPayload(ticket) {
    return JSON.stringify({
      ticketId: ticket.ticketId,
      registrationId: ticket.registrationId,
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
    modalTicketId.textContent = ticket.ticketId;
    modalEventDate.textContent = formatDate(ticket.eventDate);
    modalEventTime.textContent = ticket.eventTime || "Time not available";
    modalEventLocation.textContent = ticket.eventLocation || "Location not available";
    modalEventCategory.textContent = ticket.category || "University Event";

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
          QR code will be available after confirmation.
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
          <span>${ticket.ticketId}</span>
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
          <span class="ticket-category">${ticket.category || "University Event"}</span>

          <div class="ticket-actions">
            <button class="ticket-btn secondary view-details-btn" type="button">
              View Details
            </button>

            ${isConfirmed ? `
              <button class="ticket-btn primary show-qr-btn" type="button">
                Show QR
              </button>
            ` : ""}
          </div>
        </div>
      </div>
    `;

    card.querySelector(".view-details-btn").addEventListener("click", () => {
      openTicketModal(ticket);
    });

    const showQrBtn = card.querySelector(".show-qr-btn");

    if (showQrBtn) {
      showQrBtn.addEventListener("click", () => {
        openTicketModal(ticket);
      });
    }

    return card;
  }

  function renderEmptyState(container, message) {
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  }

  function renderTickets() {
    const confirmedTickets = tickets
      .filter(ticket => ticket.status === "confirmed")
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    const pendingTickets = tickets
      .filter(ticket => ticket.status === "pending")
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    confirmedCount.textContent = confirmedTickets.length;
    pendingCount.textContent = pendingTickets.length;

    confirmedListCount.textContent = `${confirmedTickets.length} ${confirmedTickets.length === 1 ? "ticket" : "tickets"}`;
    pendingListCount.textContent = `${pendingTickets.length} ${pendingTickets.length === 1 ? "request" : "requests"}`;

    confirmedTicketsList.innerHTML = "";
    pendingTicketsList.innerHTML = "";

    if (!confirmedTickets.length) {
      renderEmptyState(
        confirmedTicketsList,
        "No confirmed tickets yet. Registered events will appear here once confirmed."
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

  closeModalBtn.addEventListener("click", closeTicketModal);
  modalOverlay.addEventListener("click", closeTicketModal);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !ticketModal.classList.contains("hidden")) {
      closeTicketModal();
    }
  });
});
