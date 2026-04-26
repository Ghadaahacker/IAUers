document.addEventListener("DOMContentLoaded", async () => {
    const sidebarContainer = document.getElementById("student-sidebar");
    if (!sidebarContainer) return;
  
    try {
      const response = await fetch("../../Shared/HTML/student-sidebar.html");
      const html = await response.text();
      sidebarContainer.innerHTML = html;
  
      const currentPage = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");
  
      const navItems = sidebarContainer.querySelectorAll(".nav-item[data-page]");
  
      navItems.forEach((item) => {
        if (item.dataset.page === currentPage) {
          item.classList.add("active");
        }
      });
    } catch (error) {
      console.error("Error loading student sidebar:", error);
    }
  });