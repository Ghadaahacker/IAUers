import { db } from "../../Shared/JS/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");
if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

const adminEmail = (sessionStorage.getItem("userEmail") || "").toLowerCase();

const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

let allUsers = [];
let activeFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  const totalUsersCount = document.getElementById("totalUsersCount");
  const activeUsersCount = document.getElementById("activeUsersCount");
  const inactiveUsersCount = document.getElementById("inactiveUsersCount");
  const searchInput = document.getElementById("userSearch");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tbody = document.getElementById("usersTableBody");
  const emptyState = document.getElementById("usersEmptyState");

  try {
    // 1. Find all events created by this admin
    const eventsSnap = await getDocs(collection(db, "events"));
    const adminEventIds = new Set();
    eventsSnap.forEach(doc => {
      const createdBy = (doc.data().createdBy || "").toLowerCase();
      if (createdBy === adminEmail) adminEventIds.add(doc.id);
    });

    // 2. Find all students who registered for those events
    const regSnap = await getDocs(collection(db, "eventRegistrations"));
    const studentIds = new Set();
    regSnap.forEach(doc => {
      const data = doc.data();
      if (adminEventIds.has(data.eventId)) {
        const sid = data.studentId || data.userId;
        if (sid) studentIds.add(sid);
      }
    });

    // 3. Fetch those student profiles from the users collection
    const usersSnap = await getDocs(collection(db, "users"));
    allUsers = [];
    let total = 0, active = 0, inactive = 0;

    usersSnap.forEach(doc => {
      if (!studentIds.has(doc.id)) return;

      const u = doc.data();
      const isActive = u.lastLogin && u.lastLogin.toDate() >= twoDaysAgo;
      total++;
      isActive ? active++ : inactive++;

      allUsers.push({
        id: doc.id,
        name: u.name || "Unknown",
        email: u.email || "—",
        role: u.role || "student",
        department: u.department || "—",
        lastLogin: u.lastLogin || null,
        isActive
      });
    });

    totalUsersCount.textContent = total;
    activeUsersCount.textContent = active;
    inactiveUsersCount.textContent = inactive;

    renderTable();
  } catch (err) {
    console.error("Error loading users:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#5f6e80;padding:32px;">Failed to load users.</td></tr>`;
  }

  searchInput.addEventListener("input", renderTable);

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderTable();
    });
  });

  function renderTable() {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = allUsers.filter(u => {
      const matchSearch = !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term);

      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && u.isActive) ||
        (activeFilter === "inactive" && !u.isActive);

      return matchSearch && matchFilter;
    });

    tbody.innerHTML = "";

    if (!filtered.length) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    filtered.forEach(u => {
      const initial = u.name.charAt(0).toUpperCase();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initial}</div>
            <span class="user-name">${u.name}</span>
          </div>
        </td>
        <td class="cell-muted">${u.email}</td>
        <td><span class="role-badge role-${u.role}">${formatRole(u.role)}</span></td>
        <td class="cell-muted">${u.department}</td>
        <td><span class="status-badge ${u.isActive ? "status-active" : "status-inactive"}">${u.isActive ? "Active" : "Inactive"}</span></td>
        <td class="cell-muted">${formatLastLogin(u.lastLogin)}</td>
      `;
      tbody.appendChild(row);
    });
  }
});

function formatRole(role) {
  const map = { student: "Student", admin: "Admin", buildingManager: "Building Mgr" };
  return map[role] || role;
}

function formatLastLogin(ts) {
  if (!ts) return "Never";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
