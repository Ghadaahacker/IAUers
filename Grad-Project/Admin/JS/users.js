const searchInput = document.querySelector(".users-search-box input");

searchInput.addEventListener("input", function () {
  console.log("Searching for:", this.value);
});
