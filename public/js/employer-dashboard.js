// Employer Dashboard Script

// Check authentication
if (!checkAuth()) {
    window.location.href = '/';
}

const userType = localStorage.getItem('userType');
if (userType !== 'employer') {
    window.location.href = '/';
}

// Global variables
let currentChatUser = null;

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

    // Search
    document.getElementById('searchBtn').addEventListener('click', searchHelpers);

    // Create job
    document.getElementById('createJobBtn').addEventListener('click', () => {
        document.getElementById('jobModal').style.display = 'block';
    });

    // Job form submission
    document.getElementById('jobForm').addEventListener('submit', createJob);

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', updateProfile);

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
        case 'connections':
            loadConnections();
            break;
        case 'messages':
            loadConversations();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'saved':
            loadSavedProfiles();
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
            document.getElementById('savedCount').textContent = statsData.stats.savedCount || 0;
        }

        // Load job count
        const jobsResponse = await fetch(`${API_BASE_URL}/jobs?postedBy=${localStorage.getItem('userId')}`, {
            headers: getAuthHeaders()
        });
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
            const activeJobs = jobsData.jobs.filter(j => j.status === 'active').length;
            document.getElementById('jobsCount').textContent = activeJobs;
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

// Search helpers
async function searchHelpers() {
    const city = document.getElementById('searchCity').value;
    const skills = document.getElementById('searchSkills').value;
    const experience = document.getElementById('searchExperience').value;
    const rating = document.getElementById('searchRating').value;

    try {
        let url = `${API_BASE_URL}/users/search?userType=helper`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (skills) url += `&skills=${encodeURIComponent(skills)}`;
        if (experience) url += `&experience=${experience}`;
        if (rating) url += `&rating=${rating}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.users);
        }
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Error searching helpers', 'error');
    }
}

// Display search results
function displaySearchResults(users) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (users.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No helpers found matching your criteria. Try adjusting your filters.</p>';
        return;
    }

    resultsDiv.innerHTML = users.map(user => `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-image">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-info">
                    <h3>${user.full_name}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${user.city || 'N/A'}</p>
                </div>
            </div>
            <div class="profile-details">
                <p><i class="fas fa-briefcase"></i> <strong>${user.experience_years || 0} years</strong> experience</p>
                <p><i class="fas fa-tools"></i> ${user.skills || 'No skills listed'}</p>
                <p><i class="fas fa-star rating"></i> <strong style="color: #ff9800;">${user.rating || 0}/5</strong> rating</p>
                ${user.languages ? `<p><i class="fas fa-language"></i> ${user.languages}</p>` : ''}
                ${user.hourly_rate ? `<p><i class="fas fa-rupee-sign"></i> <strong>₹${user.hourly_rate}/hour</strong></p>` : ''}
            </div>
            <div class="profile-actions">
                <button class="btn btn-primary btn-sm" onclick="sendConnectionRequest(${user.id})" title="Send Connection Request">
                    <i class="fas fa-link"></i> Connect
                </button>
                <button class="btn btn-secondary btn-sm" onclick="viewProfile(${user.id})" title="View Full Profile">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline btn-sm" onclick="saveProfile(${user.id})" title="Save Profile" style="border: 2px solid var(--primary-color); color: var(--primary-color);">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Send connection request
async function sendConnectionRequest(helperId) {
    try {
        const employerId = parseInt(localStorage.getItem('userId'));
        
        if (!employerId) {
            showToast('Please log in again', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/connections`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                helperId: parseInt(helperId),
                employerId: employerId
            })
        });
        const data = await response.json();

        if (data.success) {
            showToast('Connection request sent!', 'success');
        } else {
            showToast(data.message || 'Failed to send request', 'error');
        }
    } catch (error) {
        console.error('Error sending connection request:', error);
        showToast('Error sending connection request', 'error');
    }
}

// Save profile
async function saveProfile(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/saved/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            showToast(data.saved ? 'Profile saved!' : 'Profile unsaved', 'success');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile', 'error');
    }
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
            <h3>${conn.helper_name}</h3>
            <p><i class="fas fa-envelope"></i> ${conn.helper_email}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${conn.helper_city}</p>
            <p>Status: <span class="status-badge ${conn.status}">${conn.status}</span></p>
            <p>Created: ${new Date(conn.created_at).toLocaleDateString()}</p>
            ${conn.status === 'pending' ? `
                <div class="card-actions">
                    <button class="btn btn-success btn-sm" onclick="updateConnectionStatus(${conn.id}, 'active')">Accept</button>
                    <button class="btn btn-danger btn-sm" onclick="updateConnectionStatus(${conn.id}, 'cancelled')">Reject</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Update connection status
async function updateConnectionStatus(connectionId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/connections/${connectionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        const data = await response.json();

        if (data.success) {
            showToast('Connection updated!', 'success');
            loadConnections();
        }
    } catch (error) {
        console.error('Error updating connection:', error);
        showToast('Error updating connection', 'error');
    }
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

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs?postedBy=${localStorage.getItem('userId')}`, {
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
        jobsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No job postings yet. Create your first job to get started!</p>';
        return;
    }

    jobsDiv.innerHTML = jobs.map(job => `
        <div class="card">
            <h3><i class="fas fa-briefcase"></i> ${job.title}</h3>
            <div style="padding: 0 1.5rem 1rem;">
                <p style="margin-bottom: 1rem; color: #666; line-height: 1.6;">${job.description}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                    <p style="margin: 0;"><i class="fas fa-tag" style="color: var(--primary-color);"></i> <strong>Type:</strong> ${job.job_type}</p>
                    <p style="margin: 0;"><i class="fas fa-map-marker-alt" style="color: var(--primary-color);"></i> <strong>Location:</strong> ${job.location || 'N/A'}</p>
                    <p style="margin: 0;"><i class="fas fa-rupee-sign" style="color: var(--success);"></i> <strong>Salary:</strong> ₹${job.salary || 'Not specified'}</p>
                    <p style="margin: 0;"><i class="fas fa-file-alt" style="color: var(--warning);"></i> <strong>Applications:</strong> ${job.application_count}</p>
                </div>
                <p style="margin: 0;"><i class="fas fa-circle" style="font-size: 0.5rem; color: ${job.status === 'active' ? 'var(--success)' : '#999'};"></i> <strong>Status:</strong> <span class="status-badge ${job.status}">${job.status.toUpperCase()}</span></p>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-sm" onclick="viewApplications(${job.id})">
                    <i class="fas fa-users"></i> View Applications (${job.application_count})
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteJob(${job.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Create job
async function createJob(e) {
    e.preventDefault();

    const jobData = {
        title: document.getElementById('jobTitle').value,
        job_type: document.getElementById('jobType').value,
        location: document.getElementById('jobLocation').value,
        salary: document.getElementById('jobSalary').value,
        description: document.getElementById('jobDescription').value,
        requirements: document.getElementById('jobRequirements').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(jobData)
        });
        const data = await response.json();

        if (data.success) {
            showToast('Job posted successfully!', 'success');
            document.getElementById('jobModal').style.display = 'none';
            document.getElementById('jobForm').reset();
            loadJobs();
        } else {
            showToast(data.message || 'Failed to post job', 'error');
        }
    } catch (error) {
        console.error('Error creating job:', error);
        showToast('Error posting job', 'error');
    }
}

// Delete job
async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            showToast('Job deleted!', 'success');
            loadJobs();
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        showToast('Error deleting job', 'error');
    }
}

// View applications
async function viewApplications(jobId) {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/applications`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            alert(`Applications: ${data.count}\n\n${data.applications.map(app => 
                `${app.full_name} - ${app.status}`
            ).join('\n')}`);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Load saved profiles
async function loadSavedProfiles() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/saved/list`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.savedProfiles || []);
        }
    } catch (error) {
        console.error('Error loading saved profiles:', error);
        displaySearchResults([]);
    }
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

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', 'success');
            localStorage.setItem('userName', profileData.fullName);
            loadUserProfile();
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}
