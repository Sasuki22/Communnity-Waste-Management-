/* Modern admin dashboard interactions. */
(() => {
    'use strict';

     // SYNC DARK / LIGHT MODE
function initAdminTheme() {
    const savedTheme = localStorage.getItem("cwm-theme");

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme === "dark" ? "dark" : "light"
    );
}

    const API_URL = 'admin_api.php';
    const TAB_NAMES = ['dashboard', 'users', 'pickups', 'reports', 'schedules', 'announcements'];
    const PICKUP_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const ISSUE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
    let scheduleCache = [];
    let editingScheduleId = null;

    document.addEventListener('DOMContentLoaded', () => {
        initAdminTheme();
        initNavigation();
        loadSummary();
        loadUsers();
        loadPickups();
        loadReports();
        loadSchedules();
        loadAnnouncements();
        initAnnouncements();
        initSchedules();
    });

    function initNavigation() {
        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                const tab = link.dataset.tab;
                if (TAB_NAMES.includes(tab)) switchTab(tab, true);
            });
        });

        window.addEventListener('hashchange', () => switchTab(getTabFromHash(), false));
        switchTab(getTabFromHash(), false);
    }

    function getTabFromHash() {
        const tab = window.location.hash.replace('#', '').toLowerCase();
        return TAB_NAMES.includes(tab) ? tab : 'dashboard';
    }

    function switchTab(tab, updateHash) {
        if (!TAB_NAMES.includes(tab)) tab = 'dashboard';

        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            const active = link.dataset.tab === tab;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        document.querySelectorAll('.tab-section').forEach(section => {
            section.classList.toggle('active', section.id === tab);
        });

        if (updateHash && window.location.hash !== `#${tab}`) {
            window.location.hash = tab;
        }

        const loaders = {
            dashboard: loadSummary,
            users: loadUsers,
            pickups: loadPickups,
            reports: loadReports,
            schedules: loadSchedules,
            announcements: loadAnnouncements
        };
        if (loaders[tab]) loaders[tab]();
    }

    async function request(action, options = {}) {
        const params = new URLSearchParams({ action });
        if (options.query) {
            Object.entries(options.query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.set(key, value);
                }
            });
        }

        const fetchOptions = {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            ...options
        };
        delete fetchOptions.query;

        const response = await fetch(`${API_URL}?${params.toString()}`, fetchOptions);
        let payload;
        try {
            payload = await response.json();
        } catch (error) {
            throw new Error(`The server returned an invalid response (${response.status}).`);
        }
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || `Request failed (${response.status}).`);
        }
        return payload.data;
    }

    async function loadSummary() {
        try {
            const data = await request('summary');
            setText('totalUsers', data.total_users ?? 0);
            setText('totalPickups', data.total_pickups ?? 0);
            setText('pendingRequests', data.pending_pickups ?? 0);
            setText('totalIssues', data.total_issues ?? 0);
        } catch (error) {
            ['totalUsers', 'totalPickups', 'pendingRequests', 'totalIssues']
                .forEach(id => setText(id, '—'));
            console.error('Unable to load admin summary:', error);
        }
    }

    async function loadUsers() {
        const bodies = [
            { element: document.getElementById('usersTableBody'), colspan: 4 },
            { element: document.getElementById('allUsersTableBody'), colspan: 6 }
        ].filter(item => item.element);
        if (bodies.length === 0) return;

        bodies.forEach(item => setLoading(item.element, item.colspan, 'Loading registered users...'));
        try {
            renderUsers(await request('users'));
        } catch (error) {
            bodies.forEach(item => setError(item.element, item.colspan, error.message, loadUsers));
            console.error('Unable to load users:', error);
        }
    }

    function renderUsers(users) {
        const previewBody = document.getElementById('usersTableBody');
        const fullBody = document.getElementById('allUsersTableBody');
        if (!Array.isArray(users) || users.length === 0) {
            if (previewBody) setEmpty(previewBody, 4, 'No registered users found.');
            if (fullBody) setEmpty(fullBody, 6, 'No registered users found.');
            return;
        }

        if (previewBody) renderUserRows(previewBody, users, true);
        if (fullBody) renderUserRows(fullBody, users, false);
    }

    function renderUserRows(tbody, users, compact) {
        tbody.innerHTML = users.map(user => {
            const role = user.role || 'user';
            const roleBadge = `<span class="badge ${role === 'admin' ? 'badge-admin' : 'badge-user'}">${escapeHtml(role)}</span>`;
            const commonCells = `
                <td>${escapeHtml(user.id)}</td>
                <td>${escapeHtml(user.full_name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${roleBadge}</td>
            `;
            const extraCells = compact ? '' : `
                <td>${escapeHtml(formatDate(user.created_at))}</td>
                <td><span class="table-note">Protected</span></td>
            `;
            return `<tr>${commonCells}${extraCells}</tr>`;
        }).join('');
    }

    async function loadPickups() {
        const tbody = document.getElementById('pickupsTableBody');
        if (!tbody) return;
        setLoading(tbody, 7, 'Loading pickup requests...');
        try {
            renderPickups(await request('pickups'));
        } catch (error) {
            setError(tbody, 7, error.message, loadPickups);
            console.error('Unable to load pickup requests:', error);
        }
    }

    function renderPickups(pickups) {
        const tbody = document.getElementById('pickupsTableBody');
        if (!tbody) return;
        if (!Array.isArray(pickups) || pickups.length === 0) {
            setEmpty(tbody, 7, 'No pickup requests found.');
            return;
        }
        tbody.innerHTML = pickups.map(pickup => `
            <tr>
                <td>${escapeHtml(pickup.id)}</td>
                <td>${escapeHtml(pickup.user_name)}</td>
                <td>${escapeHtml(pickup.waste_type)}</td>
                <td>${escapeHtml(pickup.address)}</td>
                <td>${escapeHtml(formatDate(pickup.preferred_date))}</td>
                <td>${renderStatusSelect('pickup', pickup.id, pickup.status, PICKUP_STATUSES)}</td>
                <td>${renderMessageControl('pickup', pickup)}</td>
            </tr>
        `).join('');
        bindStatusChanges(tbody, 'pickup');
        bindMessageActions(tbody, 'pickup');
    }

    async function loadReports() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;
        setLoading(tbody, 6, 'Loading waste reports...');
        try {
            renderReports(await request('issues'));
        } catch (error) {
            setError(tbody, 6, error.message, loadReports);
            console.error('Unable to load waste reports:', error);
        }
    }

    function renderReports(reports) {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;
        if (!Array.isArray(reports) || reports.length === 0) {
            setEmpty(tbody, 6, 'No waste reports found.');
            return;
        }
        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${escapeHtml(report.id)}</td>
                <td>${escapeHtml(report.issue_type)}</td>
                <td>${escapeHtml(report.location)}</td>
                <td>${escapeHtml(report.description || '—')}</td>
                <td>${renderStatusSelect('issue', report.id, report.status, ISSUE_STATUSES)}</td>
                <td>${renderMessageControl('issue', report)}</td>
            </tr>
        `).join('');
        bindStatusChanges(tbody, 'issue');
        bindMessageActions(tbody, 'issue');
    }

    function renderMessageControl(entity, item) {
        if (!Number(item.user_id)) return '<span class="table-note">No linked resident account</span>';
        return `<div class="admin-message-control" data-message-entity="${entity}" data-id="${escapeHtml(item.id)}">
            <textarea maxlength="1900" rows="2" aria-label="Message to resident for ${entity} ${escapeHtml(item.id)}" placeholder="Message to client"></textarea>
            <button type="button" class="btn-primary" data-send-message>Send update</button>
            <small role="status" aria-live="polite"></small>
        </div>`;
    }

    function bindMessageActions(tbody, entity) {
        tbody.querySelectorAll(`[data-message-entity="${entity}"]`).forEach(control => {
            control.querySelector('[data-send-message]').addEventListener('click', async () => {
                const row = control.closest('tr');
                const select = row.querySelector('.status-select');
                const textarea = control.querySelector('textarea');
                const button = control.querySelector('button');
                const feedback = control.querySelector('small');
                const message = textarea.value.trim();
                if (!message) {
                    feedback.textContent = 'Write a message before sending.';
                    return;
                }
                button.disabled = true;
                select.disabled = true;
                feedback.textContent = 'Sending...';
                try {
                    await request(entity === 'pickup' ? 'send_pickup_notification' : 'send_issue_notification', {
                        method: 'POST',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            [entity === 'pickup' ? 'pickup_id' : 'issue_id']: Number(control.dataset.id),
                            status: select.value,
                            message
                        })
                    });
                    select.dataset.previous = select.value;
                    textarea.value = '';
                    feedback.textContent = 'Update sent to resident.';
                    loadSummary();
                } catch (error) {
                    feedback.textContent = error.message;
                    console.error('Unable to send update:', error);
                } finally {
                    button.disabled = false;
                    select.disabled = false;
                }
            });
        });
    }

    async function loadSchedules() {
        const tbody = document.getElementById('schedulesTableBody');
        if (!tbody) return;
        setLoading(tbody, 7, 'Loading collection schedules...');
        try {
            renderSchedules(await request('schedules'));
        } catch (error) {
            setError(tbody, 7, error.message, loadSchedules);
            console.error('Unable to load schedules:', error);
        }
    }

    function initAnnouncements() {
        const form = document.getElementById('announcementForm');
        const showButton = document.getElementById('showAnnouncementForm');
        const cancelButton = document.getElementById('cancelAnnouncement');

        if (showButton && form) {
            showButton.addEventListener('click', () => {
                form.hidden = false;
                showButton.hidden = true;
                document.getElementById('announcementTitle')?.focus();
            });
        }

        if (cancelButton && form && showButton) {
            cancelButton.addEventListener('click', () => {
                form.reset();
                form.hidden = true;
                showButton.hidden = false;
            });
        }

        if (form) {
            form.addEventListener('submit', async event => {
                event.preventDefault();
                const submitButton = document.getElementById('publishAnnouncement');
                const title = document.getElementById('announcementTitle')?.value.trim();
                const message = document.getElementById('announcementMessage')?.value.trim();
                if (!title || !message) return;

                if (submitButton) submitButton.disabled = true;
                try {
                    await request('create_announcement', {
                        method: 'POST',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, message })
                    });
                    form.reset();
                    form.hidden = true;
                    if (showButton) showButton.hidden = false;
                    loadAnnouncements();
                } catch (error) {
                    window.alert(error.message);
                    console.error('Unable to publish announcement:', error);
                } finally {
                    if (submitButton) submitButton.disabled = false;
                }
            });
        }
    }

    async function loadAnnouncements() {
        const list = document.getElementById('announcementsList');
        if (!list) return;
        list.innerHTML = '<p class="loading-cell">Loading announcements...</p>';
        try {
            const announcements = await request('announcements');
            if (!announcements.length) {
                list.innerHTML = '<p class="loading-cell">No announcements have been published.</p>';
                return;
            }
            list.innerHTML = announcements.map(announcement => `
                <article class="announcement-card">
                    <div class="announcement-header">
                        <h4>${escapeHtml(announcement.title)}</h4>
                        <span class="announcement-date">${formatDate(announcement.created_at)}</span>
                    </div>
                    <p>${escapeHtml(announcement.message).replace(/\n/g, '<br>')}</p>
                    <button type="button" class="announcement-delete" data-announcement-id="${escapeHtml(announcement.id)}">Delete</button>
                </article>
            `).join('');
            list.querySelectorAll('[data-announcement-id]').forEach(button => {
                button.addEventListener('click', () => deleteAnnouncement(button.dataset.announcementId));
            });
        } catch (error) {
            list.innerHTML = `<p class="loading-cell error-cell">${escapeHtml(error.message)} <button type="button" class="inline-retry" data-retry>Retry</button></p>`;
            list.querySelector('[data-retry]')?.addEventListener('click', loadAnnouncements);
            console.error('Unable to load announcements:', error);
        }
    }

    async function deleteAnnouncement(id) {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await request('delete_announcement', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Number(id) })
            });
            loadAnnouncements();
        } catch (error) {
            window.alert(error.message);
            console.error('Unable to delete announcement:', error);
        }
    }


    function initSchedules() {
        const form = document.getElementById('scheduleForm');
        const addButton = document.getElementById('showScheduleForm');
        const cancelButton = document.getElementById('cancelScheduleForm');
        if (!form) return;

        addButton?.addEventListener('click', () => openScheduleForm(null));
        cancelButton?.addEventListener('click', closeScheduleForm);

        form.addEventListener('submit', async event => {
            event.preventDefault();
            const saveButton = document.getElementById('saveScheduleButton');
            const message = document.getElementById('scheduleFormMessage');
            const payload = {
                waste_type: document.getElementById('scheduleWasteType').value.trim(),
                icon: document.getElementById('scheduleIcon').value,
                day_of_week: document.getElementById('scheduleDay').value.trim(),
                time_slot: document.getElementById('scheduleTime').value.trim(),
                zone: document.getElementById('scheduleZone').value,
                frequency: document.getElementById('scheduleFrequency').value,
                description: document.getElementById('scheduleDescription').value.trim(),
                is_upcoming: document.getElementById('scheduleUpcoming').checked
            };

            if (!payload.waste_type || !payload.day_of_week || !payload.time_slot) {
                showScheduleMessage('Please complete the waste type, day, and time fields.', true);
                return;
            }

            const wasEditing = editingScheduleId !== null;
            if (saveButton) saveButton.disabled = true;
            if (message) message.hidden = true;
            try {
                await request(wasEditing ? 'update_schedule' : 'create_schedule', {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingScheduleId ? { ...payload, id: editingScheduleId } : payload)
                });
                closeScheduleForm();
                await loadSchedules();
                window.alert(wasEditing ? 'Schedule updated successfully.' : 'Schedule added successfully.');
            } catch (error) {
                showScheduleMessage(error.message, true);
                console.error('Unable to save schedule:', error);
            } finally {
                if (saveButton) saveButton.disabled = false;
            }
        });
    }

    function openScheduleForm(schedule) {
        const form = document.getElementById('scheduleForm');
        const addButton = document.getElementById('showScheduleForm');
        const title = document.getElementById('scheduleFormTitle');
        const saveButton = document.getElementById('saveScheduleButton');
        if (!form) return;

        editingScheduleId = schedule ? Number(schedule.id) : null;
        form.reset();
        document.getElementById('scheduleId').value = schedule?.id ?? '';
        document.getElementById('scheduleWasteType').value = schedule?.waste_type ?? '';
        document.getElementById('scheduleIcon').value = schedule?.icon ?? '🗑️';
        document.getElementById('scheduleDay').value = schedule?.day_of_week ?? '';
        document.getElementById('scheduleTime').value = schedule?.time_slot ?? '';
        document.getElementById('scheduleZone').value = schedule?.zone ?? 'All Zones';
        document.getElementById('scheduleFrequency').value = schedule?.frequency ?? 'Weekly';
        document.getElementById('scheduleDescription').value = schedule?.description ?? '';
        document.getElementById('scheduleUpcoming').checked = schedule ? Number(schedule.is_upcoming) === 1 : true;
        if (title) title.textContent = schedule ? `Edit Schedule #${schedule.id}` : 'Add Collection Schedule';
        if (saveButton) saveButton.textContent = schedule ? 'Save Changes' : 'Save Schedule';
        form.hidden = false;
        if (addButton) addButton.hidden = true;
        showScheduleMessage('', false);
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        document.getElementById('scheduleWasteType')?.focus({ preventScroll: true });
    }

    function closeScheduleForm() {
        const form = document.getElementById('scheduleForm');
        const addButton = document.getElementById('showScheduleForm');
        if (form) {
            form.reset();
            form.hidden = true;
        }
        if (addButton) addButton.hidden = false;
        editingScheduleId = null;
        showScheduleMessage('', false);
    }

    function showScheduleMessage(text, isError) {
        const message = document.getElementById('scheduleFormMessage');
        if (!message) return;
        message.textContent = text;
        message.classList.toggle('error-cell', Boolean(isError));
        message.hidden = !text;
    }

    function renderSchedules(schedules) {
        const tbody = document.getElementById('schedulesTableBody');
        if (!tbody) return;
        scheduleCache = Array.isArray(schedules) ? schedules : [];
        if (scheduleCache.length === 0) {
            setEmpty(tbody, 7, 'No collection schedules found. Add one to get started.');
            return;
        }
        tbody.innerHTML = scheduleCache.map(schedule => `
            <tr>
                <td>${escapeHtml(schedule.icon || '🗑️')} ${escapeHtml(schedule.waste_type)}</td>
                <td>${escapeHtml(schedule.day_of_week)}</td>
                <td>${escapeHtml(schedule.time_slot)}</td>
                <td>${escapeHtml(schedule.zone)}</td>
                <td>${escapeHtml(schedule.frequency || 'Weekly')}</td>
                <td><span class="schedule-state-badge ${Number(schedule.is_upcoming) === 1 ? 'is-upcoming' : ''}">${Number(schedule.is_upcoming) === 1 ? 'Upcoming' : 'View Full only'}</span></td>
                <td class="schedule-actions">
                    <button type="button" class="schedule-action-edit" data-schedule-edit="${escapeHtml(schedule.id)}">Edit</button>
                    <button type="button" class="schedule-action-delete" data-schedule-delete="${escapeHtml(schedule.id)}">Delete</button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-schedule-edit]').forEach(button => {
            button.addEventListener('click', () => {
                const schedule = scheduleCache.find(item => Number(item.id) === Number(button.dataset.scheduleEdit));
                if (schedule) openScheduleForm(schedule);
            });
        });
        tbody.querySelectorAll('[data-schedule-delete]').forEach(button => {
            button.addEventListener('click', () => deleteSchedule(Number(button.dataset.scheduleDelete)));
        });
    }

    async function deleteSchedule(id) {
        const schedule = scheduleCache.find(item => Number(item.id) === id);
        if (!schedule || !window.confirm(`Delete "${schedule.waste_type}" for ${schedule.zone}?`)) return;
        try {
            await request('delete_schedule', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            await loadSchedules();
            window.alert('Schedule deleted successfully.');
        } catch (error) {
            window.alert(error.message);
            console.error('Unable to delete schedule:', error);
        }
    }

    function renderStatusSelect(entity, id, currentStatus, statuses) {
        const options = statuses.map(status => `
            <option value="${escapeHtml(status)}"${status === currentStatus ? ' selected' : ''}>${escapeHtml(status)}</option>
        `).join('');
        return `<select class="status-select" data-entity="${entity}" data-id="${escapeHtml(id)}" data-previous="${escapeHtml(currentStatus)}">${options}</select>`;
    }

    function bindStatusChanges(tbody, entity) {
        tbody.querySelectorAll(`.status-select[data-entity="${entity}"]`).forEach(select => {
            select.addEventListener('change', async () => {
                // Linked records save the selected status together with the message.
                if (select.closest('tr').querySelector('[data-message-entity]')) return;
                const previousValue = select.dataset.previous || select.value;
                select.disabled = true;
                try {
                    await request(entity === 'pickup' ? 'update_pickup_status' : 'update_issue_status', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: Number(select.dataset.id), status: select.value })
                    });
                    select.dataset.previous = select.value;
                    loadSummary();
                } catch (error) {
                    select.value = previousValue;
                    window.alert(error.message);
                    console.error('Unable to update status:', error);
                } finally {
                    select.disabled = false;
                }
            });
        });
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    }

    function setLoading(tbody, colspan, message) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-cell">${escapeHtml(message)}</td></tr>`;
    }

    function setEmpty(tbody, colspan, message) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-cell">${escapeHtml(message)}</td></tr>`;
    }

    function setError(tbody, colspan, message, retryHandler) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-cell error-cell">${escapeHtml(message)} <button type="button" class="inline-retry" data-retry>Retry</button></td></tr>`;
        const retry = tbody.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', retryHandler);
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]);
    }

    window.loadSummary = loadSummary;
    window.loadUsers = loadUsers;
    window.loadAllUsers = loadUsers;
    window.loadPickups = loadPickups;
    window.loadReports = loadReports;
    window.loadSchedules = loadSchedules;
    window.loadAnnouncements = loadAnnouncements;
})();

/* Load Admin Profile Picture */

async function loadAdminProfilePicture() {
    const avatar = document.getElementById("adminProfileImage");

    if (!avatar) return;

    try {
        const response = await fetch("profile_api.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load profile.");
        }

        avatar.src =
            data.user?.profile_picture ||
            "images/user-solid-full.svg";

    } catch (error) {
        console.error("Admin profile picture error:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAdminProfilePicture);
} else {
    loadAdminProfilePicture();
}