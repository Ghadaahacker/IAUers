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

document.addEventListener("DOMContentLoaded", async () => {
  try {
  const params   = new URLSearchParams(window.location.search);
  const eventId  = params.get("eventId");
  console.log("📊 Analytics eventId:", eventId);
  const rawDate  = params.get("date") || "";
  const location = params.get("location") || "";

  // ── Header ──────────────────────────────────────────────────────────────────
  const titleEl = document.getElementById("eventTitle");
  const dateEl  = document.getElementById("eventDate");
  const locEl   = document.getElementById("eventLocation");

  if (titleEl) titleEl.textContent = params.get("title") || "Event Analytics";

  if (dateEl && rawDate) {
    const d = new Date(rawDate);
    dateEl.textContent = isNaN(d.getTime())
      ? rawDate
      : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (locEl) locEl.textContent = location || "—";

  if (!eventId) {
    showEmpty();
    return;
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const [regSnap, fbSnap] = await Promise.all([
    getDocs(query(collection(db, "eventRegistrations"), where("eventId", "==", eventId))),
    getDocs(query(collection(db, "eventFeedback"),      where("eventId", "==", eventId)))
  ]);

  // ── Registrations ────────────────────────────────────────────────────────────
  let totalReg   = 0;
  let confirmed  = 0;

  regSnap.forEach(d => {
    totalReg++;
    const s = (d.data().status || "").toLowerCase();
    if (s === "approved" || s === "confirmed") confirmed++;
  });

  document.getElementById("statTotalReg").textContent  = totalReg;
  document.getElementById("statConfirmed").textContent  = confirmed;

  // ── Feedback ─────────────────────────────────────────────────────────────────
  const ratingCounts = [0, 0, 0, 0, 0];
  let   ratingSum    = 0;
  let   recYes       = 0;
  let   recNo        = 0;

  fbSnap.forEach(d => {
    const data   = d.data();
    const rating = data.satisfaction ?? data.rating;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating - 1]++;
      ratingSum += rating;
    }
    if (data.wouldRecommend === true || (typeof rating === "number" && rating >= 4)) {
      recYes++;
    } else {
      recNo++;
    }
  });

  const totalFb  = fbSnap.size;
  const avgRating = totalFb > 0 ? (ratingSum / totalFb) : 0;

  // ── Avg Satisfaction card ────────────────────────────────────────────────────
  const ratingEl = document.getElementById("statAvgRating");
  const starsEl  = document.getElementById("starsRow");

  if (totalFb === 0) {
    ratingEl.textContent = "—";
    starsEl.innerHTML    = `<span style="font-size:13px;color:#5f6e80;">No feedback yet</span>`;
  } else {
    ratingEl.textContent = `${avgRating.toFixed(1)}/5`;
    const full  = Math.floor(avgRating);
    const half  = avgRating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    starsEl.innerHTML =
      `<i class="fa-solid fa-star"></i>`.repeat(full) +
      (half ? `<i class="fa-solid fa-star-half-stroke"></i>` : "") +
      `<i class="fa-regular fa-star"></i>`.repeat(empty);
  }

  // ── Satisfaction Distribution chart ──────────────────────────────────────────
  const ctx1 = document.getElementById("satisfactionChart");
  if (ctx1) {
    if (totalFb === 0) {
      ctx1.style.display = "none";
      const msg = document.createElement("p");
      msg.textContent = "No ratings submitted yet.";
      msg.style.cssText = "text-align:center;color:#5f6e80;padding:60px 0;font-size:15px;";
      ctx1.parentElement.appendChild(msg);
    } else {
      const parentW = ctx1.parentElement.clientWidth || 600;
      ctx1.width  = parentW;
      ctx1.height = 360;
      new Chart(ctx1, {
        type: "bar",
        data: {
          labels: ["1 ★", "2 ★", "3 ★", "4 ★", "5 ★"],
          datasets: [{
            label: "Responses",
            data: ratingCounts,
            backgroundColor: "#4b84e6",
            borderRadius: 8
          }]
        },
        options: {
          responsive: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: "Count" } },
            x: { title: { display: true, text: "Rating" } }
          }
        }
      });
    }
  }

  // ── Would Attend chart ────────────────────────────────────────────────────────
  const ctx2Wrap = document.querySelector(".pie-wrapper");
  const ctx2     = document.getElementById("wouldAttendChart");

  if (totalFb === 0) {
    if (ctx2Wrap) ctx2Wrap.innerHTML =
      `<p style="text-align:center;color:#5f6e80;padding:40px 0;font-size:15px;">No feedback submitted yet.</p>`;
  } else if (ctx2) {
    new Chart(ctx2, {
      type: "pie",
      data: {
        labels: [`Would Recommend (${recYes})`, `Would Not (${recNo})`],
        datasets: [{
          data: [recYes, recNo],
          backgroundColor: ["#4b84e6", "#e0534e"],
          borderColor: "#ffffff",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // ── Demographics — hide if no extra data ─────────────────────────────────────
  const demSection = document.querySelector(".demographics-section");
  if (demSection) demSection.style.display = "none";

  } catch (err) {
    console.error("❌ Analytics error:", err);
  }
});

function showEmpty() {
  const grid = document.querySelector(".event-stats-grid");
  if (grid) grid.innerHTML =
    `<p style="color:#5f6e80;font-size:15px;grid-column:1/-1;">No event selected.</p>`;
}
