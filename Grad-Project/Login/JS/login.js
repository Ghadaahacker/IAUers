const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  errorMessage.textContent = "";

  if (!email || !password) {
    errorMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (!email.endsWith("@iau.edu.sa")) {
    errorMessage.textContent = "Please use your official IAU email.";
    return;
  }

  const emailPrefix = email.split("@")[0];
  const isStudent = /^\d{10}$/.test(emailPrefix);

  if (isStudent) {
    window.location.href = "../../Student/HTML/home.html";
  } else {
    window.location.href = "../../Admin/HTML/home.html";
  }
});
