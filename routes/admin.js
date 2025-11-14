const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const db = require('../database/db');

// Get dashboard stats
router.get('/stats', authenticateAdmin, (req, res) => {
    const stats = {};

    // Total users by type
    db.get('SELECT COUNT(*) as total, SUM(CASE WHEN user_type = "employer" THEN 1 ELSE 0 END) as employers, SUM(CASE WHEN user_type = "helper" THEN 1 ELSE 0 END) as helpers FROM users WHERE user_type != "admin"', 
        (err, userStats) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            stats.users = userStats;

            // Total connections by status
            db.get('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending FROM connections',
                (err, connStats) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }

                    stats.connections = connStats;

                    // Total jobs
                    db.get('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM jobs',
                        (err, jobStats) => {
                            if (err) {
                                return res.status(500).json({ success: false, message: 'Database error' });
                            }

                            stats.jobs = jobStats;

                            // Total reports
                            db.get('SELECT COUNT(*) as total, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending FROM reports',
                                (err, reportStats) => {
                                    if (err) {
                                        return res.status(500).json({ success: false, message: 'Database error' });
                                    }

                                    stats.reports = reportStats;

                                    // Recent activity
                                    db.all('SELECT created_at FROM users ORDER BY created_at DESC LIMIT 10',
                                        (err, recentUsers) => {
                                            stats.recentSignups = recentUsers ? recentUsers.length : 0;

                                            res.json({
                                                success: true,
                                                stats
                                            });
                                        });
                                });
                        });
                });
        });
});

// Get all users with pagination
router.get('/users', authenticateAdmin, (req, res) => {
    const { page = 1, limit = 20, userType, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, full_name, email, phone, city, user_type, account_status, created_at FROM users WHERE user_type != "admin"';
    const params = [];

    if (userType) {
        sql += ' AND user_type = ?';
        params.push(userType);
    }

    if (status) {
        sql += ' AND account_status = ?';
        params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(sql, params, (err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM users WHERE user_type != "admin"';
        const countParams = [];

        if (userType) {
            countSql += ' AND user_type = ?';
            countParams.push(userType);
        }

        if (status) {
            countSql += ' AND account_status = ?';
            countParams.push(status);
        }

        db.get(countSql, countParams, (err, count) => {
            res.json({
                success: true,
                users,
                pagination: {
                    total: count.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count.total / limit)
                }
            });
        });
    });
});

// Get single user details
router.get('/users/:id', authenticateAdmin, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        delete user.password;

        // Get additional profile data based on user type
        if (user.user_type === 'helper') {
            db.get('SELECT * FROM helper_profiles WHERE user_id = ?', [user.id], (err, profile) => {
                user.profile = profile;
                res.json({ success: true, user });
            });
        } else if (user.user_type === 'employer') {
            db.get('SELECT * FROM employer_preferences WHERE user_id = ?', [user.id], (err, preferences) => {
                user.preferences = preferences;
                res.json({ success: true, user });
            });
        } else {
            res.json({ success: true, user });
        }
    });
});

// Update user account status
router.put('/users/:id/status', authenticateAdmin, (req, res) => {
    const { accountStatus } = req.body;

    if (!accountStatus) {
        return res.status(400).json({ success: false, message: 'Account status is required' });
    }

    db.run('UPDATE users SET account_status = ? WHERE id = ?', [accountStatus, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error updating user status' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Notify user
        db.run(`INSERT INTO notifications (user_id, title, message, type) 
                VALUES (?, ?, ?, ?)`,
            [req.params.id, 'Account Status Update', `Your account status has been changed to: ${accountStatus}`, 'warning']);

        res.json({
            success: true,
            message: 'User status updated successfully'
        });
    });
});

// Delete user
router.delete('/users/:id', authenticateAdmin, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    });
});

// Get all connections with filters
router.get('/connections', authenticateAdmin, (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT c.*, 
               emp.full_name as employer_name, emp.email as employer_email,
               hlp.full_name as helper_name, hlp.email as helper_email
        FROM connections c
        JOIN users emp ON c.employer_id = emp.id
        JOIN users hlp ON c.helper_id = hlp.id
    `;
    const params = [];

    if (status) {
        sql += ' WHERE c.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(sql, params, (err, connections) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            connections,
            count: connections.length
        });
    });
});

// Get all reports
router.get('/reports', authenticateAdmin, (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT r.*, 
               reporter.full_name as reporter_name, reporter.email as reporter_email,
               reported.full_name as reported_name, reported.email as reported_email
        FROM reports r
        JOIN users reporter ON r.reporter_id = reporter.id
        JOIN users reported ON r.reported_user_id = reported.id
    `;
    const params = [];

    if (status) {
        sql += ' WHERE r.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(sql, params, (err, reports) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            reports,
            count: reports.length
        });
    });
});

// Update report status
router.put('/reports/:id', authenticateAdmin, (req, res) => {
    const { status, adminNotes } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (adminNotes) {
        updates.push('admin_notes = ?');
        params.push(adminNotes);
    }

    params.push(req.params.id);

    db.run(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error updating report' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({
            success: true,
            message: 'Report updated successfully'
        });
    });
});

// Get all jobs
router.get('/jobs', authenticateAdmin, (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT j.*, u.full_name as employer_name, u.email as employer_email,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
        FROM jobs j
        JOIN users u ON j.employer_id = u.id
    `;
    const params = [];

    if (status) {
        sql += ' WHERE j.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(sql, params, (err, jobs) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            jobs,
            count: jobs.length
        });
    });
});

// Delete job
router.delete('/jobs/:id', authenticateAdmin, (req, res) => {
    db.run('DELETE FROM jobs WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting job' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, message: 'Job deleted successfully' });
    });
});

module.exports = router;
