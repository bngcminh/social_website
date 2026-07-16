let currentPage = 1;
let totalPages = 1;
let currentFilter = 'all';

const NOTIF_ICONS = {
    like: '<svg viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>',
    comment: '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>',
    follow: '<svg viewBox="0 0 24 24"><path d="M12 11.816c1.355 0 2.872-.15 3.84-1.256.814-.93 1.078-2.368.806-4.392-.38-2.825-2.117-4.512-4.646-4.512S7.734 3.343 7.354 6.168c-.272 2.024-.008 3.462.806 4.392.968 1.107 2.485 1.256 3.84 1.256zM8.84 6.368c.162-1.2.787-3.212 3.16-3.212s2.998 2.013 3.16 3.212c.207 1.55.057 2.627-.45 3.205-.455.52-1.266.743-2.71.743s-2.255-.223-2.71-.743c-.507-.578-.657-1.656-.45-3.205zm11.44 12.868c-.877-3.526-4.282-5.99-8.28-5.99s-7.403 2.464-8.28 5.99c-.172.692-.028 1.4.395 1.94.408.52 1.04.82 1.733.82h12.304c.693 0 1.325-.3 1.733-.82.424-.54.567-1.247.394-1.94zm-1.576 1.016c-.126.16-.316.246-.552.246H5.848c-.235 0-.426-.085-.552-.246-.137-.174-.18-.412-.12-.654.71-2.855 3.517-4.84 6.824-4.84s6.114 1.985 6.824 4.84c.06.242.017.48-.12.654z"/></svg>',
    admin_lock_post: '<svg viewBox="0 0 24 24"><path d="M17 11V7c0-2.757-2.243-5-5-5S7 4.243 7 7v4H5v13h14V11h-2zm-7-4c0-1.654 1.346-3 3-3s3 1.346 3 3v4H10V7zm7 15H7V13h10v9z"/></svg>',
    admin_lock_account: '<svg viewBox="0 0 24 24"><path d="M17 11V7c0-2.757-2.243-5-5-5S7 4.243 7 7v4H5v13h14V11h-2zm-7-4c0-1.654 1.346-3 3-3s3 1.346 3 3v4H10V7zm7 15H7V13h10v9z"/></svg>'
};

const NOTIF_MESSAGES = {
    like: 'đã thích bài viết của bạn',
    comment: 'đã bình luận bài viết của bạn',
    follow: 'đã theo dõi bạn',
    admin_lock_post: 'Bài viết của bạn đã bị quản trị viên ẩn',
    admin_lock_account: 'Tài khoản của bạn đã bị quản trị viên khóa'
};

function timeAgo(dateStr){
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if(diffSec < 60) return 'Vừa xong';
    if(diffMin < 60) return `${diffMin} phút trước`;
    if(diffHour < 24) return `${diffHour} giờ trước`;
    if(diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

async function refreshHeaderNotificationBadge(){
    try{
        const badge = document.getElementById('header-notif-badge');
        if(!badge) return;

        const res = await fetch('/api/notifications/unread-count');
        const data = await res.json();
        const count = data.success ? data.unreadCount : 0;

        if(count > 0){
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        }else{
            badge.textContent = '';
            badge.style.display = 'none';
        }
    }catch(err){
        console.log('Lỗi cập nhật số thông báo:', err);
    }
}

function renderNotification(notif){
    const template = document.getElementById('notification-template');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.notif-item');

    item.dataset.id = notif._id;
    if(!notif.isRead) item.classList.add('unread');

    const iconEl = item.querySelector('.notif-icon');
    iconEl.classList.add(notif.type);
    iconEl.innerHTML = NOTIF_ICONS[notif.type] || '';

    const avatarEl = item.querySelector('.notif-avatar');
    if(notif.sender){
        if(notif.sender.avatar){
            avatarEl.innerHTML = `<img src="${notif.sender.avatar}" alt="${notif.sender.username}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
        }else{
            avatarEl.textContent = notif.sender.username.substring(0, 1).toUpperCase();
        }
    }

    const textEl = item.querySelector('.notif-text');
    const senderName = notif.sender ? notif.sender.username : 'Hệ thống';
    let message = NOTIF_MESSAGES[notif.type] || '';
    textEl.innerHTML = `<strong>${senderName}</strong> ${message}`;

    if(notif.post && notif.post.content){
        const preview = document.createElement('span');
        preview.className = 'notif-preview';
        preview.textContent = notif.post.content.substring(0, 80) + (notif.post.content.length > 80 ? '...' : '');
        textEl.appendChild(preview);
    }

    item.querySelector('.notif-time').textContent = timeAgo(notif.createdAt);

    item.addEventListener('click', function(e){
        if(e.target.closest('.notif-delete')) return;
        markAsRead(notif._id);
        item.classList.remove('unread');
        refreshHeaderNotificationBadge();
        if(notif.url){
            window.location.href = notif.url;
        }
    });

    item.querySelector('.notif-delete').addEventListener('click', function(e){
        e.stopPropagation();
        deleteNotification(notif._id, item);
    });

    return clone;
}

async function loadNotifications(page = 1, append = false){
    try{
        const res = await fetch(`/api/notifications?page=${page}&limit=20`);
        const data = await res.json();

        if(!data.success) return;

        totalPages = data.totalPages;
        currentPage = data.page;

        const list = document.getElementById('notification-list');
        const empty = document.getElementById('empty-state');
        const loadMore = document.getElementById('load-more-container');

        if(!append) list.innerHTML = '';

        let notifications = data.notifications;

        if(currentFilter === 'unread'){
            notifications = notifications.filter(function(n){ return !n.isRead; });
        }

        if(notifications.length === 0 && !append){
            empty.style.display = 'flex';
            loadMore.style.display = 'none';
            return;
        }

        empty.style.display = 'none';

        notifications.forEach(function(notif){
            list.appendChild(renderNotification(notif));
        });

        loadMore.style.display = currentPage < totalPages ? 'block' : 'none';
    }catch(err){
        console.log('Lỗi tải thông báo:', err);
    }
}

function loadMoreNotifications(){
    if(currentPage < totalPages){
        loadNotifications(currentPage + 1, true);
    }
}

async function markAsRead(id){
    try{
        await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
        refreshHeaderNotificationBadge();
    }catch(err){
        console.log('Lỗi đánh dấu đã đọc:', err);
    }
}

async function markAllAsRead(){
    try{
        await fetch('/api/notifications/read-all', { method: 'PUT' });
        document.querySelectorAll('.notif-item.unread').forEach(function(item){
            item.classList.remove('unread');
        });
        refreshHeaderNotificationBadge();
    }catch(err){
        console.log('Lỗi đánh dấu tất cả:', err);
    }
}

async function deleteNotification(id, element){
    try{
        const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success){
            const wasUnread = element.classList.contains('unread');
            element.style.transition = 'opacity .3s, transform .3s';
            element.style.opacity = '0';
            element.style.transform = 'translateX(20px)';
            setTimeout(function(){
                element.remove();
                if(document.querySelectorAll('.notif-item').length === 0){
                    document.getElementById('empty-state').style.display = 'flex';
                }
            }, 300);
            if(wasUnread) refreshHeaderNotificationBadge();
        }
    }catch(err){
        console.log('Lỗi xóa thông báo:', err);
    }
}

document.addEventListener('DOMContentLoaded', function(){
    loadNotifications();

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
            tabs.forEach(function(t){ t.classList.remove('active'); });
            tab.classList.add('active');

            if(tab.id === 'tab-unread'){
                currentFilter = 'unread';
            } else {
                currentFilter = 'all';
            }
            loadNotifications(1);
        });
    });
});
