const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    const sql = `
        SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.city, u.about, 
               u.profile_image, u.verified, u.status, u.rating, u.total_reviews, u.created_at
        FROM users u
        WHERE u.id = ?
    `;

    db.get(sql, [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get additional profile data based on user type
        if (user.user_type === 'helper') {
            db.get('SELECT * FROM helper_profiles WHERE user_id = ?', [user.id], (err, profile) => {
                res.json({
                    success: true,
                    user: { ...user, helper_profile: profile }
                });
            });
        } else {
            db.get('SELECT * FROM employer_preferences WHERE user_id = ?', [user.id], (err, preferences) => {
                res.json({
                    success: true,
                    user: { ...user, employer_preferences: preferences }
                });
            });
        }
    });
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
    const { fullName, phone, city, about } = req.body;
    
    const sql = `UPDATE users SET full_name = ?, phone = ?, city = ?, about = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    db.run(sql, [fullName, phone, city, about, req.user.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    });
});

// Update helper profile
router.put('/profile/helper', authenticateToken, (req, res) => {
    const { skills, experience, hourlyRate, availability, languages, certifications } = req.body;
    
    const sql = `UPDATE helper_profiles SET skills = ?, experience = ?, hourly_rate = ?, 
                 availability = ?, languages = ?, certifications = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`;
    
    db.run(sql, [skills, experience, hourlyRate, availability, languages, certifications, req.user.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to update helper profile', error: err.message });
        }

        if (this.changes === 0) {
            // Insert if doesn't exist
            db.run(`INSERT INTO helper_profiles (user_id, skills, experience, hourly_rate, availability, languages, certifications) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, skills, experience, hourlyRate, availability, languages, certifications]);
        }

        res.json({
            success: true,
            message: 'Helper profile updated successfully'
        });
    });
});

// Search users
router.get('/search', authenticateToken, (req, res) => {
    const { userType, city, skills, experience, rating, keywords } = req.query;
    
    let sql = `
        SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.city, u.about, 
               u.profile_image, u.verified, u.rating, u.total_reviews, u.created_at
        FROM users u
        WHERE u.status = 'active' AND u.id != ?
    `;
    const params = [req.user.id];

    if (userType) {
        sql += ' AND u.user_type = ?';
        params.push(userType);
    }

    if (city) {
        sql += ' AND u.city LIKE ?';
        params.push(`%${city}%`);
    }

    if (rating) {
        sql += ' AND u.rating >= ?';
        params.push(rating);
    }

    if (keywords) {
        sql += ' AND (u.full_name LIKE ? OR u.about LIKE ?)';
        params.push(`%${keywords}%`, `%${keywords}%`);
    }

    if (userType === 'helper' && skills) {
        sql = `
            SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.city, u.about, 
                   u.profile_image, u.verified, u.rating, u.total_reviews, u.created_at,
                   h.skills, h.experience, h.hourly_rate, h.availability
            FROM users u
            LEFT JOIN helper_profiles h ON u.id = h.user_id
            WHERE u.status = 'active' AND u.id != ? AND u.user_type = 'helper'
        `;
        params[0] = req.user.id;
        
        if (city) {
            sql += ' AND u.city LIKE ?';
            params.push(`%${city}%`);
        }
        
        sql += ' AND h.skills LIKE ?';
        params.push(`%${skills}%`);
    }

    sql += ' ORDER BY u.rating DESC, u.created_at DESC LIMIT 50';

    db.all(sql, params, (err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            users,
            count: users.length
        });
    });
});

// Get user stats (MUST BE BEFORE /:id route)
router.get('/stats', authenticateToken, (req, res) => {
    const stats = {};

    // Get connection count
    db.get(`SELECT COUNT(*) as count FROM connections 
            WHERE (employer_id = ? OR helper_id = ?) AND status = 'active'`,
        [req.user.id, req.user.id], (err, result) => {
            stats.activeConnections = result ? result.count : 0;

            // Get review count
            db.get('SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = ?', 
                [req.user.id], (err, result) => {
                    stats.totalReviews = result ? result.count : 0;

                    // Get saved profiles count
                    db.get('SELECT COUNT(*) as count FROM saved_profiles WHERE user_id = ?', 
                        [req.user.id], (err, result) => {
                            stats.savedProfiles = result ? result.count : 0;

                            res.json({ success: true, stats });
                        });
                });
        });
});

// Get notifications (MUST BE BEFORE /:id route)
router.get('/notifications', authenticateToken, (req, res) => {
    db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', 
        [req.user.id], (err, notifications) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            res.json({
                success: true,
                notifications,
                count: notifications.length
            });
        });
});

// Get unread notification count (MUST BE BEFORE /:id route)
router.get('/notifications/unread/count', authenticateToken, (req, res) => {
    db.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0', 
        [req.user.id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({ success: true, count: result ? result.count : 0 });
        });
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, (req, res) => {
    db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', 
        [req.params.id, req.user.id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error updating notification' });
            }

            res.json({ success: true, message: 'Notification marked as read' });
        });
});

// Get saved profiles (MUST BE BEFORE /:id route)
router.get('/saved/list', authenticateToken, (req, res) => {
    const sql = `
        SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.city, u.about, 
               u.profile_image, u.verified, u.rating, u.total_reviews, sp.created_at as saved_at
        FROM saved_profiles sp
        JOIN users u ON sp.saved_user_id = u.id
        WHERE sp.user_id = ?
        ORDER BY sp.created_at DESC
    `;

    db.all(sql, [req.user.id], (err, profiles) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            savedProfiles: profiles,
            count: profiles.length
        });
    });
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
    const sql = `
        SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.city, u.about, 
               u.profile_image, u.verified, u.status, u.rating, u.total_reviews, u.created_at
        FROM users u
        WHERE u.id = ?
    `;

    db.get(sql, [req.params.id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get additional profile data based on user type
        if (user.user_type === 'helper') {
            db.get('SELECT * FROM helper_profiles WHERE user_id = ?', [user.id], (err, profile) => {
                res.json({
                    success: true,
                    user: { ...user, helper_profile: profile }
                });
            });
        } else {
            db.get('SELECT * FROM employer_preferences WHERE user_id = ?', [user.id], (err, preferences) => {
                res.json({
                    success: true,
                    user: { ...user, employer_preferences: preferences }
                });
            });
        }
    });
});

// Save/Unsave profile
router.post('/saved/:userId', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const savedUserId = req.params.userId;

    // Check if already saved
    db.get('SELECT id FROM saved_profiles WHERE user_id = ? AND saved_user_id = ?', 
        [userId, savedUserId], (err, existing) => {
            if (existing) {
                // Unsave
                db.run('DELETE FROM saved_profiles WHERE user_id = ? AND saved_user_id = ?', 
                    [userId, savedUserId], (err) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Error unsaving profile' });
                        }
                        res.json({ success: true, message: 'Profile unsaved', saved: false });
                    });
            } else {
                // Save
                db.run('INSERT INTO saved_profiles (user_id, saved_user_id) VALUES (?, ?)', 
                    [userId, savedUserId], (err) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Error saving profile' });
                        }
                        res.json({ success: true, message: 'Profile saved', saved: true });
                    });
            }
        });
});

// Submit review
router.post('/reviews', authenticateToken, (req, res) => {
    const { revieweeId, rating, comment, connectionId } = req.body;

    if (!revieweeId || !rating) {
        return res.status(400).json({ success: false, message: 'Reviewee ID and rating are required' });
    }

    db.run('INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, connection_id) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, revieweeId, rating, comment, connectionId], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error submitting review', error: err.message });
            }

            // Update reviewee's rating
            db.run(`UPDATE users SET 
                    rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?),
                    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?)
                    WHERE id = ?`, [revieweeId, revieweeId, revieweeId]);

            res.json({
                success: true,
                message: 'Review submitted successfully',
                reviewId: this.lastID
            });
        });
});

// Get user reviews
router.get('/:userId/reviews', authenticateToken, (req, res) => {
    const sql = `
        SELECT r.*, u.full_name as reviewer_name, u.profile_image as reviewer_image
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.reviewee_id = ?
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [req.params.userId], (err, reviews) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            reviews,
            count: reviews.length
        });
    });
});

// Submit report
router.post('/reports', authenticateToken, (req, res) => {
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId || !reason) {
        return res.status(400).json({ success: false, message: 'Reported user ID and reason are required' });
    }

    db.run('INSERT INTO reports (reporter_id, reported_user_id, reason, description) VALUES (?, ?, ?, ?)',
        [req.user.id, reportedUserId, reason, description], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error submitting report', error: err.message });
            }

            res.json({
                success: true,
                message: 'Report submitted successfully',
                reportId: this.lastID
            });
        });
});

module.exports = router;
