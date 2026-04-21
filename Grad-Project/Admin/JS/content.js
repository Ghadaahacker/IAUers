document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("eventModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelModal");

  if (openBtn && modal && closeBtn && cancelBtn) {
    openBtn.onclick = () => {
      modal.style.display = "flex";
    };

    closeBtn.onclick = () => {
      modal.style.display = "none";
    };

    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    };
  }

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
  const announcementModal = document.getElementById("announcementModal");
  const openAnnouncementBtn = document.getElementById("openAnnouncementModalBtn");
  const closeAnnouncementBtn = document.getElementById("closeAnnouncementModal");
  const cancelAnnouncementBtn = document.getElementById("cancelAnnouncementModal");
  
  if (announcementModal && openAnnouncementBtn && closeAnnouncementBtn && cancelAnnouncementBtn) {
  
    openAnnouncementBtn.onclick = () => {
      announcementModal.style.display = "flex";
    };
  
    closeAnnouncementBtn.onclick = () => {
      announcementModal.style.display = "none";
    };
  
    cancelAnnouncementBtn.onclick = () => {
      announcementModal.style.display = "none";
    };
  
    window.addEventListener("click", (e) => {
      if (e.target === announcementModal) {
        announcementModal.style.display = "none";
      }
    });
  }
});