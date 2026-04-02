const roleButtons = document.querySelectorAll(".role-btn");
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

let selectedRole = "student";

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    roleButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedRole = button.dataset.role;
  });
});

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  errorMessage.textContent = "";

  if (!email || !password) {
    errorMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (!email.endsWith("@iau.edu.sa")) {
    errorMessage.textContent = "Please use your official university email.";
    return;
  }

  if (selectedRole === "student") {
    window.location.href = "../../Student/HTML/home.html";
  } else {
    window.location.href = "../../Admin/HTML/home.html";
  }
});
