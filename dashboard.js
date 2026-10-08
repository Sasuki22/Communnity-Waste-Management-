/**
 * Community Waste Management - Dashboard & Schedule Interactions
 * Pickup requests and issue reports are saved to MySQL (phpMyAdmin)
 * Schedule data is fetched from Python Flask API on http://127.0.0.1:5000/api
 */
const API_BASE = "http://127.0.0.1:5000/api";
const PHP_API = "api_pickup.php";

const DEFAULT_SCHEDULES = [
    { id: 1, waste_type: "General Waste", icon: "🗑️", day_of_week: "Monday", time_slot: "07:00 AM - 10:00 AM", zone: "All Zones", frequency: "Weekly", description: "Non-recyclable household waste." },
    { id: 2, waste_type: "Recyclable Waste", icon: "♻️", day_of_week: "Wednesday", time_slot: "08:00 AM - 12:00 PM", zone: "All Zones", frequency: "Weekly", description: "Clean paper, plastics, glass, metal cans." },
    { id: 3, waste_type: "Organic Waste", icon: "🌿", day_of_week: "Friday", time_slot: "07:00 AM - 10:00 AM", zone: "All Zones", frequency: "Weekly", description: "Food scraps, leaves, and garden trimmings." },
    { id: 4, waste_type: "Hazardous Waste", icon: "⚠️", day_of_week: "Saturday", time_slot: "09:00 AM - 01:00 PM", zone: "All Zones", frequency: "Bi-Weekly", description: "Batteries, bulbs, electronics, and chemicals." }
];

let activeZone = "All Zones";

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initApiStatus();
    loadUpcomingSchedule();
    setupEventListeners();
    const dateInput = document.getElementById("pDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
});

async function initApiStatus() {
    const statusEl = document.getElementById("apiStatus");
    if (!statusEl) return;
    try {
        const res = await fetch(`${API_BASE}/health`, { method: "GET", cache: "no-store" });
        if (res.ok) {
            statusEl.textContent = "● Live Schedule API";
            statusEl.classList.remove("offline");
        } else {
            throw new Error();
        }
    } catch (e) {
        statusEl.textContent = "○ Standby API";
        statusEl.classList.add("offline");
    }
}

async function loadUpcomingSchedule() {
    const container = document.getElementById("upcomingScheduleList");
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/schedules/upcoming`);
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            renderUpcomingList(json.data, container);
            return;
        }
    } catch (e) {}
    renderUpcomingList(DEFAULT_SCHEDULES, container);
}

function renderUpcomingList(items, container) {
    container.innerHTML = items.map(item => `
        <div class="schedule-row clickable" data-id="${item.id}">
            <span>${item.icon || "🗑️"} ${escapeHtml(item.waste_type)}</span>
            <span class="badge">${escapeHtml(item.day_of_week)}</span>
        </div>
    `).join("");

    container.querySelectorAll(".schedule-row").forEach(row => {
        row.addEventListener("click", () => openScheduleModal(activeZone));
    });
}

async function loadZoneSchedules(zone = "All Zones") {
    activeZone = zone;
    const grid = document.getElementById("scheduleGrid");
    if (!grid) return;
    grid.innerHTML = `<div style="padding:15px; color:#667;">Loading schedules...</div>`;

    try {
        const url = zone && zone !== "All Zones"
            ? `${API_BASE}/schedules?zone=${encodeURIComponent(zone)}`
            : `${API_BASE}/schedules`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
            renderScheduleCards(json.data, grid);
            return;
        }
    } catch (e) {}

    const filtered = zone === "All Zones"
        ? DEFAULT_SCHEDULES
        : DEFAULT_SCHEDULES.filter(s => s.zone === zone || s.zone === "All Zones");
    renderScheduleCards(filtered, grid);
}

function renderScheduleCards(items, container) {
    if (!items || items.length === 0) {
        container.innerHTML = `<div style="padding:15px; color:#778;">No collection schedules found for this zone.</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="sched-card">
            <div class="sched-card-top">
                <span class="sched-title">${item.icon || "🗑️"} ${escapeHtml(item.waste_type)}</span>
                <span class="badge">${escapeHtml(item.day_of_week)}</span>
            </div>
            <div class="sched-timing">
                <span>⏰ ${escapeHtml(item.time_slot || "Regular morning collection")}</span>
                <span>•</span>
                <span>📍 ${escapeHtml(item.zone || "All Zones")}</span>
                <span>•</span>
                <span>🔄 ${escapeHtml(item.frequency || "Weekly")}</span>
            </div>
            ${item.description ? `<div class="sched-desc">${escapeHtml(item.description)}</div>` : ""}
        </div>
    `).join("");
}

function openScheduleModal(zone = "All Zones") {
    closeAllModals();
    const modal = document.getElementById("scheduleModal");
    if (!modal) return;
    document.querySelectorAll(".zone-pills .pill").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.zone === zone);
    });
    loadZoneSchedules(zone);
    if (!modal.open) modal.showModal();
}

function openPickupModal(wasteType = "") {
    closeAllModals();
    const modal = document.getElementById("pickupModal");
    if (!modal) return;
    const select = document.getElementById("pType");
    if (select && wasteType) select.value = wasteType;
    const msg = document.getElementById("pMsg");
    if (msg) msg.hidden = true;
    if (!modal.open) modal.showModal();
}

function openGuideModal() {
    closeAllModals();
    const modal = document.getElementById("guideModal");
    if (modal && !modal.open) modal.showModal();
}

function openIssueModal() {
    closeAllModals();
    const modal = document.getElementById("issueModal");
    if (!modal) return;
    const msg = document.getElementById("iMsg");
    if (msg) msg.hidden = true;
    if (!modal.open) modal.showModal();
}

function openCommunityModal() {
    closeAllModals();
    const modal = document.getElementById("communityModal");
    if (modal && !modal.open) modal.showModal();
}

function openProfileModal() {
    closeAllModals();
    const modal = document.getElementById("profileModal");
    if (modal && !modal.open) modal.showModal();
}

function closeAllModals() {
    document.querySelectorAll("dialog.modal").forEach(dialog => {
        if (dialog.open) dialog.close();
    });
}

function setupEventListeners() {
    // Global delegated click handler for all interactive elements
    document.addEventListener("click", (e) => {
        const schedTrigger = e.target.closest("[data-open-schedule]");
        if (schedTrigger) {
            e.preventDefault();
            openScheduleModal(activeZone);
            return;
        }

        const pickupTrigger = e.target.closest("[data-open-pickup]");
        if (pickupTrigger) {
            e.preventDefault();
            openPickupModal();
            return;
        }

        const guideTrigger = e.target.closest("[data-open-guide]");
        if (guideTrigger) {
            e.preventDefault();
            openGuideModal();
            return;
        }

        const issueTrigger = e.target.closest("[data-open-issue]");
        if (issueTrigger) {
            e.preventDefault();
            openIssueModal();
            return;
        }

        const commTrigger = e.target.closest("[data-open-community]");
        if (commTrigger) {
            e.preventDefault();
            openCommunityModal();
            return;
        }

        const profTrigger = e.target.closest("[data-open-profile]");
        if (profTrigger) {
            e.preventDefault();
            openProfileModal();
            return;
        }

        const closeBtn = e.target.closest("[data-close-modal]");
        if (closeBtn) {
            e.preventDefault();
            const modal = closeBtn.closest("dialog");
            if (modal && modal.open) modal.close();
            return;
        }

        if (e.target.tagName === "DIALOG" && e.target.open) {
            e.target.close();
            return;
        }

        const pill = e.target.closest(".zone-pills .pill");
        if (pill) {
            e.preventDefault();
            document.querySelectorAll(".zone-pills .pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            loadZoneSchedules(pill.dataset.zone);
            return;
        }
    });

    // Keyboard navigation (Enter / Space)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            const target = document.activeElement;
            if (!target) return;
            if (target.hasAttribute("data-open-schedule")) { e.preventDefault(); openScheduleModal(activeZone); }
            else if (target.hasAttribute("data-open-pickup")) { e.preventDefault(); openPickupModal(); }
            else if (target.hasAttribute("data-open-guide")) { e.preventDefault(); openGuideModal(); }
            else if (target.hasAttribute("data-open-issue")) { e.preventDefault(); openIssueModal(); }
            else if (target.hasAttribute("data-open-community")) { e.preventDefault(); openCommunityModal(); }
            else if (target.hasAttribute("data-open-profile")) { e.preventDefault(); openProfileModal(); }
        }
    });

    // Handle Forms
    const pickupForm = document.getElementById("pickupForm");
    if (pickupForm) pickupForm.addEventListener("submit", handlePickupSubmit);

    const issueForm = document.getElementById("issueForm");
    if (issueForm) issueForm.addEventListener("submit", handleIssueSubmit);
}

async function handlePickupSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById("pMsg");
    const btn = document.getElementById("pSubmitBtn");

    const payload = {
        action: "pickup",
        user_name: form.user_name.value.trim(),
        address: form.address.value.trim(),
        waste_type: form.waste_type.value,
        preferred_date: form.preferred_date.value,
        notes: form.notes.value.trim()
    };

    if (btn) btn.disabled = true;
    if (msg) {
        msg.hidden = false;
        msg.className = "form-feedback";
        msg.textContent = "Submitting your pickup request...";
    }

    try {
        const res = await fetch(PHP_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            msg.className = "form-feedback success";
            msg.textContent = `\u2705 Request submitted! Reference ID: #${json.request_id || "CW-101"}. Our team will collect on ${payload.preferred_date}.`;
            form.reset();
            setTimeout(() => {
                const modal = document.getElementById("pickupModal");
                if (modal && modal.open) modal.close();
            }, 2500);
        } else {
            msg.className = "form-feedback error";
            msg.textContent = `\u274C ${json.message || "Could not process request."}`;
        }
    } catch (err) {
        if (msg) {
            msg.className = "form-feedback error";
            msg.textContent = "\u274C Could not connect to server. Please make sure Apache is running.";
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleIssueSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById("iMsg");
    const btn = document.getElementById("iSubmitBtn");

    const payload = {
        action: "issue",
        issue_type: form.issue_type.value,
        location: form.location.value.trim(),
        description: form.description.value.trim()
    };

    if (btn) btn.disabled = true;
    if (msg) {
        msg.hidden = false;
        msg.className = "form-feedback";
        msg.textContent = "Submitting your report...";
    }

    try {
        const res = await fetch(PHP_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            msg.className = "form-feedback success";
            msg.textContent = `\u2705 Report #${json.report_id} submitted! Your "${payload.issue_type}" report at ${payload.location} has been forwarded to the sanitation department.`;
            form.reset();
            setTimeout(() => {
                const modal = document.getElementById("issueModal");
                if (modal && modal.open) modal.close();
                if (btn) btn.disabled = false;
            }, 2800);
        } else {
            msg.className = "form-feedback error";
            msg.textContent = `\u274C ${json.message || "Could not submit report."}`;
            if (btn) btn.disabled = false;
        }
    } catch (err) {
        if (msg) {
            msg.className = "form-feedback error";
            msg.textContent = "\u274C Could not connect to server. Please make sure Apache is running.";
        }
        if (btn) btn.disabled = false;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
}

/* ========== Dark / Light Theme Toggle ========== */
function initThemeToggle() {
    const saved = localStorage.getItem("cwm-theme");
    if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
    }

    const toggle = document.getElementById("themeToggle");
    if (toggle) {
        updateToggleIcon(toggle);
        toggle.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            const next = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("cwm-theme", next);
            updateToggleIcon(toggle);
        });
    }
}

function updateToggleIcon(btn) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = isDark
        ? '<span class="toggle-icon">&#9788;</span> <span class="toggle-label">Light</span>'
        : '<span class="toggle-icon">&#9790;</span> <span class="toggle-label">Dark</span>';
    btn.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
}

