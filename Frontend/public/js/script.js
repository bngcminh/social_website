let tweets = [];
let follows = [];

function fmt(n){return n>=1000?(n/1000).toFixed(1)+'K':n}

async function loadPosts() {
  try {
    const response = await fetch('/');
    const result = await response.json();
    
    if (result.success && result.data) {
      tweets = result.data.map(post => ({
        ...post,
        replies: 0,
        liked: false,
        retweeted: false,
        color: ['#7c3aed', '#db2777', '#059669', '#1d9bf0'][Math.floor(Math.random() * 4)]
      }));
      renderFeed();
    }
  } catch (err) {
    console.error('Lỗi khi load posts:', err);
    document.getElementById('feed-list').innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">Không có bài viết nào</p>';
  }
}

async function loadFollows() {
  try {
    const response = await fetch('/api/users/suggestions');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      follows = result.data;
      renderFollows();
    } else {
      document.getElementById('follow-list').innerHTML = '<p style="padding: 10px; text-align: center; color: #999; font-size: 12px;">Không có gợi ý nào</p>';
    }
  } catch (err) {
    console.error('Lỗi khi load suggestions:', err);
    document.getElementById('follow-list').innerHTML = '<p style="padding: 10px; text-align: center; color: #999; font-size: 12px;">Lỗi khi tải dữ liệu</p>';
  }
}

function renderFeed(){
  const el=document.getElementById('feed-list');
  const template=document.getElementById('tweet-template');
  el.innerHTML='';
  tweets.forEach(t=>{
    const clone=template.content.cloneNode(true);
    const tweet=clone.querySelector('.tweet');
    tweet.id='tw'+t._id;
    clone.querySelector('.avatar').style.background=t.color || '#1d9bf0';
    clone.querySelector('.avatar').textContent=t.author?.username?.charAt(0).toUpperCase() || 'U';
    clone.querySelector('.tweet-name').textContent=t.author?.username || 'Anonymous';
    clone.querySelector('.tweet-handle').textContent='@' + (t.author?.username || 'user');
    
    // Calculate time ago
    const createdAt = new Date(t.createdAt);
    const now = new Date();
    const diff = Math.floor((now - createdAt) / 1000);
    let timeStr = 'vừa xong';
    if (diff < 60) timeStr = 'vừa xong';
    else if (diff < 3600) timeStr = Math.floor(diff / 60) + ' phút';
    else if (diff < 86400) timeStr = Math.floor(diff / 3600) + ' giờ';
    else timeStr = Math.floor(diff / 86400) + ' ngày';
    
    clone.querySelector('.tweet-time').textContent='· ' + timeStr;
    clone.querySelector('.tweet-text').textContent=t.content;
    
    // Render images
    if(t.media && t.media.length > 0){
      const imgContainer=clone.querySelector('.tweet-image');
      imgContainer.style.display='block';
      imgContainer.querySelector('img').src=t.media[0].url;
    } else {
      clone.querySelector('.tweet-image').style.display='none';
    }
    
    const buttons=clone.querySelectorAll('.tweet-actions button');
    buttons[0].onclick=()=>bump(event,t._id,'replies');
    buttons[0].querySelector('.count').textContent=fmt(t.commentCount || 0);
    buttons[0].id='rp'+t._id;
    
    buttons[1].onclick=()=>toggleRT(t._id);
    buttons[1].querySelector('.count').textContent=fmt(t.retpostCount || 0);
    buttons[1].id='rt'+t._id;
    
    buttons[2].onclick=()=>toggleLike(t._id);
    buttons[2].querySelector('.count').textContent=fmt(t.likeCount || 0);
    buttons[2].id='lk'+t._id;
    
    buttons[3].onclick=()=>bump(event,t._id,'views');
    buttons[3].querySelector('.count').textContent=fmt(t.viewsCount || 0);
    buttons[3].id='vw'+t._id;
    
    el.appendChild(clone);
  });
}

function renderFollows(){
  const el=document.getElementById('follow-list');
  const template=document.getElementById('follow-template');
  el.innerHTML='';
  follows.forEach((f)=>{
    const clone=template.content.cloneNode(true);
    clone.querySelector('.avatar').style.background=f.color;
    clone.querySelector('.avatar').textContent=f.init;
    clone.querySelector('.user-name').textContent=f.name;
    clone.querySelector('.user-handle').textContent=f.handle;
    const btn=clone.querySelector('.follow-btn');
    btn.id='fb'+f._id;
    btn.textContent=f.following?'Đang theo dõi':'Theo dõi';
    if(f.following) btn.classList.add('following');
    btn.onclick=()=>toggleFollow(f._id,btn);
    el.appendChild(clone);
  });
}

function toggleLike(id){
  const t=tweets.find(x=>x._id===id);
  if(!t) return;
  
  // Call API
  fetch(`/api/posts/${id}/like`, {
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
      const btn=document.getElementById('lk'+id);
      const countEl=btn.querySelector('.count');
      countEl.textContent=fmt(data.likeCount);
      btn.classList.remove('liked');
      if(data.liked) btn.classList.add('liked');
      t.likeCount = data.likeCount;
      t.liked = data.liked;
    }
  })
  .catch(err => console.error('Error:', err));
}

function toggleRT(id){
  const t=tweets.find(x=>x._id===id);
  if(!t) return;
  
  // Call API
  fetch(`/api/posts/${id}/retweet`, {
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
      const btn=document.getElementById('rt'+id);
      const countEl=btn.querySelector('.count');
      countEl.textContent=fmt(data.retpostCount);
      btn.classList.remove('retweeted');
      if(data.retweeted) btn.classList.add('retweeted');
      t.retpostCount = data.retpostCount;
      t.retweeted = data.retweeted;
    }
  })
  .catch(err => console.error('Error:', err));
}

function bump(e,id,field){
  const t=tweets.find(x=>x._id===id);
  if(!t) return;
  
  if(field==='replies') {
    // Show reply modal or form
    const content = prompt('Trả lời bài viết:');
    if(!content) return;
    
    fetch(`/api/posts/${id}/reply`, {
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
        const btn=document.getElementById('rp'+id);
        btn.querySelector('.count').textContent=fmt(data.commentCount);
        t.commentCount = data.commentCount;
        alert('Đã thêm trả lời!');
      }
    })
    .catch(err => console.error('Error:', err));
  } else if(field==='views') {
    t.viewsCount++;
    const btn=document.getElementById('vw'+id);
    btn.querySelector('.count').textContent=fmt(t.viewsCount);
  }
}

async function toggleFollow(userId,btn){
  try {
    const resp = await fetch(`/user/follow/${userId}`, {
      method: 'POST'
    });
    
    if(resp.status === 401){
      window.location.href = '/auth';
      return;
    }
    
    if(resp.ok){
      const result = await resp.json();
      const f = follows.find(x => x._id === userId);
      if(f){
        f.following = result.following;
        btn.textContent = result.following ? 'Đang theo dõi' : 'Theo dõi';
        btn.classList.remove('following');
        if(result.following) btn.classList.add('following');
      }
    } else {
      alert('Lỗi khi theo dõi');
    }
  } catch(err){
    console.error('Lỗi toggleFollow:', err);
    alert('Không thể thực hiện hành động');
  }
}

function updatePostBtn(el){
  const text = el.textContent.trim();
  document.getElementById('post-btn').disabled = text.length === 0;
}

function focusCompose(){document.getElementById('compose-input').focus()}

// Add event listener for contenteditable
const composeInput = document.getElementById('compose-input');
if(composeInput) {
  composeInput.addEventListener('input', function(){
    updatePostBtn(this);
  });
  
  // Handle placeholder visibility
  composeInput.addEventListener('focus', function(){
    if(this.textContent.trim() === '') {
      // Placeholder shown via CSS
    }
  });
  
  composeInput.addEventListener('blur', function(){
    if(this.textContent.trim() === '') {
      // Placeholder shown via CSS
    }
  });
}

// Handle file input change
document.getElementById('file-input').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(event){
      document.getElementById('preview-img').src = event.target.result;
      document.getElementById('image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

function clearPreview(){
  document.getElementById('file-input').value = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('preview-img').src = '';
}

async function postTweet(e){
  if(e) e.preventDefault();
  const ta=document.getElementById('compose-input');
  const text=ta.textContent.trim();
  if(!text) return;
  
  const btn=document.getElementById('post-btn');
  btn.disabled=true;
  btn.textContent='Đang đăng...';
  
  try {
    const formData=new FormData();
    formData.append('content', text);
    
    // Append file nếu có
    const fileInput=document.getElementById('file-input');
    if(fileInput.files.length > 0){
      formData.append('file', fileInput.files[0]);
    }
    
    const resp=await fetch('/create_post', {
      method:'POST',
      body:formData
    });
    
    if(resp.status===401){
      window.location.href='/auth';
      return;
    }
    
    if(resp.ok){
      const result=await resp.json();
      ta.textContent='';
      clearPreview();
      btn.textContent='Đăng';
      btn.disabled=true;
      loadPosts();
    } else {
      const err=await resp.text();
      alert('Lỗi: '+err);
      btn.textContent='Đăng';
      btn.disabled=true;
    }
  } catch(err){
    console.error('Lỗi đăng bài:', err);
    alert('Không thể đăng bài');
    btn.textContent='Đăng';
    btn.disabled=true;
  }
}

document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',function(){
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  this.classList.add('active');
}));

document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',function(){
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  this.classList.add('active');
}));

loadFollows();
loadPosts();
