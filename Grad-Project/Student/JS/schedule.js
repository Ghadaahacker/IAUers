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
  const weekdayRow = document.getElementById("weekdayRow");
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYearLabel = document.getElementById("monthYearLabel");

  const timelineList = document.getElementById("timelineList");
  const timelineCount = document.getElementById("timelineCount");

  const selectedDayNumber = document.getElementById("selectedDayNumber");
  const selectedDayText = document.getElementById("selectedDayText");
  const selectedDayMeta = document.getElementById("selectedDayMeta");
  const dayStatusText = document.getElementById("dayStatusText");

  const detailsPanelTitle = document.getElementById("detailsPanelTitle");
  const detailsEmpty = document.getElementById("detailsEmpty");
  const detailsBox = document.getElementById("detailsBox");
  const detailsTag = document.getElementById("detailsTag");
  const detailsTitle = document.getElementById("detailsTitle");
  const detailsDate = document.getElementById("detailsDate");
  const detailsTime = document.getElementById("detailsTime");
  const detailsLocation = document.getElementById("detailsLocation");
  const detailsDescription = document.getElementById("detailsDescription");
  const detailsActionBtn = document.getElementById("detailsActionBtn");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const todayBtn = document.getElementById("todayBtn");
  const clearSelectionBtn = document.getElementById("clearSelectionBtn");
  const viewTabs = document.querySelectorAll(".view-tab");

  const today = new Date();

  let allItems = [];
  let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = formatDateKey(today);
  let currentView = "month";
  let selectedItemId = null;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    await loadStudentSchedule(user);
    renderAll();
  });

  async function loadStudentSchedule(user) {
    allItems = [];

    try {
      const q = query(
        collection(db, "eventRegistrations"),
        where("studentId", "==", user.uid),
        where("status", "==", "approved")
      );

      const snapshot = await getDocs(q);

      snapshot.forEach((docSnap) => {
        const reg = docSnap.data();

        allItems.push({
          id: docSnap.id,
          type: "event",
          title: reg.eventTitle || "Untitled Event",
          category: "Event",
          date: getDateOnly(reg.eventDateTime),
          startTime: getTimeOnly(reg.eventDateTime),
          endTime: "",
          location: reg.eventLocation || "IAU Campus",
          description: reg.description || "Registered university event.",
          colorClass: "event"
        });
      });

    } catch (error) {
      console.error("Error loading registered events:", error);
    }

    try {
  const tasksQuery = query(
    collection(db, "tasks"),
    where("studentId", "==", user.uid)
  );

  const tasksSnapshot = await getDocs(tasksQuery);

  tasksSnapshot.forEach((docSnap) => {
    const task = docSnap.data();

    const taskDate = getDateOnly(task.dueDateTime);
    const taskTime = getTimeOnly(task.dueDateTime);

    let colorClass = "task-purple";

    if (task.type === "Assignment") {
      colorClass = "task-yellow";
    } else if (task.type === "Exam") {
      colorClass = "task-orange";
    } else if (task.type === "Quiz") {
      colorClass = "task-purple";
    }

    allItems.push({
      id: docSnap.id,
      type: "task",
      title: task.title || "Untitled Task",
      category: task.type || "Task",
      date: taskDate,
      startTime: taskTime,
      endTime: "",
      location: task.courseName || "Course",
      description: `${task.type || "Task"} for ${task.courseName || "your course"}.`,
      colorClass: colorClass
    });
  });

} catch (error) {
  console.error("Error loading tasks:", error);
}
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(dateKey) {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function getDateOnly(value) {
    if (!value) return formatDateKey(today);
    const date = new Date(value);
    if (isNaN(date.getTime())) return value.slice(0, 10);
    return formatDateKey(date);
  }

  function getTimeOnly(value) {
    if (!value) return "Time not set";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Time not set";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  }

  function formatLongDate(dateKey) {
    return parseDateKey(dateKey).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatDayName(dateKey) {
    return parseDateKey(dateKey).toLocaleDateString("en-US", {
      weekday: "long"
    });
  }

  function formatTimeRange(item) {
    if (!item.endTime) return item.startTime;
    return `${item.startTime} - ${item.endTime}`;
  }

  function getItemsByDate(dateKey) {
    return allItems
      .filter(item => item.date === dateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function getVisibleDates() {
    if (currentView === "day") {
      return [selectedDate];
    }

    if (currentView === "week") {
      const base = parseDateKey(selectedDate);
      const start = addDays(base, -base.getDay());
      const dates = [];

      for (let i = 0; i < 7; i++) {
        dates.push(formatDateKey(addDays(start, i)));
      }

      return dates;
    }

    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const dates = [];

    for (let d = 1; d <= last.getDate(); d++) {
      dates.push(formatDateKey(new Date(first.getFullYear(), first.getMonth(), d)));
    }

    return dates;
  }

  function renderWeekdays() {
    weekdayRow.innerHTML = "";

    ["S", "M", "T", "W", "T", "F", "S"].forEach(label => {
      const div = document.createElement("div");
      div.textContent = label;
      weekdayRow.appendChild(div);
    });
  }

  function renderCalendar() {
    monthYearLabel.textContent = formatMonthYear(currentDate);
    calendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day";

      let cellYear = year;
      let cellMonth = month;
      let dayNumber;

      if (i < firstDayIndex) {
        dayNumber = prevMonthDays - firstDayIndex + i + 1;
        cellMonth = month - 1;
        cell.classList.add("outside");
      } else if (i >= firstDayIndex + daysInMonth) {
        dayNumber = i - (firstDayIndex + daysInMonth) + 1;
        cellMonth = month + 1;
        cell.classList.add("outside");
      } else {
        dayNumber = i - firstDayIndex + 1;
      }

      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear -= 1;
      } else if (cellMonth > 11) {
        cellMonth = 0;
        cellYear += 1;
      }

      const cellDate = new Date(cellYear, cellMonth, dayNumber);
      const dateKey = formatDateKey(cellDate);
      const dayItems = getItemsByDate(dateKey);

      if (dateKey === selectedDate) {
        cell.classList.add("selected");
      }

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = dayNumber;
      cell.appendChild(num);

      const markers = document.createElement("div");
      markers.className = "calendar-markers";

      const hasEvents = dayItems.some(item => item.type === "event");
      const hasTasks = dayItems.some(item => item.type === "task");

      if (hasEvents) {
        const dot = document.createElement("span");
        dot.className = "calendar-marker marker-event";
        markers.appendChild(dot);
      }

      if (hasTasks) {
        const dot = document.createElement("span");
        dot.className = "calendar-marker marker-task";
        markers.appendChild(dot);
      }

      cell.appendChild(markers);

      if (dateKey === formatDateKey(today)) {
        const badge = document.createElement("div");
        badge.className = "calendar-badge-mini";
        badge.textContent = "Today";
        cell.appendChild(badge);
      }

      cell.addEventListener("click", function () {
        selectedDate = dateKey;
        currentDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
        renderAll();

        const items = getItemsByDate(dateKey);

        if (items.length) {
          showDetails(items[0].id);
        } else {
          clearDetails();
        }
      });

      calendarGrid.appendChild(cell);
    }
  }

  function renderDaySummary() {
    const dateObj = parseDateKey(selectedDate);
    const items = getItemsByDate(selectedDate);

    selectedDayNumber.textContent = String(dateObj.getDate()).padStart(2, "0");
    selectedDayText.textContent = formatDayName(selectedDate);
    selectedDayMeta.textContent = formatLongDate(selectedDate);

    if (!items.length) {
      dayStatusText.textContent = "No registered events or academic items are scheduled for this selected day.";
    } else {
      const eventCount = items.filter(item => item.type === "event").length;
      const taskCount = items.filter(item => item.type === "task").length;

      dayStatusText.textContent =
        `You have ${eventCount} event${eventCount !== 1 ? "s" : ""} and ${taskCount} task${taskCount !== 1 ? "s" : ""} in this selected day.`;
    }
  }

  function renderTimeline() {
    timelineList.innerHTML = "";

    let visibleItems = [];
    const visibleDates = getVisibleDates();

    visibleDates.forEach(dateKey => {
      visibleItems = visibleItems.concat(getItemsByDate(dateKey));
    });

    visibleItems.sort((a, b) => {
      if (a.date === b.date) {
        return a.startTime.localeCompare(b.startTime);
      }

      return a.date.localeCompare(b.date);
    });

    timelineCount.textContent =
      `${visibleItems.length} ${visibleItems.length === 1 ? "item" : "items"}`;

    if (!visibleItems.length) {
      timelineList.innerHTML = `
        <div class="timeline-empty">
          No registered events or academic items in this ${currentView} view.
        </div>
      `;
      return;
    }

    visibleItems.forEach(item => {
      const block = document.createElement("div");
      block.className = `timeline-item ${item.colorClass}`;

      block.innerHTML = `
        <div class="timeline-time">
          ${formatLongDate(item.date)} • ${formatTimeRange(item)}
        </div>

        <div class="timeline-title">
          ${item.title}
        </div>
      `;

      block.addEventListener("click", function () {
        selectedDate = item.date;

        const itemDate = parseDateKey(item.date);
        currentDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1);

        selectedItemId = item.id;

        renderAll();
        showDetails(item.id);
      });

      timelineList.appendChild(block);
    });
  }

  function showDetails(itemId) {
    const item = allItems.find(entry => entry.id === itemId);

    if (!item) return;

    selectedItemId = item.id;

    detailsEmpty.classList.add("hidden");
    detailsBox.classList.remove("hidden");

    detailsTag.textContent = item.category;
    detailsTitle.textContent = item.title;
    detailsDate.textContent = formatLongDate(item.date);
    detailsTime.textContent = formatTimeRange(item);
    detailsLocation.textContent = item.location;
    detailsDescription.textContent = item.description;

    if (item.type === "event") {
      detailsPanelTitle.textContent = "Event Details";
      detailsTag.style.background = "#dfe9fa";
      detailsTag.style.color = "#245df2";
      detailsActionBtn.textContent = "Open Event";
      detailsActionBtn.classList.remove("secondary");
    } else if (item.category.toLowerCase().includes("quiz")) {
      detailsPanelTitle.textContent = "Quiz Details";
      detailsTag.style.background = "#efe8ff";
      detailsTag.style.color = "#7d4cff";
      detailsActionBtn.textContent = "Open Quiz";
      detailsActionBtn.classList.add("secondary");
    } else if (item.category.toLowerCase().includes("assignment")) {
      detailsPanelTitle.textContent = "Assignment Details";
      detailsTag.style.background = "#fff2cc";
      detailsTag.style.color = "#a86d00";
      detailsActionBtn.textContent = "Open Assignment";
      detailsActionBtn.classList.add("secondary");
    } else {
      detailsPanelTitle.textContent = "Task Details";
      detailsTag.style.background = "#efe8ff";
      detailsTag.style.color = "#7d4cff";
      detailsActionBtn.textContent = "Open Task";
      detailsActionBtn.classList.add("secondary");
    }
  }

  function clearDetails() {
    selectedItemId = null;
    detailsPanelTitle.textContent = "Item Details";
    detailsEmpty.classList.remove("hidden");
    detailsBox.classList.add("hidden");
  }

  function goPrevious() {
    if (currentView === "day") {
      const d = addDays(parseDateKey(selectedDate), -1);
      selectedDate = formatDateKey(d);
      currentDate = new Date(d.getFullYear(), d.getMonth(), 1);
    } else if (currentView === "week") {
      const d = addDays(parseDateKey(selectedDate), -7);
      selectedDate = formatDateKey(d);
      currentDate = new Date(d.getFullYear(), d.getMonth(), 1);
    } else {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      selectedDate = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }

    renderAll();
    clearDetails();
  }

  function goNext() {
    if (currentView === "day") {
      const d = addDays(parseDateKey(selectedDate), 1);
      selectedDate = formatDateKey(d);
      currentDate = new Date(d.getFullYear(), d.getMonth(), 1);
    } else if (currentView === "week") {
      const d = addDays(parseDateKey(selectedDate), 7);
      selectedDate = formatDateKey(d);
      currentDate = new Date(d.getFullYear(), d.getMonth(), 1);
    } else {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      selectedDate = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }

    renderAll();
    clearDetails();
  }

  function goToday() {
    const now = new Date();

    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    selectedDate = formatDateKey(now);

    renderAll();

    const items = getItemsByDate(selectedDate);

    if (items.length) {
      showDetails(items[0].id);
    } else {
      clearDetails();
    }
  }

  function renderAll() {
    renderWeekdays();
    renderCalendar();
    renderDaySummary();
    renderTimeline();
  }

  prevBtn.addEventListener("click", goPrevious);
  nextBtn.addEventListener("click", goNext);
  todayBtn.addEventListener("click", goToday);

  clearSelectionBtn.addEventListener("click", function () {
    clearDetails();
  });

  detailsActionBtn.addEventListener("click", function () {
    if (!selectedItemId) return;

    const item = allItems.find(entry => entry.id === selectedItemId);

    if (!item) return;

    alert(`${item.type === "event" ? "Event" : "Item"} opened: ${item.title}`);
  });

  viewTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      viewTabs.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      currentView = this.dataset.view;

      renderTimeline();
    });
  });
});
