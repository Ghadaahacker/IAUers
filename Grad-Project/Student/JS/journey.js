import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const coursesList = document.getElementById("coursesList");
  const tasksList = document.getElementById("tasksList");

  const courseModal = document.getElementById("courseModal");
  const taskModal = document.getElementById("taskModal");

  const openCourseModalBtn = document.getElementById("openCourseModalBtn");
  const closeCourseModalBtn = document.getElementById("closeCourseModalBtn");
  const openTaskModalBtn = document.getElementById("openTaskModalBtn");
  const closeTaskModalBtn = document.getElementById("closeTaskModalBtn");

  const courseForm = document.getElementById("courseForm");
  const taskForm = document.getElementById("taskForm");

  const courseNameInput = document.getElementById("courseName");
  const courseCodeInput = document.getElementById("courseCode");
  const colorOptions = document.querySelectorAll(".color-option");

  const taskTypeOptions = document.querySelectorAll(".type-option");
  const taskCourseSelect = document.getElementById("taskCourse");
  const taskTitleInput = document.getElementById("taskTitle");
  const taskDateInput = document.getElementById("taskDate");
  const taskTimeInput = document.getElementById("taskTime");

  const instructorNameInput = document.getElementById("instructorName");
  const classRoomInput = document.getElementById("classRoom");

  const editCourseModal = document.getElementById("editCourseModal");
  const closeEditCourseModalBtn = document.getElementById("closeEditCourseModalBtn");
  const editCourseForm = document.getElementById("editCourseForm");
  const editCourseNameInput = document.getElementById("editCourseName");
  const editCourseCodeInput = document.getElementById("editCourseCode");
  const editInstructorNameInput = document.getElementById("editInstructorName");
  const editClassRoomInput = document.getElementById("editClassRoom");
  const editColorOptionsBtns = document.querySelectorAll("#editColorOptions .color-option");

  const editTaskModal = document.getElementById("editTaskModal");
  const closeEditTaskModalBtn = document.getElementById("closeEditTaskModalBtn");
  const editTaskForm = document.getElementById("editTaskForm");
  const editTaskTypeOptionsBtns = document.querySelectorAll("#editTaskTypeOptions .type-option");
  const editTaskCourseSelect = document.getElementById("editTaskCourse");
  const editTaskTitleInput = document.getElementById("editTaskTitle");
  const editTaskDateInput = document.getElementById("editTaskDate");
  const editTaskTimeInput = document.getElementById("editTaskTime");

  let selectedCourseColor = "#3b82f6";
  let selectedTaskType = "Quiz";
  let selectedTaskPriority = "medium";
  let selectedCourseEmoji = "";
  let selectedTaskEmoji = "";
  let currentTaskFilter = "all";
  let currentUser = null;
  let coursesCache = [];
  let editingCourseId = null;
  let editingTaskId = null;
  let selectedEditCourseColor = "#3b82f6";
  let selectedEditTaskType = "Quiz";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    currentUser = user;

    await renderCourses();
    await populateCourseSelect();
    await renderTasks();
    await renderStats();

    updateCourseSubmitState();
    updateTaskSubmitState();
  });

  function formatTaskDate(dateString) {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "Date not set";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  function formatTaskTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getCourseInitials(courseName) {
    const words = courseName.trim().split(" ");

    return words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  function getTaskIcon(taskType) {
    if (taskType === "Quiz") return "fa-regular fa-file-lines";
    if (taskType === "Assignment") return "fa-solid fa-book-open";
    return "fa-solid fa-graduation-cap";
  }

  function openModal(modal) {
    modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
  }

  function updateCourseSubmitState() {
    const submitBtn = courseForm.querySelector(".submit-btn");

    const valid =
      courseNameInput.value.trim() !== "" &&
      courseCodeInput.value.trim() !== "" &&
      selectedCourseColor !== "";

    submitBtn.classList.toggle("enabled", valid);
  }

  function updateTaskSubmitState() {
    const submitBtn = taskForm.querySelector(".submit-btn");

    const valid =
      taskCourseSelect.value !== "" &&
      taskTitleInput.value.trim() !== "" &&
      taskDateInput.value !== "" &&
      taskTimeInput.value !== "";

    submitBtn.classList.toggle("enabled", valid);
  }

  async function getStudentCourses() {
    if (!currentUser) return [];

    const q = query(
      collection(db, "courses"),
      where("studentId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  }

  async function getStudentTasks() {
    if (!currentUser) return [];

    const q = query(
      collection(db, "tasks"),
      where("studentId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  }

  async function populateCourseSelect() {
    coursesCache = await getStudentCourses();

    taskCourseSelect.innerHTML = `<option value="">Select a course</option>`;

    coursesCache.forEach((course) => {
      const option = document.createElement("option");

      option.value = course.id;
      option.textContent = `${course.courseCode} - ${course.courseName}`;

      taskCourseSelect.appendChild(option);
    });
  }

  async function renderCourses() {
    coursesCache = await getStudentCourses();

    coursesList.innerHTML = "";

    if (!coursesCache.length) {
      coursesList.innerHTML = `
        <div class="empty-state">
          No courses added yet. Start by adding your current semester courses.
        </div>
      `;
      return;
    }

    coursesCache.forEach((course) => {
      const card = document.createElement("div");
      card.className = "card-row";

      const _badgeStyle = course.emoji
        ? 'background:' + course.color + '22;box-shadow:0 2px 10px ' + course.color + '33;'
        : 'background:' + course.color + ';';
      const _badgeContent = course.emoji
        ? '<span style="font-size:22px;line-height:1;">' + course.emoji + '</span>'
        : '<span>' + getCourseInitials(course.courseName) + '</span>';

      card.innerHTML = `
        <div class="card-row-left">
          <div class="course-badge" style="${_badgeStyle}">
            ${_badgeContent}
          </div>

          <div>
            <div class="card-title">${course.courseName}</div>
            <div class="card-subtitle">${course.courseCode}</div>
            ${course.instructorName ? `<div class="card-meta"><i class="fa-solid fa-chalkboard-user"></i> ${course.instructorName}${course.classRoom ? ` &nbsp;·&nbsp; <i class="fa-solid fa-door-open"></i> ${course.classRoom}` : ""}</div>` : ""}
          </div>
        </div>

        <div class="card-actions">
          <button class="edit-btn" type="button" aria-label="Edit Course">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="delete-btn" type="button" aria-label="Delete Course">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      `;

      card.querySelector(".edit-btn").addEventListener("click", function () {
        openEditCourseModal(course);
      });

      const deleteBtn = card.querySelector(".delete-btn");

      deleteBtn.addEventListener("click", async function () {
        await deleteDoc(doc(db, "courses", course.id));

        await renderCourses();
        await populateCourseSelect();
        await renderTasks();
        await renderStats();
      });

      coursesList.appendChild(card);
    });
  }

  async function renderTasks() {
    const tasks = await getStudentTasks();

    tasksList.innerHTML = "";

    if (!tasks.length) {
      tasksList.innerHTML = `
        <div class="empty-state">
          No academic tasks yet. Add quizzes, assignments, or exams and they will be ready for your calendar workflow.
        </div>
      `;
      return;
    }

    let sortedTasks;
    if (currentTaskFilter === "done") {
      sortedTasks = tasks.filter(t => t.status === "done");
    } else if (currentTaskFilter === "high") {
      sortedTasks = tasks.filter(t => t.status !== "done" && t.priority === "high");
    } else if (currentTaskFilter === "medium") {
      sortedTasks = tasks.filter(t => t.status !== "done" && t.priority === "medium");
    } else if (currentTaskFilter === "low") {
      sortedTasks = tasks.filter(t => t.status !== "done" && t.priority === "low");
    } else {
      sortedTasks = tasks.filter(t => t.status !== "done");
    }

    if (currentTaskFilter === "all") {
      sortedTasks = sortedTasks.sort((a, b) => {
        const aT = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const bT = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return aT - bT;
      });
    } else {
      sortedTasks = sortedTasks.sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));
    }

    if (!sortedTasks.length) {
      tasksList.innerHTML = `<div class="empty-state">No tasks in this category.</div>`;
      return;
    }

    sortedTasks.forEach((task) => {
      const card = document.createElement("div");
      card.className = "task-card";
      const isDone = task.status === "done";
      if (isDone) card.classList.add("task-done");

      const _taskBadgeStyle = task.emoji
        ? 'background:' + (task.courseColor || '#3b82f6') + '22;box-shadow:0 2px 10px ' + (task.courseColor || '#3b82f6') + '33;'
        : 'background:' + (task.courseColor || '#3b82f6') + ';';
      const _taskBadgeContent = task.emoji
        ? '<span style="font-size:20px;line-height:1;">' + task.emoji + '</span>'
        : '<i class="' + getTaskIcon(task.type) + '"></i>';

      const pColors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
      const pColor = pColors[task.priority] || "#f59e0b";
      const priorityBadge = task.priority
        ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:${pColor};">
            <span style="width:6px;height:6px;border-radius:50%;background:${pColor};display:inline-block;flex-shrink:0;"></span>
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
           </span>`
        : "";

      card.innerHTML = `
        <div class="task-left">
          <div class="task-icon-badge" style="${_taskBadgeStyle}">
            ${_taskBadgeContent}
          </div>

          <div>
            <div class="task-header-row">
              <span class="task-course-chip" style="background:${task.courseColor || "#3b82f6"}">
                ${task.courseCode || "COURSE"}
              </span>
              <span class="task-type-chip">${task.type}</span>
              ${priorityBadge}
            </div>

            <div class="task-title">${task.title}</div>

            <div class="task-meta">
              <span>
                <i class="fa-regular fa-calendar"></i>
                ${formatTaskDate(task.dueDateTime)}
              </span>
              <span>
                <i class="fa-regular fa-clock"></i>
                ${formatTaskTime(task.time)}
              </span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="task-done-btn ${isDone ? "done" : ""}" type="button" aria-label="Mark Done">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="task-edit-btn" type="button" aria-label="Edit Task">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="delete-btn" type="button" aria-label="Delete Task">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      `;

      card.querySelector(".task-done-btn").addEventListener("click", async function () {
        const newStatus = task.status === "done" ? "pending" : "done";
        await updateDoc(doc(db, "tasks", task.id), { status: newStatus });
        await renderTasks();
        await renderStats();
      });

      card.querySelector(".task-edit-btn").addEventListener("click", async function () {
        await openEditTaskModal(task);
      });

      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async function () {
        await deleteDoc(doc(db, "tasks", task.id));
        await renderTasks();
        await renderStats();
      });

      tasksList.appendChild(card);
    });
  }

  function resetCourseForm() {
    courseForm.reset();
    selectedCourseColor = "#3b82f6";

    colorOptions.forEach((option) => {
      option.classList.remove("selected");

      if (option.dataset.color === selectedCourseColor) {
        option.classList.add("selected");
      }
    });

    updateCourseSubmitState();
  }

  async function resetTaskForm() {
    taskForm.reset();
    selectedTaskType = "Quiz";

    taskTypeOptions.forEach((option) => {
      option.classList.remove("selected");

      if (option.dataset.type === selectedTaskType) {
        option.classList.add("selected");
      }
    });

    await populateCourseSelect();
    updateTaskSubmitState();
  }

  openCourseModalBtn.addEventListener("click", function () {
    resetCourseForm();
    openModal(courseModal);
  });

  closeCourseModalBtn.addEventListener("click", function () {
    closeModal(courseModal);
  });

  openTaskModalBtn.addEventListener("click", async function () {
    await resetTaskForm();
    openModal(taskModal);
  });

  closeTaskModalBtn.addEventListener("click", function () {
    closeModal(taskModal);
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", function () {
      const target = overlay.dataset.close;

      if (target === "course") closeModal(courseModal);
      if (target === "task") closeModal(taskModal);
      if (target === "editCourse") closeModal(editCourseModal);
      if (target === "editTask") closeModal(editTaskModal);
    });
  });

  colorOptions.forEach((option) => {
    option.style.background = option.dataset.color;

    option.addEventListener("click", function () {
      selectedCourseColor = option.dataset.color;

      colorOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");

      updateCourseSubmitState();
    });
  });

  taskTypeOptions.forEach((option) => {
    option.addEventListener("click", function () {
      selectedTaskType = option.dataset.type;

      taskTypeOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");

      updateTaskSubmitState();
    });
  });

  const taskPrioritySelect = document.getElementById("taskPrioritySelect");
  taskPrioritySelect?.addEventListener("change", function () {
    selectedTaskPriority = this.value;
  });

  document.querySelectorAll("#taskFilterTabs .task-filter-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#taskFilterTabs .task-filter-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentTaskFilter = this.dataset.filter;
      renderTasks();
    });
  });

  document.querySelectorAll("#courseEmojiOptions .emoji-opt").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#courseEmojiOptions .emoji-opt").forEach(b => b.classList.remove("selected"));
      if (selectedCourseEmoji === btn.dataset.emoji) {
        selectedCourseEmoji = "";
      } else {
        selectedCourseEmoji = btn.dataset.emoji;
        btn.classList.add("selected");
      }
    });
  });

  document.querySelectorAll("#taskEmojiOptions .emoji-opt").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#taskEmojiOptions .emoji-opt").forEach(b => b.classList.remove("selected"));
      if (selectedTaskEmoji === btn.dataset.emoji) {
        selectedTaskEmoji = "";
      } else {
        selectedTaskEmoji = btn.dataset.emoji;
        btn.classList.add("selected");
      }
    });
  });

  editColorOptionsBtns.forEach((option) => {
    option.style.background = option.dataset.color;
    option.addEventListener("click", function () {
      selectedEditCourseColor = option.dataset.color;
      editColorOptionsBtns.forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");
    });
  });

  editTaskTypeOptionsBtns.forEach((option) => {
    option.addEventListener("click", function () {
      selectedEditTaskType = option.dataset.type;
      editTaskTypeOptionsBtns.forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");
    });
  });

  courseNameInput.addEventListener("input", updateCourseSubmitState);
  courseCodeInput.addEventListener("input", updateCourseSubmitState);

  taskCourseSelect.addEventListener("change", updateTaskSubmitState);
  taskTitleInput.addEventListener("input", updateTaskSubmitState);
  taskDateInput.addEventListener("input", updateTaskSubmitState);
  taskTimeInput.addEventListener("input", updateTaskSubmitState);

  courseForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser) return;

    const courseName = courseNameInput.value.trim();
    const courseCode = courseCodeInput.value.trim().toUpperCase();

    if (!courseName || !courseCode) return;

    await addDoc(collection(db, "courses"), {
      studentId: currentUser.uid,
      studentEmail: currentUser.email,
      courseName: courseName,
      courseCode: courseCode,
      color: selectedCourseColor,
      instructorName: instructorNameInput.value.trim(),
      classRoom: classRoomInput.value.trim(),
      emoji: selectedCourseEmoji,
      createdAt: serverTimestamp()
    });

    await renderCourses();
    await populateCourseSelect();

    closeModal(courseModal);
    resetCourseForm();
  });

  closeEditCourseModalBtn.addEventListener("click", () => closeModal(editCourseModal));
  closeEditTaskModalBtn.addEventListener("click", () => closeModal(editTaskModal));

  function openEditCourseModal(course) {
    editingCourseId = course.id;
    editCourseNameInput.value = course.courseName;
    editCourseCodeInput.value = course.courseCode;
    editInstructorNameInput.value = course.instructorName || "";
    editClassRoomInput.value = course.classRoom || "";
    selectedEditCourseColor = course.color || "#3b82f6";

    editColorOptionsBtns.forEach(o => {
      o.classList.remove("selected");
      if (o.dataset.color === selectedEditCourseColor) o.classList.add("selected");
    });

    openModal(editCourseModal);
  }

  editCourseForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!editingCourseId || !currentUser) return;

    const courseName = editCourseNameInput.value.trim();
    const courseCode = editCourseCodeInput.value.trim().toUpperCase();
    if (!courseName || !courseCode) return;

    await updateDoc(doc(db, "courses", editingCourseId), {
      courseName,
      courseCode,
      color: selectedEditCourseColor,
      instructorName: editInstructorNameInput.value.trim(),
      classRoom: editClassRoomInput.value.trim()
    });

    editingCourseId = null;
    closeModal(editCourseModal);
    await renderCourses();
    await populateCourseSelect();
    await renderStats();
  });

  async function populateEditCourseSelect() {
    const courses = await getStudentCourses();
    editTaskCourseSelect.innerHTML = `<option value="">Select a course</option>`;
    courses.forEach(course => {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent = `${course.courseCode} - ${course.courseName}`;
      editTaskCourseSelect.appendChild(option);
    });
  }

  async function openEditTaskModal(task) {
    editingTaskId = task.id;
    selectedEditTaskType = task.type || "Quiz";

    await populateEditCourseSelect();
    editTaskCourseSelect.value = task.courseId || "";
    editTaskTitleInput.value = task.title || "";

    const datePart = (task.dueDateTime || "").split("T")[0];
    editTaskDateInput.value = datePart || "";
    editTaskTimeInput.value = task.time || "";

    editTaskTypeOptionsBtns.forEach(o => {
      o.classList.remove("selected");
      if (o.dataset.type === selectedEditTaskType) o.classList.add("selected");
    });

    openModal(editTaskModal);
  }

  editTaskForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!editingTaskId || !currentUser) return;

    const title = editTaskTitleInput.value.trim();
    const date = editTaskDateInput.value;
    const time = editTaskTimeInput.value;
    if (!title || !date || !time) return;

    const selectedCourse = coursesCache.find(c => c.id === editTaskCourseSelect.value);
    const dueDateTime = `${date}T${time}`;

    await updateDoc(doc(db, "tasks", editingTaskId), {
      title,
      type: selectedEditTaskType,
      dueDateTime,
      time,
      courseId: selectedCourse?.id || "",
      courseName: selectedCourse?.courseName || "",
      courseCode: selectedCourse?.courseCode || "",
      courseColor: selectedCourse?.color || "#3b82f6"
    });

    editingTaskId = null;
    closeModal(editTaskModal);
    await renderTasks();
    await renderStats();
  });

  async function renderStats() {
    const [courses, tasks] = await Promise.all([
      getStudentCourses(),
      getStudentTasks()
    ]);

    const coursesEl = document.getElementById("statsCoursesCount");
    const tasksEl = document.getElementById("statsTasksCount");
    const dueSoonEl = document.getElementById("statsDueSoonCount");

    if (coursesEl) coursesEl.textContent = courses.length;
    if (tasksEl) tasksEl.textContent = tasks.length;

    if (dueSoonEl) {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dueSoon = tasks.filter(t => {
        const d = new Date(t.dueDateTime);
        return d >= now && d <= weekLater;
      });
      dueSoonEl.textContent = dueSoon.length;
    }
  }

  taskForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser) return;

    const selectedCourse = coursesCache.find(
      (course) => course.id === taskCourseSelect.value
    );

    if (!selectedCourse) return;

    const title = taskTitleInput.value.trim();
    const date = taskDateInput.value;
    const time = taskTimeInput.value;

    if (!title || !date || !time) return;

    const dueDateTime = `${date}T${time}`;

    await addDoc(collection(db, "tasks"), {
      studentId: currentUser.uid,
      studentEmail: currentUser.email,
      emoji: selectedTaskEmoji,
      priority: selectedTaskPriority,
      courseId: selectedCourse.id,
      courseName: selectedCourse.courseName,
      courseCode: selectedCourse.courseCode,
      courseColor: selectedCourse.color,
      title: title,
      type: selectedTaskType,
      dueDateTime: dueDateTime,
      time: time,
      status: "pending",
      createdAt: serverTimestamp()
    });

    await renderTasks();

    closeModal(taskModal);
    await resetTaskForm();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal(courseModal);
      closeModal(taskModal);
      closeModal(editCourseModal);
      closeModal(editTaskModal);
    }
  });
});
