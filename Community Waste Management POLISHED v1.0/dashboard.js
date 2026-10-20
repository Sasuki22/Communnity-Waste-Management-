/**
 * Community Waste Management - Dashboard & Schedule Interactions
 * Pickup requests, issue reports, announcements, and schedules use PHP/MySQL.
 * Admin and resident schedule views share community_db.schedules.
 */
const PHP_API = "api_pickup.php";
const DASHBOARD_API = "dashboard_api.php";

let activeZone = "All Zones";

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    loadUpcomingSchedule();
    loadAnnouncements();
    setupEventListeners();

    const dateInput = document.getElementById("pDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) profileBtn.addEventListener("click", openProfileModal);
});

async function fetchDashboardSchedules(query = {}) {
    const params = new URLSearchParams({ action: "schedules", ...query });
    const response = await fetch(`${DASHBOARD_API}?${params.toString()}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
    });

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        throw new Error(`The server returned an invalid schedule response (${response.status}).`);
    }

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to load collection schedules.");
    }
    return Array.isArray(payload.data) ? payload.data : [];
}

async function loadUpcomingSchedule() {
    const container = document.getElementById("upcomingScheduleList");
    if (!container) return;
    container.setAttribute("aria-busy", "true");
    try {
        const schedules = await fetchDashboardSchedules({ upcoming: "1" });
        renderUpcomingList(schedules, container);
    } catch (error) {
        container.innerHTML = `
            <div class="schedule-load-error">
                <span>Unable to load collection schedules.</span>
                <button type="button" class="schedule-retry">Retry</button>
            </div>`;
        container.querySelector(".schedule-retry")?.addEventListener("click", loadUpcomingSchedule);
        console.error("Unable to load upcoming schedules:", error);
    } finally {
        container.removeAttribute("aria-busy");
    }
}

async function loadAnnouncements() {
    const list = document.getElementById("announcementsList");
    if (!list) return;

    list.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(`${DASHBOARD_API}?action=announcements`, {
            credentials: "same-origin",
            headers: { Accept: "application/json" }
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
            throw new Error(payload.message || "Unable to load announcements.");
        }

        renderAnnouncements(payload.data || [], list);
    } catch (error) {
        list.innerHTML = `
            <p class="announcements-state error">
                Unable to load announcements.
                <button type="button" class="announcement-retry">Retry</button>
            </p>`;
        list.querySelector(".announcement-retry")?.addEventListener("click", loadAnnouncements);
        console.error("Unable to load announcements:", error);
    } finally {
        list.removeAttribute("aria-busy");
    }
}

function renderAnnouncements(announcements, list) {
    if (!announcements.length) {
        list.innerHTML = '<p class="announcements-state">No community announcements yet. Please check back soon.</p>';
        return;
    }

    list.innerHTML = announcements.map(announcement => {
        const title = escapeHtml(announcement.title || "Community update");
        const message = announcement.message
            ? `<p>${escapeHtml(announcement.message)}</p>`
            : "";
        const date = formatAnnouncementDate(announcement.created_at);

        return `
            <article class="announcement-item">
                <span class="announcement-icon" aria-hidden="true">📢</span>
                <div class="announcement-copy">
                    <h4>${title}</h4>
                    ${message}
                    ${date ? `<time class="announcement-date">${escapeHtml(date)}</time>` : ""}
                </div>
            </article>`;
    }).join("");
}

function formatAnnouncementDate(value) {
    if (!value) return "";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function renderUpcomingList(items, container) {
    if (!items.length) {
        container.innerHTML = '<div class="schedule-load-error">No upcoming collection schedules have been marked by the administrator.</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="schedule-row clickable" data-id="${escapeHtml(item.id)}">
            <span>${escapeHtml(item.icon || "🗑️")} ${escapeHtml(item.waste_type)}</span>
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
        const schedules = await fetchDashboardSchedules({ zone });
        renderScheduleCards(schedules, grid);
    } catch (error) {
        grid.innerHTML = `
            <div class="schedule-load-error">
                <span>Unable to load schedules: ${escapeHtml(error.message)}</span>
                <button type="button" class="schedule-retry">Retry</button>
            </div>`;
        grid.querySelector(".schedule-retry")?.addEventListener("click", () => loadZoneSchedules(zone));
        console.error("Unable to load schedules for zone:", error);
    }
}

function renderScheduleCards(items, container) {
    if (!items || items.length === 0) {
        container.innerHTML = `<div style="padding:15px; color:#778;">No collection schedules found for this zone.</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="sched-card">
            <div class="sched-card-top">
                <span class="sched-title">${escapeHtml(item.icon || "🗑️")} ${escapeHtml(item.waste_type)}</span>
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
    loadProfile();
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
    // PROFILE FORM
const profileForm = document.getElementById("profileEditForm");

if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
}

// PROFILE PICTURE
const profilePictureInput =
    document.getElementById("profilePictureInput");

if (profilePictureInput) {
    profilePictureInput.addEventListener(
        "change",
        handleProfilePicturePreview
    );
}
}

/* =====================================
   PROFILE PICTURE PREVIEW
===================================== */

let profilePreviewUrl = null;

function handleProfilePicturePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("profileImagePreview");
    const message = document.getElementById("profileMsg");

    if (!file || !preview) {
        console.error("Profile image input or preview is missing.");
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
        showProfileMessage(
            "Please select a JPG, PNG, or WebP image.",
            "error"
        );
        event.target.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showProfileMessage(
            "Profile picture must be 2MB or smaller.",
            "error"
        );
        event.target.value = "";
        return;
    }

    if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
    }

    profilePreviewUrl = URL.createObjectURL(file);
    preview.onerror = null;
    preview.src = profilePreviewUrl;
    console.log("Profile preview loaded:", file.name);

    if (message) message.hidden = true;
}

/* =====================================
   PROFILE FEEDBACK
===================================== */

function showProfileMessage(text, type) {
    const message = document.getElementById("profileMsg");

    if (!message) return;

    message.hidden = false;
    message.className = `form-feedback ${type}`;
    message.textContent = text;
}

/* =====================================
   PROFILE FORM SUBMISSION
===================================== */

async function loadProfile() {
    try {
        const response = await fetch("profile_api.php", { credentials: "same-origin", cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load profile.");
        const user = data.user;
        document.getElementById("profileName").value = user.full_name || "";
        document.getElementById("profileEmail").value = user.email || "";
        document.getElementById("profilePhone").value = user.phone || "";
        document.getElementById("profileAddress").value = user.address || "";
        document.getElementById("profileDisplayName").textContent = user.full_name || "User";
        if (profilePreviewUrl) { URL.revokeObjectURL(profilePreviewUrl); profilePreviewUrl = null; }
        document.getElementById("profilePictureInput").value = "";
        document.getElementById("profileImagePreview").src = user.profile_picture || "images/default-avatar.png";
        const msg = document.getElementById("profileMsg");
        if (msg) msg.hidden = true;
    } catch (error) {
        showProfileMessage(error.message || "Unable to load profile.", "error");
    }
}

async function handleProfileSubmit(event) {
    event.preventDefault();
    const button = document.getElementById("profileSaveBtn");
    if (button) button.disabled = true;
    try {
        const response = await fetch("profile_api.php", {
            method: "POST",
            credentials: "same-origin",
            body: new FormData(event.currentTarget),
            headers: { Accept: "application/json" }
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to save profile.");
        showProfileMessage("Profile saved successfully!", "success");
        document.getElementById("profileDisplayName").textContent = data.user.full_name;
        const topbarName = document.querySelector("#profileBtn strong");
        if (topbarName) topbarName.textContent = data.user.full_name;
        if (profilePreviewUrl) { URL.revokeObjectURL(profilePreviewUrl); profilePreviewUrl = null; }
        document.getElementById("profileImagePreview").src = data.user.profile_picture || "images/default-avatar.png";
        document.getElementById("profilePictureInput").value = "";
    } catch (error) {
        showProfileMessage(error.message || "Unable to save profile.", "error");
    } finally {
        if (button) button.disabled = false;
    }
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

// Logout Modal
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logoutBtn');
        const modal = document.getElementById('logoutModal');
        const cancelBtn = document.getElementById('cancelLogout');

        if (!logoutBtn || !modal || !cancelBtn) return;

        function openModal() {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            cancelBtn.focus();
        }

        function closeModal() {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            logoutBtn.focus();
        }

        logoutBtn.addEventListener('click', event => {
            event.preventDefault();
            openModal();
        });

        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    });