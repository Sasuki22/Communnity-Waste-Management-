-- Run against the existing production database after taking a backup.
-- Do not import this file into public_html.
CREATE TABLE IF NOT EXISTS contact_daily_limits (
    email VARCHAR(150) NOT NULL,
    submitted_on DATE NOT NULL,
    PRIMARY KEY (email, submitted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;