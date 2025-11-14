const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

// Get all conversations for current user
router.get('/conversations', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const sql = `
        SELECT DISTINCT 
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as user_id,
            u.full_name, u.profile_image, u.user_type
        FROM messages m
        JOIN users u ON (CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END) = u.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
    `;

    db.all(sql, [userId, userId, userId, userId], (err, conversations) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        // Get last message and unread count for each conversation
        const conversationsWithDetails = conversations.map(conv => {
            return new Promise((resolve) => {
                // Get last message
                db.get(`SELECT message, created_at FROM messages 
                        WHERE (sender_id = ? AND receiver_id = ?) 
                           OR (sender_id = ? AND receiver_id = ?)
                        ORDER BY created_at DESC LIMIT 1`,
                    [userId, conv.user_id, conv.user_id, userId],
                    (err, lastMsg) => {
                        // Get unread count
                        db.get(`SELECT COUNT(*) as count FROM messages 
                                WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
                            [conv.user_id, userId],
                            (err, unread) => {
                                resolve({
                                    ...conv,
                                    last_message: lastMsg ? lastMsg.message : null,
                                    last_message_time: lastMsg ? lastMsg.created_at : null,
                                    unread_count: unread ? unread.count : 0
                                });
                            });
                    });
            });
        });

        Promise.all(conversationsWithDetails).then(results => {
            // Sort by last message time
            results.sort((a, b) => {
                if (!a.last_message_time) return 1;
                if (!b.last_message_time) return -1;
                return new Date(b.last_message_time) - new Date(a.last_message_time);
            });

            res.json({
                success: true,
                conversations: results,
                count: results.length
            });
        });
    });
});

// Get messages with specific user
router.get('/:userId', authenticateToken, (req, res) => {
    const sql = `
        SELECT m.*, 
               s.full_name as sender_name, s.profile_image as sender_image,
               r.full_name as receiver_name, r.profile_image as receiver_image
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    `;

    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    db.all(sql, [currentUserId, otherUserId, otherUserId, currentUserId], (err, messages) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        // Mark messages as read
        db.run('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0',
            [otherUserId, currentUserId]);

        res.json({
            success: true,
            messages,
            count: messages.length
        });
    });
});

// Send message
router.post('/', authenticateToken, (req, res) => {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
        return res.status(400).json({ success: false, message: 'Receiver ID and message are required' });
    }

    db.run('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
        [req.user.id, receiverId, message], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error sending message', error: err.message });
            }

            // Create notification
            db.run(`INSERT INTO notifications (user_id, title, message, type) 
                    VALUES (?, ?, ?, ?)`,
                [receiverId, 'New Message', `You have received a new message`, 'info']);

            res.json({
                success: true,
                message: 'Message sent successfully',
                messageId: this.lastID
            });
        });
});

// Get unread message count
router.get('/unread/count', authenticateToken, (req, res) => {
    db.get('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0',
        [req.user.id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({
                success: true,
                unreadCount: result.count
            });
        });
});

// Mark messages as read
router.put('/mark-read/:userId', authenticateToken, (req, res) => {
    db.run('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0',
        [req.params.userId, req.user.id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error marking messages as read' });
            }

            res.json({
                success: true,
                message: 'Messages marked as read',
                updatedCount: this.changes
            });
        });
});

module.exports = router;
