<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id'])) { header('Location: index.php'); exit; }
$userId = $_SESSION['user_id'];
$name = htmlspecialchars($_SESSION['user_name'] ?? 'Admin', ENT_QUOTES, 'UTF-8');
$role = $_SESSION['user_role'] ?? 'user';
if ($role !== 'admin') { header('Location: dashboard.php'); exit; }

// Keep the original URL working while the modern dashboard is canonical.
header('Location: admin_modern.php');
exit;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Community Waste Management</title>
    <link rel="stylesheet" href="admin_dashboard.css">
    <link rel="icon" type="image/png" href="images/recycleIcon.png">
</head>
<body>
    <div class="admin-layout">
        <!-- Left Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <span class="logo-icon">♻️</span>
                    <div class="logo-text">
                        <div class="logo-title">Community Waste</div>
                        <div class="logo-subtitle">Management</div>
                    </div>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <a href="#" class="nav-link active" data-tab="dashboard">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-text">Dashboard</span>
                </a>
                <a href="#" class="nav-link" data-tab="users">
                    <span class="nav-icon">👥</span>
                    <span class="nav-text">Registered Users</span>
                </a>
                <a href="#" class="nav-link" data-tab="pickups">
                    <span class="nav-icon">🚚</span>
                    <span class="nav-text">Pickup Requests</span>
                </a>
                <a href="#" class="nav-link" data-tab="issues">
                    <span class="nav-icon">⚠️</span>
                    <span class="nav-text">Waste Reports</span>
                </a>
                <a href="#" class="nav-link" data-tab="schedules">
                    <span class="nav-icon">📅</span>
                    <span class="nav-text">Collection Dates</span>
                </a>
                <a href="#" class="nav-link" data-tab="announcements">
                    <span class="nav-icon">📢</span>
                    <span class="nav-text">Announcements</span>
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <a href="logout.php" class="logout-btn">
                    <span class="logout-icon">🚪</span>
                    <span class="logout-text">Log Out</span>
                </a>
            </div>
        </aside>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Top Header Bar -->
            <header class="top-header">
                <div class="header-left">
                    <span class="header-icon">♻️</span>
                    <h1 class="header-title">Community Waste Management</h1>
                </div>
                <div class="header-right">
                    <div class="admin-profile">
                        <span class="profile-icon">👤</span>
                        <span class="profile-name">admin</span>
                    </div>
                </div>
            </header>
            <!-- Main Content Sections -->
            <main class="content-area">
                
                <!-- Dashboard Tab (Default View) -->
                <div id="dashboard-tab" class="tab-content active">
                    <!-- Welcome Banner -->
                    <div class="welcome-banner">
                        <h2 class="welcome-title">Welcome back, <strong>admin</strong>!</h2>
                        <p class="welcome-subtitle">Manage registered users and community pickup requests.</p>
                    </div>

                    <!-- Summary Statistics Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value" id="totalUsers">2</div>
                                <div class="stat-label">Registered Users</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🚚</div>
                            <div class="stat-info">
                                <div class="stat-value" id="totalPickups">1</div>
                                <div class="stat-label">Pickup Requests</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⏳</div>
                            <div class="stat-info">
                                <div class="stat-value" id="pendingPickups">1</div>
                                <div class="stat-label">Pending Requests</div>
                            </div>
                        </div>
                    </div>

                    <!-- Registered Users Table Section -->
                    <div class="data-section">
                        <div class="section-header">
                            <div class="section-title-group">
                                <h3 class="section-title">Registered Users</h3>
                                <p class="section-subtitle">Passwords are never displayed here.</p>
                            </div>
                            <button class="refresh-btn" onclick="loadUsers()">
                                <span class="refresh-icon">🔄</span>
                                Refresh data
                            </button>
                        </div>
                        <div class="table-wrapper">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr>
                                        <td>2</td>
                                        <td>admin</td>
                                        <td>admin123@gmail.com</td>
                                        <td><span class="role-badge role-admin">admin</span></td>
                                    </tr>
                                    <tr>
                                        <td>1</td>
                                        <td>mama</td>
                                        <td>mama@gmail.com</td>
                                        <td><span class="role-badge role-user">user</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <!-- Users Tab -->
                <div id="users-tab" class="tab-pane active">
                    <div class="section-header">
                        <h2>User Management</h2>
                        <button class="refresh-btn" onclick="loadUsers()">🔄 Refresh</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr><td colspan="6" class="loading">Loading users...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Pickups Tab -->
                <div id="pickups-tab" class="tab-pane">
                    <div class="section-header">
                        <h2>Pickup Requests</h2>
                        <div class="filter-group">
                            <select id="pickupStatusFilter" onchange="loadPickups()">
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <button class="refresh-btn" onclick="loadPickups()">🔄 Refresh</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Address</th>
                                    <th>Waste Type</th>
                                    <th>Preferred Date</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="pickupsTableBody">
                                <tr><td colspan="8" class="loading">Loading pickup requests...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Issues Tab -->
                <div id="issues-tab" class="tab-pane">
                    <div class="section-header">
                        <h2>Issue Reports</h2>
                        <div class="filter-group">
                            <select id="issueStatusFilter" onchange="loadIssues()">
                                <option value="">All Status</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                            <button class="refresh-btn" onclick="loadIssues()">🔄 Refresh</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Issue Type</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="issuesTableBody">
                                <tr><td colspan="8" class="loading">Loading issue reports...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Schedules Tab -->
                <div id="schedules-tab" class="tab-pane">
                    <div class="section-header">
                        <h2>Waste Collection Schedules</h2>
                        <button class="refresh-btn" onclick="loadSchedules()">🔄 Refresh</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Waste Type</th>
                                    <th>Day</th>
                                    <th>Time Slot</th>
                                    <th>Zone</th>
                                    <th>Frequency</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="schedulesTableBody">
                                <tr><td colspan="8" class="loading">Loading schedules...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Analytics Tab -->
                <div id="analytics-tab" class="tab-pane">
                    <div class="section-header">
                        <h2>Reports & Analytics</h2>
                    </div>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h3>Pickup Status Distribution</h3>
                            <div id="pickupChart" class="chart-container">
                                <div class="stat-item"><span class="stat-label">Pending:</span><span class="stat-value" id="chartPending">0</span></div>
                                <div class="stat-item"><span class="stat-label">Confirmed:</span><span class="stat-value" id="chartConfirmed">0</span></div>
                                <div class="stat-item"><span class="stat-label">Completed:</span><span class="stat-value" id="chartCompleted">0</span></div>
                                <div class="stat-item"><span class="stat-label">Cancelled:</span><span class="stat-value" id="chartCancelled">0</span></div>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h3>Issue Status Distribution</h3>
                            <div id="issueChart" class="chart-container">
                                <div class="stat-item"><span class="stat-label">Open:</span><span class="stat-value" id="chartOpen">0</span></div>
                                <div class="stat-item"><span class="stat-label">In Progress:</span><span class="stat-value" id="chartInProgress">0</span></div>
                                <div class="stat-item"><span class="stat-label">Resolved:</span><span class="stat-value" id="chartResolved">0</span></div>
                                <div class="stat-item"><span class="stat-label">Closed:</span><span class="stat-value" id="chartClosed">0</span></div>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h3>Waste Type Distribution</h3>
                            <div id="wasteTypeChart" class="chart-container">
                                <div class="stat-item"><span class="stat-label">General Waste:</span><span class="stat-value" id="chartGeneral">0</span></div>
                                <div class="stat-item"><span class="stat-label">Recyclable:</span><span class="stat-value" id="chartRecyclable">0</span></div>
                                <div class="stat-item"><span class="stat-label">Organic:</span><span class="stat-value" id="chartOrganic">0</span></div>
                                <div class="stat-item"><span class="stat-label">Hazardous:</span><span class="stat-value" id="chartHazardous">0</span></div>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h3>Recent Activity</h3>
                            <div id="recentActivity" class="activity-list">
                                <p class="loading">Loading activity...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Admin Profile Modal -->
    <dialog id="adminProfileModal" class="modal">
        <div class="modal-box">
            <div class="modal-header">
                <h2>👤 Admin Profile</h2>
                <button type="button" class="close-btn" data-close-modal>&times;</button>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
                <div class="profile-card">
                    <div style="font-size:13px; color:#888; margin-bottom:6px;">Admin Name</div>
                    <div style="font-size:18px; font-weight:bold; color:#1a3322;"><?= $name ?></div>
                </div>
                <div class="profile-card">
                    <div style="font-size:13px; color:#888; margin-bottom:6px;">Email</div>
                    <div style="font-size:14px; font-weight:600; color:#2c5f2d;"><?= htmlspecialchars($_SESSION['user_email'] ?? 'N/A', ENT_QUOTES, 'UTF-8') ?></div>
                </div>
                <div class="profile-card">
                    <div style="font-size:13px; color:#888; margin-bottom:6px;">Role</div>
                    <div style="font-size:14px; font-weight:600; color:#237b32;">
                        <span class="admin-badge">Administrator</span>
                    </div>
                </div>
                <div class="profile-card">
                    <div style="font-size:13px; color:#888; margin-bottom:6px;">User ID</div>
                    <div style="font-size:14px; color:#556;">#<?= $userId ?></div>
                </div>
            </div>
            <div class="modal-footer" style="display:flex; gap:10px; justify-content:flex-end; padding-top:16px; border-top:1px solid #e0e0e0;">
                <button type="button" class="btn-outline" data-close-modal>Close</button>
                <a href="dashboard.php" class="btn-solid" style="background:#237b32; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                    ← Back to Dashboard
                </a>
                <a href="logout.php" class="btn-solid" style="background:#dc3545; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                    🚪 Log Out
                </a>
            </div>
        </div>
    </dialog>

    <script src="admin_dashboard.js"></script>
</body>
</html>
