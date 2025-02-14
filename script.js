function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="spinner-container">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error-message">${message}</div>`;
}

// Add pagination state
const state = {
    currentPage: 1,
    itemsPerPage: 6,  // Changed from 8 to 6
    totalItems: 0,
    users: [],
    filteredUsers: [] // Add filtered users array
};

function filterUsers(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    state.filteredUsers = state.users.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)
    );
    state.currentPage = 1;
    state.totalItems = state.filteredUsers.length;
    displayUsers();
}

function displayUsers() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const usersToDisplay = state.filteredUsers.slice(startIndex, endIndex);

    const staffList = document.getElementById('staffList');
    staffList.innerHTML = '';
    
    if (usersToDisplay.length === 0) {
        staffList.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">No matching staff members found.</div>
            </div>`;
        return;
    }

    usersToDisplay.forEach(user => {
        const staffCard = document.createElement('div');
        staffCard.className = 'col-sm-6 col-md-4 mb-4';
        staffCard.innerHTML = `
            <div class="card shadow-sm hover-card">
                <div class="card-body">
                    <div class="card-content">
                        <h5 class="card-title mb-3">${user.firstName} ${user.lastName}</h5>
                        <div class="staff-info-item">
                            <i class="bi bi-envelope"></i>
                            <span>${user.email}</span>
                        </div>
                        <div class="staff-info-item">
                            <i class="bi bi-telephone"></i>
                            <span>${user.phone}</span>
                        </div>
                        <div class="staff-info-item">
                            <i class="bi bi-building"></i>
                            <span>${user.company.name}</span>
                        </div>
                    </div>
                    <a href="details.html?id=${user.id}" class="btn btn-primary btn-sm mt-3 w-100">
                        View Details <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        staffList.appendChild(staffCard);
    });

    // Update pagination controls
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');

    prevButton.disabled = state.currentPage === 1;
    nextButton.disabled = state.currentPage === Math.ceil(state.totalItems / state.itemsPerPage);
    currentPageSpan.textContent = state.currentPage;
    totalPagesSpan.textContent = Math.ceil(state.totalItems / state.itemsPerPage);
}

function setupPagination() {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    prevButton.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            displayUsers();
        }
    });

    nextButton.addEventListener('click', () => {
        if (state.currentPage < Math.ceil(state.totalItems / state.itemsPerPage)) {
            state.currentPage++;
            displayUsers();
        }
    });
}

// Add error boundary
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showError('staffList', 'Something went wrong. Please refresh the page.');
});

// Debounce search input
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

if (document.getElementById('staffList')) {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(e => {
        filterUsers(e.target.value);
    }, 300));

    showLoading('staffList');
    fetch('https://dummyjson.com/users')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch staff data');
            return response.json();
        })
        .then(data => {
            state.users = data.users;
            state.filteredUsers = data.users; // Initialize filtered users
            state.totalItems = data.users.length;
            displayUsers();
            setupPagination();
        })
        .catch(error => showError('staffList', 'Error loading staff directory. Please try again later.'));
}

if (document.getElementById('staffDetails')) {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (userId) {
        // Fetch user details
        showLoading('staffDetails');
        Promise.all([
            fetch(`https://dummyjson.com/users/${userId}`).then(res => res.json()),
            fetch(`https://dummyjson.com/users/${userId}/posts`).then(res => res.json())
        ])
        .then(([userData, postsData]) => {
            // Display user details
            const detailsDiv = document.getElementById('staffDetails');
            detailsDiv.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title mb-4">${userData.firstName} ${userData.lastName}</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="user-info-item">
                                <i class="bi bi-envelope"></i>
                                <span>${userData.email}</span>
                            </div>
                            <div class="user-info-item">
                                <i class="bi bi-telephone"></i>
                                <span>${userData.phone}</span>
                            </div>
                            <div class="user-info-item">
                                <i class="bi bi-person"></i>
                                <span>Age: ${userData.age}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="user-info-item">
                                <i class="bi bi-geo-alt"></i>
                                <span>${userData.address.address}, ${userData.address.city}</span>
                            </div>
                            <div class="user-info-item">
                                <i class="bi bi-building"></i>
                                <span>${userData.company.name}</span>
                            </div>
                            <div class="user-info-item">
                                <i class="bi bi-briefcase"></i>
                                <span>${userData.company.department}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Display user posts
            const postsDiv = document.getElementById('staffPosts');
            if (postsData.posts && postsData.posts.length > 0) {
                postsDiv.innerHTML = `
                    <h4 class="mb-4"><i class="bi bi-newspaper"></i> Posts by ${userData.firstName}</h4>
                    ${postsData.posts.map(post => `
                        <div class="card mb-3 shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">${post.title}</h5>
                                <p class="card-text">${post.body}</p>
                                <button onclick="toggleComments(${post.id}, this.nextElementSibling)" 
                                        class="btn btn-link p-0 text-decoration-none">
                                    <i class="bi bi-chat"></i> View Comments
                                </button>
                                <div class="comments-section mt-3" style="display: none;"></div>
                            </div>
                        </div>
                    `).join('')}
                `;
            } else {
                postsDiv.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> No posts found for ${userData.firstName}.
                    </div>
                `;
            }
        })
        .catch(error => {
            showError('staffDetails', 'Error loading staff details. Please try again later.');
            document.getElementById('staffPosts').innerHTML = '';
        });
    }
}

async function fetchComments(postId, commentsContainer) {
    try {
        const response = await fetch(`https://dummyjson.com/posts/${postId}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        
        commentsContainer.innerHTML = data.comments.length > 0 
            ? data.comments.map(comment => `
                <div class="comment-card">
                    <span class="comment-user">${comment.user.username}:</span>
                    <p>${comment.body}</p>
                </div>
            `).join('')
            : '<p>No comments found.</p>';
    } catch (error) {
        commentsContainer.innerHTML = '<p class="error-message">Error loading comments.</p>';
    }
}

function toggleComments(postId, commentsSection) {
    const button = commentsSection.previousElementSibling;
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        button.textContent = 'Hide Comments';
        if (!commentsSection.dataset.loaded) {
            fetchComments(postId, commentsSection);
            commentsSection.dataset.loaded = 'true';
        }
    } else {
        commentsSection.style.display = 'none';
        button.textContent = 'View Comments';
    }
}