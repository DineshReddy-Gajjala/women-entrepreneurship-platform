/* ==============================================
   Women Entrepreneurs Platform — Frontend Logic
   ============================================== */

const API_BASE = ''; // Same origin since Flask serves everything

// ─── Token Management ────────────────────────────
function getToken() {
  return localStorage.getItem('we_token');
}

function setToken(token) {
  localStorage.setItem('we_token', token);
}

function removeToken() {
  localStorage.removeItem('we_token');
}

function logout() {
  removeToken();
  window.location.href = '/login';
}

// ─── Helper: API Fetch ────────────────────────────
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(API_BASE + url, { ...options, headers });
  return res;
}

// ─── Auth: Login / Signup ────────────────────────────
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const msg = document.getElementById('authMessage');

  if (!loginForm) return; // Guard for pages without auth forms

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
  if (msg) msg.classList.add('hidden');
}

function showAuthMessage(text, type) {
  const msg = document.getElementById('authMessage');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `auth-message ${type}`;
  msg.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      setToken(data.access_token);
      showAuthMessage('Login successful! Redirecting…', 'success');
      setTimeout(() => window.location.href = '/dashboard', 800);
    } else {
      showAuthMessage(data.msg || 'Login failed. Check your credentials.', 'error');
    }
  } catch (err) {
    showAuthMessage('Network error. Please try again.', 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const interests = document.getElementById('signupInterests').value;

  try {
    const res = await apiFetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, interests: interests ? [interests] : [] })
    });
    const data = await res.json();

    if (res.ok) {
      setToken(data.access_token);
      showAuthMessage('Account created! Redirecting…', 'success');
      setTimeout(() => window.location.href = '/dashboard', 800);
    } else {
      showAuthMessage(data.msg || 'Signup failed.', 'error');
    }
  } catch (err) {
    showAuthMessage('Network error. Please try again.', 'error');
  }
}

// ─── Dashboard: Profile ────────────────────────────
async function loadProfile() {
  const container = document.getElementById('profileInfo');
  if (!container) return;

  const token = getToken();
  if (!token) {
    container.innerHTML = '<p style="color:var(--gray-400); font-size:.9rem;">Please <a href="/login" style="color:var(--primary-500);">login</a> to see your profile.</p>';
    return;
  }

  try {
    const res = await apiFetch('/api/profile');
    if (!res.ok) throw new Error('Unauthorized');
    const user = await res.json();

    // Update name in header
    const nameEl = document.getElementById('userName');
    if (nameEl && user.name) nameEl.textContent = user.name;

    container.innerHTML = `
      <div class="rec-item">
        <h4>📧 ${user.email || 'N/A'}</h4>
        <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
        <p><strong>Interests:</strong> ${(user.interests || []).join(', ') || 'Not set'}</p>
        ${user.is_entrepreneur ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--gray-100);">
            <p><strong>Business:</strong> ${user.business_name || 'Not set'}</p>
            <p><strong>Status:</strong> <span class="badge" style="background:var(--success); color:#fff;">Entrepreneur Active</span></p>
          </div>
        ` : ''}
      </div>
    `;

    // Fill profile editor if it exists
    const editName = document.getElementById('editBusinessName');
    if (editName) {
      editName.value = user.business_name || '';
      document.getElementById('editBusinessDesc').value = user.business_description || '';
      document.getElementById('editBusinessImage').value = user.business_image_url || '';
      document.getElementById('editIsEntrepreneur').checked = user.is_entrepreneur || false;
    }
  } catch {
    container.innerHTML = '<p style="color:var(--danger); font-size:.9rem;">Session expired. Please <a href="/login" style="color:var(--primary-500);">login again</a>.</p>';
  }
}

// ─── Dashboard: Profile Editor ────────────────────
function showProfileEditor() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const business_name = document.getElementById('editBusinessName').value;
  const business_description = document.getElementById('editBusinessDesc').value;
  const business_image_url = document.getElementById('editBusinessImage').value;
  const is_entrepreneur = document.getElementById('editIsEntrepreneur').checked;

  try {
    const res = await apiFetch('/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        business_name,
        business_description,
        business_image_url,
        is_entrepreneur
      })
    });

    if (res.ok) {
      alert('Profile updated successfully! ✨');
      closeProfileModal();
      loadProfile(); // Refresh dashboard
      if (window.location.pathname === '/') loadEntrepreneurs(); // Refresh home if visible
    } else {
      alert('Failed to update profile.');
    }
  } catch (err) {
    console.error('Update error:', err);
    alert('Network error.');
  }
}

// ─── Dashboard: AI Recommendations ────────────────
async function loadRecommendations() {
  const container = document.getElementById('recommendationsList');
  if (!container) return;

  const token = getToken();
  if (!token) {
    container.innerHTML = '<p style="color:var(--gray-400); font-size:.9rem;">Login to see personalised recommendations.</p>';
    return;
  }

  try {
    const res = await apiFetch('/api/recommendations');
    if (!res.ok) throw new Error();
    const ideas = await res.json();

    if (ideas.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-400); font-size:.9rem;">No recommendations yet. Update your interests in profile!</p>';
      return;
    }

    container.innerHTML = ideas.map(idea => `
      <div class="rec-item">
        <h4>${idea.title}</h4>
        <p>${idea.description}</p>
        <span class="badge">${idea.industry}</span>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:var(--gray-400); font-size:.9rem;">Could not load recommendations.</p>';
  }
}

// ─── Entrepreneurs Page / Section ───────────────
let allEntrepreneurs = [];

async function loadEntrepreneurs() {
  const grid = document.getElementById('entrepreneursGrid');
  if (!grid) return;

  try {
    const res = await apiFetch('/api/entrepreneurs');
    allEntrepreneurs = await res.json();
    renderEntrepreneurs(allEntrepreneurs);
  } catch {
    grid.innerHTML = '<p style="color:var(--danger); text-align:center; grid-column:1/-1;">Failed to load profiles.</p>';
  }
}

function renderEntrepreneurs(entrepreneurs) {
  const grid = document.getElementById('entrepreneursGrid');
  if (!grid) return;

  if (entrepreneurs.length === 0) {
    grid.innerHTML = '<p style="color:var(--gray-400); text-align:center; grid-column:1/-1;">No entrepreneurs found.</p>';
    return;
  }

  grid.innerHTML = entrepreneurs.map(e => `
    <div class="business-card">
      <div class="wallet-badge" onclick="toggleWallet(event, '${e.email}', 'profile', '${e.business_name}')" id="wallet-${e.email}">
        💼
      </div>
      <img src="${e.business_image_url || 'https://via.placeholder.com/400x200?text=Business'}" alt="${e.business_name}" class="business-image">
      <div class="business-content">
        <h3>${e.business_name || 'New Business'}</h3>
        <p>${e.business_description || 'No description provided.'}</p>
        <button class="btn-card" onclick="openConnectModal('${e.name}')">Connect →</button>
      </div>
    </div>
  `).join('');
}

async function toggleWallet(event, id, type, name) {
  event.stopPropagation();
  const badge = event.currentTarget;
  const token = getToken();
  
  if (!token) {
    alert('Please login to use the wallet feature!');
    window.location.href = '/login';
    return;
  }

  const isActive = badge.classList.contains('active');
  const endpoint = isActive ? '/api/wallet/remove' : '/api/wallet/add';
  const body = isActive ? { id, type } : { item: { id, type, name, timestamp: new Date().toISOString() } };

  try {
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (res.ok) {
      badge.classList.toggle('active');
      const msg = isActive ? 'Removed from wallet' : 'Added to wallet!';
      
      // Visual feedback for "Add to Cart" specifically
      if (badge.textContent.includes('Add to Cart')) {
        const originalText = badge.textContent;
        badge.textContent = isActive ? 'Removed' : 'Added! ✨';
        badge.style.background = isActive ? 'var(--gray-300)' : 'var(--success)';
        badge.style.color = 'white';
        setTimeout(() => {
          badge.textContent = isActive ? 'Add to Cart →' : 'In Wallet 💼';
          badge.style.background = '';
          badge.style.color = '';
        }, 1500);
      }
      
      console.log(`${msg}: ${name}`);
      // Refresh wallet if on dashboard
      if (document.getElementById('walletItemsList')) loadWalletItems();
    }
  } catch (err) {
    console.error('Wallet error:', err);
  }
}

async function loadWalletItems() {
  const container = document.getElementById('walletItemsList');
  if (!container) return;

  try {
    const res = await apiFetch('/api/wallet');
    const items = await res.json();

    if (items.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-400); font-size:.9rem;">Your wallet is empty. Save some business profiles or products!</p>';
      return;
    }

    container.innerHTML = `
      <div class="wallet-grid">
        ${items.map(item => `
          <div class="stat-card" style="text-align: left; position: relative;">
            <div style="font-size: 1.5rem; margin-bottom: 8px;">${item.type === 'profile' ? '👩‍💼' : '🛍️'}</div>
            <h4 style="font-size: 0.95rem;">${item.name}</h4>
            <p style="font-size: 0.8rem; color: var(--gray-400);">${item.type.toUpperCase()}</p>
            <button onclick="removeFromWallet('${item.id}', '${item.type}')" style="position: absolute; top: 10px; right: 10px; background: none; color: var(--danger); font-size: 0.8rem;">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch {
    container.innerHTML = '<p style="color:var(--danger); font-size:.9rem;">Could not load wallet.</p>';
  }
}

async function removeFromWallet(id, type) {
  try {
    const res = await apiFetch('/api/wallet/remove', {
      method: 'POST',
      body: JSON.stringify({ id, type })
    });
    if (res.ok) loadWalletItems();
  } catch (err) {
    console.error('Remove error:', err);
  }
}

// ─── Dashboard: Success Prediction ────────────────
async function handlePredict(e) {
  e.preventDefault();
  const title = document.getElementById('ideaTitle').value;
  const investment = document.getElementById('ideaInvestment').value;
  const market_size = document.getElementById('ideaMarket').value;
  const resultDiv = document.getElementById('predictionResult');

  try {
    const res = await apiFetch('/api/predict_success', {
      method: 'POST',
      body: JSON.stringify({ title, investment, market_size })
    });
    const data = await res.json();

    const colorMap = { High: 'var(--success)', Moderate: 'var(--warning)', Low: 'var(--danger)' };
    resultDiv.innerHTML = `
      <div class="idea-result" style="border-left-color: ${colorMap[data.success_level] || 'var(--gray-300)'};">
        <h4>${data.success_level} Potential ✨</h4>
        <p>${data.message}</p>
        <p style="margin-top:6px; font-weight:600; color:${colorMap[data.success_level]};">Score: ${data.score}/60</p>
      </div>
    `;
  } catch {
    resultDiv.innerHTML = '<p style="color:var(--danger); font-size:.9rem;">Prediction failed. Try again.</p>';
  }
}

// ─── Mentors Page ────────────────────────────────
let allMentors = [];

async function loadMentors() {
  const grid = document.getElementById('mentorsGrid');
  if (!grid) return;

  try {
    const res = await apiFetch('/api/mentors');
    allMentors = await res.json();
    renderMentors(allMentors);
    
    // Initialize modal listeners if on this page
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
      closeBtn.onclick = closeConnectModal;
      document.getElementById('connectModal').onclick = (e) => {
        if (e.target.id === 'connectModal') closeConnectModal();
      };
      document.getElementById('connectForm').onsubmit = handleConnectSubmit;
    }
  } catch {
    grid.innerHTML = '<p style="color:var(--danger); text-align:center; grid-column:1/-1;">Failed to load mentors.</p>';
  }
}

function renderMentors(mentors) {
  const grid = document.getElementById('mentorsGrid');
  if (!grid) return;

  if (mentors.length === 0) {
    grid.innerHTML = '<p style="color:var(--gray-400); text-align:center; grid-column:1/-1;">No mentors found matching your search.</p>';
    return;
  }

  const emojis = ['👩‍💻', '👩‍🔬', '👩‍🎨', '👩‍⚕️', '👩‍🏫'];

  grid.innerHTML = mentors.map((m, i) => `
    <div class="card">
      <p class="card-meta">${m.expertise}</p>
      <p>${m.bio}</p>
      <div style="display: flex; gap: 10px; margin-top: auto;">
        <button class="btn-card" onclick="openConnectModal('${m.name}')">Connect →</button>
        <button class="btn-card" style="background: var(--primary-100); color: var(--primary-600); box-shadow: none;" onclick="toggleWallet(event, '${m.id}', 'mentor', '${m.name}')">💼</button>
      </div>
    </div>
  `).join('');
}

function filterMentors() {
  const query = document.getElementById('mentorSearch').value.toLowerCase();
  const filtered = allMentors.filter(m => 
    m.name.toLowerCase().includes(query) || 
    m.expertise.toLowerCase().includes(query) || 
    m.bio.toLowerCase().includes(query)
  );
  renderMentors(filtered);
}

function openConnectModal(name) {
  const modal = document.getElementById('connectModal');
  const visitorEmailGroup = document.getElementById('visitorEmailGroup');
  const targetInput = document.getElementById('targetMentor');
  const modalTitle = document.getElementById('modalTitle');
  
  targetInput.value = name;
  modalTitle.textContent = `Connect with ${name}`;
  
  // Hide email field if logged in
  if (getToken()) {
    visitorEmailGroup.classList.add('hidden');
    document.getElementById('visitorEmail').required = false;
  } else {
    visitorEmailGroup.classList.remove('hidden');
    document.getElementById('visitorEmail').required = true;
  }
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeConnectModal() {
  const modal = document.getElementById('connectModal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  document.getElementById('connectForm').reset();
  const msg = document.getElementById('modalMessage');
  msg.classList.add('hidden');
}

async function handleConnectSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitConnect');
  const msg = document.getElementById('modalMessage');
  const mentor = document.getElementById('targetMentor').value;
  const email = document.getElementById('visitorEmail').value;
  const message = document.getElementById('connectMessage').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const res = await apiFetch('/api/connect_mentor', {
      method: 'POST',
      body: JSON.stringify({ mentor, email, message })
    });

    if (res.ok) {
      msg.textContent = `Success! Your message has been sent to ${mentor}. ✨`;
      msg.className = 'auth-message success';
      msg.classList.remove('hidden');
      setTimeout(closeConnectModal, 2000);
    } else {
      throw new Error();
    }
  } catch {
    msg.textContent = 'Failed to send request. Please try again.';
    msg.className = 'auth-message error';
    msg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Request ✨';
  }
}

// ─── Marketplace Page ────────────────────────────
let allProducts = [];

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  try {
    const res = await apiFetch('/api/products');
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch {
    grid.innerHTML = '<p style="color:var(--danger); text-align:center; grid-column:1/-1;">Failed to load products.</p>';
  }
}

let activeProductChatId = null;

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const icons = ['🎒', '💍', '🧴', '🌿', '🎨', '📦'];
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card">
      <div class="product-card-inner">
        <span class="product-badge">${p.category}</span>
        <div class="product-preview">
          <span class="product-icon">${icons[i % icons.length]}</span>
        </div>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="product-card-footer">
          <div class="card-price">₹${p.price.toFixed(2)}</div>
          <div class="product-actions">
            <button class="btn-card" onclick="toggleWallet(event, '${p.id}', 'product', '${p.name}')">Add to Cart →</button>
            <button class="btn-card secondary" onclick="openProductChat(${p.id})">Chat Seller</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

async function openProductChat(productId) {
  const modal = document.getElementById('productChatModal');
  const title = document.getElementById('productChatTitle');
  const subtitle = document.getElementById('productChatSubtitle');
  const body = document.getElementById('productChatBody');
  const input = document.getElementById('productChatInput');

  const product = allProducts.find((item) => item.id === productId);
  if (!product || !modal || !body || !title || !subtitle || !input) return;

  activeProductChatId = productId;
  title.textContent = `Chat with seller about ${product.name}`;
  subtitle.textContent = `Ask about ${product.name}, pricing, delivery or customization and receive a fast seller reply.`;
  input.value = '';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  try {
    const res = await apiFetch(`/api/product_chat/${productId}`);
    const history = res.ok ? await res.json() : [];
    renderProductChat(history);
  } catch {
    body.innerHTML = '<div class="product-chat-system">Unable to load chat history. Please try again.</div>';
  }
}

function closeProductChatModal() {
  const modal = document.getElementById('productChatModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
}

function renderProductChat(history) {
  const body = document.getElementById('productChatBody');
  if (!body) return;

  if (!history || history.length === 0) {
    body.innerHTML = '<div class="product-chat-system">No conversation yet. Send the first message to the seller.</div>';
    return;
  }

  body.innerHTML = history.map((item) => `
    <div class="product-chat-message ${item.sender}">
      ${escapeHtml(item.message)}
    </div>
  `).join('');
  body.scrollTop = body.scrollHeight;
}

async function sendProductChatMessage() {
  const input = document.getElementById('productChatInput');
  const body = document.getElementById('productChatBody');
  if (!input || !body || !activeProductChatId) return;

  const message = input.value.trim();
  if (!message) return;

  try {
    const res = await apiFetch('/api/product_chat', {
      method: 'POST',
      body: JSON.stringify({
        productId: activeProductChatId,
        message,
        sender: 'buyer'
      })
    });
    const data = await res.json();

    if (res.ok && data.history) {
      renderProductChat(data.history);
      input.value = '';
    } else {
      body.innerHTML += '<div class="product-chat-system">Could not send your message. Try again.</div>';
    }
  } catch {
    body.innerHTML += '<div class="product-chat-system">Network error while sending chat.</div>';
  }
}

// ─── Chatbot ────────────────────────────────────
function initChatbot() {
  const fab = document.getElementById('chatbotFab');
  const win = document.getElementById('chatbotWindow');
  const closeBtn = document.getElementById('chatbotClose');
  const sendBtn = document.getElementById('chatSend');
  const input = document.getElementById('chatInput');

  if (!fab || !win) return;

  fab.addEventListener('click', () => {
    win.classList.toggle('hidden');
    fab.style.display = win.classList.contains('hidden') ? 'flex' : 'none';
    if (!win.classList.contains('hidden')) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    win.classList.add('hidden');
    fab.style.display = 'flex';
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const body = document.getElementById('chatbotBody');
  const question = input.value.trim();
  if (!question) return;

  // Add user message
  body.innerHTML += `<div class="chat-msg user">${escapeHtml(question)}</div>`;
  input.value = '';
  body.scrollTop = body.scrollHeight;

  try {
    const res = await apiFetch('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    body.innerHTML += `<div class="chat-msg bot">${escapeHtml(data.answer)}</div>`;
  } catch {
    body.innerHTML += `<div class="chat-msg bot">Sorry, I'm having trouble right now. Please try again later.</div>`;
  }
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Navbar Scroll Effect & Mobile Toggle ────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

// ─── Initialize Everything ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initChatbot();
  
  // Page specific initializers
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') {
    loadEntrepreneurs();
  }
});
