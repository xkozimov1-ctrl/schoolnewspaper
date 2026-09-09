let articles = [];
let bookmarks = JSON.parse(localStorage.getItem('sg_bookmarks')) || [];
let currentArticleId = null;
let currentFilter = 'Barchasi';

// 1. BACKEND API DANI DATA OLISH
async function fetchArticles() {
  try {
    const res = await fetch('/api/articles');
    articles = await res.json();
    renderArticles();
  } catch (err) {
    showToast("Ma'lumotlarni yuklashda xatolik yuz berdi", "error");
  }
}

// 2. TOAST NOTIFICATION
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
  
  toast.className = `${bgClass} text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
  
  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function calculateReadTime(text) {
  if (!text) return "1 min o'qish";
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 150)} min o'qish`;
}

// 3. SAHIFALAR O'RTASIDA NAVIGATSIYA
function showPage(pageId) {
  document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const header = document.getElementById('main-header');
  const nav = document.getElementById('main-nav');

  if (pageId === 'admin-view') {
    if (header) header.classList.add('hidden');
    if (nav) nav.classList.add('hidden');
  } else {
    if (header) header.classList.remove('hidden');
    if (nav) nav.classList.remove('hidden');
  }
}

// 4. MAQOLALARNI CHIQARISH
function renderArticles(filterCat = currentFilter, searchQuery = '') {
  currentFilter = filterCat;
  const container = document.getElementById('home-articles-container');
  if (!container) return;

  const heroMain = document.getElementById('hero-main-card');
  const heroSide = document.getElementById('hero-side-cards');
  const sortElem = document.getElementById('sort-select');
  const sortVal = sortElem ? sortElem.value : 'latest';

  container.innerHTML = '';

  let filtered = articles.filter(a => {
    if (filterCat === 'Saqlanganlar') return bookmarks.includes(a._id);
    const matchCat = (filterCat === 'Barchasi') || a.category === filterCat;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sortVal === 'popular') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else if (sortVal === 'comments') {
    filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
  }

  const heroSec = document.getElementById('hero-section');
  if (filtered.length > 0 && filterCat === 'Barchasi' && searchQuery === '' && heroSec) {
    heroSec.classList.remove('hidden');
    const main = filtered[0];
    if (heroMain) {
      heroMain.onclick = () => openArticle(main._id);
      heroMain.innerHTML = `
        <div>
          <div class="relative h-72 sm:h-96 overflow-hidden">
            <img src="${main.image}" class="article-img w-full h-full object-cover transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <span class="absolute top-4 left-4 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">Bosh Yangilik</span>
            <div class="absolute bottom-4 left-4 right-4 text-white">
              <p class="text-xs text-brand-300 font-medium mb-1"><i class="fa-regular fa-calendar mr-1"></i> ${main.date}</p>
              <h2 class="font-gazette text-2xl sm:text-3xl font-bold leading-tight group-hover:text-brand-400 transition">${main.title}</h2>
            </div>
          </div>
          <div class="p-6">
            <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">${main.content}</p>
          </div>
        </div>
        <div class="px-6 pb-6 flex justify-between items-center text-xs text-slate-400">
          <span><i class="fa-regular fa-user mr-1"></i> ${main.author}</span>
          <span class="text-brand-600 dark:text-brand-400 font-bold">Batafsil <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      `;
    }

    if (heroSide) {
      heroSide.innerHTML = '';
      filtered.slice(1, 3).forEach(item => {
        heroSide.innerHTML += `
          <div onclick="openArticle('${item._id}')" class="article-card bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex gap-4 items-center group cursor-pointer">
            <div class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img src="${item.image}" class="article-img w-full h-full object-cover transition">
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-brand-600 uppercase">${item.category}</span>
              <h3 class="font-bold text-sm line-clamp-2 group-hover:text-brand-500 transition mt-1">${item.title}</h3>
              <span class="text-[11px] text-slate-400 mt-1 block">${item.date}</span>
            </div>
          </div>
        `;
      });
    }
  } else if (heroSec) {
    heroSec.classList.add('hidden');
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center py-12 text-slate-400 text-sm">Maqolalar topilmadi</div>`;
    return;
  }

  filtered.forEach(art => {
    const isBookmarked = bookmarks.includes(art._id);
    container.innerHTML += `
      <div class="article-card bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition flex flex-col justify-between group cursor-pointer relative">
        <div onclick="openArticle('${art._id}')">
          <div class="h-48 overflow-hidden relative">
            <img src="${art.image}" class="article-img w-full h-full object-cover transition">
            <span class="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm uppercase">${art.category}</span>
          </div>
          <div class="p-5">
            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-2">
              <span><i class="fa-regular fa-clock mr-1"></i> ${calculateReadTime(art.content)}</span>
              <span><i class="fa-solid fa-heart text-red-500 mr-1"></i> ${art.likes || 0}</span>
            </div>
            <h4 class="font-bold text-base group-hover:text-brand-500 transition line-clamp-2 mb-2">${art.title}</h4>
            <p class="text-slate-500 dark:text-slate-400 text-xs line-clamp-2">${art.content}</p>
          </div>
        </div>
        <div class="px-5 pb-4 pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
          <span><i class="fa-regular fa-user mr-1"></i> ${art.author}</span>
          <button onclick="toggleBookmark('${art._id}', event)" class="p-1 hover:text-amber-500 transition">
            <i class="${isBookmarked ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;
  });

  renderAdminTable();
  updateStats();
}

function openArticle(id) {
  currentArticleId = id;
  const article = articles.find(a => a._id === id);
  if (!article) return;

  document.getElementById('article-view-title').textContent = article.title;
  document.getElementById('article-view-category').textContent = article.category;
  document.getElementById('article-view-author').textContent = article.author;
  document.getElementById('article-view-date').textContent = article.date;
  document.getElementById('article-view-readtime').innerHTML = `<i class="fa-regular fa-clock mr-1"></i> ${calculateReadTime(article.content)}`;
  document.getElementById('article-view-image').src = article.image;
  document.getElementById('article-view-content').innerHTML = `<p>${article.content}</p>`;
  document.getElementById('like-count').textContent = article.likes || 0;

  const commentsContainer = document.getElementById('comments-list');
  commentsContainer.innerHTML = '';
  document.getElementById('comments-count').textContent = article.comments ? article.comments.length : 0;

  if (article.comments) {
    article.comments.forEach(c => {
      commentsContainer.innerHTML += `
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-xs text-slate-900 dark:text-white">${c.name}</span>
            <span class="text-[10px] text-slate-400">${c.date}</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300">${c.text}</p>
        </div>
      `;
    });
  }

  showPage('article-view');
}

function toggleBookmark(id, event) {
  if (event) event.stopPropagation();
  const idx = bookmarks.indexOf(id);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
    showToast("Xatcho'plardan olib tashlandi");
  } else {
    bookmarks.push(id);
    showToast("Saqlanganlarga qo'shildi");
  }
  localStorage.setItem('sg_bookmarks', JSON.stringify(bookmarks));
  renderArticles();
}

async function deleteArticle(id) {
  if (confirm("Ushbu maqolani o'chirmoqchimisiz?")) {
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      fetchArticles();
      showToast("Maqola o'chirildi", "error");
    } catch (err) {
      showToast("O'chirishda xatolik", "error");
    }
  }
}

function renderAdminTable() {
  const tbody = document.getElementById('articles-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  articles.forEach(art => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
        <td class="p-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">${art.title}</td>
        <td class="p-4"><span class="bg-brand-500/10 text-brand-500 font-bold px-2.5 py-1 rounded-md">${art.category}</span></td>
        <td class="p-4 text-slate-500 dark:text-slate-400">${art.author}</td>
        <td class="p-4 text-slate-400">${art.date}</td>
        <td class="p-4 text-right space-x-2">
          <button onclick="openArticle('${art._id}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i class="fa-solid fa-eye"></i></button>
          <button onclick="deleteArticle('${art._id}')" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

function updateStats() {
  const total = document.getElementById('stat-total-articles');
  const comments = document.getElementById('stat-total-comments');
  if (total) total.textContent = articles.length;
  if (comments) {
    const totalComments = articles.reduce((acc, curr) => acc + (curr.comments ? curr.comments.length : 0), 0);
    comments.textContent = totalComments;
  }
}

// YASHIRIN ADMIN PANELGA KIRISH VA KATEGORIYA EVENTLARI
function initCategoryButtons() {
  const navContainer = document.getElementById('main-nav');
  if (navContainer) {
    const buttons = navContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const catName = btn.textContent.trim();
        renderArticles(catName);
      });
    });
  }
}

function initSecretAdminAccess() {
  // 1-usul: Logotipni 3 marta tez bosish
  const logoHeader = document.querySelector('header h1');
  let clickCount = 0;
  let clickTimer = null;

  if (logoHeader) {
    logoHeader.style.cursor = 'pointer';
    logoHeader.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount === 3) {
        showPage('admin-view');
        showToast("Secret Panel: Admin rejimiga o'tildi!");
        clickCount = 0;
      } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
      }
    });
  }

  // 2-usul: Ctrl + Shift + A birgalikda bosish
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      showPage('admin-view');
      showToast("Secret Combo: Admin rejimiga o'tildi!");
    }
  });
}

// INIZIALIZATSIYA
document.addEventListener('DOMContentLoaded', () => {
  fetchArticles();
  initCategoryButtons();
  initSecretAdminAccess();

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  }

  const likeBtn = document.getElementById('like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!currentArticleId) return;
      try {
        const res = await fetch(`/api/articles/${currentArticleId}/like`, { method: 'POST' });
        const updated = await res.json();
        document.getElementById('like-count').textContent = updated.likes;
        fetchArticles();
        showToast("Menga yoqdi!");
      } catch (err) {
        showToast("Xatolik yuz berdi", "error");
      }
    });
  }

  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('comment-name').value;
      const text = document.getElementById('comment-text').value;

      try {
        await fetch(`/api/articles/${currentArticleId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, text })
        });
        commentForm.reset();
        await fetchArticles();
        openArticle(currentArticleId);
        showToast("Izohingiz saqlandi!");
      } catch (err) {
        showToast("Izoh yuborishda xatolik", "error");
      }
    });
  }

  const addArticleForm = document.getElementById('add-article-form');
  if (addArticleForm) {
    addArticleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newArt = {
        title: document.getElementById('article-title').value,
        category: document.getElementById('article-category').value,
        author: document.getElementById('article-author').value,
        image: document.getElementById('article-image').value,
        content: document.getElementById('article-content').value,
      };

      try {
        await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArt)
        });
        addArticleForm.reset();
        fetchArticles();
        showToast("Yangi maqola saqlandi!");
      } catch (err) {
        showToast("Maqola qo'shishda xatolik", "error");
      }
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderArticles(currentFilter, e.target.value);
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderArticles();
    });
  }
});