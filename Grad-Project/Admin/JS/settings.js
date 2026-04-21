document.addEventListener("DOMContentLoaded", () => {
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const discardBtn = document.getElementById("discardBtn");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const deactivateBtn = document.getElementById("deactivateBtn");
  
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("emailAddress");
    const departmentSelect = document.getElementById("department");
  
    const defaultValues = {
      fullName: fullNameInput ? fullNameInput.value : "",
      email: emailInput ? emailInput.value : "",
      department: departmentSelect ? departmentSelect.value : ""
    };
  
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () => {
        alert("Changes saved successfully.");
      });
    }
  
    if (discardBtn) {
      discardBtn.addEventListener("click", () => {
        if (fullNameInput) fullNameInput.value = defaultValues.fullName;
        if (emailInput) emailInput.value = defaultValues.email;
        if (departmentSelect) departmentSelect.value = defaultValues.department;
      });
    }
  
    if (sendMessageBtn) {
      sendMessageBtn.addEventListener("click", () => {
        alert("Your message has been sent.");
      });
    }
  
    if (deactivateBtn) {
      deactivateBtn.addEventListener("click", () => {
        const confirmed = confirm("Are you sure you want to deactivate this account?");
        if (confirmed) {
          alert("Deactivation request submitted.");
        }
      });
    }
  });