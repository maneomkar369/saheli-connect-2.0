const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            userType: user.user_type,
            role: user.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, userType, city, about } = req.body;

        // Validate input
        if (!fullName || !email || !phone || !password || !userType || !city) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const sql = `INSERT INTO users (full_name, email, phone, password, user_type, city, about) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [fullName, email, phone, hashedPassword, userType, city, about || ''], function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
                }

                const userId = this.lastID;

                // Create profile based on user type
                if (userType === 'helper') {
                    db.run('INSERT INTO helper_profiles (user_id) VALUES (?)', [userId]);
                } else if (userType === 'employer') {
                    db.run('INSERT INTO employer_preferences (user_id) VALUES (?)', [userId]);
                }

                // Get created user
                db.get('SELECT id, full_name, email, phone, user_type, city, about, verified, status FROM users WHERE id = ?', 
                    [userId], (err, user) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Error fetching user' });
                        }

                        const token = generateToken(user);

                        res.status(201).json({
                            success: true,
                            message: 'User registered successfully',
                            token,
                            user: {
                                id: user.id,
                                full_name: user.full_name,
                                email: user.email,
                                phone: user.phone,
                                user_type: user.user_type,
                                city: user.city,
                                about: user.about,
                                verified: user.verified,
                                status: user.status
                            }
                        });
                    });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if account is suspended
            if (user.status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been suspended. Please contact support.'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    user_type: user.user_type,
                    city: user.city,
                    about: user.about,
                    verified: user.verified,
                    status: user.status,
                    rating: user.rating
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Admin login
router.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Check admin credentials
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { id: 'admin', username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Admin login successful',
                token,
                admin: {
                    username,
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
