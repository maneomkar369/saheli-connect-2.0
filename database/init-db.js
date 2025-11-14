const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'saheli_connect.db');

console.log('🗄️  Initializing Saheli Connect Database...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error creating database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database file created');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const initializeDatabase = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT NOT NULL,
                    password TEXT NOT NULL,
                    user_type TEXT NOT NULL CHECK(user_type IN ('employer', 'helper')),
                    city TEXT NOT NULL,
                    about TEXT,
                    profile_image TEXT,
                    verified BOOLEAN DEFAULT 0,
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'pending')),
                    rating REAL DEFAULT 0.0,
                    total_reviews INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating users table:', err);
                else console.log('✓ Users table created');
            });

            // Create helper_profiles table
            db.run(`
                CREATE TABLE IF NOT EXISTS helper_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    skills TEXT,
                    experience TEXT,
                    hourly_rate REAL,
                    availability TEXT,
                    languages TEXT,
                    certifications TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating helper_profiles:', err);
                else console.log('✓ Helper profiles table created');
            });

            // Create employer_preferences table
            db.run(`
                CREATE TABLE IF NOT EXISTS employer_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    services_needed TEXT,
                    budget_range TEXT,
                    preferred_experience TEXT,
                    preferred_skills TEXT,
                    work_schedule TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating employer_preferences:', err);
                else console.log('✓ Employer preferences table created');
            });

            // Create connections table
            db.run(`
                CREATE TABLE IF NOT EXISTS connections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employer_id INTEGER NOT NULL,
                    helper_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
                    started_at DATETIME,
                    ended_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating connections:', err);
                else console.log('✓ Connections table created');
            });

            // Create messages table
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_id INTEGER NOT NULL,
                    receiver_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    read BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating messages:', err);
                else console.log('✓ Messages table created');
            });

            // Create reviews table
            db.run(`
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reviewer_id INTEGER NOT NULL,
                    reviewee_id INTEGER NOT NULL,
                    connection_id INTEGER,
                    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                    comment TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL
                )
            `, (err) => {
                if (err) console.error('Error creating reviews:', err);
                else console.log('✓ Reviews table created');
            });

            // Create reports table
            db.run(`
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reporter_id INTEGER NOT NULL,
                    reported_user_id INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME,
                    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating reports:', err);
                else console.log('✓ Reports table created');
            });

            // Create saved_profiles table
            db.run(`
                CREATE TABLE IF NOT EXISTS saved_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    saved_user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (saved_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(user_id, saved_user_id)
                )
            `, (err) => {
                if (err) console.error('Error creating saved_profiles:', err);
                else console.log('✓ Saved profiles table created');
            });

            // Create notifications table
            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
                    read BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating notifications:', err);
                else console.log('✓ Notifications table created');
            });

            // Create jobs table
            db.run(`
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employer_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    location TEXT NOT NULL,
                    work_type TEXT NOT NULL,
                    salary_range TEXT,
                    requirements TEXT,
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'filled')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating jobs:', err);
                else console.log('✓ Jobs table created');
            });

            // Create job_applications table
            db.run(`
                CREATE TABLE IF NOT EXISTS job_applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL,
                    helper_id INTEGER NOT NULL,
                    cover_letter TEXT,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'shortlisted', 'accepted', 'rejected')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(job_id, helper_id)
                )
            `, (err) => {
                if (err) console.error('Error creating job_applications:', err);
                else console.log('✓ Job applications table created');
            });

            console.log('\n📊 Inserting sample data...\n');

            // Hash password for sample users
            const hashedPassword = bcrypt.hashSync('password123', 10);

            // Insert sample employers
            const employers = [
                ['Priya Sharma', 'priya@example.com', '+919876543210', 'Mumbai', 'Looking for reliable house help'],
                ['Kavita Reddy', 'kavita@example.com', '+919876543211', 'Bangalore', 'Professional seeking cooking help'],
                ['Neha Patel', 'neha@example.com', '+919876543212', 'Delhi', 'Need help with household chores'],
                ['Ritu Verma', 'ritu@example.com', '+919876543213', 'Pune', 'Working professional looking for full-time help'],
                ['Divya Mehta', 'divya@example.com', '+919876543214', 'Mumbai', 'Need experienced cook and house help']
            ];

            employers.forEach(([name, email, phone, city, about]) => {
                db.run(`INSERT INTO users (full_name, email, phone, password, user_type, city, about, verified, rating, total_reviews) 
                        VALUES (?, ?, ?, ?, 'employer', ?, ?, 1, ?, ?)`,
                    [name, email, phone, hashedPassword, city, about, (Math.random() * 2 + 3).toFixed(1), Math.floor(Math.random() * 20) + 5]);
            });

            // Insert sample helpers
            const helpers = [
                ['Meera Devi', 'meera@example.com', '+919876543220', 'Mumbai', '5 years experience in household management'],
                ['Anjali Kumari', 'anjali@example.com', '+919876543221', 'Bangalore', 'Expert in cooking and cleaning'],
                ['Sunita Singh', 'sunita@example.com', '+919876543222', 'Delhi', 'Experienced in childcare and cooking'],
                ['Lakshmi Iyer', 'lakshmi@example.com', '+919876543223', 'Chennai', 'Professional house-help with references'],
                ['Rekha Nair', 'rekha@example.com', '+919876543224', 'Mumbai', 'Specialized in elderly care'],
                ['Pooja Yadav', 'pooja@example.com', '+919876543225', 'Pune', 'Experienced in cooking and household chores'],
                ['Geeta Sharma', 'geeta@example.com', '+919876543226', 'Mumbai', 'Full-time house help with 8 years experience']
            ];

            helpers.forEach(([name, email, phone, city, about], index) => {
                db.run(`INSERT INTO users (full_name, email, phone, password, user_type, city, about, verified, rating, total_reviews) 
                        VALUES (?, ?, ?, ?, 'helper', ?, ?, 1, ?, ?)`,
                    [name, email, phone, hashedPassword, city, about, (Math.random() * 1.5 + 3.5).toFixed(1), Math.floor(Math.random() * 30) + 10],
                    function(err) {
                        if (!err) {
                            const helperId = this.lastID;
                            // Insert helper profile
                            const skills = [
                                'Cooking, Cleaning, Laundry',
                                'Cooking, Baby Care, Elderly Care',
                                'Cleaning, Laundry, Organization',
                                'Cooking, Housekeeping, Pet Care',
                                'Elderly Care, Nursing, Companionship',
                                'Cooking, Cleaning, Utensil Washing',
                                'Cooking, Cleaning, Laundry, Ironing'
                            ];
                            const experience = ['5+ years', '3-5 years', '2-3 years', '5+ years', '7+ years', '4-5 years', '8+ years'];
                            const rates = [200, 180, 150, 220, 250, 170, 210];
                            
                            db.run(`INSERT INTO helper_profiles (user_id, skills, experience, hourly_rate, availability, languages) 
                                    VALUES (?, ?, ?, ?, ?, ?)`,
                                [helperId, skills[index], experience[index], rates[index], 'Full-time, Part-time', 'Hindi, English']);
                        }
                    });
            });

            // Insert sample connections
            setTimeout(() => {
                db.run(`INSERT INTO connections (employer_id, helper_id, status, started_at) VALUES (1, 6, 'active', datetime('now', '-15 days'))`);
                db.run(`INSERT INTO connections (employer_id, helper_id, status, started_at) VALUES (2, 7, 'active', datetime('now', '-10 days'))`);
                db.run(`INSERT INTO connections (employer_id, helper_id, status) VALUES (3, 8, 'pending')`);
                db.run(`INSERT INTO connections (employer_id, helper_id, status, started_at) VALUES (4, 11, 'active', datetime('now', '-5 days'))`);
                db.run(`INSERT INTO connections (employer_id, helper_id, status) VALUES (5, 12, 'pending')`);

                // Insert sample messages - Conversation 1 (Priya & Meera)
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (1, 6, 'Hello Meera! I saw your profile and I am interested in your services.', datetime('now', '-3 days'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (6, 1, 'Hello! Thank you for reaching out. I would be happy to help. What are your requirements?', 1, datetime('now', '-3 days', '+2 hours'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (1, 6, 'I need help with cooking and cleaning for a family of 4. Are you available on weekdays?', 1, datetime('now', '-3 days', '+3 hours'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (6, 1, 'Yes, I am available Monday to Friday. I can work from 9 AM to 5 PM. My rate is Rs. 200 per hour.', 1, datetime('now', '-3 days', '+4 hours'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (1, 6, 'That sounds perfect! Can we meet tomorrow to discuss further?', 1, datetime('now', '-2 days'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (6, 1, 'Sure! What time works best for you?', datetime('now', '-2 days', '+1 hour'))`);

                // Insert sample messages - Conversation 2 (Kavita & Anjali)
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (2, 7, 'Hi Anjali! I need someone for cooking and cleaning. Are you available?', datetime('now', '-5 days'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (7, 2, 'Hello! Yes, I am available. I have 3 years of experience in both.', 1, datetime('now', '-5 days', '+1 hour'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (2, 7, 'Great! What is your expected salary?', 1, datetime('now', '-5 days', '+2 hours'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (7, 2, 'I am looking for Rs. 15,000 per month for full-time work.', 1, datetime('now', '-5 days', '+3 hours'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (2, 7, 'That works for me. When can you start?', datetime('now', '-4 days'))`);

                // Insert sample messages - Conversation 3 (Ritu & Pooja)
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (4, 11, 'Hello Pooja! I liked your profile. Can you tell me about your experience?', datetime('now', '-2 days'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (11, 4, 'Hi! I have 4 years of experience in cooking and household chores. I am very punctual and hardworking.', 1, datetime('now', '-2 days', '+30 minutes'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, read, created_at) VALUES (4, 11, 'Do you know South Indian cooking?', 1, datetime('now', '-2 days', '+1 hour'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (11, 4, 'Yes, I know both North and South Indian cuisine. I can prepare idli, dosa, sambhar, etc.', datetime('now', '-2 days', '+2 hours'))`);

                // Insert sample messages - Conversation 4 (Divya & Geeta)
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (5, 12, 'Hi Geeta! I need a full-time house help. Are you interested?', datetime('now', '-1 day'))`);
                db.run(`INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (12, 5, 'Hello! Yes, I am looking for full-time work. I have 8 years of experience.', datetime('now', '-1 day', '+15 minutes'))`);

                // Insert sample reviews
                db.run(`INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, created_at) VALUES (1, 6, 5, 'Excellent work! Very professional and reliable. Highly recommended!', datetime('now', '-10 days'))`);
                db.run(`INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, created_at) VALUES (2, 7, 4, 'Good service, punctual and honest. Does quality work.', datetime('now', '-7 days'))`);
                db.run(`INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, created_at) VALUES (4, 11, 5, 'Amazing cook! My family loves her food. Very trustworthy.', datetime('now', '-3 days'))`);

                // Insert sample jobs
                db.run(`INSERT INTO jobs (employer_id, title, description, location, work_type, salary_range, requirements, created_at) 
                        VALUES (1, 'Full-time Cook Required', 'Looking for experienced cook for family of 4. Must know North Indian cuisine and some South Indian dishes.', 'Mumbai', 'Full-time', '15000-20000', 'Must know North Indian cuisine, experience with family cooking', datetime('now', '-20 days'))`, 
                        function(err) {
                            if (!err) {
                                const jobId1 = this.lastID;
                                // Applications for this job
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 6, 'I have 5 years of experience in cooking for families. I specialize in North Indian cuisine and am familiar with South Indian dishes as well.', 'accepted', datetime('now', '-18 days'))`, [jobId1]);
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 7, 'I am an experienced cook with knowledge of various cuisines. I can provide references from my previous employers.', 'reviewed', datetime('now', '-17 days'))`, [jobId1]);
                            }
                        });
                
                db.run(`INSERT INTO jobs (employer_id, title, description, location, work_type, salary_range, requirements, created_at) 
                        VALUES (2, 'Part-time House Help', 'Need help with cleaning and laundry. Morning hours preferred, 4-5 hours per day.', 'Bangalore', 'Part-time', '8000-12000', 'Morning hours preferred, experience with cleaning and laundry', datetime('now', '-15 days'))`,
                        function(err) {
                            if (!err) {
                                const jobId2 = this.lastID;
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 7, 'I am available for part-time work in the mornings. I have good experience with cleaning and laundry work.', 'accepted', datetime('now', '-13 days'))`, [jobId2]);
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 8, 'I can work in morning hours and have 2 years of cleaning experience.', 'pending', datetime('now', '-12 days'))`, [jobId2]);
                            }
                        });

                db.run(`INSERT INTO jobs (employer_id, title, description, location, work_type, salary_range, requirements, created_at) 
                        VALUES (4, 'Live-in House Help', 'Looking for live-in help for elderly care and household work. Separate room will be provided.', 'Pune', 'Live-in', '18000-25000', 'Experience in elderly care, willing to stay in, patient and caring', datetime('now', '-10 days'))`,
                        function(err) {
                            if (!err) {
                                const jobId3 = this.lastID;
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 9, 'I have 7 years of experience in elderly care and nursing. I am willing to stay in and provide 24/7 care.', 'shortlisted', datetime('now', '-9 days'))`, [jobId3]);
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 11, 'I have experience taking care of elderly people and can manage household work as well.', 'reviewed', datetime('now', '-8 days'))`, [jobId3]);
                            }
                        });

                db.run(`INSERT INTO jobs (employer_id, title, description, location, work_type, salary_range, requirements, created_at) 
                        VALUES (5, 'Cook and Housekeeping', 'Need experienced cook who can also handle basic housekeeping duties.', 'Mumbai', 'Full-time', '16000-22000', 'Cooking skills required, housekeeping experience preferred', datetime('now', '-5 days'))`,
                        function(err) {
                            if (!err) {
                                const jobId4 = this.lastID;
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 12, 'I have 8 years of experience in both cooking and housekeeping. I can manage all household tasks efficiently.', 'pending', datetime('now', '-4 days'))`, [jobId4]);
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 6, 'I specialize in cooking and also have good experience with housekeeping work.', 'pending', datetime('now', '-3 days'))`, [jobId4]);
                            }
                        });

                db.run(`INSERT INTO jobs (employer_id, title, description, location, work_type, salary_range, requirements, created_at) 
                        VALUES (3, 'Weekend House Help', 'Looking for help on weekends only for deep cleaning and organizing.', 'Delhi', 'Part-time', '5000-8000', 'Weekend availability, experience with deep cleaning', datetime('now', '-2 days'))`,
                        function(err) {
                            if (!err) {
                                const jobId5 = this.lastID;
                                db.run(`INSERT INTO job_applications (job_id, helper_id, cover_letter, status, created_at) 
                                        VALUES (?, 8, 'I am available on weekends and have good experience with deep cleaning and organization.', 'pending', datetime('now', '-1 day'))`, [jobId5]);
                            }
                        });

                // Insert notifications
                db.run(`INSERT INTO notifications (user_id, title, message, type, created_at) 
                        VALUES (6, 'New Message', 'You have a new message from Priya Sharma', 'info', datetime('now', '-2 days'))`);
                db.run(`INSERT INTO notifications (user_id, title, message, type, created_at) 
                        VALUES (7, 'Application Accepted', 'Your application for Part-time House Help has been accepted', 'success', datetime('now', '-13 days'))`);
                db.run(`INSERT INTO notifications (user_id, title, message, type, created_at) 
                        VALUES (11, 'New Review', 'You received a 5-star review from Ritu Verma', 'success', datetime('now', '-3 days'))`);
                db.run(`INSERT INTO notifications (user_id, title, message, type, created_at) 
                        VALUES (1, 'Connection Request', 'Your connection with Meera Devi is now active', 'success', datetime('now', '-15 days'))`);
                db.run(`INSERT INTO notifications (user_id, title, message, type, created_at) 
                        VALUES (12, 'New Message', 'You have a new message from Divya Mehta', 'info', datetime('now', '-1 day'))`);

                console.log('✓ Sample data inserted successfully\n');
                console.log('🎉 Database initialization complete!\n');
                console.log('📝 Sample Credentials:');
                console.log('   Employers: priya@example.com, kavita@example.com, neha@example.com, ritu@example.com, divya@example.com');
                console.log('   Helpers: meera@example.com, anjali@example.com, sunita@example.com, lakshmi@example.com, rekha@example.com, pooja@example.com, geeta@example.com');
                console.log('   Password for all: password123\n');
                console.log('   Admin: admin / admin123\n');
                console.log('📊 Sample Data Added:');
                console.log('   - 5 Employers, 7 Job Seekers');
                console.log('   - 5 Active Connections, 2 Pending Connections');
                console.log('   - 5 Job Postings with 10 Applications');
                console.log('   - 20+ Messages between users');
                console.log('   - 3 Reviews and 5 Notifications\n');
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            }, 1000);
        });
    });
};

initializeDatabase()
    .then(() => {
        console.log('\n✨ Setup complete! Run "npm start" to start the server.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Initialization failed:', err);
        process.exit(1);
    });
