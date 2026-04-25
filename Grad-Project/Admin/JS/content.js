document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("eventModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelModal");

  if (openBtn && modal) openBtn.onclick = () => modal.style.display = "flex";
  if (closeBtn && modal) closeBtn.onclick = () => modal.style.display = "none";
  if (cancelBtn && modal) cancelBtn.onclick = () => modal.style.display = "none";

  const announcementModal = document.getElementById("announcementModal");
  const openAnnouncementBtn = document.getElementById("openAnnouncementModalBtn");
  const closeAnnouncementBtn = document.getElementById("closeAnnouncementModal");
  const cancelAnnouncementBtn = document.getElementById("cancelAnnouncementModal");

  if (openAnnouncementBtn && announcementModal)
    openAnnouncementBtn.onclick = () => announcementModal.style.display = "flex";

  if (closeAnnouncementBtn && announcementModal)
    closeAnnouncementBtn.onclick = () => announcementModal.style.display = "none";

  if (cancelAnnouncementBtn && announcementModal)
    cancelAnnouncementBtn.onclick = () => announcementModal.style.display = "none";

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === announcementModal) announcementModal.style.display = "none";
  });

  const unlimitedSeatsCheckbox = document.getElementById("unlimitedSeats");
  const seatCapacityInput = document.getElementById("seatCapacity");

  if (unlimitedSeatsCheckbox && seatCapacityInput) {
    unlimitedSeatsCheckbox.addEventListener("change", () => {
      if (unlimitedSeatsCheckbox.checked) {
        seatCapacityInput.value = "";
        seatCapacityInput.disabled = true;
        seatCapacityInput.placeholder = "Unlimited seats enabled";
      } else {
        seatCapacityInput.disabled = false;
        seatCapacityInput.placeholder = "Enter maximum number of seats";
      }
    });
  }

  const saveEventDraftBtn = document.getElementById("saveEventDraftBtn");
  const saveAnnouncementDraftBtn = document.getElementById("saveAnnouncementDraftBtn");

  if (saveEventDraftBtn && modal) {
    saveEventDraftBtn.addEventListener("click", () => {
      alert("Event saved as draft (Admin only)");
      modal.style.display = "none";
    });
  }

  if (saveAnnouncementDraftBtn && announcementModal) {
    saveAnnouncementDraftBtn.addEventListener("click", () => {
      alert("Announcement saved as draft (Admin only)");
      announcementModal.style.display = "none";
    });
  }

  const filterSelect = document.getElementById("contentTypeFilter");
  const contentCards = document.querySelectorAll(".content-card");

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      const selected = filterSelect.value;

      contentCards.forEach((card) => {
        const typeBadge = card.querySelector(".badge.type");
        const statusBadge = card.querySelector(".badge.status");

        const type = typeBadge ? typeBadge.textContent.toLowerCase() : "";
        const status = statusBadge ? statusBadge.textContent.toLowerCase() : "";

        let show = true;

        if (selected === "event") {
          show = type.includes("event");
        } else if (selected === "announcement") {
          show = type.includes("announcement");
        } else if (selected === "draft") {
          show = status.includes("draft");
        }

        card.style.display = show ? "flex" : "none";
      });
    });
  }

  document.querySelectorAll(".analytics-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = encodeURIComponent(btn.dataset.title);
      const date = encodeURIComponent(btn.dataset.date);
      const location = encodeURIComponent(btn.dataset.location);
  
      window.location.href = `event-analytics.html?title=${title}&date=${date}&location=${location}`;
    });
  });

  document.querySelectorAll(".icon-btn[title='Delete']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const confirmDelete = confirm("Are you sure you want to delete this item?");
  
      if (confirmDelete) {
        const card = btn.closest(".content-card");
        card.remove();
      }
    });
  });

  document.querySelectorAll(".edit-event-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.style.display = "flex";

      document.querySelector("#eventModal input[type='text']").value = btn.dataset.title;
      document.querySelector("#eventModal textarea").value = btn.dataset.description;
      document.querySelector("#eventModal input[type='datetime-local']").value = btn.dataset.date;
      document.querySelectorAll("#eventModal input[type='text']")[1].value = btn.dataset.location;
    });
  });
  
  document.querySelectorAll(".edit-announcement-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      announcementModal.style.display = "flex";
      
      document.querySelector("#announcementModal input[type='text']").value = btn.dataset.title;
      document.querySelector("#announcementModal textarea").value = btn.dataset.description;
      document.querySelector("#announcementModal input[type='url']").value = btn.dataset.link;
    });
  });
  
});