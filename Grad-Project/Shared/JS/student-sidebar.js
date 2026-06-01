document.addEventListener("DOMContentLoaded", async () => {
    const sidebarContainer = document.getElementById("student-sidebar");
    if (!sidebarContainer) return;
  
    try {
      const response = await fetch("../../Shared/HTML/student-sidebar.html");
      const html = await response.text();
      sidebarContainer.innerHTML = html;
  
      const currentPage = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");
  
      const navItems = sidebarContainer.querySelectorAll(".nav-item[data-page]");

      navItems.forEach((item) => {
        if (item.dataset.page === currentPage) {
          item.classList.add("active");
        }
      });

      // Clickable logo → concept modal
      const brand = sidebarContainer.querySelector(".brand");
      if (brand) {
        brand.style.cursor = "pointer";
        brand.title = "About IAU'ers";
        brand.addEventListener("click", () => {
          if (document.getElementById("iauersConceptModal")) return;

          document.body.insertAdjacentHTML("beforeend", `
            <div id="iauersConceptModal" style="
              position:fixed;inset:0;background:rgba(3,6,20,0.9);
              backdrop-filter:blur(10px);z-index:9999;
              display:flex;align-items:center;justify-content:center;
              padding:20px;font-family:'Inter',sans-serif;">
              <div style="
                background:linear-gradient(155deg,#080f28 0%,#0d1a3e 55%,#080f28 100%);
                border:1px solid rgba(0,229,255,0.14);border-radius:28px;
                padding:36px 32px 28px;max-width:500px;width:100%;position:relative;
                box-shadow:0 40px 100px rgba(0,0,0,0.7);max-height:92vh;overflow-y:auto;">
                <button id="closeConceptModal" style="
                  position:absolute;top:16px;right:16px;width:34px;height:34px;
                  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);
                  color:rgba(255,255,255,0.6);border-radius:50%;font-size:15px;cursor:pointer;
                  display:flex;align-items:center;justify-content:center;">✕</button>
                <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;">
                  <div style="width:54px;height:54px;border-radius:50%;flex-shrink:0;border:1px solid rgba(0,229,255,0.3);display:flex;align-items:center;justify-content:center;position:relative;">
                    <div style="position:absolute;width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,229,255,0.2);"></div>
                    <div style="position:absolute;width:20px;height:20px;border-radius:50%;border:1px solid rgba(0,229,255,0.4);"></div>
                    <span style="font-family:'DM Serif Display',serif;font-size:14px;color:#fff;font-style:italic;position:relative;z-index:1;">i</span>
                  </div>
                  <div>
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;line-height:1;letter-spacing:1px;">
                      <span style="color:#fff;">IAU</span><span style="color:#fff;opacity:0.6;">'</span><span style="color:#00E5FF;opacity:0.85;">ers</span>
                    </div>
                    <div style="font-size:10px;color:rgba(0,229,255,0.4);letter-spacing:3px;text-transform:uppercase;margin-top:3px;">Platform Concept</div>
                  </div>
                </div>
                <div style="height:1px;background:linear-gradient(90deg,rgba(0,229,255,0.25),rgba(139,92,246,0.2),transparent);margin-bottom:20px;"></div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px;">
                  <div style="background:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.14);border-radius:14px;padding:14px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">🎓</div><div style="font-size:11px;font-weight:700;color:#00E5FF;">Students</div></div>
                  <div style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.16);border-radius:14px;padding:14px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">⚙️</div><div style="font-size:11px;font-weight:700;color:#a78bfa;">Admins</div></div>
                  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">🏛️</div><div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);">University</div></div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;text-align:left;">
                  <div style="border-left:2.5px solid rgba(0,229,255,0.5);border-radius:0 12px 12px 0;background:rgba(0,229,255,0.04);padding:13px 16px;">
                    <div style="font-size:10px;font-weight:800;color:#00E5FF;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Centralized Ecosystem</div>
                    <p style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.75;margin:0;">IAU'ers is a centralized platform built to connect university user groups. Each of the three rings primarily represents one of the three main user groups and those under them, all interacting within one unified ecosystem.</p>
                  </div>
                  <div style="border-left:2.5px solid rgba(139,92,246,0.6);border-radius:0 12px 12px 0;background:rgba(139,92,246,0.05);padding:13px 16px;">
                    <div style="font-size:10px;font-weight:800;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">The Center "i"</div>
                    <p style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.75;margin:0;">The <strong style="color:#00E5FF;">"i"</strong> at the center represents <em style="color:#fff;">Information</em> and the <em style="color:#fff;">IAU'ers identity</em>, reflecting the knowledge that connects everyone on the platform.</p>
                  </div>
                  <div style="border-left:2.5px solid rgba(255,255,255,0.2);border-radius:0 12px 12px 0;background:rgba(255,255,255,0.03);padding:13px 16px;">
                    <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Continuous Flow</div>
                    <p style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.75;margin:0;">The circular motion reflects the <strong style="color:#fff;">continuous flow</strong> of university services, delivered seamlessly through one connected platform.</p>
                  </div>
                </div>
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.12),transparent);margin-bottom:14px;"></div>
                <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.22);margin:0;">IAU · College of Business Administration · 2026</p>
              </div>
            </div>
          `);

          document.getElementById("closeConceptModal").addEventListener("click", () => {
            document.getElementById("iauersConceptModal").remove();
          });
          document.getElementById("iauersConceptModal").addEventListener("click", (e) => {
            if (e.target === e.currentTarget) e.currentTarget.remove();
          });
        });
      }

    } catch (error) {
      console.error("Error loading student sidebar:", error);
    }
  });