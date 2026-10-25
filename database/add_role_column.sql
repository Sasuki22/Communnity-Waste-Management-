-- Add role column to users table if it doesn't exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` ENUM('user', 'admin') DEFAULT 'user' AFTER `password`;

-- Update existing admin user (change email to your admin email)
UPDATE `users` SET `role` = 'admin' WHERE `email` = 'admin@example.com';

-- Or create a new admin user (change credentials as needed)
INSERT INTO `users` (`full_name`, `email`, `password`, `role`) 
VALUES ('Admin User', 'admin@waste.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE `role` = 'admin';
-- Default password: 'password' (hashed)
