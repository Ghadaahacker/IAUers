const analyticsSummary = {
    engagement: 72.3,
    responses: 487,
    satisfaction: 4.4,
    wouldAttend: 89.7
  };
  
  const engagementTrend = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [45, 52, 67, 58, 73, 81]
  };
  
  const eventComparison = {
    labels: ["Tech Conf", "Career Fair", "Workshop", "Sports Day"],
    satisfaction: [4.2, 4.9, 4.1, 4.5],
    responses: [140, 198, 84, 156]
  };
  
  const recommendationData = {
    wouldAttend: 90,
    wouldNot: 10
  };
  
  const topEvents = [
    {
      title: "Career Fair 2026",
      description: "Strong student engagement and excellent feedback from attendees.",
      rating: 4.6,
      attendees: 198,
      engagement: 92.4
    },
    {
      title: "Sports Day Competition",
      description: "High participation with positive recommendation trends.",
      rating: 4.5,
      attendees: 156,
      engagement: 88.3
    },
    {
      title: "Tech Innovation Conference",
      description: "Good turnout with strong academic interest and event reach.",
      rating: 4.3,
      attendees: 142,
      engagement: 87.3
    }
  ];
  
  function fillSummary() {
    document.getElementById("engagementValue").textContent = `${analyticsSummary.engagement}%`;
    document.getElementById("responsesValue").textContent = analyticsSummary.responses;
    document.getElementById("satisfactionValue").textContent = `${analyticsSummary.satisfaction}/5`;
    document.getElementById("wouldAttendValue").textContent = `${analyticsSummary.wouldAttend}%`;
  }
  
  function renderEngagementChart() {
    const ctx = document.getElementById("engagementTrendChart").getContext("2d");
  
    new Chart(ctx, {
      type: "line",
      data: {
        labels: engagementTrend.labels,
        datasets: [
          {
            label: "engagement",
            data: engagementTrend.data,
            borderColor: "#4b84e6",
            backgroundColor: "rgba(75,132,230,0.10)",
            tension: 0.4,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: "#4b84e6"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            title: {
              display: true,
              text: "Engagement"
            }
          }
        }
      }
    });
  }
  
  function renderComparisonChart() {
    const ctx = document.getElementById("eventComparisonChart").getContext("2d");
  
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: eventComparison.labels,
        datasets: [
          {
            label: "satisfaction",
            data: eventComparison.satisfaction,
            backgroundColor: "#4b84e6",
            borderRadius: 12,
            yAxisID: "y"
          },
          {
            label: "responses",
            data: eventComparison.responses,
            backgroundColor: "#8f5cf2",
            borderRadius: 12,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            title: {
              display: true,
              text: "Satisfaction"
            }
          },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: "Responses"
            }
          }
        }
      }
    });
  }
  
  function renderRecommendationChart() {
    const ctx = document.getElementById("recommendationChart").getContext("2d");
  
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: [
          `Would Attend: ${recommendationData.wouldAttend}%`,
          `Would Not: ${recommendationData.wouldNot}%`
        ],
        datasets: [
          {
            data: [recommendationData.wouldAttend, recommendationData.wouldNot],
            backgroundColor: ["#4b84e6", "#e0534e"],
            borderColor: "#ffffff",
            borderWidth: 2
          }
        ]
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
  
  function renderTopEvents() {
    const container = document.getElementById("topEventsList");
  
    container.innerHTML = topEvents.map((event, index) => {
      const rank = index + 1;
      return `
        <div class="top-event-card">
          <div class="rank-badge rank-${rank}">${rank}</div>
  
          <div class="event-main">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
          </div>
  
          <div class="metric-box metric-rating">
            <div class="value"><i class="fa-solid fa-star"></i>${event.rating}</div>
            <div class="label">Rating</div>
          </div>
  
          <div class="metric-box metric-attendees">
            <div class="value"><i class="fa-solid fa-users"></i>${event.attendees}</div>
            <div class="label">Attendees</div>
          </div>
  
          <div class="metric-box metric-engagement">
            <div class="value"><i class="fa-solid fa-arrow-trend-up"></i>${event.engagement}%</div>
            <div class="label">Engagement</div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    fillSummary();
    renderEngagementChart();
    renderComparisonChart();
    renderRecommendationChart();
    renderTopEvents();
  });