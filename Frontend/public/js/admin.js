function switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(function (el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab[data-tab]').forEach(function (el) {
        el.classList.remove('active');
    });

    document.getElementById('tab-' + tabName).classList.add('active');
    var tab = document.querySelector('.tab[data-tab="' + tabName + '"]');
    if (tab) tab.classList.add('active');

    if (tabName === 'users') loadUsers();
    if (tabName === 'posts') loadPosts();
    if (tabName === 'comments') loadComments();
}

var searchTimeout = null;
function debounceSearch(type) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
        if (type === 'users') loadUsers(1);
        if (type === 'posts') loadPosts(1);
    }, 400);
}

function formatDate(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var diff = now - d;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) return seconds + 'giây';
    if (minutes < 60) return minutes + ' phút';
    if (hours < 24) return hours + ' giờ';
    if (days < 7) return days + ' ngày';

    return d.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short'
    });
}

function showToast(message) {
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
}

function showLoading(containerId) {
    var el = document.getElementById(containerId);
    el.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';
}

// ===== USERS =====
async function loadUsers(page) {
    if (!page) page = 1;
    showLoading('users-list');
    try {
        var search = document.getElementById('user-search')?.value?.trim() || '';
        var res = await fetch('/admin/users?page=' + page + '&limit=15&search=' + encodeURIComponent(search));
        var data = await res.json();
        if (!data.success) return;

        var container = document.getElementById('users-list');
        container.innerHTML = '';

        if (data.users.length === 0) {
            container.innerHTML = '<div class="admin-empty">Không tìm thấy người dùng nào</div>';
            return;
        }

        data.users.forEach(function (user) {
            var div = document.createElement('div');
            div.className = 'admin-item';

            var letter = user.username.substring(0, 1).toUpperCase();
            var statusCls = user.isActive ? 'status-active' : 'status-locked';
            var statusTxt = user.isActive ? 'Hoạt động' : 'Bị khóa';
            var roleCls = user.role === 'admin' ? 'role-admin' : 'role-user';

            var actions = '';
            if (user.role !== 'admin') {
                actions =
                    '<div class="admin-item-actions">' +
                    '<button class="admin-act act-toggle" title="' + (user.isActive ? 'Khóa' : 'Mở khóa') + '" onclick="toggleUser(\'' + user._id + '\')">' +
                    '<svg viewBox="0 0 24 24"><path d="M17 11V7c0-2.757-2.243-5-5-5S7 4.243 7 7v4H5v13h14V11h-2zm-7-4c0-1.654 1.346-3 3-3s3 1.346 3 3v4H10V7zm7 15H7V13h10v9z"/></svg>' +
                    '</button>' +
                    '<button class="admin-act act-delete" title="Xóa" onclick="confirmDeleteUser(\'' + user._id + '\', \'' + user.username + '\')">' +
                    '<svg viewBox="0 0 24 24"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>' +
                    '</button>' +
                    '</div>';
            }

            div.innerHTML =
                '<div class="avatar" style="width:40px;height:40px;font-size:16px">' + letter + '</div>' +
                '<div class="admin-item-body">' +
                '<div class="admin-item-header">' +
                '<span class="admin-item-name">' + user.username + '</span>' +
                '<span class="admin-item-handle">@' + user.email.split('@')[0] + '</span>' +
                '<span class="admin-item-time">' + formatDate(user.createdAt) + '</span>' +
                '</div>' +
                '<div class="admin-item-text">' + user.email + '</div>' +
                '<div class="admin-item-meta">' +
                '<span class="admin-badge ' + statusCls + '">' + statusTxt + '</span>' +
                '<span class="admin-badge ' + roleCls + '">' + user.role + '</span>' +
                '</div>' +
                actions +
                '</div>';

            container.appendChild(div);
        });

        renderPagination('users', data.page, data.totalPages);
    } catch (err) {
        console.log('Lỗi tải users:', err);
    }
}

async function toggleUser(userId) {
    try {
        var res = await fetch('/admin/users/' + userId + '/toggle', { method: 'PUT' });
        var data = await res.json();
        if (data.success) {
            showToast(data.message);
            loadUsers();
        }
    } catch (err) {
        console.log(err);
    }
}

function confirmDeleteUser(userId, username) {
    showModal(
        'Xóa tài khoản?',
        'Tài khoản @' + username + ' sẽ bị xóa vĩnh viễn cùng toàn bộ dữ liệu liên quan.',
        function () { deleteUser(userId); }
    );
}

async function deleteUser(userId) {
    try {
        var res = await fetch('/admin/users/' + userId, { method: 'DELETE' });
        var data = await res.json();
        if (data.success) {
            closeModal();
            showToast('Đã xóa người dùng');
            loadUsers();
        }
    } catch (err) {
        console.log(err);
    }
}

// ===== POSTS =====
async function loadPosts(page) {
    if (!page) page = 1;
    showLoading('posts-list');
    try {
        var search = document.getElementById('post-search')?.value?.trim() || '';
        var res = await fetch('/admin/posts?page=' + page + '&limit=15&search=' + encodeURIComponent(search));
        var data = await res.json();
        if (!data.success) return;

        var container = document.getElementById('posts-list');
        container.innerHTML = '';

        if (data.posts.length === 0) {
            container.innerHTML = '<div class="admin-empty">Không tìm thấy bài viết nào</div>';
            return;
        }

        data.posts.forEach(function (post) {
            var div = document.createElement('div');
            div.className = 'admin-item';

            var authorName = post.author ? post.author.username : 'Đã xóa';
            var letter = authorName.substring(0, 1).toUpperCase();
            var statusCls = post.isHidden ? 'status-hidden' : 'status-visible';
            var statusTxt = post.isHidden ? 'Đã ẩn' : 'Hiển thị';
            var content = post.content || '(Không có nội dung)';

            div.innerHTML =
                '<div class="avatar" style="width:40px;height:40px;font-size:16px">' + letter + '</div>' +
                '<div class="admin-item-body">' +
                '<div class="admin-item-header">' +
                '<span class="admin-item-name">' + authorName + '</span>' +
                '<span class="admin-item-time">' + formatDate(post.createdAt) + '</span>' +
                '</div>' +
                '<div class="admin-item-text">' + content + '</div>' +
                '<div class="admin-item-stats">' +
                '<span class="admin-stat">' +
                '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z"/></svg>' +
                (post.likeCount || 0) +
                '</span>' +
                '<span class="admin-stat">' +
                '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>' +
                (post.commentCount || 0) +
                '</span>' +
                '<span class="admin-badge ' + statusCls + '">' + statusTxt + '</span>' +
                '</div>' +
                '<div class="admin-item-actions">' +
                '<button class="admin-act act-toggle" title="' + (post.isHidden ? 'Hiện' : 'Ẩn') + '" onclick="togglePost(\'' + post._id + '\')">' +
                '<svg viewBox="0 0 24 24"><path d="' + (post.isHidden ?
                    'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' :
                    'M3.693 21.707l-1.414-1.414 2.429-2.429c-2.479-2.421-3.606-5.376-3.658-5.513l-.131-.352.131-.352C1.268 11.195 5.597 2.26 12 2.26c2.422 0 4.602.726 6.482 2.159l2.811-2.811 1.414 1.414L3.693 21.707z'
                ) + '"/></svg>' +
                '</button>' +
                '<button class="admin-act act-delete" title="Xóa" onclick="confirmDeletePost(\'' + post._id + '\')">' +
                '<svg viewBox="0 0 24 24"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>' +
                '</button>' +
                '</div>' +
                '</div>';

            container.appendChild(div);
        });

        renderPagination('posts', data.page, data.totalPages);
    } catch (err) {
        console.log('Lỗi tải posts:', err);
    }
}

async function togglePost(postId) {
    try {
        var res = await fetch('/admin/posts/' + postId + '/toggle', { method: 'PUT' });
        var data = await res.json();
        if (data.success) {
            showToast(data.message);
            loadPosts();
        }
    } catch (err) {
        console.log(err);
    }
}

function confirmDeletePost(postId) {
    showModal(
        'Xóa bài viết?',
        'Bài viết sẽ bị xóa vĩnh viễn cùng toàn bộ bình luận và lượt thích liên quan.',
        function () { deletePost(postId); }
    );
}

async function deletePost(postId) {
    try {
        var res = await fetch('/admin/posts/' + postId, { method: 'DELETE' });
        var data = await res.json();
        if (data.success) {
            closeModal();
            showToast('Đã xóa bài viết');
            loadPosts();
        }
    } catch (err) {
        console.log(err);
    }
}

// ===== COMMENTS =====
async function loadComments(page) {
    if (!page) page = 1;
    showLoading('comments-list');
    try {
        var res = await fetch('/admin/comments?page=' + page + '&limit=15');
        var data = await res.json();
        if (!data.success) return;

        var container = document.getElementById('comments-list');
        container.innerHTML = '';

        if (data.comments.length === 0) {
            container.innerHTML = '<div class="admin-empty">Không có bình luận nào</div>';
            return;
        }

        data.comments.forEach(function (comment) {
            var div = document.createElement('div');
            div.className = 'admin-item';

            var authorName = comment.author ? comment.author.username : 'Đã xóa';
            var letter = authorName.substring(0, 1).toUpperCase();
            var statusCls = comment.isHidden ? 'status-hidden' : 'status-visible';
            var statusTxt = comment.isHidden ? 'Đã ẩn' : 'Hiển thị';
            var content = comment.content || '(Ảnh)';
            var postContent = comment.post ? (comment.post.content || '').substring(0, 50) : 'Bài viết đã xóa';

            div.innerHTML =
                '<div class="avatar" style="width:40px;height:40px;font-size:16px">' + letter + '</div>' +
                '<div class="admin-item-body">' +
                '<div class="admin-item-header">' +
                '<span class="admin-item-name">' + authorName + '</span>' +
                '<span class="admin-item-time">' + formatDate(comment.createdAt) + '</span>' +
                '</div>' +
                '<div class="admin-item-text">' + content + '</div>' +
                '<div class="admin-item-ref">' + postContent + '</div>' +
                '<div class="admin-item-meta">' +
                '<span class="admin-badge ' + statusCls + '">' + statusTxt + '</span>' +
                '</div>' +
                '<div class="admin-item-actions">' +
                '<button class="admin-act act-toggle" title="' + (comment.isHidden ? 'Hiện' : 'Ẩn') + '" onclick="toggleComment(\'' + comment._id + '\')">' +
                '<svg viewBox="0 0 24 24"><path d="' + (comment.isHidden ?
                    'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' :
                    'M3.693 21.707l-1.414-1.414 2.429-2.429c-2.479-2.421-3.606-5.376-3.658-5.513l-.131-.352.131-.352C1.268 11.195 5.597 2.26 12 2.26c2.422 0 4.602.726 6.482 2.159l2.811-2.811 1.414 1.414L3.693 21.707z'
                ) + '"/></svg>' +
                '</button>' +
                '<button class="admin-act act-delete" title="Xóa" onclick="confirmDeleteComment(\'' + comment._id + '\')">' +
                '<svg viewBox="0 0 24 24"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>' +
                '</button>' +
                '</div>' +
                '</div>';

            container.appendChild(div);
        });

        renderPagination('comments', data.page, data.totalPages);
    } catch (err) {
        console.log('Lỗi tải comments:', err);
    }
}

async function toggleComment(commentId) {
    try {
        var res = await fetch('/admin/comments/' + commentId + '/toggle', { method: 'PUT' });
        var data = await res.json();
        if (data.success) {
            showToast(data.message);
            loadComments();
        }
    } catch (err) {
        console.log(err);
    }
}

function confirmDeleteComment(commentId) {
    showModal(
        'Xóa bình luận?',
        'Bình luận và tất cả reply liên quan sẽ bị xóa vĩnh viễn.',
        function () { deleteComment(commentId); }
    );
}

async function deleteComment(commentId) {
    try {
        var res = await fetch('/admin/comments/' + commentId, { method: 'DELETE' });
        var data = await res.json();
        if (data.success) {
            closeModal();
            showToast('Đã xóa bình luận');
            loadComments();
        }
    } catch (err) {
        console.log(err);
    }
}

// ===== PAGINATION =====
function renderPagination(type, currentPage, totalPages) {
    var container = document.getElementById(type + '-pagination');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    var prevBtn = document.createElement('button');
    prevBtn.className = 'admin-page-btn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = function () {
        if (type === 'users') loadUsers(currentPage - 1);
        if (type === 'posts') loadPosts(currentPage - 1);
        if (type === 'comments') loadComments(currentPage - 1);
    };
    container.appendChild(prevBtn);

    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, currentPage + 2);

    for (var i = start; i <= end; i++) {
        var btn = document.createElement('button');
        btn.className = 'admin-page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = (function (p) {
            return function () {
                if (type === 'users') loadUsers(p);
                if (type === 'posts') loadPosts(p);
                if (type === 'comments') loadComments(p);
            };
        })(i);
        container.appendChild(btn);
    }

    var nextBtn = document.createElement('button');
    nextBtn.className = 'admin-page-btn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = function () {
        if (type === 'users') loadUsers(currentPage + 1);
        if (type === 'posts') loadPosts(currentPage + 1);
        if (type === 'comments') loadComments(currentPage + 1);
    };
    container.appendChild(nextBtn);
}

// ===== MODAL =====
var modalCallback = null;

function showModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    modalCallback = onConfirm;

    document.getElementById('modal-confirm-btn').onclick = function () {
        if (modalCallback) modalCallback();
    };
}

function closeModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    modalCallback = null;
}

document.getElementById('confirm-modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});
