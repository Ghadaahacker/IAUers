import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChH322jxj-b2_ZCWi71RRrzUG8O7pFkBE",
  authDomain: "iauers.firebaseapp.com",
  projectId: "iauers",
  storageBucket: "iauers.firebasestorage.app",
  messagingSenderId: "278163865940",
  appId: "1:278163865940:web:9112b4946c387ec39e88c1"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const $ = id => document.getElementById(id);

function show(id) {
  ["stateLoading","stateValid","stateSuccess","stateError","stateNoParam"]
    .forEach(s => document.getElementById(s).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function formatDate(value) {
  if (!value) return "Date not available";
  const d = value.toDate ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let eventPin = null; // null = no PIN required

async function init() {
  const params = new URLSearchParams(window.location.search);
  const regId  = params.get("reg");

  if (!regId) { show("stateNoParam"); return; }

  try {
    // Load registration
    const regRef  = doc(db, "eventRegistrations", regId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) {
      $("errorMsg").textContent = "No ticket found with this ID.";
      show("stateError");
      return;
    }

    const reg = regSnap.data();

    // Load student name from users collection
    let studentName  = reg.studentName || "Unknown Student";
    let studentEmail = reg.studentEmail || "";

    if (reg.studentId) {
      try {
        const userSnap = await getDoc(doc(db, "users", reg.studentId));
        if (userSnap.exists()) {
          studentName  = userSnap.data().name  || studentName;
          studentEmail = userSnap.data().email || studentEmail;
        }
      } catch (_) {}
    }

    // Load event — get PIN and enforce time window
    if (reg.eventId) {
      try {
        const eventSnap = await getDoc(doc(db, "events", reg.eventId));
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();

          // PIN — check session cache first so volunteer only enters once per session
          if (eventData.checkinPin) {
            const cached = localStorage.getItem(`pin_${reg.eventId}`);
            if (cached === String(eventData.checkinPin)) {
              // Already verified — skip PIN entry
              eventPin = null;
            } else {
              eventPin = String(eventData.checkinPin);
              $("pinSection").classList.remove("hidden");
            }
          }

          // Time window: 1 hour before → 1 hour after event start
          const raw = eventData.dateTime || reg.eventDateTime;
          if (raw) {
            const eventTime = raw.toDate ? raw.toDate() : new Date(raw);
            if (!isNaN(eventTime.getTime())) {
              const now      = new Date();
              const opensAt  = new Date(eventTime.getTime() - 60 * 60 * 1000);
              const closesAt = new Date(eventTime.getTime() + 60 * 60 * 1000);

              if (now < opensAt) {
                const fmt = t => t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                const dateStr = opensAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                $("errorIcon").innerHTML = `<i class="fa-regular fa-clock"></i>`;
                $("errorTitle").textContent = "Too Early";
                $("errorMsg").textContent = `Check-in opens at ${fmt(opensAt)} on ${dateStr}.`;
                show("stateError");
                return;
              }

              if (now > closesAt) {
                $("errorIcon").innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i>`;
                $("errorTitle").textContent = "Check-in Closed";
                $("errorMsg").textContent = "Check-in for this event has closed.";
                show("stateError");
                return;
              }
            }
          }
        }
      } catch (_) {}
    }

    // Load rating if exists
    let ratingText = null;
    try {
      const ratingSnap = await getDocs(query(
        collection(db, "eventFeedback"),
        where("studentId", "==", reg.studentId),
        where("eventId",   "==", reg.eventId)
      ));
      if (!ratingSnap.empty) {
        const r = ratingSnap.docs[0].data();
        ratingText = `Rated ${r.satisfaction}/5 · ${r.wouldRecommend ? "Would recommend" : "Would not recommend"}`;
      }
    } catch (_) {}

    // Populate UI
    $("ticketId").textContent    = reg.ticketId || `TKT-${regId.slice(0,6).toUpperCase()}`;
    $("avatarInitials").textContent = getInitials(studentName);
    $("studentName").textContent = studentName;
    $("studentEmail").textContent = studentEmail;
    $("eventTitle").textContent  = reg.eventTitle    || "Untitled Event";
    $("eventDate").textContent   = formatDate(reg.eventDateTime);
    $("eventLocation").textContent = reg.eventLocation || "IAU Campus";

    if (ratingText) {
      $("ratingText").textContent = ratingText;
      $("ratingRow").classList.remove("hidden");
    }

    // Already checked in?
    if (reg.checkedIn) {
      const t = reg.checkedInAt?.toDate?.() || null;
      $("checkedInTime").textContent = t
        ? t.toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
        : "earlier";
      $("alreadyCheckedIn").classList.remove("hidden");
      $("confirmBtn").disabled = true;
    }

    show("stateValid");

    // Confirm check-in
    $("confirmBtn").addEventListener("click", async () => {
      // Validate PIN if event requires one
      if (eventPin !== null) {
        const entered = String($("pinInput").value).trim();
        if (entered !== eventPin) {
          $("pinError").classList.remove("hidden");
          $("pinInput").focus();
          return;
        }
        $("pinError").classList.add("hidden");
      }

      $("confirmBtn").disabled = true;
      $("confirmBtn").innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Confirming…`;

      try {
        await updateDoc(regRef, {
          checkedIn:   true,
          checkedInAt: serverTimestamp()
        });

        // Cache PIN so volunteer doesn't re-enter it for subsequent scans
        if (eventPin !== null && reg.eventId) {
          localStorage.setItem(`pin_${reg.eventId}`, eventPin);
        }

        $("successMsg").textContent = `${studentName} has been checked in for ${reg.eventTitle || "the event"}.`;
        show("stateSuccess");
      } catch (err) {
        console.error(err);
        $("confirmBtn").disabled = false;
        $("confirmBtn").innerHTML = `<i class="fa-solid fa-circle-check"></i> Confirm Check-in`;
        alert("Failed to check in. Please try again.");
      }
    });

  } catch (err) {
    console.error(err);
    $("errorMsg").textContent = "Something went wrong. Please try again.";
    show("stateError");
  }
}

init();
