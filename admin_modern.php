<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id'])) { header('Location: index.php'); exit; }
$userId = $_SESSION['user_id'];
$name = htmlspecialchars($_SESSION['user_name'] ?? 'Admin', ENT_QUOTES, 'UTF-8');
$role = $_SESSION['user_role'] ?? 'user';
if ($role !== 'admin') { header('Location: dashboard.php'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Community Waste Management</title>
    <link rel="stylesheet" href="admin_modern.css">
</head>
<body>
    <div class="dashboard-layout">
        <!-- Left Sidebar -->
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
                <a href="#dashboard" class="nav-link active" data-tab="dashboard">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-label">Dashboard</span>
                </a>
                <a href="#users" class="nav-link" data-tab="users">
                    <span class="nav-icon">👥</span>
                    <span class="nav-label">Registered Users</span>
                </a>
                <a href="#pickups" class="nav-link" data-tab="pickups">
                    <span class="nav-icon">🚚</span>
                    <span class="nav-label">Pickup Requests</span>
                </a>
                <a href="#reports" class="nav-link" data-tab="reports">
                    <span class="nav-icon">⚠️</span>
                    <span class="nav-label">Waste Reports</span>
                </a>
                <a href="#schedules" class="nav-link" data-tab="schedules">
                    <span class="nav-icon">📅</span>
                    <span class="nav-label">Collection Dates</span>
                </a>
                <a href="#announcements" class="nav-link" data-tab="announcements">
                    <span class="nav-icon">📢</span>
                    <span class="nav-label">Announcements</span>
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <a href="logout.php" class="logout-btn">
                    <span class="logout-icon">🚪</span>
                    <span class="logout-label">Log Out</span>
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="main-area">
            <!-- Top Header -->
            <header class="top-header">
                <div class="header-left">
                    <span class="header-icon">♻️</span>
                    <h1 class="header-title">Community Waste Management</h1>
                </div>
                <div class="header-right">
                    <div class="user-badge">
                        <span class="user-icon">👤</span>
                        <span class="user-name"><?= $name ?></span>
                    </div>
                </div>
            </header>

            <!-- Content Area -->
            <main class="content-wrapper">
                
                <!-- Dashboard Tab -->
                <div id="dashboard" class="tab-section active">
                    <!-- Welcome Banner -->
                    <div class="welcome-banner">
                        <h2 class="welcome-title">Welcome back, <strong><?= $name ?></strong>!</h2>
                        <p class="welcome-subtitle">Manage registered users and community pickup requests.</p>
                    </div>

                    <!-- Stats Grid -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-number" id="totalUsers">0</div>
                                <div class="stat-label">Registered Users</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🚚</div>
                            <div class="stat-info">
                                <div class="stat-number" id="totalPickups">0</div>
                                <div class="stat-label">Pickup Requests</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⏳</div>
                            <div class="stat-info">
                                <div class="stat-number" id="pendingRequests">0</div>
                                <div class="stat-label">Pending Requests</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⚠️</div>
                            <div class="stat-info">
                                <div class="stat-number" id="totalIssues">0</div>
                                <div class="stat-label">Waste Reports</div>
                            </div>
                        </div>
                    </div>

                    <!-- Registered Users Section -->
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">Registered Users</h3>
                                <p class="section-subtitle">Passwords are never displayed here.</p>
                            </div>
                            <button class="btn-refresh" onclick="loadUsers()">
                                <span>🔄</span>
                                <span>Refresh data</span>
                            </button>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr><td colspan="4" class="loading-cell">Loading registered users...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Users Tab -->
                <div id="users" class="tab-section">
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">All Registered Users</h3>
                                <p class="section-subtitle">Complete user management</p>
                            </div>
                            <button class="btn-refresh" onclick="loadAllUsers()"><span>🔄</span> <span>Refresh</span></button>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Security</th></tr></thead>
                                <tbody id="allUsersTableBody"><tr><td colspan="6" class="loading-cell">Loading users...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Pickup Requests Tab -->
                <div id="pickups" class="tab-section">
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">Pickup Requests</h3>
                                <p class="section-subtitle">Manage waste collection requests</p>
                            </div>
                            <button class="btn-refresh" onclick="loadPickups()"><span>🔄</span> <span>Refresh</span></button>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>ID</th><th>User</th><th>Waste Type</th><th>Location</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody id="pickupsTableBody"><tr><td colspan="6" class="loading-cell">Loading pickup requests...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Waste Reports Tab -->
                <div id="reports" class="tab-section">
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">Waste Reports</h3>
                                <p class="section-subtitle">View reported issues</p>
                            </div>
                            <button class="btn-refresh" onclick="loadReports()"><span>🔄</span> <span>Refresh</span></button>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Description</th><th>Status</th></tr></thead>
                                <tbody id="reportsTableBody"><tr><td colspan="5" class="loading-cell">Loading reports...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Collection Dates Tab -->
                <div id="schedules" class="tab-section">
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">Collection Dates</h3>
                                <p class="section-subtitle">Waste collection schedule</p>
                            </div>
                            <button class="btn-refresh" onclick="loadSchedules()"><span>🔄</span> <span>Refresh</span></button>
                        </div>
                        <div class="table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>Waste Type</th><th>Day</th><th>Time</th><th>Zone</th></tr></thead>
                                <tbody id="schedulesTableBody"><tr><td colspan="4" class="loading-cell">Loading schedules...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Announcements Tab -->
                <div id="announcements" class="tab-section">
                    <div class="content-section">
                        <div class="section-header">
                            <div class="section-info">
                                <h3 class="section-title">Announcements</h3>
                                <p class="section-subtitle">Publish community notifications</p>
                            </div>
                            <button type="button" class="btn-primary" id="showAnnouncementForm"><span>➕</span> <span>New Announcement</span></button>
                        </div>
                        <form id="announcementForm" class="announcement-form" hidden>
                            <label for="announcementTitle">Title</label>
                            <input id="announcementTitle" name="title" type="text" maxlength="150" required>
                            <label for="announcementMessage">Message</label>
                            <textarea id="announcementMessage" name="message" rows="4" maxlength="5000" required></textarea>
                            <div class="announcement-form-actions">
                                <button type="button" class="btn-secondary" id="cancelAnnouncement">Cancel</button>
                                <button type="submit" class="btn-primary" id="publishAnnouncement">Publish Announcement</button>
                            </div>
                        </form>
                        <div id="announcementsList" class="announcements-list">
                            <p class="loading-cell">Loading announcements...</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    </div>
    <script src="admin_modern.js"></script>
</body>
</html>

