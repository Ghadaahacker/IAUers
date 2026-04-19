document.addEventListener("DOMContentLoaded", function () {
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

  function formatMonthShort(dateKey) {
    return parseDateKey(dateKey).toLocaleDateString("en-US", {
      month: "short"
    });
  }

  function formatTimeRange(item) {
    return item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime;
  }

  const weekdayRow = document.getElementById("weekdayRow");
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYearLabel = document.getElementById("monthYearLabel");

  const myEventsList = document.getElementById("myEventsList");
  const myTasksList = document.getElementById("myTasksList");
  const eventsCounter = document.getElementById("eventsCounter");
  const tasksCounter = document.getElementById("tasksCounter");

  const timelineList = document.getElementById("timelineList");
  const timelineCount = document.getElementById("timelineCount");

  const selectedDayNumber = document.getElementById("selectedDayNumber");
  const selectedDayText = document.getElementById("selectedDayText");
  const selectedDayMeta = document.getElementById("selectedDayMeta");
  const dayStatusText = document.getElementById("dayStatusText");

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

  function makeDate(offset) {
    return formatDateKey(addDays(today, offset));
  }

  const allItems = [
    {
      id: 1,
      type: "event",
      title: "Student Club Orientation",
      category: "Campus Event",
      date: makeDate(0),
      startTime: "09:00",
      endTime: "10:30",
      location: "Main Hall",
      description: "Approved university event for student clubs and activities.",
      colorClass: "event"
    },
    {
      id: 2,
      type: "task",
      title: "Database Quiz",
      category: "Quiz",
      date: makeDate(0),
      startTime: "11:00",
      endTime: "12:00",
      location: "Room B204",
      description: "Quiz scheduled from your academic journey.",
      colorClass: "task-purple"
    },
    {
      id: 3,
      type: "task",
      title: "Machine Learning Assignment Due",
      category: "Assignment",
      date: makeDate(1),
      startTime: "23:59",
      endTime: "",
      location: "Blackboard",
      description: "Submit your machine learning assignment before midnight.",
      colorClass: "task-yellow"
    },
    {
      id: 4,
      type: "event",
      title: "Career Fair",
      category: "Academic Event",
      date: makeDate(2),
      startTime: "10:00",
      endTime: "14:00",
      location: "University Auditorium",
      description: "Meet employers and explore internship opportunities.",
      colorClass: "event"
    },
    {
      id: 5,
      type: "task",
      title: "Digital Transformation Presentation",
      category: "Presentation",
      date: makeDate(3),
      startTime: "13:00",
      endTime: "15:00",
      location: "Building C12",
      description: "Group presentation scheduled from your course plan.",
      colorClass: "task-green"
    },
    {
      id: 6,
      type: "task",
      title: "Business Analytics Lecture",
      category: "Lecture",
      date: makeDate(-1),
      startTime: "08:30",
      endTime: "10:00",
      location: "Building A - Room 110",
      description: "Regular lecture from your weekly academic schedule.",
      colorClass: "task-orange"
    },
    {
      id: 7,
      type: "event",
      title: "Founding Day Celebration",
      category: "Cultural",
      date: makeDate(7),
      startTime: "10:00",
      endTime: "16:00",
      location: "University Auditorium",
      description: "Approved campus event that appears after registration approval.",
      colorClass: "event"
    },
    {
      id: 8,
      type: "task",
      title: "Project Team Meeting",
      category: "Task",
      date: makeDate(7),
      startTime: "15:30",
      endTime: "17:00",
      location: "Online",
      description: "Team meeting and sprint discussion.",
      colorClass: "task-purple"
    }
  ];

  let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = formatDateKey(today);
  let currentView = "month";
  let selectedItemId = null;

  function getItemsByDate(dateKey) {
    return allItems
      .filter(item => item.date === dateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function getItemsForCurrentMonth() {
    return allItems.filter(item => {
      const d = parseDateKey(item.date);
      return (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth()
      );
    });
  }

  function getEventsForCurrentMonth() {
    return getItemsForCurrentMonth().filter(item => item.type === "event");
  }

  function getTasksForCurrentMonth() {
    return getItemsForCurrentMonth().filter(item => item.type === "task");
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

      const hasEvents = dayItems.some(item => item.type === "event");
      const hasTasks = dayItems.some(item => item.type === "task");
      const isToday = dateKey === formatDateKey(today);

      if (dateKey === selectedDate) {
        cell.classList.add("selected");
      }

      if (hasEvents && !hasTasks) {
        cell.classList.add("highlight-event");
      } else if (!hasEvents && hasTasks) {
        cell.classList.add("highlight-task");
      }

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = dayNumber;
      cell.appendChild(num);

      const markers = document.createElement("div");
      markers.className = "calendar-markers";

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

      if (isToday) {
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

  function renderBottomPanels() {
    const monthEvents = getEventsForCurrentMonth();
    const monthTasks = getTasksForCurrentMonth();

    eventsCounter.textContent = `${monthEvents.length} ${monthEvents.length === 1 ? "item" : "items"}`;
    tasksCounter.textContent = `${monthTasks.length} ${monthTasks.length === 1 ? "item" : "items"}`;

    myEventsList.innerHTML = "";
    myTasksList.innerHTML = "";

    if (!monthEvents.length) {
      myEventsList.innerHTML = `<div class="simple-empty">No approved events for this month yet.</div>`;
    } else {
      monthEvents.forEach(item => {
        const card = document.createElement("div");
        card.className = "simple-card event";
        card.innerHTML = `
          <h4>${item.title}</h4>
          <p>${formatMonthShort(item.date)} ${parseDateKey(item.date).getDate()} • ${formatTimeRange(item)}</p>
          <p>${item.location}</p>
        `;
        card.addEventListener("click", function () {
          selectedDate = item.date;
          const itemDate = parseDateKey(item.date);
          currentDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1);
          selectedItemId = item.id;
          renderAll();
          showDetails(item.id);
        });
        myEventsList.appendChild(card);
      });
    }

    if (!monthTasks.length) {
      myTasksList.innerHTML = `<div class="simple-empty">No tasks from My Journey for this month yet.</div>`;
    } else {
      monthTasks.forEach(item => {
        const card = document.createElement("div");
        card.className = "simple-card task";
        card.innerHTML = `
          <h4>${item.title}</h4>
          <p>${formatMonthShort(item.date)} ${parseDateKey(item.date).getDate()} • ${formatTimeRange(item)}</p>
          <p>${item.category}</p>
        `;
        card.addEventListener("click", function () {
          selectedDate = item.date;
          const itemDate = parseDateKey(item.date);
          currentDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1);
          selectedItemId = item.id;
          renderAll();
          showDetails(item.id);
        });
        myTasksList.appendChild(card);
      });
    }
  }

  function renderDaySummary() {
    const dateObj = parseDateKey(selectedDate);
    const items = getItemsByDate(selectedDate);

    selectedDayNumber.textContent = String(dateObj.getDate()).padStart(2, "0");
    selectedDayText.textContent = formatDayName(selectedDate);
    selectedDayMeta.textContent = formatLongDate(selectedDate);

    if (!items.length) {
      dayStatusText.textContent = `"No events or tasks are scheduled for this day yet."`;
    } else {
      const eventCount = items.filter(item => item.type === "event").length;
      const taskCount = items.filter(item => item.type === "task").length;
      dayStatusText.textContent = `"You have ${eventCount} event${eventCount !== 1 ? "s" : ""} and ${taskCount} task${taskCount !== 1 ? "s" : ""} scheduled for this day."`;
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

    timelineCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "item" : "items"}`;

    if (!visibleItems.length) {
      timelineList.innerHTML = `<div class="timeline-empty">No scheduled items in this view.</div>`;
      return;
    }

    visibleItems.forEach(item => {
      const block = document.createElement("div");
      block.className = `timeline-item ${item.colorClass}`;
      block.innerHTML = `
        <div class="timeline-time">${formatLongDate(item.date)} • ${formatTimeRange(item)}</div>
        <div class="timeline-title">${item.title}</div>
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
      detailsTag.style.background = "#dfe9fa";
      detailsTag.style.color = "#245df2";
      detailsActionBtn.textContent = "Open Event";
      detailsActionBtn.classList.remove("secondary");
    } else {
      detailsTag.style.background = "#efe8ff";
      detailsTag.style.color = "#7d4cff";
      detailsActionBtn.textContent = "Open Task";
      detailsActionBtn.classList.add("secondary");
    }
  }

  function clearDetails() {
    selectedItemId = null;
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
      const selected = parseDateKey(selectedDate);
      const safeDay = Math.min(
        selected.getDate(),
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      );
      selectedDate = formatDateKey(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), safeDay)
      );
    }

    renderAll();
    const items = getItemsByDate(selectedDate);
    if (items.length) {
      showDetails(items[0].id);
    } else {
      clearDetails();
    }
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
      const selected = parseDateKey(selectedDate);
      const safeDay = Math.min(
        selected.getDate(),
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      );
      selectedDate = formatDateKey(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), safeDay)
      );
    }

    renderAll();
    const items = getItemsByDate(selectedDate);
    if (items.length) {
      showDetails(items[0].id);
    } else {
      clearDetails();
    }
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
    renderBottomPanels();
    renderDaySummary();
    renderTimeline();

    if (selectedItemId) {
      const exists = allItems.some(item => item.id === selectedItemId);
      if (exists) {
        showDetails(selectedItemId);
      } else {
        clearDetails();
      }
    }
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
    alert(`${item.type === "event" ? "Event" : "Task"} opened: ${item.title}`);
  });

  viewTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      viewTabs.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      currentView = this.dataset.view;
      renderTimeline();
    });
  });

  renderAll();

  const initialItems = getItemsByDate(selectedDate);
  if (initialItems.length) {
    showDetails(initialItems[0].id);
  }
});
