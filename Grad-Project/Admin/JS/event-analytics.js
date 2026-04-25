document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    
    const eventTitle = params.get("title");
    const eventDate = params.get("date");
    const eventLocation = params.get("location");
    
    if (eventTitle) document.getElementById("eventTitle").textContent = eventTitle;
    if (eventDate) document.getElementById("eventDate").textContent = eventDate;
    if (eventLocation) document.getElementById("eventLocation").textContent = eventLocation;
    
    const satisfactionCanvas = document.getElementById("satisfactionChart");
    const wouldAttendCanvas = document.getElementById("wouldAttendChart");
  
    if (satisfactionCanvas) {
      new Chart(satisfactionCanvas, {
        type: "bar",
        data: {
          labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
          datasets: [{
            label: "Ratings",
            data: [3, 8, 18, 50, 60],
            backgroundColor: "#4b84e6",
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 80,
              title: {
                display: true,
                text: "Count"
              }
            },
            x: {
              title: {
                display: true,
                text: "Rating (Stars)"
              }
            }
          }
        }
      });
    }
  
    if (wouldAttendCanvas) {
      new Chart(wouldAttendCanvas, {
        type: "pie",
        data: {
          labels: ["Yes", "No"],
          datasets: [{
            data: [87, 13],
            backgroundColor: ["#4b84e6", "#e0534e"],
            borderColor: "#ffffff",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    }
  });