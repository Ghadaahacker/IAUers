document.addEventListener("DOMContentLoaded", () => {
  const eventModal = document.getElementById("eventModal");
  const announcementModal = document.getElementById("announcementModal");

  const openModalBtn = document.getElementById("openModalBtn");
  const closeModal = document.getElementById("closeModal");
  const cancelModal = document.getElementById("cancelModal");

  const openAnnouncementModalBtn = document.getElementById("openAnnouncementModalBtn");
  const closeAnnouncementModal = document.getElementById("closeAnnouncementModal");
  const cancelAnnouncementModal = document.getElementById("cancelAnnouncementModal");

  const sendBuildingRequestBtn = document.getElementById("sendBuildingRequestBtn");
  const saveEventDraftBtn = document.getElementById("saveEventDraftBtn");

  const eventTitleInput = document.getElementById("eventTitleInput");
  const eventDescriptionInput = document.getElementById("eventDescriptionInput");
  const eventDateTimeInput = document.getElementById("eventDateTimeInput");
  const buildingHallSelect = document.getElementById("buildingHall");

  const announcementTitleInput = document.getElementById("announcementTitleInput");
  const announcementDescriptionInput = document.getElementById("announcementDescriptionInput");
  const announcementLinkInput = document.getElementById("announcementLinkInput");

  function openModal(modal) {
    modal.style.display = "flex";
  }

  function closeModalFunc(modal) {
    modal.style.display = "none";
  }

  function resetEventForm() {
    eventTitleInput.value = "";
    eventDescriptionInput.value = "";
    eventDateTimeInput.value = "";
    buildingHallSelect.value = "";
  }

  function resetAnnouncementForm() {
    announcementTitleInput.value = "";
    announcementDescriptionInput.value = "";
    announcementLinkInput.value = "";
  }

  openModalBtn.addEventListener("click", () => {
    openModal(eventModal);
  });

  closeModal.addEventListener("click", () => {
    closeModalFunc(eventModal);
  });

  cancelModal.addEventListener("click", () => {
    closeModalFunc(eventModal);
  });

  openAnnouncementModalBtn.addEventListener("click", () => {
    openModal(announcementModal);
  });

  closeAnnouncementModal.addEventListener("click", () => {
    closeModalFunc(announcementModal);
  });

  cancelAnnouncementModal.addEventListener("click", () => {
    closeModalFunc(announcementModal);
  });

  sendBuildingRequestBtn.addEventListener("click", () => {
    const selectedHall = buildingHallSelect.options[buildingHallSelect.selectedIndex];

    if (!eventTitleInput.value.trim()) {
      alert("Please enter the event title.");
      return;
    }

    if (!eventDateTimeInput.value) {
      alert("Please select date and time.");
      return;
    }

    if (!buildingHallSelect.value) {
      alert("Please select a building / hall.");
      return;
    }

    const building = selectedHall.dataset.building;
    const capacity = selectedHall.dataset.capacity;

    const buildingManager =
      building === "D3" ? "D3 Building Manager" :
      building === "A7" ? "A7 Building Manager" :
      "Building Manager";

    const requestData = {
      title: eventTitleInput.value.trim(),
      description: eventDescriptionInput.value.trim(),
      dateTime: eventDateTimeInput.value,
      hall: buildingHallSelect.value,
      building: building,
      capacity: capacity,
      status: "Pending Building Approval",
      sentTo: buildingManager
    };

    console.log("Booking Request:", requestData);

    alert(`Your event request has been sent to ${buildingManager} for approval.`);

    resetEventForm();
    closeModalFunc(eventModal);
  });

  saveEventDraftBtn.addEventListener("click", () => {
    alert("Event saved as draft.");
    resetEventForm();
    closeModalFunc(eventModal);
  });

  const saveAnnouncementDraftBtn = document.getElementById("saveAnnouncementDraftBtn");
  const publishAnnouncementBtn = document.getElementById("publishAnnouncementBtn");

  saveAnnouncementDraftBtn.addEventListener("click", () => {
    alert("Announcement saved as draft.");
    resetAnnouncementForm();
    closeModalFunc(announcementModal);
  });

  publishAnnouncementBtn.addEventListener("click", () => {
    if (!announcementTitleInput.value.trim()) {
      alert("Please enter the announcement title.");
      return;
    }

    alert("Announcement published successfully.");
    resetAnnouncementForm();
    closeModalFunc(announcementModal);
  });

  window.addEventListener("click", (event) => {
    if (event.target === eventModal) {
      closeModalFunc(eventModal);
    }

    if (event.target === announcementModal) {
      closeModalFunc(announcementModal);
    }
  });
});