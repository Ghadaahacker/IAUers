import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

sendBuildingRequestBtn.addEventListener("click", async () => {
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

  const buildingManagerEmail =
    building === "D3" ? "building@iau.edu.sa" :
    building === "A7" ? "building2@iau.edu.sa" :
    "";

  try {
    await addDoc(collection(db, "bookingRequests"), {
      title: eventTitleInput.value.trim(),
      description: eventDescriptionInput.value.trim(),
      dateTime: eventDateTimeInput.value,
      hall: buildingHallSelect.value,
      building: building,
      capacity: Number(capacity),
      assignedToEmail: buildingManagerEmail,
      status: "Pending",
      rejectionReason: "",
      createdAt: serverTimestamp()
    });

    alert(`Your request has been sent to ${buildingManagerEmail}.`);

    resetEventForm();
    closeModalFunc(eventModal);

  } catch (error) {
    console.error("Error sending request:", error);
    alert("Request was not sent. Check console.");
  }
});
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

  let allEvents = [];
  let currentPage = 1;
  const eventsPerPage = 5;
  
  const contentList = document.getElementById("contentList");
  const sortFilter = document.getElementById("sortFilter");
  const filterSelect = document.getElementById("contentTypeFilter");

  async function saveAnnouncementToFirebase(status) {
    const title = announcementTitleInput.value.trim();
    const description = announcementDescriptionInput.value.trim();
    const link = announcementLinkInput.value.trim();
  
    if (!title || !description) {
      alert("Please fill announcement title and description.");
      return;
    }
  
    try {
      await addDoc(collection(db, "events"), {
        title,
        description,
        link,
        type: "announcement",
        status,
        dateTime: new Date().toISOString(),
        createdBy: auth.currentUser ? auth.currentUser.email : "unknown-admin",
        createdAt: serverTimestamp()
      });
  
      alert(
        status === "published"
          ? "Announcement published successfully."
          : "Announcement saved as draft."
      );
  
      resetAnnouncementForm();
      closeModalFunc(announcementModal);
  
      loadEventsFromFirebase();
  
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement. Check console.");
    }
  }
  
  saveAnnouncementDraftBtn.addEventListener("click", () => {
    saveAnnouncementToFirebase("draft");
  });
  
  publishAnnouncementBtn.addEventListener("click", () => {
    saveAnnouncementToFirebase("published");
  });

  window.addEventListener("click", (event) => {
    if (event.target === eventModal) {
      closeModalFunc(eventModal);
    }

    if (event.target === announcementModal) {
      closeModalFunc(announcementModal);
    }
  });

  function updateStats() {

    const totalContentCount = document.getElementById("totalContentCount");
    const activeEventsCount = document.getElementById("activeEventsCount");
    const pendingDraftsCount = document.getElementById("pendingDraftsCount");
  
    const total = allEvents.length;
  
    const published =
      allEvents.filter(event => event.status === "published").length;
  
    const drafts =
      allEvents.filter(event => event.status === "draft").length;
  
    totalContentCount.textContent = total;
    activeEventsCount.textContent = published;
    pendingDraftsCount.textContent = drafts;
  }
  
  function getFilteredEvents() {
    const selectedType = filterSelect ? filterSelect.value : "all";
  
    return allEvents.filter((event) => {
      if (selectedType === "all") return true;
      if (selectedType === "event") return event.type === "event";
      if (selectedType === "announcement") return event.type === "announcement";
      if (selectedType === "draft") return event.status === "draft";
      return true;
    });
  }
  
  function renderPagination() {
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;
  
    pagination.innerHTML = "";
  
    const filteredEvents = getFilteredEvents();
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  
    if (totalPages <= 1) return;
  
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-btn";
    prevBtn.textContent = "‹";
    prevBtn.disabled = currentPage === 1;
  
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderEventsPage();
        renderPagination();
      }
    });
  
    pagination.appendChild(prevBtn);
  
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = i === currentPage ? "page-btn active" : "page-btn";
      pageBtn.textContent = i;
  
      pageBtn.addEventListener("click", () => {
        currentPage = i;
        renderEventsPage();
        renderPagination();
      });
  
      pagination.appendChild(pageBtn);
    }
  
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-btn";
    nextBtn.textContent = "›";
    nextBtn.disabled = currentPage === totalPages;
  
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderEventsPage();
        renderPagination();
      }
    });
  
    pagination.appendChild(nextBtn);
  }
  
  function renderEventsPage() {
    if (!contentList) return;
  
    contentList.innerHTML = "";
  
    let filteredEvents = getFilteredEvents();
  
    const selectedSort = sortFilter ? sortFilter.value : "newest";
  
    if (selectedSort === "newest") {
      filteredEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    } else if (selectedSort === "oldest") {
      filteredEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    } else if (selectedSort === "title") {
      filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
    }
  
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
  
    const start = (currentPage - 1) * eventsPerPage;
    const end = start + eventsPerPage;
  
    const eventsToShow = filteredEvents.slice(start, end);
  
    if (eventsToShow.length === 0) {
      contentList.innerHTML = `
        <div class="empty-state">
          No content found for the selected filter.
        </div>
      `;
      return;
    }
  
    eventsToShow.forEach((event) => {
      const statusClass = event.status === "published" ? "published" : "draft";
      const typeLabel = event.type === "announcement" ? "ANNOUNCEMENT" : "EVENT";
      const typeClass = event.type === "announcement" ? "announcement" : "event";
  
      const card = document.createElement("article");
      card.className = "content-card";
  
      card.innerHTML = `
        <div class="content-info">
          <div class="badges">
            <span class="badge type ${typeClass}">${typeLabel}</span>
            <span class="badge status ${statusClass}">${event.status.toUpperCase()}</span>
          </div>
  
          <h3>${event.title}</h3>
          <p>${event.description}</p>
  
          <div class="meta">
            <span>
              <span class="material-symbols-outlined small">calendar_month</span>
              ${new Date(event.dateTime).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
  
            <span>
            <span class="material-symbols-outlined small">
             ${event.type === "announcement" ? "link" : "location_on"}
            </span>
              ${
                event.type === "announcement"
                  ? `<a href="${event.link}" target="_blank">${event.link}</a>`
                  : (event.location || event.hall || "")
              }
            </span>
          </div>
        </div>
  
        <div class="content-actions">
          <button class="icon-btn analytics-btn" title="Analytics" type="button">
            <span class="material-symbols-outlined">bar_chart</span>
          </button>
  
          <button class="icon-btn delete-event-btn" title="Delete" type="button">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      `;
  
      const deleteBtn = card.querySelector(".delete-event-btn");
  
      deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Delete this content?");
        if (!confirmDelete) return;
  
        await deleteDoc(doc(db, "events", event.id));
        loadEventsFromFirebase();
      });
  
      contentList.appendChild(card);
    });
  }
  
  async function loadEventsFromFirebase() {
  
    try {
  
      const q = query(
        collection(db, "events"),
        orderBy("createdAt", "desc")
      );
  
      const snapshot = await getDocs(q);
  
      allEvents = [];
  
      snapshot.forEach((eventDoc) => {
  
        allEvents.push({
          id: eventDoc.id,
          ...eventDoc.data()
        });
      });
  
      updateStats();
      renderEventsPage();
      renderPagination();
  
    } catch (error) {
  
      console.error("Error loading events:", error);
    }
  }
  
  if (sortFilter) {
  
    sortFilter.addEventListener("change", () => {
  
      currentPage = 1;
  
      renderEventsPage();
      renderPagination();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      currentPage = 1;
      renderEventsPage();
      renderPagination();
    });
  }
  
  loadEventsFromFirebase();

});