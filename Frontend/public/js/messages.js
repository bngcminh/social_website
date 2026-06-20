// Messages Page JavaScript
const socket = io();

let currentConversationId = null;

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
        document.getElementById('header-username').textContent = username;
        document.getElementById('header-avatar').textContent = username.substring(0, 1).toUpperCase();
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
