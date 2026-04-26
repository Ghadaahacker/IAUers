document.addEventListener("DOMContentLoaded", function () {
  const COURSES_KEY = "studentCourses";
  const TASKS_KEY = "studentJourneyTasks";

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

  function loadCourses() {
    const raw = localStorage.getItem(COURSES_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse studentCourses:", error);
      return [];
    }
  }

  function saveCourses(courses) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  }

  function loadTasks() {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse studentJourneyTasks:", error);
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function formatTaskDate(dateString) {
    const date = new Date(dateString);
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

  function populateCourseSelect() {
    const courses = loadCourses();
    taskCourseSelect.innerHTML = `<option value="">Select a course</option>`;

    courses.forEach(course => {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent = `${course.code} - ${course.name}`;
      taskCourseSelect.appendChild(option);
    });
  }

  function renderCourses() {
    const courses = loadCourses();
    const searchValue = journeySearch ? journeySearch.value.trim().toLowerCase() : "";

    const filteredCourses = courses.filter(course => {
      return [course.name, course.code]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    });

    coursesList.innerHTML = "";

    if (!filteredCourses.length) {
      coursesList.innerHTML = `
        <div class="empty-state">
          No courses added yet. Start by adding your current semester courses.
        </div>
      `;
      return;
    }

    filteredCourses.forEach(course => {
      const card = document.createElement("div");
      card.className = "card-row";

      card.innerHTML = `
        <div class="card-row-left">
          <div class="course-badge" style="background:${course.color}">
            <span>${getCourseInitials(course.name)}</span>
          </div>

          <div>
            <div class="card-title">${course.name}</div>
            <div class="card-subtitle">${course.code}</div>
          </div>
        </div>

        <button class="delete-btn" type="button" aria-label="Delete Course">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      `;

      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", function () {
        const updatedCourses = loadCourses().filter(item => item.id !== course.id);
        saveCourses(updatedCourses);

        const updatedTasks = loadTasks().filter(task => task.courseId !== course.id);
        saveTasks(updatedTasks);

        populateCourseSelect();
        renderCourses();
        renderTasks();
      });

      coursesList.appendChild(card);
    });
  }

  function renderTasks() {
    const tasks = loadTasks();
    const courses = loadCourses();
    const searchValue = journeySearch.value.trim().toLowerCase();

    const filteredTasks = tasks
      .filter(task => {
        return [task.title, task.courseCode, task.type]
          .join(" ")
          .toLowerCase()
          .includes(searchValue);
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.date}T${a.time}`);
        const bDate = new Date(`${b.date}T${b.time}`);
        return aDate - bDate;
      });

    tasksList.innerHTML = "";

    if (!filteredTasks.length) {
      tasksList.innerHTML = `
        <div class="empty-state">
          No academic tasks yet. Add quizzes, assignments, or exams and they will be ready for your calendar workflow.
        </div>
      `;
      return;
    }

    filteredTasks.forEach(task => {
      const course = courses.find(courseItem => courseItem.id === task.courseId);

      const card = document.createElement("div");
      card.className = "task-card";

      card.innerHTML = `
        <div class="task-left">
          <div class="task-icon-badge" style="background:${task.courseColor}">
            <i class="${getTaskIcon(task.type)}"></i>
          </div>

          <div>
            <div class="task-header-row">
              <span class="task-course-chip" style="background:${task.courseColor}">
                ${task.courseCode}
              </span>
              <span class="task-type-chip">${task.type}</span>
            </div>

            <div class="task-title">${task.title}</div>

            <div class="task-meta">
              <span>
                <i class="fa-regular fa-calendar"></i>
                ${formatTaskDate(task.date)}
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
      deleteBtn.addEventListener("click", function () {
        const updatedTasks = loadTasks().filter(item => item.id !== task.id);
        saveTasks(updatedTasks);
        renderTasks();
      });

      tasksList.appendChild(card);
    });
  }

  function resetCourseForm() {
    courseForm.reset();
    selectedCourseColor = "#3b82f6";

    colorOptions.forEach(option => {
      option.classList.remove("selected");
      if (option.dataset.color === selectedCourseColor) {
        option.classList.add("selected");
      }
    });

    updateCourseSubmitState();
  }

  function resetTaskForm() {
    taskForm.reset();
    selectedTaskType = "Quiz";

    taskTypeOptions.forEach(option => {
      option.classList.remove("selected");
      if (option.dataset.type === selectedTaskType) {
        option.classList.add("selected");
      }
    });

    populateCourseSelect();
    updateTaskSubmitState();
  }

  openCourseModalBtn.addEventListener("click", function () {
    resetCourseForm();
    openModal(courseModal);
  });

  closeCourseModalBtn.addEventListener("click", function () {
    closeModal(courseModal);
  });

  openTaskModalBtn.addEventListener("click", function () {
    resetTaskForm();
    openModal(taskModal);
  });

  closeTaskModalBtn.addEventListener("click", function () {
    closeModal(taskModal);
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", function () {
      const target = overlay.dataset.close;
      if (target === "course") closeModal(courseModal);
      if (target === "task") closeModal(taskModal);
    });
  });

  colorOptions.forEach(option => {
    option.style.background = option.dataset.color;

    option.addEventListener("click", function () {
      selectedCourseColor = option.dataset.color;

      colorOptions.forEach(item => item.classList.remove("selected"));
      option.classList.add("selected");

      updateCourseSubmitState();
    });
  });

  taskTypeOptions.forEach(option => {
    option.addEventListener("click", function () {
      selectedTaskType = option.dataset.type;

      taskTypeOptions.forEach(item => item.classList.remove("selected"));
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

  courseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const courses = loadCourses();

    const newCourse = {
      id: `course-${Date.now()}`,
      name: courseNameInput.value.trim(),
      code: courseCodeInput.value.trim().toUpperCase(),
      color: selectedCourseColor
    };

    courses.push(newCourse);
    saveCourses(courses);

    populateCourseSelect();
    renderCourses();
    closeModal(courseModal);
    resetCourseForm();
  });

  taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const courses = loadCourses();
    const selectedCourse = courses.find(course => course.id === taskCourseSelect.value);

    if (!selectedCourse) return;

    const tasks = loadTasks();

    const newTask = {
      id: `task-${Date.now()}`,
      type: selectedTaskType,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
      courseColor: selectedCourse.color,
      title: taskTitleInput.value.trim(),
      date: taskDateInput.value,
      time: taskTimeInput.value
    };

    tasks.push(newTask);
    saveTasks(tasks);

    renderTasks();
    closeModal(taskModal);
    resetTaskForm();
  });

  if (journeySearch) {
    journeySearch.addEventListener("input", function () {
      renderCourses();
      renderTasks();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal(courseModal);
      closeModal(taskModal);
    }
  });

  populateCourseSelect();
  renderCourses();
  renderTasks();
  updateCourseSubmitState();
  updateTaskSubmitState();
});
