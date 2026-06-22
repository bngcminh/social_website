// Profile page JavaScript

// Format number (1000 -> 1K)
function fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
}

// Load and display post counts
function loadPostCounts() {
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        const postId = post.getAttribute('data-post-id');
        if (postId) {
            loadPostData(postId);
        }
    });
}

// Fetch post data and update counts
async function loadPostData(postId) {
    try {
        const response = await fetch(`/posts/${postId}`);
        const responseText = await response.text();
        let result = {};

        if (responseText) {
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                result = {
                    success: response.ok,
                    message: responseText
                };
            }
        } else {
            result = {
                success: response.ok,
                message: response.ok ? 'cập nhật hồ sơ thành công' : 'Không thấy cập nhật hồ sơ'
            };
        }
        
        if (result.success && result.data) {
            const post = result.data;
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            
            if (postElement) {
                const buttons = postElement.querySelectorAll('.tweet-actions button');
                if (buttons.length >= 4) {
                    buttons[0].querySelector('.count').textContent = fmt(post.commentCount || 0);
                    buttons[1].querySelector('.count').textContent = fmt(post.retpostCount || 0);
                    buttons[2].querySelector('.count').textContent = fmt(post.likeCount || 0);
                    buttons[3].querySelector('.count').textContent = fmt(post.viewsCount || 0);
                }
            }
        }
    } catch (error) {
        console.error('Error loading post data:', error);
    }
}

// Toggle post menu
function togglePostMenu(btn) {
    const dropdown = btn.nextElementSibling;
    dropdown.classList.toggle('active');
    
    // Close when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Edit post
function editPost(postId) {
    alert('Chức năng chỉnh sửa bài viết sẽ được cập nhật sớm!');
    // TODO: Implement edit post functionality
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
        return;
    }

    try {
        const response = await fetch(`/user/delete_post/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Remove post from DOM
            document.querySelector(`[data-post-id="${postId}"]`).remove();
            alert('Xóa bài viết thành công!');
            // Refresh page
            location.reload();
        } else {
            alert('Có lỗi xảy ra khi xóa bài viết');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra');
    }
}

// Toggle like
async function toggleLike(postId) {
    try {
        const response = await fetch(`/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const btn = document.querySelector(`[data-post-id="${postId}"] .action-btn`);
            if (data.liked) {
                btn.classList.add('liked');
            } else {
                btn.classList.remove('liked');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Toggle follow
async function toggleFollow(userId) {
    try {
        const response = await fetch(`/user/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const btn = document.querySelector('.follow-btn');
            btn.classList.toggle('following');
            btn.textContent = btn.classList.contains('following') ? 'Đang theo dõi' : 'Theo dõi';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Edit profile
function editProfile() {
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.add('active');
}

// Close edit profile modal
function closeEditProfile() {
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.remove('active');
}

// Handle avatar upload
function editPhoto() {
    const fileInput = document.getElementById('avatar-file-input');
    fileInput.click();
}

// Handle avatar file selection
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarPreview = document.getElementById('avatar-preview');
            if (avatarPreview.tagName === 'IMG') {
                avatarPreview.src = e.target.result;
            } else {
                // Replace div with img
                const img = document.createElement('img');
                img.src = e.target.result;
                img.id = 'avatar-preview';
                avatarPreview.replaceWith(img);
            }
        };
        reader.readAsDataURL(file);
    }
}

// Save profile changes
async function saveProfile() {
    try {
        const name = document.getElementById('edit-name').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const location = document.getElementById('edit-location').value.trim();
        const website = document.getElementById('edit-website').value.trim();

        if (!name) {
            alert('Tên không được để trống');
            return;
        }

        const formData = new FormData();
        formData.append('username', name);
        formData.append('bio', bio);
        formData.append('location', location);
        formData.append('website', website);

        // Check if avatar was changed
        const avatarFileInput = document.getElementById('avatar-file-input');
        if (avatarFileInput.files.length > 0) {
            formData.append('avatar', avatarFileInput.files[0]);
        }

        const response = await fetch('/profile/edit', {
            method: 'PUT',
            body: formData
        });

        const responseText = await response.text();
        let result = {};

        if (responseText) {
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                result = {
                    success: response.ok,
                    message: responseText
                };
            }
        } else {
            result = {
                success: response.ok,
                message: response.ok ? 'Cập nhật hồ sơ thành công' : 'Không thể cập nhật hồ sơ'
            };
        }

        if (response.ok && result.success) {
            alert('Cập nhật hồ sơ thành công!');
            closeEditProfile();
            // Reload page to show updated profile
            location.reload();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        return;
        alert('Lỗi khi lưu hồ sơ');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('edit-profile-modal');
    if (e.target === modal) {
        closeEditProfile();
    }
});

// Switch tab
// Store original posts HTML on page load
let originalPostsHTML = '';

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    const profilePosts = document.querySelector('.profile-posts');
    if(profilePosts) {
        originalPostsHTML = profilePosts.innerHTML;
    }
    loadPostCounts();
});

function switchTab(btn) {
    // Remove active from all tabs
    document.querySelectorAll('.profile-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    // Add active to clicked tab
    btn.parentElement.classList.add('active');
    
    // Get tab name
    const tabName = btn.getAttribute('data-tab');
    
    // Load data based on tab
    if(tabName === 'likes') {
        loadLikedPosts();
    } else if(tabName === 'posts') {
        // Restore original posts
        const profilePosts = document.querySelector('.profile-posts');
        if(profilePosts && originalPostsHTML) {
            profilePosts.innerHTML = originalPostsHTML;
            loadPostCounts();
        }
    }
}

// Load liked posts
async function loadLikedPosts() {
    try {
        const response = await fetch(`/posts/liked`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if(response.status === 401) {
            window.location.href = '/auth';
            return;
        }
        
        const data = await response.json();
        if(data.success) {
            renderLikedPosts(data.posts);
        }
    } catch(err) {
        console.error('Error loading liked posts:', err);
    }
}

// Render liked posts
function renderLikedPosts(posts) {
    const container = document.querySelector('.profile-posts');
    if(!container) return;
    
    container.innerHTML = '';
    
    if(posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
                </svg>
                <p>Chưa thích bài viết nào</p>
            </div>
        `;
        return;
    }
    
    posts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post';
        postEl.setAttribute('data-post-id', String(post._id));
        
        const avatarContent = post.author.avatar ? 
            `<img src="${post.author.avatar}" alt="${post.author.username}">` :
            `<span>${post.author.username.substring(0, 2).toUpperCase()}</span>`;
        
        postEl.innerHTML = `
            <div class="post-left">
                <div class="avatar">${avatarContent}</div>
            </div>
            <div class="post-right">
                <div class="post-header">
                    <div class="tweet-user">
                        <span class="post-author">${post.author.username}</span>
                        <span class="post-handle">@${post.author.username}</span>
                        <span class="post-time"> · ${new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div class="tweet-options">
                        <svg fill="currentColor" fill-rule="evenodd" height="64" viewBox="0 0 24 24" width="64" xmlns="http://www.w3.org/2000/svg" style="flex: 0 0 auto; line-height: 1;"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"></path></svg>
                        <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g></svg>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                ${post.media && post.media.length > 0 ? `
                    <div class="post-media">
                        ${post.media.map(m => 
                            m.type === 'image' ? 
                            `<img src="${m.url}" alt="Post image" style="border-radius: 16px;">` :
                            `<video src="${m.url}" controls style="border-radius: 16px; max-width: 100%;"></video>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="tweet-actions">
                    <button class="act reply" data-action="reply">
                        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1.25em;height:1.25em;display:inline-block;fill:currentColor;vertical-align:text-bottom"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>
                        <span class="count">${fmt(post.commentCount || 0)}</span>
                    </button>
                    <button class="act retweet" data-action="retweet">
                        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1.25em;height:1.25em;display:inline-block;fill:currentColor;vertical-align:text-bottom"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>
                        <span class="count">${fmt(post.retpostCount || 0)}</span>
                    </button>
                    <button class="act like" data-action="like">
                        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1.25em;height:1.25em;display:inline-block;fill:currentColor;vertical-align:text-bottom"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>
                        <span class="count">${fmt(post.likeCount || 0)}</span>
                    </button>
                    <button class="act views" data-action="views">
                        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1.25em;height:1.25em;display:inline-block;fill:currentColor;vertical-align:text-bottom"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>
                        <span class="count">${fmt(post.viewsCount || 0)}</span>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(postEl);
    });
    
    // Re-attach event listeners
    document.querySelectorAll('.post .tweet-actions button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const postElement = this.closest('.post');
            if(!postElement) return;
            
            const postId = postElement.getAttribute('data-post-id');
            if(!postId) {
                console.error('Post ID not found!');
                return;
            }
            
            const action = this.getAttribute('data-action');
            
            if(action === 'like') {
                togglePostLike(postId, this);
            } else if(action === 'retweet') {
                togglePostRetweet(postId, this);
            } else if(action === 'reply') {
                replyToPost(postId, this);
            }
        });
    });
}

// Load post counts on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPostCounts();
    
    // Add event listeners to action buttons
    document.querySelectorAll('.post .tweet-actions button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const postElement = this.closest('.post');
            if(!postElement) return;
            
            const postId = postElement.getAttribute('data-post-id');
            if(!postId) {
                console.error('Post ID not found!');
                return;
            }
            
            const action = this.getAttribute('data-action');
            console.log('Action:', action, 'PostID:', postId);
            
            if(action === 'like') {
                togglePostLike(postId, this);
            } else if(action === 'retweet') {
                togglePostRetweet(postId, this);
            } else if(action === 'reply') {
                replyToPost(postId, this);
            }
        });
    });
});

// Toggle like on a post
function togglePostLike(postId, btn) {
    fetch(`/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(resp => {
        if(resp.status === 401){
            window.location.href = '/auth';
            return;
        }
        return resp.json();
    })
    .then(data => {
        if(data.success){
            const countEl = btn.querySelector('.count');
            countEl.textContent = fmt(data.likeCount);
            btn.classList.remove('liked');
            if(data.liked) btn.classList.add('liked');
        }
    })
    .catch(err => console.error('Error:', err));
}

// Toggle retweet on a post
function togglePostRetweet(postId, btn) {
    fetch(`/posts/${postId}/retweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(resp => {
        if(resp.status === 401){
            window.location.href = '/auth';
            return;
        }
        return resp.json();
    })
    .then(data => {
        if(data.success){
            const countEl = btn.querySelector('.count');
            countEl.textContent = fmt(data.retpostCount);
            btn.classList.remove('retweeted');
            if(data.retweeted) btn.classList.add('retweeted');
        }
    })
    .catch(err => console.error('Error:', err));
}

// Reply to a post
function replyToPost(postId, btn) {
    const content = prompt('Trả lời bài viết:');
    if(!content) return;
    
    fetch(`/get_posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
    .then(resp => {
        if(resp.status === 401){
            window.location.href = '/auth';
            return;
        }
        return resp.json();
    })
    .then(data => {
        if(data.success){
            const countEl = btn.querySelector('.count');
            countEl.textContent = fmt(data.commentCount);
            alert('Đã thêm trả lời!');
        }
    })
    .catch(err => console.error('Error:', err));
}
