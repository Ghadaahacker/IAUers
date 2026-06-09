import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");

if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

function showToast(message, type = "success") {
  const existing = document.getElementById("content-toast");
  if (existing) existing.remove();

  const colors = {
    success: { bg: "#22a24d", icon: "✓" },
    error:   { bg: "#c84a2f", icon: "✕" },
    info:    { bg: "#3a5a96", icon: "ℹ" }
  };
  const { bg, icon } = colors[type] || colors.info;

  const toast = document.createElement("div");
  toast.id = "content-toast";
  toast.style.cssText = `
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    background: #fff; border-radius: 14px; padding: 14px 20px;
    box-shadow: 0 8px 32px rgba(29,30,52,0.14);
    border-left: 5px solid ${bg};
    max-width: 360px; opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    transform: translateY(10px);
    font-family: Arial, sans-serif;
  `;
  toast.innerHTML = `
    <div style="width:28px;height:28px;border-radius:50%;background:${bg};
      color:#fff;display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:700;flex-shrink:0;">${icon}</div>
    <p style="margin:0;font-size:14px;color:#1d1e34;font-weight:500;line-height:1.5;">${message}</p>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

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

  // Prevent selecting a past date — set min to current date and time
  const nowLocal = new Date();
  nowLocal.setSeconds(0, 0);
  nowLocal.setMinutes(nowLocal.getMinutes() + 1);
  const pad = n => String(n).padStart(2, "0");
  eventDateTimeInput.min = `${nowLocal.getFullYear()}-${pad(nowLocal.getMonth()+1)}-${pad(nowLocal.getDate())}T${pad(nowLocal.getHours())}:${pad(nowLocal.getMinutes())}`;
  const eventFileInput = document.getElementById("eventFileInput");
  const fileNameText = document.getElementById("fileNameText");

  const eventInterestChips = document.querySelectorAll(".admin-interest-chip");

  const imageLightbox = document.getElementById("imageLightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeLightbox = document.getElementById("closeLightbox");

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("card-image")) {
      lightboxImg.src = e.target.src;
      imageLightbox.classList.add("open");
    }
  });

  closeLightbox.addEventListener("click", () => {
    imageLightbox.classList.remove("open");
  });

  imageLightbox.addEventListener("click", (e) => {
    if (e.target === imageLightbox) {
      imageLightbox.classList.remove("open");
    }
  });

  eventInterestChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  function getSelectedEventInterests() {
    const selectedInterests = [];
    document.querySelectorAll(".admin-interest-chip.active").forEach((chip) => {
      selectedInterests.push(chip.textContent.trim());
    });
    return selectedInterests;
  }

  function resetEventInterests() {
    eventInterestChips.forEach((chip) => {
      chip.classList.remove("active");
    });
  }

  function setEventInterests(interests = []) {
    eventInterestChips.forEach((chip) => {
      const chipText = chip.textContent.trim();
      if (interests.includes(chipText)) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  eventFileInput.addEventListener("change", () => {
    fileNameText.textContent =
      eventFileInput.files.length > 0
        ? eventFileInput.files[0].name
        : "No file selected";
    fileNameText.style.color = "";
  });

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
    eventFileInput.value = "";
    fileNameText.textContent = "No file selected";
    fileNameText.style.color = "";
    resetEventInterests();
    const pinEl = document.getElementById("checkinPinInput");
    if (pinEl) pinEl.value = "";
  }

  function resetAnnouncementForm() {
    announcementTitleInput.value = "";
    announcementDescriptionInput.value = "";
    announcementLinkInput.value = "";
  }

  let editingEventId = null;

  openModalBtn.addEventListener("click", () => {
    editingEventId = null;
    resetEventForm();
    openModal(eventModal);
  });

  closeModal.addEventListener("click", () => {
    closeModalFunc(eventModal);
  });

  cancelModal.addEventListener("click", () => {
    closeModalFunc(eventModal);
  });

  openAnnouncementModalBtn.addEventListener("click", () => {
    editingEventId = null;
    resetAnnouncementForm();
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
      showToast("Please enter the event title.", "error");
      return;
    }

    if (!eventDateTimeInput.value) {
      showToast("Please select date and time.", "error");
      return;
    }

    if (new Date(eventDateTimeInput.value) <= new Date()) {
      showToast("Event date and time must be in the future.", "error");
      return;
    }

    if (!buildingHallSelect.value) {
      showToast("Please select a building / hall.", "error");
      return;
    }

    const selectedInterests = getSelectedEventInterests();

    if (selectedInterests.length === 0) {
      showToast("Please select at least one event interest.", "error");
      return;
    }

    const building = selectedHall.dataset.building;
    const capacity = selectedHall.dataset.capacity;

    const buildingManagerEmail =
      building === "D3" ? "building@iau.edu.sa" :
      building === "A7" ? "building2@iau.edu.sa" :
      "";

    try {
      sendBuildingRequestBtn.disabled = true;
      sendBuildingRequestBtn.textContent = "Sending...";

      let imageUrl = "";
      const selectedFile = eventFileInput.files[0];
      if (selectedFile) {
        imageUrl = await compressAndConvertToBase64(selectedFile);
      } else if (editingEventId) {
        const existing = allEvents.find(e => e.id === editingEventId);
        imageUrl = existing?.image || "";
      }

      await addDoc(collection(db, "bookingRequests"), {
        title: eventTitleInput.value.trim(),
        description: eventDescriptionInput.value.trim(),
        dateTime: eventDateTimeInput.value,
        hall: buildingHallSelect.value,
        building: building,
        capacity: Number(capacity),
        interests: selectedInterests,
        assignedToEmail: buildingManagerEmail,
        status: "Pending",
        rejectionReason: "",
        image: imageUrl,
        draftId: editingEventId || "",
        createdBy: (sessionStorage.getItem("userEmail") || auth.currentUser?.email || "unknown-admin").toLowerCase(),
        createdAt: serverTimestamp(),
        checkinPin: document.getElementById("checkinPinInput")?.value.trim() || null
      });

      if (editingEventId) {
        await deleteDoc(doc(db, "events", editingEventId));
        editingEventId = null;
      }

      showToast(`Request sent to ${buildingManagerEmail}.`, "success");

      resetEventForm();
      closeModalFunc(eventModal);
      await loadEventsFromFirebase();

    } catch (error) {
      console.error("Error sending request:", error);
      showToast(error.message, "error");
    } finally {
      sendBuildingRequestBtn.disabled = false;
      sendBuildingRequestBtn.textContent = "Send to Building Manager";
    }
  });

  saveEventDraftBtn.addEventListener("click", async () => {
    const selectedHall = buildingHallSelect.options[buildingHallSelect.selectedIndex];

    if (!eventTitleInput.value.trim()) {
      showToast("Please enter the event title.", "error");
      return;
    }

    if (!eventDateTimeInput.value) {
      showToast("Please select date and time.", "error");
      return;
    }

    if (new Date(eventDateTimeInput.value) <= new Date()) {
      showToast("Event date and time must be in the future.", "error");
      return;
    }

    const selectedInterests = getSelectedEventInterests();

    if (selectedInterests.length === 0) {
      showToast("Please select at least one event interest.", "error");
      return;
    }

    const building = buildingHallSelect.value
      ? selectedHall.dataset.building
      : "";

    const capacity = buildingHallSelect.value
      ? selectedHall.dataset.capacity
      : 0;

    let imageUrl = "";
    const selectedFile = eventFileInput.files[0];
    if (selectedFile) {
      imageUrl = await compressAndConvertToBase64(selectedFile);
    } else if (editingEventId) {
      const existing = allEvents.find(e => e.id === editingEventId);
      imageUrl = existing?.image || "";
    }

    try {
      const eventData = {
        title: eventTitleInput.value.trim(),
        description: eventDescriptionInput.value.trim(),
        dateTime: eventDateTimeInput.value,
        hall: buildingHallSelect.value || "",
        building,
        capacity: Number(capacity),
        interests: selectedInterests,
        type: "event",
        status: "draft",
        createdBy: (sessionStorage.getItem("userEmail") || auth.currentUser?.email || "unknown-admin").toLowerCase(),
        updatedAt: serverTimestamp(),
        image: imageUrl,
        checkinPin: document.getElementById("checkinPinInput")?.value.trim() || null
      };

      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), eventData);
        editingEventId = null;
      } else {
        await addDoc(collection(db, "events"), {
          ...eventData,
          createdAt: serverTimestamp()
        });
      }

      showToast("Event saved as draft.", "success");

      resetEventForm();
      closeModalFunc(eventModal);
      await loadEventsFromFirebase();

    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("Draft was not saved: " + error.message, "error");
    }
  });

  const saveAnnouncementDraftBtn = document.getElementById("saveAnnouncementDraftBtn");
  const publishAnnouncementBtn = document.getElementById("publishAnnouncementBtn");

  let allEvents = [];
  let currentPage = 1;
  const eventsPerPage = 5;

  const contentList = document.getElementById("contentList");
  const sortFilter = document.getElementById("sortFilter");
  const filterSelect = document.getElementById("contentTypeFilter");
  const searchInput = document.getElementById("contentSearchInput");

  async function saveAnnouncementToFirebase(status) {
    const title = announcementTitleInput.value.trim();
    const description = announcementDescriptionInput.value.trim();
    const link = announcementLinkInput.value.trim();

    if (!title || !description) {
      showToast("Please fill in the title and description.", "error");
      return;
    }

    try {
      const announcementData = {
        title,
        description,
        link,
        type: "announcement",
        status,
        dateTime: new Date().toISOString(),
        createdBy: (sessionStorage.getItem("userEmail") || auth.currentUser?.email || "unknown-admin").toLowerCase(),
        updatedAt: serverTimestamp()
      };

      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), announcementData);
        editingEventId = null;
      } else {
        await addDoc(collection(db, "events"), {
          ...announcementData,
          createdAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, "activityLogs"), {
        message:
          status === "published"
            ? `Announcement "${title}" was published.`
            : `Announcement "${title}" was saved as draft.`,
        type: status,
        adminEmail: (auth.currentUser?.email || "").toLowerCase(),
        createdAt: serverTimestamp()
      });

      showToast(
        status === "published"
          ? "Announcement published successfully."
          : "Announcement saved as draft."
      );

      resetAnnouncementForm();
      closeModalFunc(announcementModal);
      loadEventsFromFirebase();

    } catch (error) {
      console.error("Error saving announcement:", error);
      showToast("Failed to save announcement.", "error");
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
    const published = allEvents.filter(event => event.status === "published").length;
    const drafts = allEvents.filter(event => event.status === "draft").length;

    totalContentCount.textContent = total;
    activeEventsCount.textContent = published;
    pendingDraftsCount.textContent = drafts;
  }

  function getFilteredEvents() {
    const selectedType = filterSelect ? filterSelect.value : "all";
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

    return allEvents.filter((event) => {
      const matchesType = (() => {
        if (selectedType === "all") return true;
        if (selectedType === "event") return event.type === "event";
        if (selectedType === "announcement") return event.type === "announcement";
        if (selectedType === "draft") return event.status === "draft";
        if (selectedType === "pending") {
          return event.sourceCollection === "bookingRequests" &&
            (event.status === "Pending" || event.status === "Pending Building Approval");
        }
        return true;
      })();

      const matchesSearch = !searchTerm ||
        (event.title || "").toLowerCase().includes(searchTerm) ||
        (event.description || "").toLowerCase().includes(searchTerm);

      return matchesType && matchesSearch;
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
      const isPending = event.status === "Pending" || event.status === "Pending Building Approval";

      const statusClass =
        event.status === "published" ? "published"
        : event.status === "Rejected" ? "rejected"
        : isPending ? "pending"
        : "draft";

      const statusLabel = isPending ? "PENDING" : event.status.toUpperCase();

      const typeLabel = event.type === "announcement" ? "ANNOUNCEMENT" : "EVENT";
      const typeClass = event.type === "announcement" ? "announcement" : "event";

      const interestTags =
        Array.isArray(event.interests) && event.interests.length
          ? `
            <div class="content-interest-tags">
              ${event.interests.map(interest => `<span>${interest}</span>`).join("")}
            </div>
          `
          : "";

      const card = document.createElement("article");
      card.className = event.image ? "content-card has-image" : "content-card";

      card.innerHTML = `
        ${event.image ? `<img src="${event.image}" class="card-image" alt="Event Image">` : ""}
        <div class="card-body-row">
          <div class="content-info">
            <div class="badges">
              <span class="badge type ${typeClass}">${typeLabel}</span>
              <span class="badge status ${statusClass}">
                ${statusLabel}
              </span>
              ${event.status === "Rejected" && event.rejectionReason
                ? `
                  <div class="reject-reason">
                    <strong>Rejection Reason:</strong>
                    ${event.rejectionReason}
                  </div>
                `
                : ""
              }
            </div>

            <h3>${event.title}</h3>
            <p>${event.description}</p>

            ${interestTags}

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
                ${event.type === "announcement"
                  ? `<a href="${event.link}" target="_blank">${event.link}</a>`
                  : (event.location || event.hall || "")
                }
              </span>
            </div>
          </div>

          <div class="content-actions">
            ${event.status === "draft"
              ? `
                <button class="icon-btn edit-event-btn" title="Edit" type="button">
                  <span class="material-symbols-outlined">edit</span>
                </button>
              `
              : ""
            }
            ${event.status === "published" && event.type === "event"
              ? `
                <button class="icon-btn registrations-btn" title="View Registrations" type="button">
                  <span class="material-symbols-outlined">group</span>
                </button>
                <button class="icon-btn analytics-btn" title="Analytics" type="button">
                  <span class="material-symbols-outlined">bar_chart</span>
                </button>
              `
              : ""
            }
            <button class="icon-btn delete-event-btn" title="Delete" type="button">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;

      const deleteBtn = card.querySelector(".delete-event-btn");
      const editBtn = card.querySelector(".edit-event-btn");

      if (editBtn) {
        editBtn.addEventListener("click", () => {
          editingEventId = event.id;

          if (event.type === "announcement") {
            announcementTitleInput.value = event.title || "";
            announcementDescriptionInput.value = event.description || "";
            announcementLinkInput.value = event.link || "";
            openModal(announcementModal);
          } else {
            eventTitleInput.value = event.title || "";
            eventDescriptionInput.value = event.description || "";
            eventDateTimeInput.value = event.dateTime || "";
            buildingHallSelect.value = event.hall || "";
            setEventInterests(event.interests || []);
            const pinEl = document.getElementById("checkinPinInput");
            if (pinEl) pinEl.value = event.checkinPin || "";

            if (event.image) {
              fileNameText.textContent = "Current image saved";
              fileNameText.style.color = "#3a5a96";
            } else {
              fileNameText.textContent = "No file selected";
              fileNameText.style.color = "";
            }

            openModal(eventModal);
          }
        });
      }

      const registrationsBtn = card.querySelector(".registrations-btn");
      if (registrationsBtn) {
        registrationsBtn.addEventListener("click", () => openRegistrationsModal(event));
      }

      const analyticsBtn = card.querySelector(".analytics-btn");
      if (analyticsBtn) {
        analyticsBtn.addEventListener("click", () => {
          const params = new URLSearchParams({
            eventId: event.id,
            title: event.title || "",
            date: event.dateTime || "",
            location: event.location || event.hall || ""
          });
          window.location.href = `../HTML/event-analytics.html?${params.toString()}`;
        });
      }

      deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Delete this content?");
        if (!confirmDelete) return;

        try {
          if (event.sourceCollection === "bookingRequests") {
            // Pending or rejected — doc lives directly in bookingRequests
            await deleteDoc(doc(db, "bookingRequests", event.id));
          } else {
            // Published event — delete from events
            await deleteDoc(doc(db, "events", event.id));

            // Mark all student registrations as cancelled
            const regSnap = await getDocs(query(
              collection(db, "eventRegistrations"),
              where("eventId", "==", event.id)
            ));
            for (const regDoc of regSnap.docs) {
              await updateDoc(doc(db, "eventRegistrations", regDoc.id), {
                status: "cancelled",
                cancelledAt: serverTimestamp()
              });
            }

            // Mark the linked bookingRequest as Deleted (BM's onSnapshot hides it)
            if (event.bookingRequestId) {
              await updateDoc(doc(db, "bookingRequests", event.bookingRequestId), {
                status: "Deleted",
                deletedAt: serverTimestamp()
              });
            }
          }
        } catch (err) {
          console.error("Delete error:", err);
          showToast("Delete error: " + err.message, "error");
        }

        loadEventsFromFirebase();
      });

      contentList.appendChild(card);
    });
  }

  async function loadEventsFromFirebase() {
    try {
      const adminEmail =
        (sessionStorage.getItem("userEmail") || auth.currentUser?.email || "").toLowerCase();

      const [snapshot, rejectedSnapshot, pendingSnapshot] = await Promise.all([
        getDocs(query(collection(db, "events"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "bookingRequests"), where("status", "==", "Rejected"))),
        getDocs(query(collection(db, "bookingRequests"), where("status", "in", ["Pending", "Pending Building Approval"])))
      ]);

      allEvents = [];

      snapshot.forEach((eventDoc) => {
        const data = eventDoc.data();
        if ((data.createdBy || "").toLowerCase() === adminEmail) {
          allEvents.push({ id: eventDoc.id, ...data });
        }
      });

      rejectedSnapshot.forEach((requestDoc) => {
        const data = requestDoc.data();
        if ((data.createdBy || "").toLowerCase() === adminEmail) {
          allEvents.push({
            id: requestDoc.id,
            ...data,
            type: "event",
            sourceCollection: "bookingRequests"
          });
        }
      });

      pendingSnapshot.forEach((requestDoc) => {
        const data = requestDoc.data();
        if ((data.createdBy || "").toLowerCase() === adminEmail) {
          allEvents.push({
            id: requestDoc.id,
            ...data,
            type: "event",
            sourceCollection: "bookingRequests"
          });
        }
      });

      updateStats();
      renderEventsPage();
      renderPagination();

    } catch (error) {
      console.error("Error loading events:", error);
    }
  }

  // ── Registrations Modal ────────────────────────────────────────────────────
  const regModal     = document.getElementById("registrationsModal");
  const closeRegModal = document.getElementById("closeRegModal");

  closeRegModal.addEventListener("click", () => regModal.style.display = "none");
  regModal.addEventListener("click", e => { if (e.target === regModal) regModal.style.display = "none"; });

  async function openRegistrationsModal(event) {
    document.getElementById("regModalTitle").textContent = `Registrations — ${event.title || "Event"}`;
    document.getElementById("regTotalBadge").textContent = "Loading...";
    document.getElementById("regModalList").innerHTML = "";
    regModal.style.display = "flex";

    try {
      const snap = await getDocs(query(
        collection(db, "eventRegistrations"),
        where("eventId", "==", event.id)
      ));

      const regs = [];
      snap.forEach(d => regs.push({ id: d.id, ...d.data() }));

      const checkedInCount = regs.filter(r => r.checkedIn).length;
      document.getElementById("regTotalBadge").textContent =
        `${regs.length} ${regs.length === 1 ? "registration" : "registrations"}` +
        (checkedInCount > 0 ? ` · ${checkedInCount} checked in` : "");

      const list = document.getElementById("regModalList");

      if (!regs.length) {
        list.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#5f6e80;font-size:15px;">
            No registrations yet.
          </div>`;
        return;
      }

      // جيب أسماء الطلاب اللي ما عندهم studentName من users collection
      const missingIds = regs
        .filter(r => !r.studentName && r.studentId)
        .map(r => r.studentId);

      const userNameMap = {};
      if (missingIds.length) {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach(d => {
          if (missingIds.includes(d.id)) {
            userNameMap[d.id] = d.data().name || "";
          }
        });
      }

      list.innerHTML = regs.map((r, i) => {
        const name = r.studentName || userNameMap[r.studentId] || r.studentEmail?.split("@")[0] || "Unknown";
        const date = r.createdAt?.toDate
          ? r.createdAt.toDate().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
          : "—";
        const initial = name.charAt(0).toUpperCase();

        const checkedIn = !!r.checkedIn;
        const checkinTime = r.checkedInAt?.toDate
          ? r.checkedInAt.toDate().toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
          : null;

        return `
          <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;
            border-bottom:1px solid #f0f4f8;${i % 2 === 0 ? "background:#fff;" : "background:#fafbfc;"}">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1d1e34,#3a5a96);
              color:#fff;display:flex;align-items:center;justify-content:center;
              font-size:14px;font-weight:700;flex-shrink:0;">${initial}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:700;color:#1d1e34;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${name}
              </div>
              <div style="font-size:13px;color:#5f6e80;">${r.studentEmail || "—"}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              ${checkedIn
                ? `<span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;
                    background:#dcf5e7;color:#1a7a3c;display:flex;align-items:center;gap:5px;">
                    <i class="fa-solid fa-circle-check" style="font-size:10px;"></i> ATTENDED
                   </span>
                   ${checkinTime ? `<div style="font-size:11px;color:#98a3b2;">${checkinTime}</div>` : ""}`
                : `<span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;
                    background:#f0f4f8;color:#65728d;">REGISTERED</span>`
              }
              <div style="font-size:12px;color:#c0c8d4;">Reg: ${date}</div>
            </div>
          </div>`;
      }).join("");

    } catch (err) {
      console.error(err);
      document.getElementById("regModalList").innerHTML =
        `<div style="text-align:center;padding:40px;color:#c84a2f;">Failed to load registrations.</div>`;
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

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderEventsPage();
      renderPagination();
    });
  }

  function compressAndConvertToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 800;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
      };
    });
  }

  loadEventsFromFirebase();
});