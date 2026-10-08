-- Community Waste Management Database Schema
-- Database: community_db

CREATE DATABASE IF NOT EXISTS `community_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `community_db`;

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `pickup_requests`
CREATE TABLE IF NOT EXISTS `pickup_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `waste_type` VARCHAR(100) NOT NULL DEFAULT 'General Waste',
  `preferred_date` DATE NOT NULL,
  `notes` TEXT,
  `status` ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `schedules`
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `waste_type` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(20) NOT NULL,
  `day_of_week` VARCHAR(50) NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `zone` VARCHAR(50) NOT NULL DEFAULT 'All Zones',
  `frequency` VARCHAR(30) NOT NULL DEFAULT 'Weekly',
  `description` TEXT,
  `is_upcoming` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `reported_issues`
CREATE TABLE IF NOT EXISTS `reported_issues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `issue_type` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default schedule data
INSERT INTO `schedules` (`waste_type`, `icon`, `day_of_week`, `time_slot`, `zone`, `frequency`, `description`, `is_upcoming`) VALUES
('General Waste', '🗑️', 'Monday', '07:00 AM - 10:00 AM', 'All Zones', 'Weekly', 'Non-recyclable household waste.', 1),
('Recyclable Waste', '♻️', 'Wednesday', '08:00 AM - 12:00 PM', 'All Zones', 'Weekly', 'Clean paper, plastics, glass, metal cans.', 1),
('Organic Waste', '🌿', 'Friday', '07:00 AM - 10:00 AM', 'All Zones', 'Weekly', 'Food scraps, leaves, and garden trimmings.', 1),
('Hazardous Waste', '⚠️', 'Saturday', '09:00 AM - 01:00 PM', 'All Zones', 'Bi-Weekly', 'Batteries, bulbs, electronics, and chemicals.', 1),
('General Waste (Zone 1)', '🗑️', 'Monday & Thursday', '06:30 AM - 09:30 AM', 'Zone 1', 'Bi-Weekly', 'Zone 1 regular waste collection.', 0),
('Recyclable Waste (Zone 1)', '♻️', 'Wednesday', '08:00 AM - 11:00 AM', 'Zone 1', 'Weekly', 'Zone 1 recyclables collection.', 0),
('General Waste (Zone 2)', '🗑️', 'Tuesday & Friday', '06:30 AM - 09:30 AM', 'Zone 2', 'Bi-Weekly', 'Zone 2 regular waste collection.', 0),
('Recyclable Waste (Zone 2)', '♻️', 'Thursday', '08:00 AM - 11:00 AM', 'Zone 2', 'Weekly', 'Zone 2 recyclables collection.', 0),
('General Waste (Zone 3)', '🗑️', 'Wednesday & Saturday', '06:30 AM - 09:30 AM', 'Zone 3', 'Bi-Weekly', 'Zone 3 regular waste collection.', 0),
('Recyclable Waste (Zone 3)', '♻️', 'Friday', '08:00 AM - 11:00 AM', 'Zone 3', 'Weekly', 'Zone 3 recyclables collection.', 0);
