let currentSearchType = 'all';
const searchInput = document.getElementById('search-input');
const resultContainer = document.getElementById('search-results-container');
const emptyState = document.getElementById('search-empty');

function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, function(char){
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char];
    });
}

function userAvatar(user){
    if(user.avatar){
        return `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.username)}">`;
    }

    return `<span>${escapeHtml((user.username || 'U').substring(0, 1).toUpperCase())}</span>`;
}

function renderUsers(users){
    if(!users || users.length === 0){
        return '';
    }

    return `
        <section class="result-section">
            <h2>Người dùng</h2>
            ${users.map(function(user){
                return `
                    <a class="user-result" href="/profile/${encodeURIComponent(user.username)}">
                        <div class="result-avatar">${userAvatar(user)}</div>
                        <div class="result-body">
                            <div class="result-title">${escapeHtml(user.username)}</div>
                            <div class="result-meta">@${escapeHtml(user.username)}</div>
                            ${user.bio ? `<div class="result-text">${escapeHtml(user.bio)}</div>` : ''}
                            <div class="result-meta">${user.followingCount || 0} Đang theo dõi · ${user.followersCount || 0} Người theo dõi</div>
                        </div>
                    </a>
                `;
            }).join('')}
        </section>
    `;
}

function renderPostMedia(post){
    if(!post.media || post.media.length === 0){
        return '';
    }

    const media = post.media[0];
    if(media.type === 'video'){
        return `<video class="result-media" src="${escapeHtml(media.url)}" controls></video>`;
    }

    return `<img class="result-media" src="${escapeHtml(media.url)}" alt="Ảnh bài viết">`;
}

function renderPosts(posts){
    if(!posts || posts.length === 0){
        return '';
    }

    return `
        <section class="result-section">
            <h2>Bài viết</h2>
            ${posts.map(function(post){
                const author = post.author || {};
                return `
                    <article class="post-result" onclick="window.location.href='/post/${post._id}'">
                        <div class="result-avatar">${userAvatar(author.username ? author : { username: 'U' })}</div>
                        <div class="result-body">
                            <div>
                                <span class="result-title">${escapeHtml(author.username || 'Người dùng')}</span>
                                <span class="result-meta">@${escapeHtml(author.username || 'user')}</span>
                            </div>
                            <div class="result-text">${escapeHtml(post.content)}</div>
                            ${renderPostMedia(post)}
                        </div>
                    </article>
                `;
            }).join('')}
        </section>
    `;
}

function renderResults(data){
    const users = data.users || [];
    const posts = data.posts || [];

    if(users.length === 0 && posts.length === 0){
        emptyState.style.display = 'flex';
        emptyState.textContent = 'Không tìm thấy kết quả phù hợp.';
        resultContainer.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    resultContainer.innerHTML = renderUsers(users) + renderPosts(posts);
}

async function runSearch(){
    const keyword = searchInput.value.trim();

    if(!keyword){
        emptyState.style.display = 'flex';
        emptyState.textContent = 'Nhập từ khóa để tìm kiếm bài viết hoặc người dùng.';
        resultContainer.innerHTML = '';
        return;
    }

    emptyState.style.display = 'flex';
    emptyState.textContent = 'Đang tìm kiếm...';
    resultContainer.innerHTML = '';

    try{
        const response = await fetch(`/search?q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(currentSearchType)}`);
        const responseText = await response.text();
        let data = {};

        try{
            data = responseText ? JSON.parse(responseText) : {};
        }catch(parseErr){
            data = { message: responseText };
        }

        if(!response.ok){
            emptyState.textContent = data.message || 'Có lỗi khi tìm kiếm.';
            console.error('Search request failed:', response.status, data.message || responseText);
            return;
        }

        renderResults(data);
    }catch(err){
        console.error(err);
        emptyState.textContent = 'Không thể kết nối tới server.';
    }
}

document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click', function(){
        document.querySelectorAll('.tab').forEach(function(item){
            item.classList.remove('active');
        });

        this.classList.add('active');
        currentSearchType = this.dataset.type;
        runSearch();
    });
});

document.querySelectorAll('.suggest-item').forEach(function(item){
    item.addEventListener('click', function(){
        searchInput.value = this.dataset.keyword || '';
        runSearch();
    });
});

searchInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
        e.preventDefault();
        runSearch();
    }
});

if(searchInput.value.trim()){
    runSearch();
}