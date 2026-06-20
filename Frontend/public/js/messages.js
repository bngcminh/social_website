// Messages Page JavaScript
const socket = io();

let currentConversationId = null;
let autoRefreshInterval = null;

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
        alert(result.message);
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
        alert(result.message);
        return;
    }

    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';

    result.messages.forEach(function(message){
        renderMessage(message);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
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
    if(message.conversation === currentConversationId){
        renderMessage(message);

        const messagesList = document.getElementById('messages-list');
        messagesList.scrollTop = messagesList.scrollHeight;
    }
});

socket.on('chat error', function(data){
    alert(data.message);
});

function renderMessage(message){
    const messagesList = document.getElementById('messages-list');

    const messageDiv = document.createElement('div');
    messageDiv.className = message.sender._id === currentUserId ? 'message mine' : 'message';

    messageDiv.innerHTML = `
        <div class="message-sender">${message.sender.username}</div>
        <div class="message-content">${message.content}</div>
        <div class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</div>
    `;

    messagesList.appendChild(messageDiv);
}
// Load conversation
async function loadConversation(conversationId) {
    try {
        currentConversationId = conversationId;
        
        const response = await fetch(`/api/conversations/${conversationId}`);
        const result = await response.json();

        if (result.success) {
            const { conversation, messages } = result.data;

            // Update header
            const otherParticipant = conversation.participants.find(p => p._id.toString() !== userId);
            document.getElementById('header-username').textContent = otherParticipant.username;
            document.getElementById('header-avatar').textContent = otherParticipant.username.substring(0, 1).toUpperCase();

            // Show message area
            document.getElementById('message-area-empty').style.display = 'none';
            document.getElementById('message-area-content').style.display = 'flex';

            // Update active conversation
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.add('active');

            // Display messages
            displayMessages(messages);

            // Scroll to bottom
            setTimeout(() => {
                const messagesList = document.getElementById('messages-list');
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 100);

            // Stop previous auto-refresh
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }

            // Auto-refresh messages every 2 seconds
            autoRefreshInterval = setInterval(() => {
                refreshMessages(conversationId);
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        alert('Lỗi khi tải cuộc trò chuyện');
    }
}

// Display messages
function displayMessages(messages) {
    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';

    // Thêm div heheboy vào đầu
    const heheDiv = document.createElement('div');
    heheDiv.className = 'heheboy';
    messagesList.appendChild(heheDiv);

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        const isOwn = message.sender._id === userId;
        
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        
        let content = '';
        if (message.content) {
            content = `<div class="message-bubble">${escapeHtml(message.content)}</div>`;
        }

        if (message.image && message.image.length > 0) {
            message.image.forEach(img => {
                content += `<div class="message-bubble"><img src="${img}" alt="message image" class="message-image"></div>`;
            });
        }

        messageDiv.innerHTML = content;
        messagesList.appendChild(messageDiv);
    });
}

// Refresh messages
async function refreshMessages(conversationId) {
    try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        const result = await response.json();

        if (result.success) {
            const messagesList = document.getElementById('messages-list');
            const currentMessageCount = messagesList.children.length;
            const newMessageCount = result.data.messages.length;

            // Only update if there are new messages
            if (newMessageCount > currentMessageCount) {
                displayMessages(result.data.messages);
                // Scroll to bottom
                setTimeout(() => {
                    messagesList.scrollTop = messagesList.scrollHeight;
                }, 50);
            }
        }
    } catch (error) {
        console.error('Error refreshing messages:', error);
    }
}

// Send message
async function sendMessage() {
    if (!currentConversationId) return;

    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();

    if (!content) return;

    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: currentConversationId,
                content: content,
                image: []
            })
        });

        const result = await response.json();

        if (result.success) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Fetch and display messages immediately
            const convResponse = await fetch(`/api/conversations/${currentConversationId}`);
            const convResult = await convResponse.json();
            
            if (convResult.success) {
                displayMessages(convResult.data.messages);
                // Scroll to bottom
                setTimeout(() => {
                    const messagesList = document.getElementById('messages-list');
                    messagesList.scrollTop = messagesList.scrollHeight;
                }, 100);
            }
        } else {
            alert('Lỗi khi gửi tin nhắn: ' + result.message);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Lỗi khi gửi tin nhắn');
    }
}

function setupMessageInput() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
    });

    sendBtn.addEventListener('click', sendMessage);
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const conversationItems = document.querySelectorAll('.conversation-item');

        conversationItems.forEach(item => {
            const username = item.querySelector('.conversation-name').textContent.toLowerCase();
            if (username.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function setupNewMessageButton() {
    const newMessageBtn = document.querySelector('.new-message-btn');
    
    newMessageBtn.addEventListener('click', () => {
        const targetUsername = prompt('Nhập tên người dùng để bắt đầu cuộc trò chuyện:');
        if (targetUsername) {
            startNewConversation(targetUsername);
        }
    });
}

async function startNewConversation(username) {
    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(username)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            const user = result.data[0];
            
            const convResponse = await fetch('/api/conversations/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user._id
                })
            });

            const convResult = await convResponse.json();
            
            if (convResult.success) {
                location.reload();
            }
        } else {
            alert('Không tìm thấy người dùng');
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
        alert('Lỗi khi tạo cuộc trò chuyện');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    setupMessageInput();
    setupSearch();
    setupNewMessageButton();
});
