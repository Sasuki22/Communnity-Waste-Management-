# 🌿 Community Waste Management System

A comprehensive web-based platform for managing community waste collection, pickup requests, and environmental awareness programs.

## 🚀 Features

- **User Authentication** - Secure login/registration system with password hashing
- **Waste Collection Schedule** - View upcoming collection schedules by zone and waste type
- **Special Pickup Requests** - Request pickups for bulk/special waste items
- **Issue Reporting** - Report missed collections, damaged bins, or other concerns
- **Dark/Light Theme** - Toggle between themes with persistent user preference
- **Community Programs** - Track recycling rewards and environmental initiatives
- **Waste Segregation Guide** - Educational resources for proper waste disposal

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design with mobile support

**Backend:**
- PHP 7.4+ (Main API)
- Python 3.x + Flask (Schedule API)
- MySQL Database (phpMyAdmin)

**Server:**
- Apache (XAMPP)
- MySQL 5.7+

## 📋 Requirements

- XAMPP (or similar LAMP/WAMP stack)
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Python 3.7+ (for Flask backend)
- Git

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/community-waste-management.git
cd community-waste-management
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Update DB_PASSWORD if you have a MySQL password
```

### 3. Configure Database Connection
```bash
# Copy example config
cp config.example.php config.php

# config.php will automatically load from .env file
```

### 4. Set Up Database
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create database: `community_db`
3. Import schema:
   - Go to Import tab
   - Select `database/database.sql`
   - Click "Go"

### 5. Install Python Dependencies (Optional)
```bash
cd backend
pip install -r requirements.txt
```

### 6. Start the Application

**Option A: PHP Only (Recommended)**
1. Start XAMPP (Apache + MySQL)
2. Visit: `http://localhost/community-waste-management/`

**Option B: With Python Flask Backend**
1. Start XAMPP (Apache + MySQL)
2. In terminal:
   ```bash
   cd backend
   python run.py
   ```
3. Visit: `http://localhost/community-waste-management/`

## 📁 Project Structure

```
Community Waste Management/
├── backend/                 # Python Flask API
│   ├── routes/             # API route handlers
│   ├── app.py              # Flask application
│   ├── config.py           # Backend configuration
│   ├── database.py         # SQLite database handler
│   └── run.py              # Application entry point
├── database/               # SQL schemas
│   └── database.sql        # MySQL database schema
├── images/                 # Static images
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── api_pickup.php          # PHP API for pickups/issues
├── config.php              # PHP database config (gitignored)
├── config.example.php      # Config template
├── dashboard.php           # Main dashboard
├── dashboard.js            # Dashboard functionality
├── dashboard.css           # Dashboard styles
├── index.php               # Landing page
├── login.php               # Login API
├── register.php            # Registration API
└── style.css               # Landing page styles
```

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User authentication and profiles |
| `pickup_requests` | Special pickup requests |
| `reported_issues` | Community issue reports |
| `schedules` | Waste collection schedules |

## 🎨 Theme System

Toggle between light and dark modes using the button in the dashboard topbar.

**Customization:**
- Edit CSS variables in `dashboard.css` (lines 7-63)
- Theme preference stored in browser localStorage

## 🔒 Security Features

- ✅ Environment variables for sensitive data (.env)
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection
- ✅ Session-based authentication
- ✅ Gitignored config files

## 🚀 Deployment to GitHub

### First Time Setup
```bash
# Add all files to staging
git add .

# Create first commit
git commit -m "Initial commit: Community Waste Management System"

# Add your GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### For Subsequent Updates
```bash
git add .
git commit -m "Your commit message here"
git push
```

## 📝 Environment Variables

Required variables in `.env`:

```env
# Database
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=community_db

# Flask Backend
FLASK_SECRET_KEY=your-secret-key-here
FLASK_PORT=5000
FLASK_HOST=0.0.0.0
FLASK_DEBUG=True
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running in XAMPP
- Check `.env` credentials match phpMyAdmin
- Ensure `community_db` database exists

### Python Encoding Errors
- All Python files include UTF-8 encoding declaration
- If issues persist, check Python version (3.7+ required)

### Theme Not Saving
- Enable browser localStorage
- Check browser console for JavaScript errors

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 📧 Contact

Project Link: [https://github.com/YOUR_USERNAME/community-waste-management](https://github.com/YOUR_USERNAME/community-waste-management)

---

**Built with ♻️ for a greener future**

