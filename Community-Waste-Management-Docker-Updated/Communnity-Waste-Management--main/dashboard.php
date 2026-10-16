<?php
session_start();
if (!isset($_SESSION['user_id'])) { header('Location: index.php'); exit; }
$name = htmlspecialchars($_SESSION['user_name'] ?? 'User', ENT_QUOTES, 'UTF-8');
$role = $_SESSION['user_role'] ?? 'user';
$isAdmin = ($role === 'admin');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard | Community Waste Management</title>
<link rel="stylesheet" href="dashboard.css?v=20261016">
</head>
<body>

<div class="main">
    <header class="topbar">
        <div class="topbar-left">
            <button type="button" class="profile-info" id="profileBtn" aria-haspopup="dialog" aria-controls="profileModal">
                👤 <strong><?= $name ?></strong>
                <?php if ($isAdmin): ?>
                    <span class="admin-badge">Admin</span>
                <?php endif; ?>
            </button>
        </div>
        <strong class="topbar-center">♻️ Community Waste Management</strong>
        <div class="topbar-right">
            <?php if ($isAdmin): ?>
                <button type="button" class="admin-btn" onclick="window.location.href='admin_modern.php'">
                    ⚙️ Admin Dashboard
                </button>
            <?php endif; ?>
            <button type="button" class="theme-toggle" id="themeToggle" title="Toggle Theme">
                <span class="toggle-icon">&#9790;</span> <span class="toggle-label">Dark</span>
            </button>
            <a class="topbar-logout" href="logout.php" aria-label="Log out of your account">
                <span aria-hidden="true">⇥</span>
                <span>Logout</span>
            </a>
        </div>
    </header>
    <main class="content">
   

<section class="welcome">
    <div class="welcome-text">
        <h2>Welcome back,</h2>
        <h1><?= $name ?>!</h1>
        <p>Let's keep our community clean and green together.</p>
    </div>


</section>



        <section class="features" id="actions">
            <div class="feature clickable" data-open-pickup role="button" tabindex="0">
                🚚
                <h3>Request Pickup</h3>
                <p>Schedule a waste disposal pickup.</p>
            </div>
            <div class="feature clickable" data-open-schedule role="button" tabindex="0">
                📅
                <h3>View Schedule</h3>
                <p>Check the waste collection schedule.</p>
            </div>
            <div class="feature clickable" data-open-guide role="button" tabindex="0">
                📖
                <h3>Recycling Guide</h3>
                <p>Learn how to properly segregate waste.</p>
            </div>
            <div class="feature clickable" data-open-issue role="button" tabindex="0">
                ⚠️
                <h3>Report Issue</h3>
                <p>Report missed collection or other concerns.</p>
            </div>
        </section>

        <section class="panels">
            <div class="panel" id="schedule">
                <div class="panel-header">
                    <h3>Upcoming Schedule</h3>
                    <button type="button" class="btn-link" data-open-schedule>View Full →</button>
                </div>
                <div id="upcomingScheduleList" class="schedule-items">
                    <div class="schedule-row" data-id="1"><span>🗑️ General Waste</span><span class="badge">Monday</span></div>
                    <div class="schedule-row" data-id="2"><span>♻️ Recyclable Waste</span><span class="badge">Wednesday</span></div>
                    <div class="schedule-row" data-id="3"><span>🌿 Organic Waste</span><span class="badge">Friday</span></div>
                    <div class="schedule-row" data-id="4"><span>⚠️ Hazardous Waste</span><span class="badge">Saturday</span></div>
                </div>
            </div>
            <div class="panel" id="announcements">
                <div class="panel-header">
                    <h3>Announcements</h3>
                    <span class="panel-kicker">Community updates</span>
                </div>
                <div id="announcementsList" class="announcements-list" aria-live="polite" aria-busy="true">
                    <article class="announcement-item">
                        <span class="announcement-icon" aria-hidden="true">📢</span>
                        <div class="announcement-copy"><h4>Schedule Update</h4></div>
                    </article>
                    <article class="announcement-item">
                        <span class="announcement-icon" aria-hidden="true">📢</span>
                        <div class="announcement-copy"><h4>Recycling Drive</h4></div>
                    </article>
                    <article class="announcement-item">
                        <span class="announcement-icon" aria-hidden="true">📢</span>
                        <div class="announcement-copy"><h4>Keep Our Community Clean</h4></div>
                    </article>
                </div>
            </div>
        </section>
    </main>
</div>
</div>
<!-- Schedule Modal Dialog -->
<dialog id="scheduleModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>📅 Waste Collection Schedule</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal-body">
            <p class="modal-sub">Browse waste collection schedules by zone or view community routines.</p>
            <div class="zone-pills" id="zonePills">
                <button type="button" class="pill active" data-zone="All Zones">All Zones</button>
                <button type="button" class="pill" data-zone="Zone 1">Zone 1</button>
                <button type="button" class="pill" data-zone="Zone 2">Zone 2</button>
                <button type="button" class="pill" data-zone="Zone 3">Zone 3</button>
            </div>
            <div id="scheduleGrid" class="schedule-grid"></div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-outline" data-close-modal>Close</button>
            <button type="button" class="btn-solid" data-open-pickup>Request Pickup</button>
        </div>
    </div>
</dialog>

<!-- Pickup Modal Dialog -->
<dialog id="pickupModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>🚚 Request Special Pickup</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <form id="pickupForm" class="modal-body form-body">
            <div class="field">
                <label for="pName">Full Name</label>
                <input id="pName" name="user_name" value="<?= $name ?>" required>
            </div>
            <div class="field">
                <label for="pAddr">Address / Zone</label>
                <input id="pAddr" name="address" placeholder="e.g. Block 10 Lot 5, Zone 1" required>
            </div>
            <div class="field">
                <label for="pType">Waste Type</label>
                <select id="pType" name="waste_type" required>
                    <option value="Bulky Items">Bulky Items (Furniture, Appliances)</option>
                    <option value="Recyclable Waste">Recyclable Waste (Cardboard, Plastics, Metal)</option>
                    <option value="Hazardous Waste">Hazardous Waste (Batteries, Electronics, Bulbs)</option>
                    <option value="Organic Waste">Organic / Garden Waste</option>
                    <option value="General Waste">General / Residual Waste</option>
                </select>
            </div>
            <div class="field">
                <label for="pDate">Preferred Date</label>
                <input id="pDate" name="preferred_date" type="date" required>
            </div>
            <div class="field">
                <label for="pNotes">Notes (Optional)</label>
                <input id="pNotes" name="notes" placeholder="Special instructions or details">
            </div>
            <div id="pMsg" class="form-feedback" hidden></div>
            <div class="modal-footer" style="padding:10px 0 0">
                <button type="button" class="btn-outline" data-close-modal>Cancel</button>
                <button type="submit" class="btn-solid" id="pSubmitBtn">Submit Request</button>
            </div>
        </form>
    </div>
</dialog>

<!-- Guide Modal Dialog -->
<dialog id="guideModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>📖 Waste Segregation Guide</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <div class="sched-card" style="border-left: 5px solid #28a745;">
                <strong>🌿 Green Bin: Biodegradable & Organic</strong>
                <p style="margin:4px 0 0; font-size:13px; color:#556;">Food scraps, fruit peels, vegetable waste, garden clippings, leaves, soiled paper napkins.</p>
            </div>
            <div class="sched-card" style="border-left: 5px solid #007bff;">
                <strong>♻️ Blue Bin: Clean Recyclables</strong>
                <p style="margin:4px 0 0; font-size:13px; color:#556;">Clean paper, cardboard boxes, plastic bottles, metal cans, glass jars. <em>Note: Rinse before disposal!</em></p>
            </div>
            <div class="sched-card" style="border-left: 5px solid #ffc107;">
                <strong>⚠️ Yellow Bin: Special & Hazardous Waste</strong>
                <p style="margin:4px 0 0; font-size:13px; color:#556;">Batteries, light bulbs, e-waste, paint cans, expired chemicals. Please request a special pickup.</p>
            </div>
            <div class="sched-card" style="border-left: 5px solid #6c757d;">
                <strong>🗑️ Black Bin: Residual / General Waste</strong>
                <p style="margin:4px 0 0; font-size:13px; color:#556;">Sanitary items, non-recyclable plastic packaging, worn fabrics, broken ceramics.</p>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-outline" data-close-modal>Close</button>
            <button type="button" class="btn-solid" data-open-schedule>View Schedule</button>
        </div>
    </div>
</dialog>

<!-- Report Issue Modal Dialog -->
<dialog id="issueModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>⚠️ Report an Issue / Concern</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <form id="issueForm" class="modal-body form-body">
            <div class="field">
                <label for="iType">Issue Type</label>
                <select id="iType" name="issue_type" required>
                    <option value="Missed Collection">Missed Scheduled Collection</option>
                    <option value="Damaged Bin">Damaged / Overfilled Bin</option>
                    <option value="Illegal Dumping">Illegal Waste Dumping</option>
                    <option value="Spill or Leakage">Waste Spill or Truck Leakage</option>
                    <option value="Other">Other Community Sanitation Concern</option>
                </select>
            </div>
            <div class="field">
                <label for="iLocation">Location / Street / Zone</label>
                <input id="iLocation" name="location" placeholder="e.g. Corner of Elm St and 2nd Ave, Zone 2" required>
            </div>
            <div class="field">
                <label for="iDesc">Description & Details</label>
                <textarea id="iDesc" name="description" rows="3" placeholder="Please describe the issue in detail..." required></textarea>
            </div>
            <div id="iMsg" class="form-feedback" hidden></div>
            <div class="modal-footer" style="padding:10px 0 0">
                <button type="button" class="btn-outline" data-close-modal>Cancel</button>
                <button type="submit" class="btn-solid" id="iSubmitBtn">Submit Report</button>
            </div>
        </form>
    </div>
</dialog>

<!-- Community Programs Modal Dialog -->
<dialog id="communityModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>♧ Community Programs & Rewards</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <div class="sched-card">
                <div class="sched-card-top">
                    <span class="sched-title">🌱 Saturday Neighborhood Clean-Up Drive</span>
                    <span class="badge">+50 Eco Points</span>
                </div>
                <div class="sched-timing">
                    <span>📅 Oct 12, 2026 • 07:00 AM</span>
                    <span>•</span>
                    <span>📍 Zone 1 Community Park</span>
                </div>
                <p class="sched-desc">Join fellow neighbors for a morning community park tidy-up. Equipment and refreshments provided.</p>
            </div>
            <div class="sched-card">
                <div class="sched-card-top">
                    <span class="sched-title">🍂 Home Composting & Garden Workshop</span>
                    <span class="badge">+30 Eco Points</span>
                </div>
                <div class="sched-timing">
                    <span>📅 Oct 19, 2026 • 02:00 PM</span>
                    <span>•</span>
                    <span>📍 Community Hall</span>
                </div>
                <p class="sched-desc">Learn how to turn organic kitchen scraps into rich nutrient fertilizer for your backyard.</p>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-outline" data-close-modal>Close</button>
            <button type="button" class="btn-solid" data-open-schedule>Check Schedule</button>
        </div>
    </div>
</dialog>

<!-- MODERN EDITABLE PROFILE MODAL -->
<dialog id="profileModal" class="modal">
    <div class="modal-box">

        <!-- PROFILE MODAL HEADER -->
        <div class="modal-header">
            <h2>👤 My Profile</h2>

            <button
                type="button"
                class="close-btn"
                data-close-modal
                aria-label="Close profile"
            >&times;</button>
        </div>

        <!-- PROFILE MODAL BODY -->
        <div class="modal-body profile-body">

            <!-- PROFILE EDIT FORM -->
            <form
                id="profileEditForm"
                class="profile-form"
                enctype="multipart/form-data"
            >

                <!-- PROFILE PICTURE SECTION -->
                <div class="profile-header">

                    <div class="profile-picture-container">

                        <img
                            id="profileImagePreview"
                            src="images/default-avatar.png"
                            alt="Profile Picture"
                            class="profile-picture"
                            onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23dcebd7%22/%3E%3Ctext x=%2250%22 y=%2268%22 font-size=%2255%22 text-anchor=%22middle%22%3E👤%3C/text%3E%3C/svg%3E';"
                        >

                        <label
                            for="profilePictureInput"
                            class="profile-upload-btn"
                        >
                             📷Change Photo
                        </label>

                        <input
                            type="file"
                            id="profilePictureInput"
                            name="profile_picture"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                        >

                    </div>

                    <!-- DISPLAY NAME -->
                    <h2 id="profileDisplayName">
                        <?= $name ?>
                    </h2>

                    <!-- ACCOUNT STATUS -->
                    <span class="profile-status" style="color: #4CAF50;">
                        ● Active Account
                    </span>

                </div>

                <!-- PERSONAL INFORMATION -->
                <div class="profile-details">

                    <h3>Personal Information</h3>

                    <!-- FULL NAME -->
                    <div class="field">
                        <label for="profileName">
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="profileName"
                            name="full_name"
                            value="<?= $name ?>"
                            maxlength="100"
                            autocomplete="name"
                            required
                        >
                    </div>

                    <!-- EMAIL ADDRESS -->
                    <div class="field">
                        <label for="profileEmail">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="profileEmail"
                            name="email"
                            placeholder="Enter your email address"
                            autocomplete="email"
                        >
                    </div>

                    <!-- PHONE NUMBER -->
                    <div class="field">
                        <label for="profilePhone">
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            id="profilePhone"
                            name="phone"
                            placeholder="Enter your phone number"
                            autocomplete="tel"
                        >
                    </div>

                    <!-- ADDRESS -->
                    <div class="field">
                        <label for="profileAddress">
                            Address
                        </label>

                        <input
                            type="text"
                            id="profileAddress"
                            name="address"
                            placeholder="Enter your complete address"
                            autocomplete="street-address"
                        >
                    </div>

                </div>

                <!-- FEEDBACK MESSAGE -->
                <div
                    id="profileMsg"
                    class="form-feedback"
                    role="status"
                    aria-live="polite"
                    hidden
                ></div>

                <!-- PROFILE BUTTONS -->
                <div class="modal-footer">

                    <button
                        type="button"
                        class="btn-outline"
                        data-close-modal
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn-solid"
                        id="profileSaveBtn"
                    >
                        💾 Save Changes
                    </button>

                </div>

            </form>

        </div>

    </div>
</dialog>


<script src="config.js"></script>
<script src="dashboard.js"></script>
</body></html>
