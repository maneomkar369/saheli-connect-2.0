// Job Seeker Dashboard Script

// Check authentication
if (!checkAuth()) {
    window.location.href = '/';
}

const userType = localStorage.getItem('userType');
if (userType !== 'helper') {
    window.location.href = '/';
}

// Global variables
let currentChatUser = null;
let currentJobId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadOverviewData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    // Search jobs
    document.getElementById('searchBtn').addEventListener('click', searchJobs);

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', updateProfile);

    // Apply form submission
    document.getElementById('applyForm').addEventListener('submit', applyForJob);

    // Send message
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Close modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

// Switch sections
function switchSection(section) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Show section
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(section).classList.add('active');

    // Load section data
    switch(section) {
        case 'overview':
            loadOverviewData();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'connections':
            loadConnections();
            break;
        case 'messages':
            loadConversations();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'profile':
            loadUserProfile();
            break;
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            const user = data.user;
            document.getElementById('userName').textContent = user.full_name;
            document.getElementById('welcomeName').textContent = user.full_name;
            
            // Fill profile form
            document.getElementById('profileFullName').value = user.full_name || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profilePhone').value = user.phone || '';
            document.getElementById('profileCity').value = user.city || '';
            document.getElementById('profileAddress').value = user.address || '';

            // Fill helper profile
            if (user.helperProfile) {
                document.getElementById('experienceYears').value = user.helperProfile.experience_years || '';
                document.getElementById('skills').value = user.helperProfile.skills || '';
                document.getElementById('languages').value = user.helperProfile.languages || '';
                document.getElementById('availability').value = user.helperProfile.availability || '';
                document.getElementById('preferredJobType').value = user.helperProfile.preferred_job_type || '';
                document.getElementById('expectedSalary').value = user.helperProfile.expected_salary || '';
                document.getElementById('bio').value = user.helperProfile.bio || '';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load overview data
async function loadOverviewData() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_BASE_URL}/users/stats`, {
            headers: getAuthHeaders()
        });
        const statsData = await statsResponse.json();

        if (statsData.success) {
            document.getElementById('connectionsCount').textContent = statsData.stats.connectionsCount || 0;
        }

        // Load applications count
        const appsResponse = await fetch(`${API_BASE_URL}/jobs/my/applications`, {
            headers: getAuthHeaders()
        });
        const appsData = await appsResponse.json();
        if (appsData.success) {
            document.getElementById('applicationsCount').textContent = appsData.count;
        }

        // Load profile with rating
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders()
        });
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.user.helperProfile) {
            document.getElementById('rating').textContent = profileData.user.helperProfile.rating || '0.0';
        }

        // Load unread messages count
        const messagesResponse = await fetch(`${API_BASE_URL}/messages/unread/count`, {
            headers: getAuthHeaders()
        });
        const messagesData = await messagesResponse.json();
        if (messagesData.success) {
            const count = messagesData.unreadCount;
            document.getElementById('messagesCount').textContent = count;
            if (count > 0) {
                document.getElementById('messageCount').textContent = count;
            }
        }

        // Load notifications
        loadNotifications();
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/notifications`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            const notificationsList = document.getElementById('notificationsList');
            if (data.notifications.length === 0) {
                notificationsList.innerHTML = '<p>No notifications</p>';
            } else {
                notificationsList.innerHTML = data.notifications.slice(0, 5).map(notif => `
                    <div class="notification-item ${notif.read ? '' : 'unread'}">
                        <h4>${notif.title}</h4>
                        <p>${notif.message}</p>
                        <small>${new Date(notif.created_at).toLocaleString()}</small>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Search jobs
async function searchJobs() {
    const city = document.getElementById('searchCity').value;
    const jobType = document.getElementById('searchJobType').value;
    const salaryMin = document.getElementById('searchSalaryMin').value;
    const salaryMax = document.getElementById('searchSalaryMax').value;

    try {
        let url = `${API_BASE_URL}/jobs?`;
        if (city) url += `city=${encodeURIComponent(city)}&`;
        if (jobType) url += `jobType=${jobType}&`;
        if (salaryMin) url += `salaryMin=${salaryMin}&`;
        if (salaryMax) url += `salaryMax=${salaryMax}&`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayJobs(data.jobs);
        }
    } catch (error) {
        console.error('Error searching jobs:', error);
        showToast('Error searching jobs', 'error');
    }
}

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayJobs(data.jobs);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Display jobs
function displayJobs(jobs) {
    const jobsDiv = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        jobsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No jobs available at the moment. Check back later for new opportunities!</p>';
        return;
    }

    jobsDiv.innerHTML = jobs.map(job => `
        <div class="card">
            <h3><i class="fas fa-briefcase"></i> ${job.title}</h3>
            <div style="padding: 0 1.5rem 1rem;">
                <p style="margin-bottom: 1rem;"><i class="fas fa-building" style="color: var(--primary-color);"></i> <strong>Employer:</strong> ${job.employer_name}</p>
                <p style="margin-bottom: 1rem; color: #666; line-height: 1.6;">${job.description}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                    <p style="margin: 0;"><i class="fas fa-tag" style="color: var(--primary-color);"></i> <strong>Type:</strong> ${job.job_type}</p>
                    <p style="margin: 0;"><i class="fas fa-map-marker-alt" style="color: var(--primary-color);"></i> <strong>Location:</strong> ${job.location || 'N/A'}</p>
                    <p style="margin: 0;"><i class="fas fa-rupee-sign" style="color: var(--success);"></i> <strong>Salary:</strong> ₹${job.salary || 'Not specified'}</p>
                    <p style="margin: 0;"><i class="fas fa-clock" style="color: var(--warning);"></i> <strong>Posted:</strong> ${new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                ${job.requirements ? `<p style="margin: 0; padding: 0.75rem; background: rgba(233,30,99,0.05); border-left: 3px solid var(--primary-color); border-radius: 5px;"><i class="fas fa-list-check"></i> <strong>Requirements:</strong> ${job.requirements}</p>` : ''}
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-sm" onclick="openApplyModal(${job.id})" style="flex: 2;">
                    <i class="fas fa-paper-plane"></i> Apply Now
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openApplyModal(${job.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `).join('');
}

// Open apply modal
async function openApplyModal(jobId) {
    currentJobId = jobId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            const job = data.job;
            document.getElementById('jobDetails').innerHTML = `
                <h3>${job.title}</h3>
                <p><strong>Employer:</strong> ${job.employer_name}</p>
                <p><strong>Type:</strong> ${job.job_type}</p>
                <p><strong>Salary:</strong> ₹${job.salary || 'Not specified'}</p>
            `;
            document.getElementById('applyModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading job details:', error);
    }
}

// Apply for job
async function applyForJob(e) {
    e.preventDefault();

    const coverLetter = document.getElementById('coverLetter').value;

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${currentJobId}/apply`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ coverLetter })
        });
        const data = await response.json();

        if (data.success) {
            showToast('Application submitted successfully!', 'success');
            document.getElementById('applyModal').style.display = 'none';
            document.getElementById('applyForm').reset();
        } else {
            showToast(data.message || 'Failed to submit application', 'error');
        }
    } catch (error) {
        console.error('Error applying for job:', error);
        showToast('Error submitting application', 'error');
    }
}

// Load applications
async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/my/applications`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayApplications(data.applications);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Display applications
function displayApplications(applications) {
    const appsDiv = document.getElementById('applicationsList');
    
    if (applications.length === 0) {
        appsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">You haven\'t applied to any jobs yet. Browse available jobs to get started!</p>';
        return;
    }

    appsDiv.innerHTML = applications.map(app => {
        const statusColors = {
            'pending': '#ff9800',
            'reviewed': '#2196f3',
            'shortlisted': '#9c27b0',
            'accepted': '#4caf50',
            'rejected': '#f44336'
        };
        return `
        <div class="card">
            <h3><i class="fas fa-briefcase"></i> ${app.title}</h3>
            <div style="padding: 0 1.5rem 1rem;">
                <p style="margin-bottom: 0.75rem;"><i class="fas fa-building" style="color: var(--primary-color);"></i> <strong>Employer:</strong> ${app.employer_name}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                    <p style="margin: 0;"><i class="fas fa-tag" style="color: var(--primary-color);"></i> <strong>Type:</strong> ${app.job_type}</p>
                    <p style="margin: 0;"><i class="fas fa-map-marker-alt" style="color: var(--primary-color);"></i> <strong>Location:</strong> ${app.location || 'N/A'}</p>
                    <p style="margin: 0;"><i class="fas fa-rupee-sign" style="color: var(--success);"></i> <strong>Salary:</strong> ₹${app.salary || 'Not specified'}</p>
                    <p style="margin: 0;"><i class="fas fa-clock" style="color: var(--warning);"></i> <strong>Applied:</strong> ${new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <p style="margin: 0; padding: 0.75rem; background: ${statusColors[app.status]}15; border-left: 3px solid ${statusColors[app.status]}; border-radius: 5px;">
                    <i class="fas fa-info-circle" style="color: ${statusColors[app.status]};"></i> 
                    <strong>Status:</strong> <span style="color: ${statusColors[app.status]}; text-transform: uppercase; font-weight: bold;">${app.status}</span>
                </p>
                ${app.cover_letter ? `<p style="margin-top: 1rem; padding: 0.75rem; background: rgba(0,0,0,0.02); border-radius: 5px;"><strong><i class="fas fa-file-alt"></i> Your Cover Letter:</strong><br><em style="color: #666;">${app.cover_letter}</em></p>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Load connections
async function loadConnections() {
    try {
        const response = await fetch(`${API_BASE_URL}/connections`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayConnections(data.connections);
        }
    } catch (error) {
        console.error('Error loading connections:', error);
    }
}

// Display connections
function displayConnections(connections) {
    const connectionsDiv = document.getElementById('connectionsList');
    
    if (connections.length === 0) {
        connectionsDiv.innerHTML = '<p>No connections yet.</p>';
        return;
    }

    connectionsDiv.innerHTML = connections.map(conn => `
        <div class="card">
            <h3>${conn.employer_name}</h3>
            <p><i class="fas fa-envelope"></i> ${conn.employer_email}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${conn.employer_city}</p>
            <p>Status: <span class="status-badge ${conn.status}">${conn.status}</span></p>
            <p>Created: ${new Date(conn.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Load conversations
async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayConversations(data.conversations);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Display conversations
function displayConversations(conversations) {
    const conversationsDiv = document.getElementById('conversationsList');
    
    if (conversations.length === 0) {
        conversationsDiv.innerHTML = '<p>No conversations yet.</p>';
        return;
    }

    conversationsDiv.innerHTML = conversations.map(conv => `
        <div class="conversation-item ${currentChatUser === conv.user_id ? 'active' : ''}" 
             onclick="loadChat(${conv.user_id}, '${conv.full_name}')">
            <h4>${conv.full_name}</h4>
            <p>${conv.last_message || 'No messages'}</p>
            ${conv.unread_count > 0 ? `<span class="badge">${conv.unread_count}</span>` : ''}
        </div>
    `).join('');
}

// Load chat
async function loadChat(userId, userName) {
    currentChatUser = userId;
    document.getElementById('chatHeader').textContent = userName;

    try {
        const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const messagesDiv = document.getElementById('chatMessages');
    const currentUserId = parseInt(localStorage.getItem('userId'));

    messagesDiv.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender_id === currentUserId ? 'sent' : 'received'}">
            <div class="message-bubble">
                ${msg.message}
                <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message || !currentChatUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                receiverId: currentChatUser,
                message
            })
        });
        const data = await response.json();

        if (data.success) {
            messageInput.value = '';
            loadChat(currentChatUser, document.getElementById('chatHeader').textContent);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error sending message', 'error');
    }
}

// Load reviews
async function loadReviews() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reviews`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displayReviews(data.reviews);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display reviews
function displayReviews(reviews) {
    const reviewsDiv = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        reviewsDiv.innerHTML = '<p>No reviews yet.</p>';
        return;
    }

    reviewsDiv.innerHTML = reviews.map(review => `
        <div class="card">
            <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
            <p><strong>From:</strong> ${review.reviewer_name}</p>
            <p>${review.review_text || 'No comment'}</p>
            <p><small>${new Date(review.created_at).toLocaleDateString()}</small></p>
        </div>
    `).join('');
}

// Update profile
async function updateProfile(e) {
    e.preventDefault();

    const profileData = {
        fullName: document.getElementById('profileFullName').value,
        phone: document.getElementById('profilePhone').value,
        city: document.getElementById('profileCity').value,
        address: document.getElementById('profileAddress').value
    };

    const helperProfileData = {
        experienceYears: document.getElementById('experienceYears').value,
        skills: document.getElementById('skills').value,
        languages: document.getElementById('languages').value,
        availability: document.getElementById('availability').value,
        preferredJobType: document.getElementById('preferredJobType').value,
        expectedSalary: document.getElementById('expectedSalary').value,
        bio: document.getElementById('bio').value
    };

    try {
        // Update basic profile
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        const profileResult = await profileResponse.json();

        // Update helper profile
        const helperResponse = await fetch(`${API_BASE_URL}/users/profile/helper`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(helperProfileData)
        });
        const helperResult = await helperResponse.json();

        if (profileResult.success && helperResult.success) {
            showToast('Profile updated successfully!', 'success');
            localStorage.setItem('userName', profileData.fullName);
            loadUserProfile();
        } else {
            showToast('Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}
