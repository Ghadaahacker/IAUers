import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const confirmedCount = document.getElementById("confirmedCount");
  const pastCount = document.getElementById("pastCount");
  const confirmedListCount = document.getElementById("confirmedListCount");
  const pastListCount = document.getElementById("pastListCount");

  const confirmedTicketsList = document.getElementById("confirmedTicketsList");
  const pastTicketsList = document.getElementById("pastTicketsList");

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
  const qrSection = document.querySelector(".qr-section");

  let tickets = [];
  let ratedEventIds = new Set();
  let currentUserId = null;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    currentUserId = user.uid;
    showLoading();

    try {
      await Promise.all([
        loadTickets(user.uid),
        loadFeedbackStatus(user.uid)
      ]);
      renderTickets();
    } catch (error) {
      console.error("Error loading tickets:", error);
      showError();
    }
  });

  async function loadTickets(uid) {
    tickets = [];

    const q = query(
      collection(db, "eventRegistrations"),
      where("studentId", "==", uid)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      tickets.push(normalizeTicket(docSnap.id, docSnap.data()));
    });
  }

  async function loadFeedbackStatus(uid) {
    ratedEventIds = new Set();

    const q = query(
      collection(db, "eventFeedback"),
      where("studentId", "==", uid)
    );

    const snap = await getDocs(q);
    snap.forEach(doc => ratedEventIds.add(doc.data().eventId));
  }

  function normalizeTicket(id, data) {
    return {
      ticketId: data.ticketId || `TKT-${id.slice(0, 6).toUpperCase()}`,
      registrationId: id,
      studentId: data.studentId || "",
      eventId: data.eventId || "",
      eventTitle: data.eventTitle || data.title || data.name || "Untitled Event",
      eventDate: data.eventDate || data.eventDateTime || data.dateTime || data.date || "",
      eventTime:
        data.eventTime ||
        getTimeOnly(data.eventDateTime || data.dateTime || data.eventDate || data.date),
      eventLocation:
        data.eventLocation || data.location || data.venue || "IAU Campus",
      category: data.category || data.eventCategory || "University Event",
      status: data.status || "confirmed"
    };
  }

  // Returns true if the event date has already passed
  function isEventPast(eventDate) {
    if (!eventDate) return false;
    const date = eventDate.toDate ? eventDate.toDate() : new Date(eventDate);
    if (isNaN(date.getTime())) return false;
    return date < new Date();
  }

  function formatDate(value) {
    if (!value) return "Date not available";
    if (value.toDate) value = value.toDate();

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
    if (value.toDate) value = value.toDate();

    const date = new Date(value);
    if (isNaN(date.getTime())) return "Time not available";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function generateQrUrl(ticket) {
    return `https://iauers.web.app/checkin/?reg=${ticket.registrationId}`;
  }

  function openTicketModal(ticket, showQr = false) {
    const isPast = isEventPast(ticket.eventDate);
    modalStatusTag.textContent = isPast ? "Past" : ticket.status === "confirmed" ? "Confirmed" : "Pending";
    modalStatusTag.className = `modal-status-tag ${isPast ? "past" : ticket.status}`;

    modalEventTitle.textContent = ticket.eventTitle;
    modalTicketId.textContent = ticket.ticketId;
    modalEventDate.textContent = formatDate(ticket.eventDate);
    modalEventTime.textContent = ticket.eventTime || "Time not available";
    modalEventLocation.textContent = ticket.eventLocation || "Location not available";

    qrCodeContainer.innerHTML = "";

    if (showQr) {
      qrSection.style.display = "block";

      const qrUrl = encodeURIComponent(generateQrUrl(ticket));
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrUrl}`;

      qrCodeContainer.innerHTML = `
        <img
          src="${qrImageUrl}"
          alt="Ticket QR Code"
          style="width:220px;height:220px;display:block;margin:0 auto;"
        />
      `;
    } else {
      qrSection.style.display = "none";
    }

    ticketModal.classList.remove("hidden");
  }

  function closeTicketModal() {
    ticketModal.classList.add("hidden");
    qrCodeContainer.innerHTML = "";
    qrSection.style.display = "none";
  }

  // ── Rating Modal ─────────────────────────────────────────────────────────────

  function openRatingModal(ticket) {
    const existing = document.getElementById("ratingModalOverlay");
    if (existing) existing.remove();

    let selectedSatisfaction = 0;
    let selectedRecommend = null; // true = Yes, false = No

    const overlay = document.createElement("div");
    overlay.id = "ratingModalOverlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(29,30,52,0.45);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
    `;

    const ynBase = `
      padding: 10px 28px; border-radius: 10px; font-size: 15px;
      font-weight: 600; cursor: pointer; border: 2px solid #d2dbe5;
      background: #f5f7fa; color: #32395a; transition: 0.15s ease;
    `;

    overlay.innerHTML = `
      <div id="ratingModalBox" style="
        background: #fff; border-radius: 20px; padding: 36px 32px;
        max-width: 480px; width: 92%; box-shadow: 0 20px 60px rgba(29,30,52,0.18);
        display: flex; flex-direction: column; gap: 26px; position: relative;
      ">
        <button id="closeRatingBtn" style="
          position: absolute; top: 16px; right: 18px; background: none;
          border: none; font-size: 20px; cursor: pointer; color: #5f6e80;
        ">✕</button>

        <div>
          <h2 style="font-size: 22px; color: #1d1e34; margin-bottom: 6px;">Event Feedback</h2>
          <p style="font-size: 14px; color: #5f6e80;">${ticket.eventTitle}</p>
        </div>

        <!-- Q1: Satisfaction -->
        <div>
          <p style="font-size: 15px; font-weight: 600; color: #32395a; margin-bottom: 14px;">
            How satisfied were you with this event? (1–5)
          </p>
          <div id="starRow" style="display: flex; gap: 10px;">
            ${[1,2,3,4,5].map(n => `
              <button class="star-btn" data-star="${n}" style="
                background: none; border: none; font-size: 38px; cursor: pointer;
                color: #d2dbe5; transition: color 0.15s ease; padding: 0;
              ">★</button>
            `).join("")}
          </div>
          <p id="satisfactionLabel" style="font-size: 13px; color: #5f6e80; margin-top: 8px; min-height: 18px;"></p>
        </div>

        <!-- Q2: Would recommend? -->
        <div>
          <p style="font-size: 15px; font-weight: 600; color: #32395a; margin-bottom: 14px;">
            Would you recommend this event to others?
          </p>
          <div style="display: flex; gap: 12px;">
            <button id="yesBtn" style="${ynBase}">👍 Yes</button>
            <button id="noBtn"  style="${ynBase}">👎 No</button>
          </div>
        </div>

        <button id="submitRatingBtn" disabled style="
          width: 100%; height: 48px; border: none; border-radius: 12px;
          background: linear-gradient(90deg, #1d1e34, #3a5a96);
          color: #fff; font-size: 16px; font-weight: 700; cursor: not-allowed;
          opacity: 0.5; transition: opacity 0.2s;
        ">Submit Feedback</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const satLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    const starBtns       = overlay.querySelectorAll(".star-btn");
    const submitBtn      = overlay.querySelector("#submitRatingBtn");
    const satLabel       = overlay.querySelector("#satisfactionLabel");
    const yesBtn         = overlay.querySelector("#yesBtn");
    const noBtn          = overlay.querySelector("#noBtn");

    function checkReady() {
      const ready = selectedSatisfaction > 0 && selectedRecommend !== null;
      submitBtn.disabled = !ready;
      submitBtn.style.opacity = ready ? "1" : "0.5";
      submitBtn.style.cursor  = ready ? "pointer" : "not-allowed";
    }

    function highlightStars(count) {
      starBtns.forEach(btn => {
        btn.style.color = Number(btn.dataset.star) <= count ? "#f4b400" : "#d2dbe5";
      });
    }

    starBtns.forEach(btn => {
      btn.addEventListener("mouseenter", () => highlightStars(Number(btn.dataset.star)));
      btn.addEventListener("mouseleave", () => highlightStars(selectedSatisfaction));
      btn.addEventListener("click", () => {
        selectedSatisfaction = Number(btn.dataset.star);
        highlightStars(selectedSatisfaction);
        satLabel.textContent = satLabels[selectedSatisfaction];
        checkReady();
      });
    });

    function selectYN(value) {
      selectedRecommend = value;
      yesBtn.style.cssText += value === true
        ? "border-color:#22a24d; background:#dff6e7; color:#22a24d;"
        : "border-color:#d2dbe5; background:#f5f7fa; color:#32395a;";
      noBtn.style.cssText += value === false
        ? "border-color:#c84a2f; background:#fde8e4; color:#c84a2f;"
        : "border-color:#d2dbe5; background:#f5f7fa; color:#32395a;";
      checkReady();
    }

    yesBtn.addEventListener("click", () => selectYN(true));
    noBtn.addEventListener("click",  () => selectYN(false));

    function closeRatingModal() { overlay.remove(); }

    overlay.querySelector("#closeRatingBtn").addEventListener("click", closeRatingModal);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeRatingModal(); });

    submitBtn.addEventListener("click", async () => {
      if (selectedSatisfaction === 0 || selectedRecommend === null) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";

      try {
        await addDoc(collection(db, "eventFeedback"), {
          eventId: ticket.eventId,
          eventTitle: ticket.eventTitle,
          studentId: currentUserId,
          satisfaction: selectedSatisfaction,
          wouldRecommend: selectedRecommend,
          submittedAt: serverTimestamp()
        });

        ratedEventIds.add(ticket.eventId);
        closeRatingModal();
        showToast("Thank you for your feedback!");
        renderTickets();
      } catch (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Feedback";
        showToast("Failed to submit. Please try again.", "error");
      }
    });
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: ${type === "success" ? "#22a24d" : "#c84a2f"};
      color: #fff; padding: 14px 22px; border-radius: 12px;
      font-size: 15px; font-weight: 600; z-index: 9999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      opacity: 0; transition: opacity 0.25s;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; });
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Ticket Card ───────────────────────────────────────────────────────────────

  function createTicketCard(ticket, isPastCard = false) {
    const card = document.createElement("div");
    const isCancelled = ticket.status === "cancelled";

    card.className = "ticket-card";
    if (isPastCard)   card.classList.add("ticket-card-past");
    if (isCancelled)  card.classList.add("ticket-card-cancelled");

    const alreadyRated = ratedEventIds.has(ticket.eventId);

    let statusLabel, statusClass, headActionBtn;

    if (isCancelled) {
      statusLabel    = "Cancelled";
      statusClass    = "cancelled";
      headActionBtn  = `<button class="ticket-btn dismiss-btn" type="button" title="Remove ticket">
                          <i class="fa-solid fa-trash"></i> Dismiss
                        </button>`;
    } else if (isPastCard) {
      statusLabel   = "Past";
      statusClass   = "past";
      headActionBtn = alreadyRated
        ? `<button class="ticket-btn secondary" type="button" disabled style="cursor:default;opacity:0.7;">
             <i class="fa-solid fa-star" style="color:#f4b400;"></i> Rated
           </button>`
        : `<button class="ticket-btn secondary rate-event-btn" type="button">
             <i class="fa-regular fa-star"></i> Rate Event
           </button>`;
    } else {
      statusLabel   = "Confirmed";
      statusClass   = "confirmed";
      headActionBtn = `<button class="ticket-btn primary show-qr-btn" type="button">
                         <i class="fa-solid fa-qrcode"></i> Show QR
                       </button>`;
    }

    card.innerHTML = `
      <div class="ticket-card-head">
        <div class="ticket-id">
          <i class="fa-solid fa-ticket"></i>
          <span>${ticket.ticketId}</span>
        </div>
        <div class="head-right">
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          ${headActionBtn}
        </div>
      </div>

      <div class="ticket-card-body">
        ${isCancelled ? `<div class="cancelled-notice"><i class="fa-solid fa-circle-exclamation"></i> This event has been cancelled by the organizer.</div>` : ""}
        <h3 style="${isCancelled ? "opacity:0.5;text-decoration:line-through;" : ""}">${ticket.eventTitle}</h3>

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

        ${!isCancelled ? `
        <div class="ticket-footer">
          <button class="ticket-btn secondary view-details-btn" type="button">
            View Details
          </button>
        </div>` : ""}
      </div>
    `;

    if (!isCancelled) {
      card.querySelector(".view-details-btn").addEventListener("click", () => {
        openTicketModal(ticket, false);
      });
    }

    const showQrBtn = card.querySelector(".show-qr-btn");
    if (showQrBtn) {
      showQrBtn.addEventListener("click", () => openTicketModal(ticket, true));
    }

    const rateEventBtn = card.querySelector(".rate-event-btn");
    if (rateEventBtn) {
      rateEventBtn.addEventListener("click", () => openRatingModal(ticket));
    }

    const dismissBtn = card.querySelector(".dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", async () => {
        dismissBtn.disabled = true;
        dismissBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        try {
          await deleteDoc(doc(db, "eventRegistrations", ticket.registrationId));
          card.style.transition = "opacity 0.3s, transform 0.3s";
          card.style.opacity = "0";
          card.style.transform = "translateX(20px)";
          setTimeout(() => {
            card.remove();
            tickets = tickets.filter(t => t.registrationId !== ticket.registrationId);
            renderTickets();
          }, 300);
        } catch (err) {
          console.error(err);
          dismissBtn.disabled = false;
          dismissBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Dismiss`;
        }
      });
    }

    return card;
  }

  function showLoading() {
    confirmedTicketsList.innerHTML = `<div class="empty-state">Loading tickets...</div>`;
    pastTicketsList.innerHTML = `<div class="empty-state">Loading past events...</div>`;
    confirmedCount.textContent = "--";
    pastCount.textContent = "--";
    confirmedListCount.textContent = "Loading";
    pastListCount.textContent = "Loading";
  }

  function showError() {
    confirmedTicketsList.innerHTML = `<div class="empty-state">Could not load tickets.</div>`;
    pastTicketsList.innerHTML = `<div class="empty-state">Could not load past events.</div>`;
    confirmedCount.textContent = "0";
    pastCount.textContent = "0";
    confirmedListCount.textContent = "0 tickets";
    pastListCount.textContent = "0 events";
  }

  function renderEmptyState(container, message) {
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  }

  function renderTickets() {
    const upcomingTickets = tickets
      .filter(t => !isEventPast(t.eventDate))
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    const pastTickets = tickets
      .filter(t => isEventPast(t.eventDate))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    confirmedCount.textContent = upcomingTickets.length;
    pastCount.textContent = pastTickets.length;

    confirmedListCount.textContent =
      `${upcomingTickets.length} ${upcomingTickets.length === 1 ? "ticket" : "tickets"}`;

    pastListCount.textContent =
      `${pastTickets.length} ${pastTickets.length === 1 ? "event" : "events"}`;

    confirmedTicketsList.innerHTML = "";
    pastTicketsList.innerHTML = "";

    if (!upcomingTickets.length) {
      renderEmptyState(confirmedTicketsList, "No upcoming events registered.");
    } else {
      upcomingTickets.forEach(ticket => {
        confirmedTicketsList.appendChild(createTicketCard(ticket, false));
      });
    }

    if (!pastTickets.length) {
      renderEmptyState(pastTicketsList, "No past events yet.");
    } else {
      pastTickets.forEach(ticket => {
        pastTicketsList.appendChild(createTicketCard(ticket, true));
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
