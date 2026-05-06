import { auth, db } from "../../Shared/JS/firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async function (e) {
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

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      errorMessage.textContent = "User data not found.";
      return;
    }

    const userData = userSnap.data();

    // 🔥 التوجيه حسب الدور
    if (userData.role === "student") {
      window.location.href = "../../Student/HTML/home.html";

    } else if (userData.role === "admin") {
      window.location.href = "../../Admin/HTML/home.html";

    } else if (userData.role === "buildingManager") {
      window.location.href = "../../Building-Admin/home.html"; // 👈 هنا التعديل

    } else {
      errorMessage.textContent = "Unknown role.";
    }

  } catch (error) {
    console.error(error);
    errorMessage.textContent = "Invalid email or password.";
  }
});
