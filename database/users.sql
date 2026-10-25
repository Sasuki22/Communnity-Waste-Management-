-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 25, 2026 at 02:26 AM
-- Server version: 11.8.9-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u312765318_community_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `created_at`, `phone`, `address`, `profile_picture`) VALUES
(1, 'sakuragi', 'sakuragi@gmail.com', '$2y$10$zj8MEj/y73QCWLFkLHey8.niZyUjVbRdQoD3PfJ23BodmueM2Mc8K', 'admin', '2026-10-14 02:49:11', '09657876525', 'Solid Cement', 'uploads/profiles/user_1_774175c8b948cab757d87202.png'),
(2, 'dragon', 'dragon@gmail.com', '$2y$10$OftKN/44gn1yJemwrXdZoOf/P6zmpES4EiwXQa4EbzwilWd90mFMy', 'user', '2026-10-15 11:26:22', NULL, NULL, NULL),
(3, 'Allenkalbo', 'allenkalbo@gmail.com', '$2y$10$eUmNgk0jBqiw1w4I0L57r.zlBYV.RHU7/WAKsCWDj3ClspXei6K6u', 'user', '2026-10-23 11:45:04', NULL, NULL, NULL),
(4, 'test 1', 'test1@gmail.com', '$2y$10$r5Ehafsvx7d0bWcHGTwr0OH2dupE8lnxc17heZYn8x2qHdet.2LDS', 'user', '2026-10-23 13:07:35', '12345678910', '', 'uploads/profiles/user_4_55b7d1546ad2b22969705049.png'),
(5, 'Test11', 'test11@gmail.com', '$2y$10$lzdaB1oWMym3jZeJuFN52uRqHeDgJFgR6NdCA3N4ddJmVKvuasemG', 'admin', '2026-10-23 17:34:11', '', '', 'uploads/profiles/user_5_278539cccecf120589400590.jpg'),
(8, 'Saki', 'sakitest1@gmail.com', '$2y$10$tuoBaLHH9ZFBj.8tzr347uSqvuwR28adgQQLD4A7/8gD12z2pENze', 'admin', '2026-10-24 02:06:27', '0977265977011111', 'anitpolo city', NULL),
(9, 'puhfih', 'puhfih@gmail.com', '$2y$10$0ZMgZte7Kxi18Y9zkWkGkuxjLDN7jKz7dmXemJqJqCVBhLd/EQDv2', 'admin', '2026-10-24 02:12:42', NULL, NULL, NULL),
(11, 'Arnold', 'subtest@yahoo.com', '$2y$10$P5jxAkEMZQ1L5nV2RpBbt.9gP/e5bMMmKeuyG1L2rffSaAjV8jkJa', 'user', '2026-10-24 04:02:56', '09876543111', 'dalig', 'uploads/profiles/user_11_d0626a04479f4f58ea3651f7.jpg'),
(12, 'Daniela Ceballos', 'danieladanielceballos@gmail.com', '$2y$10$6BdkQFMk6PzAgeJBl2/h4.SMPEV/ysCh6QRd3Di0ZOrwPXLVVBzm2', 'user', '2026-10-24 05:03:16', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
