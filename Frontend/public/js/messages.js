// Messages Page JavaScript
const socket = io();

let currentConversationId = null;

socket.on('connect', function(){
    socket.emit('join user', {
        userId: currentUserId
    });
});

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, function(m){
        return map[m];
    });
}

async function startConversation(receiverId){
    const response = await fetch('/conversations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId })
    });

    const result = await response.json();

    if(!result.success){
        alert(result.message || 'Khong the tao cuoc tro chuyen');
        return;
    }

    currentConversationId = result.conversation._id;

    socket.emit('join conversation', {
        conversationId: currentConversationId,
        userId: currentUserId
    });

    await loadMessages(currentConversationId);
}

async function loadMessages(conversationId){
    const response = await fetch(`/conversations/${conversationId}/messages`);
    const result = await response.json();

    if(!result.success){
        alert(result.message || 'Khong the tai tin nhan');
        return;
    }

    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';

    const heheDiv = document.createElement('div');
    heheDiv.className = 'heheboy';
    messagesList.appendChild(heheDiv);

    result.messages.forEach(function(message){
        renderMessage(message);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
}

async function loadConversation(conversationId) {
    currentConversationId = conversationId;

    socket.emit('join conversation', {
        conversationId: currentConversationId,
        userId: currentUserId
    });

    const item = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if(item){
            document.querySelectorAll('.conversation-item').forEach(function(conversationItem){
                conversationItem.classList.remove('active');
            });
            item.classList.add('active');

            const username = item.querySelector('.conversation-name')?.textContent || '';
            const avatarEl = item.querySelector('.avatar');
            const headerAvatar = document.getElementById('header-avatar');
            
            document.getElementById('header-username').textContent = username;
            
            // copy avatar từ conversation item sang header
            if(avatarEl){
                headerAvatar.innerHTML = avatarEl.innerHTML || avatarEl.textContent;
                if(!avatarEl.querySelector('img')){
                    headerAvatar.textContent = username.substring(0, 1).toUpperCase();
                }
            } else {
                headerAvatar.textContent = username.substring(0, 1).toUpperCase();
            }
        }

    document.getElementById('message-area-empty').style.display = 'none';
    document.getElementById('message-area-content').style.display = 'flex';

    await loadMessages(conversationId);
}

function sendMessage(){
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if(!content || !currentConversationId){
        return;
    }

    socket.emit('send message', {
        conversationId: currentConversationId,
        senderId: currentUserId,
        content
    });

    input.value = '';
}

socket.on('new message', function(message){
    if(String(message.conversation) === String(currentConversationId)){
        renderMessage(message);

        const messagesList = document.getElementById('messages-list');
        messagesList.scrollTop = messagesList.scrollHeight;
    }
});

socket.on('chat error', function(data){
    alert(data.message || 'Co loi khi chat');
});

socket.on('conversation updated', function(conversation){
    upsertConversationItem(conversation);
});

function renderMessage(message){
    const messagesList = document.getElementById('messages-list');
    const messageDiv = document.createElement('div');
    const isOwn = String(message.sender._id) === String(currentUserId);

    messageDiv.className = `message ${isOwn ? 'own mine' : 'other'}`;
    messageDiv.innerHTML = `
        <div class="message-bubble">${escapeHtml(message.content)}</div>
    `;

    messagesList.appendChild(messageDiv);
}

function getOtherParticipant(conversation){
    return conversation.participants.find(function(participant){
        return String(participant._id) !== String(currentUserId);
    });
}

function getConversationPreview(conversation){
    if(!conversation.lastMessage){
        return 'Bat dau cuoc tro chuyen...';
    }

    const prefix = String(conversation.lastMessage.sender?._id) === String(currentUserId) ? 'Ban: ' : '';
    return prefix + (conversation.lastMessage.content || '[Hinh anh]');
}

function upsertConversationItem(conversation){
    const conversationsEl = document.querySelector('.conversations');

    if(!conversationsEl){
        return;
    }

    const otherParticipant = getOtherParticipant(conversation);

    if(!otherParticipant){
        return;
    }

    const emptyEl = conversationsEl.querySelector('.no-conversations');
    if(emptyEl){
        emptyEl.remove();
    }

    let item = conversationsEl.querySelector(`[data-conversation-id="${conversation._id}"]`);

    if(!item){
        item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.conversationId = conversation._id;
        item.onclick = function(){
            loadConversation(conversation._id);
        };

        item.innerHTML = `
            <div class="conversation-avatar">
                <div class="avatar"></div>
            </div>
            <div class="conversation-info">
                <div class="conversation-name"></div>
                <div class="conversation-preview">
                    <span class="message-text"></span>
                </div>
            </div>
        `;
    }

    item.querySelector('.avatar').textContent = otherParticipant.username.substring(0, 1).toUpperCase();
    item.querySelector('.conversation-name').textContent = otherParticipant.username;
    item.querySelector('.message-text').textContent = getConversationPreview(conversation).substring(0, 50);

    conversationsEl.prepend(item);
}

function setupMessageInput() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    if(!messageInput || !sendBtn){
        return;
    }

    messageInput.addEventListener('keypress', function(e){
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');

    if(!searchInput){
        return;
    }

    searchInput.addEventListener('input', function(e){
        const searchTerm = e.target.value.toLowerCase();
        const conversationItems = document.querySelectorAll('.conversation-item');

        conversationItems.forEach(function(item){
            const username = item.querySelector('.conversation-name').textContent.toLowerCase();
            item.style.display = username.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

function setupNewMessageButton() {
    const newMessageBtn = document.querySelector('.new-message-btn');

    if(!newMessageBtn){
        return;
    }

    newMessageBtn.addEventListener('click', function(){
        const targetUsername = prompt('Nhap ten nguoi dung de bat dau cuoc tro chuyen:');
        if(targetUsername){
            startNewConversation(targetUsername);
        }
    });
}

async function startNewConversation(username) {
    try{
        const response = await fetch(`/search?q=${encodeURIComponent(username)}&type=users`);
        const result = await response.json();
        const user = result.users && result.users[0];

        if(!user){
            alert('Khong tim thay nguoi dung');
            return;
        }

        await startConversation(user._id);
        location.reload();
    }catch(error){
        console.error('Error starting conversation:', error);
        alert('Loi khi tao cuoc tro chuyen');
    }
}

document.addEventListener('DOMContentLoaded', function(){
    setupMessageInput();
    setupSearch();
    setupNewMessageButton();
});
