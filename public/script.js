let allArticles = [];
let adminToken = localStorage.getItem('admin_token') || null;

document.addEventListener('DOMContentLoaded', () => {
    const homeView = document.getElementById('home-view');
    const adminView = document.getElementById('admin-view');
    const searchFilterBar = document.getElementById('search-filter-bar');
    const goHomeBtn = document.getElementById('go-home-btn');
    const logoBtn = document.getElementById('logo-btn');

    const articlesContainer = document.getElementById('articles-container');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');

    const adminSecretBtn = document.getElementById('admin-secret-btn');
    const loginModal = document.getElementById('login-modal');
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const loginForm = document.getElementById('login-form');
    const adminPassInput = document.getElementById('admin-pass-input');
    const addArticleForm = document.getElementById('add-article-form');
    const adminArticlesList = document.getElementById('admin-articles-list');
    const logoutBtn = document.getElementById('logout-btn');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const articleModal = document.getElementById('article-modal');
    const closeArticleModalBtn = document.getElementById('close-article-modal');
    const pollForm = document.getElementById('poll-form');

    // MAVZU HOLATI
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // SAHIFA NAVIGATSIYASI
    function showHomeView() {
        homeView.classList.remove('hidden');
        adminView.classList.add('hidden');
        searchFilterBar.classList.remove('hidden');
        goHomeBtn.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showAdminView() {
        homeView.classList.add('hidden');
        adminView.classList.remove('hidden');
        searchFilterBar.classList.add('hidden');
        goHomeBtn.classList.remove('hidden');
        renderAdminArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (logoBtn) logoBtn.addEventListener('click', showHomeView);
    if (goHomeBtn) goHomeBtn.addEventListener('click', showHomeView);

    // SKELETON LOADERS
    function renderSkeletonLoaders() {
        if (!articlesContainer) return;
        articlesContainer.innerHTML = Array(4).fill(0).map(() => `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
                <div class="h-48 bg-slate-200 dark:bg-slate-800"></div>
                <div class="p-5 space-y-3">
                    <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                    <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                </div>
            </div>
        `).join('');
    }

    async function fetchArticles() {
        renderSkeletonLoaders();
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('Yuklashda xatolik');
            
            allArticles = await response.json();
            filterArticles();
            if (adminToken) renderAdminArticles();
        } catch (error) {
            console.error('Xatolik:', error);
            if (articlesContainer) {
                articlesContainer.innerHTML = `
                    <div class="col-span-full py-12 text-center">
                        <p class="text-rose-500 font-medium mb-2">Ma'lumotlarni yuklab bo'lmadi.</p>
                        <button onclick="window.location.reload()" class="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 px-3 py-1.5 rounded-lg">Qayta urinish</button>
                    </div>
                `;
            }
        }
    }

    // MAQOLALARNI CHIZISH
    function renderArticles(articles) {
        if (!articlesContainer) return;

        if (articles.length === 0) {
            articlesContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-16 h-16 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center text-2xl mb-3">
                        <i class="fa-regular fa-newspaper"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-700 dark:text-slate-200">Maqolalar topilmadi</h3>
                    <p class="text-xs text-slate-400 mt-1">Qidiruv parametrlarini o'zgartirib ko'ring yoki keyinroq tashrif buyuring.</p>
                </div>
            `;
            return;
        }

        const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');

        articlesContainer.innerHTML = articles.map(article => {
            const isLiked = likedArticles.includes(article.id);
            return `
            <article class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between group">
                <div>
                    <div class="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer" onclick="openArticleModal(${article.id})">
                        <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'">
                        <span class="absolute top-3 left-3 bg-brand-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                            ${escapeHtml(article.category)}
                        </span>
                    </div>
                    <div class="p-5">
                        <div class="flex justify-between items-center text-xs text-slate-400 mb-2">
                            <span>✍️ ${escapeHtml(article.author)}</span>
                            <span>📅 ${formatDate(article.created_at)}</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-snug cursor-pointer hover:text-brand-600 transition" onclick="openArticleModal(${article.id})">
                            ${escapeHtml(article.title)}
                        </h3>
                        <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4">
                            ${escapeHtml(article.content)}
                        </p>
                    </div>
                </div>

                <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button id="like-btn-${article.id}" onclick="handleLike(${article.id})" class="flex items-center gap-1.5 ${isLiked ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-400'} hover:text-rose-500 transition">
                        <span>❤️</span>
                        <span id="like-count-${article.id}" class="font-bold">${article.likes || 0}</span>
                    </button>
                    <button onclick="openArticleModal(${article.id})" class="text-brand-600 dark:text-brand-500 font-semibold hover:underline flex items-center gap-1">
                        Batafsil va Izohlar (${article.comments ? article.comments.length : 0}) <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                </div>
            </article>
        `;
        }).join('');
    }

    // ADMIN MAQOLALAR RO'YXATI
    function renderAdminArticles() {
        if (!adminArticlesList) return;

        if (allArticles.length === 0) {
            adminArticlesList.innerHTML = `<p class="text-slate-500 text-center py-4 text-xs">O'chirish uchun maqolalar mavjud emas.</p>`;
            return;
        }

        adminArticlesList.innerHTML = allArticles.map(article => `
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl gap-4">
                <div class="flex items-center gap-4 overflow-hidden">
                    <img src="${escapeHtml(article.image)}" alt="" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'">
                    <div class="truncate">
                        <h4 class="font-bold text-sm text-slate-800 dark:text-white truncate">${escapeHtml(article.title)}</h4>
                        <p class="text-xs text-slate-400">${escapeHtml(article.category)} • ${escapeHtml(article.author)}</p>
                    </div>
                </div>
                <button onclick="deleteArticle(${article.id})" class="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 flex-shrink-0">
                    <i class="fa-solid fa-trash"></i> O'chirish
                </button>
            </div>
        `).join('');
    }

    // FILTR VA QIDIRUV
    function filterArticles() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';

        const filtered = allArticles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchTerm) || 
                                  article.content.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        renderArticles(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterArticles);
    if (categoryFilter) categoryFilter.addEventListener('change', filterArticles);

    // ADMIN AUTHENTIFIKATSIYA
    if (adminSecretBtn) {
        adminSecretBtn.addEventListener('click', () => {
            if (adminToken) {
                showAdminView();
            } else {
                loginModal.classList.remove('hidden');
                adminPassInput.focus();
            }
        });
    }

    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', () => {
            loginModal.classList.add('hidden');
            adminPassInput.value = '';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = adminPassInput.value;

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const data = await res.json();
                if (res.ok && data.token) {
                    adminToken = data.token;
                    localStorage.setItem('admin_token', adminToken);
                    loginModal.classList.add('hidden');
                    adminPassInput.value = '';
                    showAdminView();
                } else {
                    alert(data.error || 'Parol noto\'g\'ri!');
                    adminPassInput.value = '';
                }
            } catch (err) {
                alert('Tizimga kirishda xatolik yuz berdi!');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminToken = null;
            localStorage.removeItem('admin_token');
            showHomeView();
        });
    }

    if (closeArticleModalBtn) {
        closeArticleModalBtn.addEventListener('click', () => {
            articleModal.classList.add('hidden');
        });
    }

    // MODALNI ESCAPE TUGMASI ORQALI YOPISH
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (articleModal && !articleModal.classList.contains('hidden')) {
                articleModal.classList.add('hidden');
            }
            if (loginModal && !loginModal.classList.contains('hidden')) {
                loginModal.classList.add('hidden');
            }
        }
    });

    // MAQOLA QO'SHISH
    if (addArticleForm) {
        addArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!adminToken) {
                alert("Sessiya muddati tugagan. Qaytadan admin sifatida kiring.");
                return;
            }

            const newArticle = {
                title: document.getElementById('title').value,
                category: document.getElementById('category').value,
                author: document.getElementById('author').value,
                image: document.getElementById('image').value,
                content: document.getElementById('content').value
            };

            try {
                const response = await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(newArticle)
                });

                if (response.ok) {
                    addArticleForm.reset();
                    alert('Maqola muvaffaqiyatli chop etildi!');
                    await fetchArticles();
                    showHomeView();
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Maqolani qo\'shishda xatolik yuz berdi!');
                }
            } catch (error) {
                console.error('Xatolik:', error);
            }
        });
    }

    // POLL / SO'ROVNOMA
    async function fetchPoll() {
        try {
            const res = await fetch('/api/poll');
            const pollData = await res.json();
            renderPoll(pollData);
        } catch (err) {
            console.error("So'rovnomani yuklashda xatolik:", err);
        }
    }

    function renderPoll(poll) {
        const pollOptionsElem = document.getElementById('poll-options');
        const pollSubmitBtn = document.getElementById('poll-submit-btn');
        if (!pollOptionsElem) return;

        const hasVoted = localStorage.getItem('poll_voted') === 'true';
        const totalVotes = poll.options ? poll.options.reduce((acc, opt) => acc + opt.votes, 0) : 0;

        pollOptionsElem.innerHTML = poll.options.map(opt => {
            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            if (hasVoted) {
                return `
                    <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div class="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <span>${escapeHtml(opt.text)}</span>
                            <span class="font-bold">${percent}%</span>
                        </div>
                        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div class="bg-brand-500 h-2 rounded-full" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                        <input type="radio" name="poll" value="${opt.id}" class="accent-brand-500" required>
                        <span class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(opt.text)}</span>
                    </label>
                `;
            }
        }).join('');

        if (hasVoted && pollSubmitBtn) {
            pollSubmitBtn.classList.add('hidden');
        }
    }

    if (pollForm) {
        pollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedOption = document.querySelector('input[name="poll"]:checked');
            if (!selectedOption) return;

            try {
                const res = await fetch('/api/poll/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ optionId: parseInt(selectedOption.value) })
                });

                if (res.ok) {
                    const updatedPoll = await res.json();
                    localStorage.setItem('poll_voted', 'true');
                    renderPoll(updatedPoll);
                    alert("Ovozingiz qabul qilindi. Rahmat!");
                }
            } catch (err) {
                console.error("Ovoz berishda xatolik:", err);
            }
        });
    }

    fetchArticles();
    fetchPoll();
});

// GLOBAL FUNKSIYALAR
function openArticleModal(id) {
    const article = allArticles.find(a => a.id === id);
    if (!article) return;

    const modalContent = document.getElementById('modal-article-content');
    const articleModal = document.getElementById('article-modal');

    modalContent.innerHTML = `
        <div class="relative h-64 sm:h-80 w-full bg-slate-200 dark:bg-slate-800">
            <img src="${escapeHtml(article.image)}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'">
            <span class="absolute bottom-4 left-4 bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                ${escapeHtml(article.category)}
            </span>
        </div>
        <div class="p-6 sm:p-8 space-y-6">
            <div>
                <div class="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span>✍️ ${escapeHtml(article.author)}</span>
                    <span>📅 ${formatDate(article.created_at)}</span>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    ${escapeHtml(article.title)}
                </h2>
            </div>

            <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                ${escapeHtml(article.content)}
            </p>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 class="font-bold text-slate-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                    <i class="fa-regular fa-comments text-brand-500"></i> Izohlar (${article.comments ? article.comments.length : 0})
                </h3>

                <div class="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                    ${(article.comments && article.comments.length > 0) 
                        ? article.comments.map(c => `
                            <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                                <span class="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">${escapeHtml(c.name)}</span>
                                <span class="text-slate-600 dark:text-slate-300">${escapeHtml(c.text)}</span>
                            </div>
                        `).join('') 
                        : '<p class="text-slate-400 italic text-xs text-center py-2">Hali izohlar yo\'q. Birinchi bo\'lib izoh qoldiring!</p>'
                    }
                </div>

                <form onsubmit="handleComment(event, ${article.id})" class="space-y-2">
                    <input type="text" id="modal-comment-name-${article.id}" placeholder="Ismingiz" required class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                    <div class="flex gap-2">
                        <input type="text" id="modal-comment-text-${article.id}" placeholder="Izohingizni yozing..." required class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                        <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0">
                            Yuborish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    articleModal.classList.remove('hidden');
}

async function handleLike(id) {
    let likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');

    if (likedArticles.includes(id)) {
        alert("Siz ushbu maqolaga allaqachon layk bosgansiz!");
        return;
    }

    try {
        const response = await fetch(`/api/articles/${id}/like`, { method: 'POST' });
        if (response.ok) {
            const updatedArticle = await response.json();
            
            const likeCountElem = document.getElementById(`like-count-${id}`);
            if (likeCountElem) {
                likeCountElem.textContent = updatedArticle.likes;
            }

            const articleIndex = allArticles.findIndex(a => a.id === id);
            if (articleIndex !== -1) {
                allArticles[articleIndex].likes = updatedArticle.likes;
            }

            likedArticles.push(id);
            localStorage.setItem('liked_articles', JSON.stringify(likedArticles));

            const likeBtn = document.getElementById(`like-btn-${id}`);
            if (likeBtn) {
                likeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
                likeBtn.classList.add('text-rose-500', 'font-bold');
            }
        }
    } catch (error) {
        console.error('Layk bosishda xatolik:', error);
    }
}

async function handleComment(event, id) {
    event.preventDefault();
    const nameInput = document.getElementById(`modal-comment-name-${id}`);
    const textInput = document.getElementById(`modal-comment-text-${id}`);

    if (!nameInput || !textInput) return;

    const commentData = { name: nameInput.value, text: textInput.value };

    try {
        const response = await fetch(`/api/articles/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData)
        });

        if (response.ok) {
            const updatedArticle = await response.json();
            const articleIndex = allArticles.findIndex(a => a.id === id);
            if (articleIndex !== -1) {
                allArticles[articleIndex] = updatedArticle;
            }
            openArticleModal(id);
        }
    } catch (error) {
        console.error('Izoh yuborishda xatolik:', error);
    }
}

async function deleteArticle(id) {
    if (!adminToken) {
        alert("Ruxsat yo'q. Avval admin sifatida kiring.");
        return;
    }

    if (!confirm("Haqiqatdan ham ushbu maqolani o'chirmoqchimisiz?")) return;

    try {
        const response = await fetch(`/api/articles/${id}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            allArticles = allArticles.filter(a => a.id !== id);
            const articlesContainer = document.getElementById('articles-container');
            const adminArticlesList = document.getElementById('admin-articles-list');
            
            if (articlesContainer) {
                const articleElem = articlesContainer.querySelector(`[onclick*="${id}"]`)?.closest('article');
                if (articleElem) articleElem.remove();
            }
            if (adminArticlesList) {
                const adminElem = adminArticlesList.querySelector(`[onclick="deleteArticle(${id})"]`)?.closest('div');
                if (adminElem) adminElem.remove();
            }
        } else {
            alert("O'chirishda xatolik yuz berdi!");
        }
    } catch (error) {
        console.error("O'chirishda xatolik:", error);
    }
}

function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

function startCountdown() {
    let targetDate = localStorage.getItem('countdown_target');
    if (!targetDate) {
        targetDate = new Date().getTime() + (5 * 24 * 60 * 60 * 1000);
        localStorage.setItem('countdown_target', targetDate);
    } else {
        targetDate = parseInt(targetDate);
    }

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        const dElem = document.getElementById('timer-days');
        const hElem = document.getElementById('timer-hours');
        const mElem = document.getElementById('timer-mins');

        if (distance < 0) {
            clearInterval(timerInterval);
            if (dElem) dElem.textContent = '00';
            if (hElem) hElem.textContent = '00';
            if (mElem) mElem.textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (dElem) dElem.textContent = String(days).padStart(2, '0');
        if (hElem) hElem.textContent = String(hours).padStart(2, '0');
        if (mElem) mElem.textContent = String(minutes).padStart(2, '0');
    }, 1000);
}

startCountdown();