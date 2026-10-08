<?php
session_start();
if (!isset($_SESSION['user_id'])) { header('Location: index.php'); exit; }
$name = htmlspecialchars($_SESSION['user_name'] ?? 'User', ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard | Community Waste Management</title>
<link rel="stylesheet" href="dashboard.css">
</head>
<body>

          <div class="layout">
     <aside class="sidebar">
        <h2>♻️ Community Waste Management System</h2>
      <nav aria-label="Dashboard navigation">
    <a class="active" href="dashboard.php">⌂ &nbsp; Dashboard</a>
    <a href="#schedule" data-open-schedule>▦ &nbsp; Schedule</a>
    <a href="#pickup" data-open-pickup>🚚 &nbsp; Request Pickup</a>
    <a href="#guide" data-open-guide>📖 &nbsp; Recycling Guide</a>
    <a href="#issue" data-open-issue>⚠ &nbsp; Report Issue</a>
    <a href="#community" data-open-community>♧ &nbsp; Community</a>
    <a href="#profile" data-open-profile>♙ &nbsp; Profile</a>
</nav>
   <a class="logout" href="logout.php">⇥ &nbsp; Logout</a>
</aside>
     
<div class="main">
    <header class="topbar">
        <strong>♻️ Community Waste Management</strong>
        <div class="topbar-right">
            <button type="button" class="theme-toggle" id="themeToggle" title="Toggle Theme">
                <span class="toggle-icon">&#9790;</span> <span class="toggle-label">Dark</span>
            </button>
            <span class="api-status" id="apiStatus">● API Ready</span>
            <span id="profile">👤 <?= $name ?></span>
        </div>
    </header>
    <main class="content">
        <section class="welcome">
            <small>Welcome back,</small>
            <h1><?= $name ?>!</h1>
            <p>Let's keep our community clean and green together.</p>
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
                <h3>Announcements</h3>
                <p>📢 Schedule Update</p>
                <p>📢 Recycling Drive</p>
                <p>📢 Keep Our Community Clean</p>
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

<!-- Profile Modal Dialog -->
<dialog id="profileModal" class="modal">
    <div class="modal-box">
        <div class="modal-header">
            <h2>👤 Member Profile</h2>
            <button type="button" class="close-btn" data-close-modal>&times;</button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
            <div class="sched-card">
                <div style="font-size:13px; color:#556;">Member Name</div>
                <div style="font-size:16px; font-weight:bold; color:#1a3322;"><?= $name ?></div>
            </div>
            <div class="sched-card">
                <div style="font-size:13px; color:#556;">Account Status</div>
                <div style="font-size:14px; font-weight:600; color:#237b32;">Active Community Member</div>
            </div>
            <div class="sched-card">
                <div style="font-size:13px; color:#556;">Eco-Impact Rewards</div>
                <div style="font-size:14px; font-weight:bold; color:#205c39;">🌿 120 Eco Points</div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-outline" data-close-modal>Close</button>
            <a href="logout.php" class="btn-solid" style="background:#b53232; color:#fff; text-decoration:none; display:inline-flex; align-items:center;">Log out</a>
        </div>
    </div>
</dialog>

<script src="dashboard.js"></script>
</body></html>
