document.addEventListener("DOMContentLoaded", function () {
  const savedName = localStorage.getItem("studentName") || "Student";
  const greetingText = document.getElementById("greetingText");

  const hour = new Date().getHours();
  let greeting = "";

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning";
  } else if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  greetingText.textContent = `${greeting}, ${savedName}`;

  // Highlight current page automatically
  const currentPage = window.location.pathname.split("/").pop() || "home.html";
  const navItems = document.querySelectorAll(".nav-menu .nav-item, .sidebar-bottom .nav-item");

  navItems.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    } else if (href !== "home.html") {
      link.classList.remove("active");
    }
  });
});
