const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

// Get all connections for current user
router.get('/', authenticateToken, (req, res) => {
    const sql = `
        SELECT c.*, 
               emp.full_name as employer_name, emp.email as employer_email, emp.city as employer_city,
               hlp.full_name as helper_name, hlp.email as helper_email, hlp.city as helper_city,
               hlp.rating as helper_rating
        FROM connections c
        JOIN users emp ON c.employer_id = emp.id
        JOIN users hlp ON c.helper_id = hlp.id
        WHERE c.employer_id = ? OR c.helper_id = ?
        ORDER BY c.created_at DESC
    `;

    db.all(sql, [req.user.id, req.user.id], (err, connections) => {
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

// Create connection request
router.post('/', authenticateToken, (req, res) => {
    const { helperId, employerId } = req.body;

    if (!helperId || !employerId) {
        return res.status(400).json({ success: false, message: 'Helper ID and Employer ID are required' });
    }

    // Check if connection already exists
    db.get('SELECT id FROM connections WHERE employer_id = ? AND helper_id = ?', 
        [employerId, helperId], (err, existing) => {
            if (existing) {
                return res.status(400).json({ success: false, message: 'Connection already exists' });
            }

            db.run('INSERT INTO connections (employer_id, helper_id, status) VALUES (?, ?, ?)',
                [employerId, helperId, 'pending'], function(err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Error creating connection', error: err.message });
                    }

                    // Create notification for helper
                    db.run(`INSERT INTO notifications (user_id, title, message, type) 
                            VALUES (?, ?, ?, ?)`,
                        [helperId, 'New Connection Request', 'You have received a new connection request', 'info']);

                    res.json({
                        success: true,
                        message: 'Connection request sent successfully',
                        connectionId: this.lastID
                    });
                });
        });
});

// Update connection status
router.put('/:id', authenticateToken, (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    let updateSql = 'UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (status === 'active') {
        updateSql += ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'completed' || status === 'cancelled') {
        updateSql += ', ended_at = CURRENT_TIMESTAMP';
    }

    updateSql += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(updateSql, params, function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error updating connection', error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        res.json({
            success: true,
            message: 'Connection status updated successfully'
        });
    });
});

// Delete connection
router.delete('/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM connections WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting connection' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        res.json({ success: true, message: 'Connection deleted successfully' });
    });
});

module.exports = router;
