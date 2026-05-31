import { db } from "../../Shared/JS/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const currentUserRole = sessionStorage.getItem("userRole");
if (currentUserRole !== "admin") {
  window.location.href = "../../Login/HTML/login.html";
}

async function loadAnalytics() {
  const [eventsSnap, registrationsSnap, feedbackSnap] = await Promise.all([
    getDocs(query(collection(db, "events"), where("status", "==", "published"))),
    getDocs(collection(db, "eventRegistrations")),
    getDocs(collection(db, "eventFeedback"))
  ]);

  // Build events map
  const eventsMap = {};
  let totalCapacity = 0;

  eventsSnap.forEach(docSnap => {
    const data = docSnap.data();
    eventsMap[docSnap.id] = { id: docSnap.id, ...data, registrationCount: 0 };
    totalCapacity += Number(data.capacity) || 0;
  });

  // Process registrations
  let totalRegistrations = 0;
  let confirmedCount = 0;
  const monthlyData = {};

  registrationsSnap.forEach(docSnap => {
    const reg = docSnap.data();
    totalRegistrations++;

    const status = reg.status || reg.ticketStatus || "";
    if (status === "confirmed") confirmedCount++;

    // Monthly grouping
    const ts = reg.registeredAt || reg.createdAt || reg.timestamp;
    if (ts) {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      const key = date.toLocaleString("en-US", { month: "short" }) + " " + date.getFullYear();
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    }

    // Count per event
    const eventId = reg.eventId;
    if (eventId && eventsMap[eventId]) {
      eventsMap[eventId].registrationCount++;
    }
  });

  // KPI values
  const confirmationRate = totalRegistrations > 0
    ? Math.round((confirmedCount / totalRegistrations) * 1000) / 10
    : 0;
  const fillRate = totalCapacity > 0
    ? Math.round((totalRegistrations / totalCapacity) * 1000) / 10
    : 0;
  const pendingCount = totalRegistrations - confirmedCount;

  document.getElementById("engagementValue").textContent = `${confirmationRate}%`;
  document.getElementById("responsesValue").textContent = totalRegistrations;
  document.getElementById("satisfactionValue").textContent = `${fillRate}%`;
  document.getElementById("wouldAttendValue").textContent = confirmedCount;

  // Last 6 months for the trend chart
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      key: d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear()
    };
  });

  // Registrations Over Time chart
  const ctx1 = document.getElementById("engagementTrendChart").getContext("2d");
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: last6Months.map(m => m.label),
      datasets: [{
        label: "Registrations",
        data: last6Months.map(m => monthlyData[m.key] || 0),
        borderColor: "#4b84e6",
        backgroundColor: "rgba(75,132,230,0.10)",
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "#4b84e6"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: "Registrations" }
        }
      }
    }
  });

  // Top events by registration count (up to 5)
  const topEvents = Object.values(eventsMap)
    .sort((a, b) => b.registrationCount - a.registrationCount)
    .slice(0, 5);

  // Event Registrations vs Capacity chart
  const ctx2 = document.getElementById("eventComparisonChart").getContext("2d");
  new Chart(ctx2, {
    type: "bar",
    data: {
      labels: topEvents.map(e => (e.title || "Event").slice(0, 22)),
      datasets: [
        {
          label: "Registrations",
          data: topEvents.map(e => e.registrationCount),
          backgroundColor: "#4b84e6",
          borderRadius: 10
        },
        {
          label: "Capacity",
          data: topEvents.map(e => Number(e.capacity) || 0),
          backgroundColor: "#8f5cf2",
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Count" }
        }
      }
    }
  });

  // Recommendation Rate pie chart — from real student feedback (1–5 rating)
  let totalFeedback = 0;
  let wouldRecommend = 0;

  feedbackSnap.forEach(docSnap => {
    const fb = docSnap.data();
    totalFeedback++;
    if (fb.wouldRecommend === true || (typeof fb.rating === "number" && fb.rating >= 4)) {
      wouldRecommend++;
    }
  });

  const wouldNotRecommend = totalFeedback - wouldRecommend;
  const recommendPct = totalFeedback > 0
    ? Math.round((wouldRecommend / totalFeedback) * 100)
    : 0;

  const ctx3 = document.getElementById("recommendationChart").getContext("2d");

  if (totalFeedback === 0) {
    ctx3.canvas.style.display = "none";
    const noData = document.createElement("p");
    noData.textContent = "No feedback submitted yet.";
    noData.style.cssText = "text-align:center; color:#5f6e80; padding: 40px 0; font-size:15px;";
    ctx3.canvas.parentElement.appendChild(noData);
  } else {
    new Chart(ctx3, {
      type: "pie",
      data: {
        labels: [
          `Would Recommend (4–5★): ${wouldRecommend}`,
          `Would Not Recommend (1–3★): ${wouldNotRecommend}`
        ],
        datasets: [{
          data: [wouldRecommend, wouldNotRecommend],
          backgroundColor: ["#4b84e6", "#e0534e"],
          borderColor: "#ffffff",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = Math.round((ctx.parsed / totalFeedback) * 100);
                return ` ${ctx.label.split(":")[0]}: ${pct}%`;
              }
            }
          }
        }
      }
    });

    // Update KPI "Confirmed" card to show recommendation rate
    document.getElementById("wouldAttendValue").textContent = `${recommendPct}%`;
    document.querySelector(".kpi-card:nth-child(4) .kpi-label").textContent = "Recommend Rate";
  }

  // Top Performing Events list
  const container = document.getElementById("topEventsList");
  const rankedEvents = topEvents.filter(e => e.registrationCount > 0);

  if (rankedEvents.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No event registrations yet.</p></div>`;
    return;
  }

  container.innerHTML = rankedEvents.map((event, index) => {
    const rank = index + 1;
    const cap = Number(event.capacity) || 0;
    const fillPct = cap > 0 ? Math.round((event.registrationCount / cap) * 100) : 0;
    const badgeClass = rank <= 3 ? `rank-${rank}` : "rank-3";

    return `
      <div class="top-event-card">
        <div class="rank-badge ${badgeClass}">${rank}</div>
        <div class="event-main">
          <h3>${event.title || "Untitled Event"}</h3>
          <p>${(event.description || "No description available.").slice(0, 110)}</p>
        </div>
        <div class="metric-box metric-attendees">
          <div class="value"><i class="fa-solid fa-users"></i>${event.registrationCount}</div>
          <div class="label">Registrations</div>
        </div>
        <div class="metric-box metric-rating">
          <div class="value"><i class="fa-solid fa-chair"></i>${cap || "—"}</div>
          <div class="label">Capacity</div>
        </div>
        <div class="metric-box metric-engagement">
          <div class="value"><i class="fa-solid fa-arrow-trend-up"></i>${fillPct}%</div>
          <div class="label">Fill Rate</div>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadAnalytics);
