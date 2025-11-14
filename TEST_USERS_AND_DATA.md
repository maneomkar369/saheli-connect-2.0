# Saheli Connect - Test Users and Sample Data

## 🎯 Overview
The database now contains comprehensive sample data for testing all features of the Saheli Connect platform.

## 👥 Test User Credentials

### Employers (5 users)
| Name | Email | City | Password |
|------|-------|------|----------|
| Priya Sharma | priya@example.com | Mumbai | password123 |
| Kavita Reddy | kavita@example.com | Bangalore | password123 |
| Neha Patel | neha@example.com | Delhi | password123 |
| **Ritu Verma** ⭐ | **ritu@example.com** | **Pune** | **password123** |
| **Divya Mehta** ⭐ | **divya@example.com** | **Mumbai** | **password123** |

### Job Seekers/Helpers (7 users)
| Name | Email | City | Skills | Experience | Rate/hr |
|------|-------|------|--------|------------|---------|
| Meera Devi | meera@example.com | Mumbai | Cooking, Cleaning, Laundry | 5+ years | ₹200 |
| Anjali Kumari | anjali@example.com | Bangalore | Cooking, Baby Care, Elderly Care | 3-5 years | ₹180 |
| Sunita Singh | sunita@example.com | Delhi | Cleaning, Laundry, Organization | 2-3 years | ₹150 |
| Lakshmi Iyer | lakshmi@example.com | Chennai | Cooking, Housekeeping, Pet Care | 5+ years | ₹220 |
| Rekha Nair | rekha@example.com | Mumbai | Elderly Care, Nursing, Companionship | 7+ years | ₹250 |
| **Pooja Yadav** ⭐ | **pooja@example.com** | **Pune** | **Cooking, Cleaning, Utensil Washing** | **4-5 years** | **₹170** |
| **Geeta Sharma** ⭐ | **geeta@example.com** | **Mumbai** | **Cooking, Cleaning, Laundry, Ironing** | **8+ years** | **₹210** |

### Admin
| Username | Password |
|----------|----------|
| admin | admin123 |

⭐ = Newly added users

---

## 💼 Sample Jobs (5 Job Postings)

### 1. Full-time Cook Required
- **Posted by:** Priya Sharma (Mumbai)
- **Type:** Full-time
- **Salary:** ₹15,000-20,000/month
- **Requirements:** North Indian cuisine experience
- **Applications:** 2 (1 accepted, 1 reviewed)

### 2. Part-time House Help
- **Posted by:** Kavita Reddy (Bangalore)
- **Type:** Part-time
- **Salary:** ₹8,000-12,000/month
- **Requirements:** Morning hours, cleaning & laundry
- **Applications:** 2 (1 accepted, 1 pending)

### 3. Live-in House Help ⭐
- **Posted by:** Ritu Verma (Pune)
- **Type:** Live-in
- **Salary:** ₹18,000-25,000/month
- **Requirements:** Elderly care experience
- **Applications:** 2 (1 shortlisted, 1 reviewed)

### 4. Cook and Housekeeping ⭐
- **Posted by:** Divya Mehta (Mumbai)
- **Type:** Full-time
- **Salary:** ₹16,000-22,000/month
- **Requirements:** Cooking + housekeeping
- **Applications:** 2 (both pending)

### 5. Weekend House Help ⭐
- **Posted by:** Neha Patel (Delhi)
- **Type:** Part-time (weekends)
- **Salary:** ₹5,000-8,000/month
- **Requirements:** Deep cleaning experience
- **Applications:** 1 (pending)

---

## 🔗 Sample Connections (7 Connections)

| Employer | Helper | Status | Started |
|----------|--------|--------|---------|
| Priya Sharma | Meera Devi | Active | 15 days ago |
| Kavita Reddy | Anjali Kumari | Active | 10 days ago |
| Neha Patel | Sunita Singh | Pending | - |
| **Ritu Verma** ⭐ | **Pooja Yadav** ⭐ | **Active** | **5 days ago** |
| **Divya Mehta** ⭐ | **Geeta Sharma** ⭐ | **Pending** | **-** |

---

## 💬 Sample Messages (20+ Messages)

### Conversation 1: Priya ↔ Meera (6 messages)
Latest exchange about setting up an interview and discussing work arrangements.

### Conversation 2: Kavita ↔ Anjali (5 messages)
Discussion about salary expectations and start date.

### Conversation 3: Ritu ↔ Pooja ⭐ (4 messages)
Conversation about cooking skills and experience with South Indian cuisine.

### Conversation 4: Divya ↔ Geeta ⭐ (2 messages)
Initial contact for full-time house help position.

---

## ⭐ Sample Reviews (3 Reviews)

1. **Priya → Meera:** 5 stars - "Excellent work! Very professional and reliable. Highly recommended!"
2. **Kavita → Anjali:** 4 stars - "Good service, punctual and honest. Does quality work."
3. **Ritu → Pooja:** ⭐ 5 stars - "Amazing cook! My family loves her food. Very trustworthy."

---

## 🔔 Sample Notifications (5 Notifications)

- Message notifications for Meera and Geeta
- Application acceptance for Anjali
- New review notification for Pooja
- Connection status update for Priya

---

## 📊 Summary Statistics

- **Total Users:** 12 (5 employers + 7 helpers)
- **Active Connections:** 3
- **Pending Connections:** 2
- **Job Postings:** 5 (all active)
- **Job Applications:** 10
  - Accepted: 2
  - Shortlisted: 1
  - Reviewed: 3
  - Pending: 4
- **Messages:** 20+
- **Reviews:** 3
- **Notifications:** 5

---

## 🧪 Testing Scenarios

### Scenario 1: Employer Workflow
1. Login as **divya@example.com** (password: password123)
2. View dashboard with active jobs and pending applications
3. Check messages from Geeta Sharma
4. Review applications for "Cook and Housekeeping" job
5. Accept/reject applications

### Scenario 2: Job Seeker Workflow
1. Login as **pooja@example.com** (password: password123)
2. Browse available jobs
3. View connection with Ritu Verma
4. Check messages from employers
5. Apply for new jobs

### Scenario 3: Messaging System
1. Login as **ritu@example.com**
2. Go to Messages section
3. View conversation with Pooja Yadav
4. Send new messages
5. Real-time message updates

### Scenario 4: Job Application Flow
1. Login as **geeta@example.com**
2. Browse jobs
3. Apply for Divya's "Cook and Housekeeping" position
4. Track application status
5. Receive notifications

---

## 🚀 Quick Start

```bash
# Server is already running at http://localhost:3000

# Test login with any user:
# Email: divya@example.com (or any other from the list)
# Password: password123

# Admin access:
# URL: http://localhost:3000/admin
# Username: admin
# Password: admin123
```

---

## 📝 Notes

- All user passwords are: **password123** (except admin)
- Messages show realistic timestamps (ranging from 1-5 days ago)
- Reviews have dates to show activity history
- Job applications show different statuses for testing
- Connections show both active and pending states
- All data is fully relational and connected

---

## 🎨 Features to Test

✅ User registration & login (both employer and helper)  
✅ Profile management with role-specific fields  
✅ Job posting creation and management  
✅ Job search and filtering  
✅ Application submission and tracking  
✅ Connection requests and status updates  
✅ Real-time messaging between users  
✅ Review and rating system  
✅ Notifications system  
✅ Admin dashboard and user management  
✅ Saved profiles functionality  

All features are now fully populated with realistic test data!
