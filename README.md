# Saheli Connect - Empowering Women Through Dignified Work

A full-stack web platform connecting working women with reliable house-help providers while creating dignified livelihood opportunities for women seeking financial independence.

## 🎯 Project Overview

**Saheli Connect** addresses a real-world problem: working women often struggle to find reliable house-help, while many women seeking financial independence lack suitable opportunities. This platform bridges that gap by providing a safe, transparent, and dignified connection system with a complete backend and database.

## 🏗️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome 6.4.0 for icons
- Responsive design with CSS Grid and Flexbox

### Backend
- **Node.js** with Express.js
- **SQLite3** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Features
- RESTful API architecture
- Token-based authentication
- Real-time messaging system
- User profile management
- Advanced search and filtering
- Admin dashboard with analytics

### For Job Seekers
- Create detailed profiles showcasing skills and experience
- Browse verified employer profiles
- Secure messaging system
- Transparent ratings and reviews
- Multi-language support

### For Employers
- Search and filter house-help professionals by skills, location, and experience
- View verified profiles with ratings and reviews
- Direct messaging capabilities
- Save favorite profiles
- Track connections and communications

### Platform Features
- ✅ User verification system
- 🔒 Secure messaging
- ⭐ Rating and review system
- 🔍 Advanced search and filters
- 📱 Fully responsive design
- 🌐 Multi-language support ready
- 🎨 Modern, intuitive UI/UX

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Navigate to the project directory**
   ```bash
   cd /home/vishal/Desktop/women
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install:
   - express
   - sqlite3
   - bcryptjs
   - jsonwebtoken
   - cors
   - dotenv
   - express-validator
   - multer

3. **Initialize the database**
   ```bash
   node database/init-db.js
   ```
   
   This creates the SQLite database and populates it with sample data.

4. **Start the server**
   
   Production mode:
   ```bash
   npm start
   ```
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - API Endpoint: `http://localhost:3000/api`
   - Admin Panel: `http://localhost:3000/admin.html`

### Quick Setup (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

## 📁 Project Structure

```
women/
├── server.js                  # Express server
├── package.json              # Node.js dependencies
├── .env                      # Environment variables
├── setup.sh                  # Setup script
├── README.md                 # Documentation
├── index.html               # Landing page
├── dashboard.html           # User dashboard
├── admin.html               # Admin login
├── admin-dashboard.html     # Admin dashboard
├── database/
│   ├── db.js                # Database connection
│   ├── init-db.js           # Database initialization
│   └── saheli_connect.db    # SQLite database (generated)
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── connections.js       # Connection management routes
│   ├── messages.js          # Messaging routes
│   └── admin.js             # Admin routes
├── css/
│   ├── style.css            # Main styles
│   ├── dashboard.css        # Dashboard styles
│   └── admin.css            # Admin panel styles
└── js/
    ├── api-config.js        # API configuration
    ├── script.js            # Landing page scripts
    ├── dashboard.js         # Dashboard functionality
    └── admin.js             # Admin functionality
```

## 🔐 Authentication & Credentials

### Demo User Accounts
All user passwords: `password123`

**Employers:**
- Email: `priya@example.com`
- Email: `kavita@example.com`

**Helpers:**
- Email: `meera@example.com`
- Email: `anjali@example.com`
- Email: `sunita@example.com`

### Admin Access
- **Username:** `admin`
- **Password:** `admin123`
- **URL:** http://localhost:3000/admin.html

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "User Name",
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "password123",
  "userType": "employer|helper",
  "city": "Mumbai"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Admin Login
```http
POST /api/auth/admin-login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### User Endpoints (Requires Authentication)

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "phone": "+919876543210",
  "city": "Mumbai",
  "about": "About text"
}
```

#### Search Users
```http
GET /api/users/search?userType=helper&city=Mumbai&rating=4
Authorization: Bearer <token>
```

Query Parameters:
- `userType`: employer|helper
- `city`: City name
- `skills`: Comma-separated skills
- `experience`: Experience level
- `rating`: Minimum rating

#### Save/Unsave Profile
```http
POST /api/users/saved/:userId
Authorization: Bearer <token>
```

#### Get Saved Profiles
```http
GET /api/users/saved/list
Authorization: Bearer <token>
```

### Connection Endpoints

#### Get All Connections
```http
GET /api/connections
Authorization: Bearer <token>
```

#### Create Connection Request
```http
POST /api/connections
Authorization: Bearer <token>
Content-Type: application/json

{
  "helperId": 2,
  "employerId": 1
}
```

#### Update Connection Status
```http
PUT /api/connections/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active|pending|completed|cancelled"
}
```

### Messaging Endpoints

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <token>
```

#### Get Messages with User
```http
GET /api/messages/:userId
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2,
  "message": "Hello!"
}
```

#### Get Unread Count
```http
GET /api/messages/unread/count
Authorization: Bearer <token>
```

### Admin Endpoints (Requires Admin Token)

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Get Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

#### Update User Status
```http
PUT /api/admin/users/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "active|inactive|suspended|pending"
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin-token>
```

#### Get All Reports
```http
GET /api/admin/reports
Authorization: Bearer <admin-token>
```

#### Update Report Status
```http
PUT /api/admin/reports/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "pending|investigating|resolved|dismissed"
}
```

## �️ Database Schema

### Tables

1. **users** - Main user table
   - id, full_name, email, phone, password, user_type, city, about, verified, status, rating, etc.

2. **helper_profiles** - Helper-specific information
   - skills, experience, hourly_rate, availability, languages

3. **employer_preferences** - Employer requirements
   - services_needed, budget_range, preferred_experience

4. **connections** - Active connections between employers and helpers
   - employer_id, helper_id, status, started_at, ended_at

5. **messages** - User messages
   - sender_id, receiver_id, message, read, created_at

6. **reviews** - User reviews and ratings
   - reviewer_id, reviewee_id, rating, comment

7. **reports** - User reports and issues
   - reporter_id, reported_user_id, reason, status

8. **saved_profiles** - Saved/bookmarked profiles
   - user_id, saved_user_id

9. **notifications** - User notifications
   - user_id, title, message, type, read

## ✨ Features

1. **Landing Page** (`index.html`)
   - View platform features and benefits
   - Sign up as employer or job seeker
   - Login to existing account

2. **Authentication**
   - Modal-based login/signup
   - User type selection (employer/helper)
   - Form validation

3. **Dashboard** (`dashboard.html`)
   - Overview with stats and activity
   - Search and filter profiles
   - Messaging system
   - Profile management
   - Connections tracking
   - Settings

## 🎯 Key Sections

### Landing Page
- Hero section with clear call-to-action
- About section explaining the mission
- How it works (4-step process)
- Platform features showcase
- Statistics counter
- Contact form
- Responsive navigation

### Dashboard
- **Overview**: Activity feed, statistics, recommendations
- **Search**: Advanced filters for finding matches
- **Messages**: Real-time chat interface
- **Profile**: Complete profile management
- **Connections**: Manage active connections
- **Saved**: Bookmarked profiles
- **Settings**: Notifications and preferences

## 🎨 Design Features

- **Color Scheme**: Modern purple and pink gradient
- **Responsive**: Works on all devices (mobile, tablet, desktop)
- **Animations**: Smooth transitions and scroll animations
- **Accessibility**: Clear typography and contrast
- **User-friendly**: Intuitive navigation and clear CTAs

## 🔧 Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #ec4899;
    --success-color: #10b981;
    /* ... more colors */
}
```

### Sample Data
Modify profile data in `js/dashboard.js`:
```javascript
const sampleProfiles = [
    // Add your profile data here
];
```

## 📱 Responsive Breakpoints

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🚀 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time notifications
- [ ] Payment gateway integration
- [ ] Video call functionality
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced matching algorithm
- [ ] Background verification system
- [ ] Multi-language interface
- [ ] SMS notifications
- [ ] Document upload and verification

## 🤝 Contributing

We welcome contributions from the community! This is a project focused on social impact and women empowerment.

### How to Contribute

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:
- Code of conduct
- Development setup
- Coding standards
- Pull request process
- Style guidelines

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Testing
- 🌐 Translations
- ♿ Accessibility improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Additional Documentation

- **[SETUP.md](SETUP.md)** - Complete setup and installation guide with troubleshooting
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project with style guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[ADMIN_JOB_MANAGEMENT_GUIDE.md](ADMIN_JOB_MANAGEMENT_GUIDE.md)** - Admin job management documentation
- **[LICENSE](LICENSE)** - MIT License details
- **[.env.example](.env.example)** - Environment variables template

## 📦 Project Files

```
saheli-connect/
├── 📄 Documentation
│   ├── README.md                    # Main documentation
│   ├── SETUP.md                     # Setup guide
│   ├── CONTRIBUTING.md              # Contribution guidelines
│   ├── CHANGELOG.md                 # Version history
│   ├── LICENSE                      # MIT License
│   └── ADMIN_JOB_MANAGEMENT_GUIDE.md
│
├── 🗄️ Database
│   ├── db.js                        # Database connection
│   ├── init-db.js                   # Database initialization
│   └── saheli_connect.db            # SQLite database
│
├── 🔐 Middleware
│   └── auth.js                      # Authentication middleware
│
├── 🛣️ Routes (API)
│   ├── auth.js                      # Authentication endpoints
│   ├── users.js                     # User management
│   ├── connections.js               # Connection management
│   ├── messages.js                  # Messaging system
│   ├── jobs.js                      # Job management
│   └── admin.js                     # Admin operations
│
├── 🎨 Frontend
│   ├── css/                         # Stylesheets
│   ├── js/                          # JavaScript files
│   ├── index.html                   # Landing page
│   ├── dashboard.html               # User dashboard
│   ├── admin.html                   # Admin login
│   └── admin-dashboard.html         # Admin panel
│
├── ⚙️ Configuration
│   ├── .env                         # Environment variables (create from .env.example)
│   ├── .env.example                 # Environment template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Node.js dependencies
│   └── setup.sh                     # Setup script
│
└── 🚀 Server
    └── server.js                    # Express server
```

## 👥 Target Audience

### Primary Users
- Working women seeking reliable house-help
- Women looking for dignified employment opportunities
- Urban households needing domestic assistance

### Geographic Focus
- Initially: Major Indian cities
- Expansion: Pan-India coverage

## 🌟 Social Impact

- **Empowerment**: Creates dignified work opportunities
- **Safety**: Verified profiles and secure platform
- **Transparency**: Clear ratings and reviews
- **Fair Wages**: Direct connection reduces exploitation
- **Community**: Builds trust and support network

## � Development

### Environment Variables
Create a `.env` file in the root directory:

```env
# JWT Secret Key (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Database Management

**Reset Database:**
```bash
rm database/saheli_connect.db
node database/init-db.js
```

**Backup Database:**
```bash
cp database/saheli_connect.db database/saheli_connect_backup_$(date +%Y%m%d).db
```

### Development Mode
```bash
npm run dev  # Uses nodemon for auto-reload
```

## 🧪 Testing the Application

### Test User Registration & Login
1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign In"
3. Register as a new user or use demo credentials
4. Verify JWT token is stored in localStorage

### Test Dashboard Features
1. Login as an employer (`priya@example.com`)
2. Search for helpers with filters
3. View helper profiles
4. Send a connection request
5. Check messages section

### Test Admin Panel
1. Navigate to http://localhost:3000/admin.html
2. Login with admin credentials
3. View statistics dashboard
4. Manage users (edit, suspend, delete)
5. Check reports and connections

### Test Messaging System
1. Login as User A
2. Send a message to User B
3. Logout and login as User B
4. Check for new message notification
5. Reply to the message

## 🛠️ Troubleshooting

### Server won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Kill existing process: `kill -9 <PID>`
- Or use a different port in `.env`

### Database errors
- Delete and recreate: `rm database/saheli_connect.db && node database/init-db.js`
- Check file permissions: `ls -l database/`

### Authentication issues
- Clear browser localStorage
- Check JWT_SECRET in `.env`
- Verify token expiry (default 7 days)

### API not responding
- Check server logs in terminal
- Verify CORS is enabled
- Check API_BASE_URL in `js/api-config.js`

## �📞 Support

For questions or support:
- Email: support@saheliconnect.com
- Phone: +91 1800-123-4567

## 🙏 Acknowledgments

- Built with the mission of women empowerment
- Inspired by the need for dignified livelihood opportunities
- Designed to solve real-world problems

---

**Saheli Connect** - Connecting Women, Creating Opportunities

*Making a difference, one connection at a time.*
#   s a h e l i _ 1  
 