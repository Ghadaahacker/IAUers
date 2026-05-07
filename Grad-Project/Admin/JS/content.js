import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
  const contentList = document.getElementById("contentList");
  let editingEventId = null;
  let allEvents = [];
  let currentPage = 1;
  const eventsPerPage = 5;

  function applyContentFilter() {
    const selected = filterSelect ? filterSelect.value : "all";
    const cards = document.querySelectorAll(".content-card");
  
    cards.forEach((card) => {
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
  }
  
  if (filterSelect) {
    filterSelect.addEventListener("change", applyContentFilter);
  }

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

  async function saveEventToFirebase(status) {
    const titleInput = document.querySelector("#eventModal input[type='text']");
    const descriptionInput = document.querySelector("#eventModal textarea");
    const dateTimeInput = document.querySelector("#eventModal input[type='datetime-local']");
    const locationInput = document.querySelectorAll("#eventModal input[type='text']")[1];
  
    const unlimitedSeatsCheckbox = document.getElementById("unlimitedSeats");
    const seatCapacityInput = document.getElementById("seatCapacity");
  
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const dateTime = dateTimeInput.value;
    const location = locationInput.value.trim();
    const unlimitedSeats = unlimitedSeatsCheckbox.checked;
    const seatCapacity = seatCapacityInput.value;
  
    if (!title || !description || !dateTime || !location) {
      alert("Please fill all event fields.");
      return;
    }
  
    if (!unlimitedSeats && !seatCapacity) {
      alert("Please enter seat capacity or choose Unlimited Seats.");
      return;
    }
  
    try {
      const eventData = {
        title,
        description,
        dateTime,
        location,
        unlimitedSeats,
        seatCapacity: unlimitedSeats ? null : Number(seatCapacity),
        status,
        type: "event",
        updatedAt: serverTimestamp()
      };
      
      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), eventData);
        editingEventId = null;
      } else {
        await addDoc(collection(db, "events"), {
          ...eventData,
          createdBy: auth.currentUser ? auth.currentUser.email : "unknown-admin",
          createdAt: serverTimestamp()
        });
      }
      
      alert(
        status === "published"
          ? "Event published successfully."
          : "Event saved as draft."
      );
      
      modal.style.display = "none";
      
      titleInput.value = "";
      descriptionInput.value = "";
      dateTimeInput.value = "";
      locationInput.value = "";
      seatCapacityInput.value = "";
      
      unlimitedSeatsCheckbox.checked = false;
      seatCapacityInput.disabled = false;
      
      loadEventsFromFirebase();
      
    }

     catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Check console.");
    }
  }
  
  const publishEventBtn = document.querySelector("#eventModal .publish-btn");
  
  if (publishEventBtn) {
    publishEventBtn.addEventListener("click", () => {
      saveEventToFirebase("published");
    });
  }
  
  if (saveEventDraftBtn) {
    saveEventDraftBtn.addEventListener("click", () => {
      saveEventToFirebase("draft");
    });
  }

  function renderEventsPage() {

    contentList.innerHTML = "";
  
    const start = (currentPage - 1) * eventsPerPage;
    const end = start + eventsPerPage;
  
    const eventsToShow = allEvents.slice(start, end);
  
    eventsToShow.forEach((event) => {
  
      const statusClass =
        event.status === "published"
          ? "published"
          : "draft";
  
      const card = document.createElement("article");
  
      card.className = "content-card";
  
      card.innerHTML = `
        <div class="content-info">
      
          <div class="badges">
           <span class="badge type event">EVENT</span>

            <span class="badge status ${statusClass}">
             ${event.status.toUpperCase()}
           </span>
          </div>
          
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          
          <div class="meta">
          
          <span>
           <span class="material-symbols-outlined small">
             calendar_month
           </span>
           
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
              location_on
            </span>

            ${event.location}
         </span>

        </div>

       </div>

       <div class="content-actions">

       ${event.status === "draft" ? `
        <button
          class="icon-btn edit-event-btn"
          title="Edit"
          type="button"
        >
          <span class="material-symbols-outlined">edit</span>
        </button>
      ` : ""}
      
       <button
        class="icon-btn analytics-btn"
        title="Analytics"
        type="button"
       >

       <span class="material-symbols-outlined">bar_chart</span>
       </button>

       <button
        class="icon-btn delete-event-btn"
        title="Delete"
        type="button" 
         >
        <span class="material-symbols-outlined">delete</span>
        </button>

        </div>
       `;
  
       contentList.appendChild(card);
       const editBtn = card.querySelector(".edit-event-btn");

        if (editBtn) {
          editBtn.addEventListener("click", () => {
            editingEventId = event.id;

            modal.style.display = "flex";

            document.querySelector("#eventModal input[type='text']").value = event.title;
            document.querySelector("#eventModal textarea").value = event.description;
            document.querySelector("#eventModal input[type='datetime-local']").value = event.dateTime;
            document.querySelectorAll("#eventModal input[type='text']")[1].value = event.location;

            document.getElementById("unlimitedSeats").checked = event.unlimitedSeats;
            document.getElementById("seatCapacity").value = event.seatCapacity || "";
            document.getElementById("seatCapacity").disabled = event.unlimitedSeats;
          });
        }

       const deleteBtn = card.querySelector(".delete-event-btn");
 
       deleteBtn.addEventListener("click", async () => {
         const confirmDelete = confirm("Are you sure you want to delete this event?");
 
         if (!confirmDelete) return;
 
         await deleteDoc(doc(db, "events", event.id));
 
         loadEventsFromFirebase();
       });
 
       const analyticsBtn = card.querySelector(".analytics-btn");
 
       analyticsBtn.addEventListener("click", () => {
         const title = encodeURIComponent(event.title);
         const date = encodeURIComponent(
           new Date(event.dateTime).toLocaleString("en-GB", {
             day: "numeric",
             month: "short",
             year: "numeric",
             hour: "2-digit",
             minute: "2-digit"
           })
         );
         const location = encodeURIComponent(event.location);
 
         window.location.href = `event-analytics.html?title=${title}&date=${date}&location=${location}`;
       });
 
     });
 
     applyContentFilter();
   }
 
  function renderPagination() {

    const pagination = document.querySelector(".pagination");
  
    if (!pagination) return;
  
    pagination.innerHTML = "";
  
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);
  
    const prevBtn = document.createElement("button");
  
    prevBtn.className = "page-btn";
    prevBtn.innerHTML = "‹";
  
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
  
      pageBtn.className = "page-btn";
  
      if (i === currentPage) {
        pageBtn.classList.add("active");
      }
  
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
    nextBtn.innerHTML = "›";
  
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

  function updateStats() {
    const totalContentCount = document.getElementById("totalContentCount");
    const activeEventsCount = document.getElementById("activeEventsCount");
    const pendingDraftsCount = document.getElementById("pendingDraftsCount");
  
    const total = allEvents.length;
    const published = allEvents.filter(event => event.status === "published").length;
    const drafts = allEvents.filter(event => event.status === "draft").length;
  
    if (totalContentCount) totalContentCount.textContent = total;
    if (activeEventsCount) activeEventsCount.textContent = published;
    if (pendingDraftsCount) pendingDraftsCount.textContent = drafts;
  }

  async function loadEventsFromFirebase() {
    if (!contentList) return;
  
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

      const totalPages = Math.ceil(allEvents.length / eventsPerPage);
      
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }

      renderEventsPage();
      renderPagination();
      updateStats();
  
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }
  
  loadEventsFromFirebase();
        
});