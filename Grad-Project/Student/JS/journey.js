import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
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

  let selectedCourseColor = "#3b82f6";
  let selectedTaskType = "Quiz";
  let currentUser = null;
  let coursesCache = [];

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../../Login/HTML/login.html";
      return;
    }

    currentUser = user;

    await renderCourses();
    await populateCourseSelect();
    await renderTasks();

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

      card.innerHTML = `
        <div class="card-row-left">
          <div class="course-badge" style="background:${course.color}">
            <span>${getCourseInitials(course.courseName)}</span>
          </div>

          <div>
            <div class="card-title">${course.courseName}</div>
            <div class="card-subtitle">${course.courseCode}</div>
          </div>
        </div>

        <button class="delete-btn" type="button" aria-label="Delete Course">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      `;

      const deleteBtn = card.querySelector(".delete-btn");

      deleteBtn.addEventListener("click", async function () {
        await deleteDoc(doc(db, "courses", course.id));

        await renderCourses();
        await populateCourseSelect();
        await renderTasks();
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

    const sortedTasks = tasks.sort((a, b) => {
      const aDate = new Date(a.dueDateTime);
      const bDate = new Date(b.dueDateTime);
      return aDate - bDate;
    });

    sortedTasks.forEach((task) => {
      const card = document.createElement("div");
      card.className = "task-card";

      card.innerHTML = `
        <div class="task-left">
          <div class="task-icon-badge" style="background:${task.courseColor || "#3b82f6"}">
            <i class="${getTaskIcon(task.type)}"></i>
          </div>

          <div>
            <div class="task-header-row">
              <span class="task-course-chip" style="background:${task.courseColor || "#3b82f6"}">
                ${task.courseCode || "COURSE"}
              </span>

              <span class="task-type-chip">${task.type}</span>
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

        <button class="delete-btn" type="button" aria-label="Delete Task">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      `;

      const deleteBtn = card.querySelector(".delete-btn");

      deleteBtn.addEventListener("click", async function () {
        await deleteDoc(doc(db, "tasks", task.id));
        await renderTasks();
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
      createdAt: serverTimestamp()
    });

    await renderCourses();
    await populateCourseSelect();

    closeModal(courseModal);
    resetCourseForm();
  });

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
    }
  });
});
