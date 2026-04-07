document.addEventListener("DOMContentLoaded", () => {
    const deleteButtons = document.querySelectorAll('.icon-btn[title="Delete"]');
  
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".content-card");
        if (confirm("Are you sure you want to delete this item?")) {
          card.remove();
        }
      });
    });
  });