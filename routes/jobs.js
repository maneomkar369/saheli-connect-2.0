const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

// Get all jobs with filters
router.get('/', (req, res) => {
    const { city, jobType, salaryMin, salaryMax, postedBy } = req.query;
    let sql = `
        SELECT j.*, u.full_name as employer_name, u.city as employer_city,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
        FROM jobs j
        JOIN users u ON j.employer_id = u.id
        WHERE j.status = 'active'
    `;
    const params = [];

    if (city) {
        sql += ' AND u.city LIKE ?';
        params.push(`%${city}%`);
    }

    if (jobType) {
        sql += ' AND j.job_type = ?';
        params.push(jobType);
    }

    if (salaryMin) {
        sql += ' AND j.salary >= ?';
        params.push(salaryMin);
    }

    if (salaryMax) {
        sql += ' AND j.salary <= ?';
        params.push(salaryMax);
    }

    if (postedBy) {
        sql += ' AND j.employer_id = ?';
        params.push(postedBy);
    }

    sql += ' ORDER BY j.created_at DESC';

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

// Get single job by ID
router.get('/:id', (req, res) => {
    const sql = `
        SELECT j.*, u.full_name as employer_name, u.email as employer_email, 
               u.phone as employer_phone, u.city as employer_city, u.profile_image as employer_image,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id AND status = 'pending') as pending_count
        FROM jobs j
        JOIN users u ON j.employer_id = u.id
        WHERE j.id = ?
    `;

    db.get(sql, [req.params.id], (err, job) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({
            success: true,
            job
        });
    });
});

// Create new job (employers only)
router.post('/', authenticateToken, (req, res) => {
    if (req.user.userType !== 'employer') {
        return res.status(403).json({ success: false, message: 'Only employers can post jobs' });
    }

    const { title, description, job_type, location, salary, requirements } = req.body;

    if (!title || !description || !job_type) {
        return res.status(400).json({ success: false, message: 'Title, description, and job type are required' });
    }

    db.run(`INSERT INTO jobs (employer_id, title, description, job_type, location, salary, requirements) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, title, description, job_type, location, salary, requirements],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error creating job', error: err.message });
            }

            res.json({
                success: true,
                message: 'Job created successfully',
                jobId: this.lastID
            });
        });
});

// Update job
router.put('/:id', authenticateToken, (req, res) => {
    const { title, description, job_type, location, salary, requirements, status } = req.body;

    db.get('SELECT employer_id FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employer_id !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'You can only edit your own jobs' });
        }

        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title);
        }
        if (description) {
            updates.push('description = ?');
            params.push(description);
        }
        if (job_type) {
            updates.push('job_type = ?');
            params.push(job_type);
        }
        if (location) {
            updates.push('location = ?');
            params.push(location);
        }
        if (salary !== undefined) {
            updates.push('salary = ?');
            params.push(salary);
        }
        if (requirements) {
            updates.push('requirements = ?');
            params.push(requirements);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(req.params.id);

        const sql = `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error updating job', error: err.message });
            }

            res.json({
                success: true,
                message: 'Job updated successfully'
            });
        });
    });
});

// Delete job
router.delete('/:id', authenticateToken, (req, res) => {
    db.get('SELECT employer_id FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employer_id !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'You can only delete your own jobs' });
        }

        db.run('DELETE FROM jobs WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error deleting job' });
            }

            res.json({ success: true, message: 'Job deleted successfully' });
        });
    });
});

// Apply for job (helpers only)
router.post('/:id/apply', authenticateToken, (req, res) => {
    if (req.user.userType !== 'helper') {
        return res.status(403).json({ success: false, message: 'Only helpers can apply for jobs' });
    }

    const { coverLetter } = req.body;

    // Check if already applied (job_applications uses helper_id)
    db.get('SELECT id FROM job_applications WHERE job_id = ? AND helper_id = ?',
        [req.params.id, req.user.id], (err, existing) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            if (existing) {
                return res.status(400).json({ success: false, message: 'You have already applied for this job' });
            }

            db.run('INSERT INTO job_applications (job_id, helper_id, cover_letter) VALUES (?, ?, ?)',
                [req.params.id, req.user.id, coverLetter], function(err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Error applying for job', error: err.message });
                    }

                    // Get employer ID for notification
                    db.get('SELECT employer_id FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
                        if (!err && job) {
                            db.run(`INSERT INTO notifications (user_id, title, message, type) 
                                    VALUES (?, ?, ?, ?)`,
                                [job.employer_id, 'New Job Application', `You have received a new application for your job posting`, 'info']);
                        }
                    });

                    res.json({
                        success: true,
                        message: 'Application submitted successfully',
                        applicationId: this.lastID
                    });
                });
        });
});

// Get applications for a job (employer only)
router.get('/:id/applications', authenticateToken, (req, res) => {
    // Verify job ownership
    db.get('SELECT employer_id FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.employer_id !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'You can only view applications for your own jobs' });
        }

        const sql = `
            SELECT ja.*, u.full_name, u.email, u.phone, u.profile_image, u.city,
                   hp.experience AS experience, hp.skills, hp.languages, hp.certifications, hp.hourly_rate
            FROM job_applications ja
            JOIN users u ON ja.helper_id = u.id
            LEFT JOIN helper_profiles hp ON u.id = hp.user_id
            WHERE ja.job_id = ?
            ORDER BY ja.created_at DESC
        `;

        db.all(sql, [req.params.id], (err, applications) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            res.json({
                success: true,
                applications,
                count: applications.length
            });
        });
    });
});

// Update application status
router.put('/applications/:applicationId', authenticateToken, (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Verify ownership
        db.get(`SELECT ja.id, j.employer_id, ja.helper_id 
            FROM job_applications ja 
            JOIN jobs j ON ja.job_id = j.id 
            WHERE ja.id = ?`, [req.params.applicationId], (err, application) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.employer_id !== req.user.id && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        db.run('UPDATE job_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, req.params.applicationId], function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error updating application status' });
                }

                // Notify applicant (helper)
                db.run(`INSERT INTO notifications (user_id, title, message, type) 
                        VALUES (?, ?, ?, ?)`,
                    [application.helper_id, 'Application Update', `Your job application status has been updated to: ${status}`, 'info']);

                res.json({
                    success: true,
                    message: 'Application status updated successfully'
                });
            });
    });
});

// Get my applications (helper)
router.get('/my/applications', authenticateToken, (req, res) => {
    if (req.user.userType !== 'helper') {
        return res.status(403).json({ success: false, message: 'Only helpers can view their applications' });
    }

    const sql = `
        SELECT ja.*, j.title, j.description, j.job_type, j.location, j.salary,
               u.full_name as employer_name, u.email as employer_email, u.city as employer_city
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        JOIN users u ON j.employer_id = u.id
        WHERE ja.helper_id = ?
        ORDER BY ja.created_at DESC
    `;

    db.all(sql, [req.user.id], (err, applications) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }

        res.json({
            success: true,
            applications,
            count: applications.length
        });
    });
});

module.exports = router;
