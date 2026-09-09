require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const existsSync = require('fs').existsSync;

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'articles.json');
const POLL_FILE = path.join(__dirname, 'poll.json');

// Parol va tokenlar endi to'g'ridan-to'g'ri .env faylidan olinadi
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Boshlang'ich JSON fayllarni asinxron yaratish
async function initDB() {
    try {
        if (!existsSync(DATA_FILE)) {
            await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
        }
        if (!existsSync(POLL_FILE)) {
            const defaultPoll = {
                question: "Maktabimizda qaysi yangi to'garak ochilishini xohlaysiz?",
                options: [
                    { id: 1, text: "Robotics & AI", votes: 0 },
                    { id: 2, text: "Shaxmat va Mantiq", votes: 0 },
                    { id: 3, text: "Debat va Jurnalistika", votes: 0 }
                ]
            };
            await fs.writeFile(POLL_FILE, JSON.stringify(defaultPoll, null, 2));
        }
    } catch (err) {
        console.error("Baza fayllarini yaratishda xatolik:", err);
    }
}

async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return filePath.endsWith('articles.json') ? [] : {};
    }
}

async function writeJSON(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Admin Authentifikatsiya Middleware
function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === ADMIN_TOKEN) {
            return next();
        }
    }
    return res.status(401).json({ error: "Ruxsat etilmagan! Admin sifatida kiring." });
}

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password && password === ADMIN_SECRET) {
        return res.json({ token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: "Noto'g'ri parol!" });
});

// Barcha maqolalarni olish
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await readJSON(DATA_FILE);
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: "Maqolalarni o'qishda xatolik." });
    }
});

// Yangi maqola chop etish (Faqat Admin)
app.post('/api/articles', requireAdmin, async (req, res) => {
    try {
        const { title, category, author, image, content } = req.body;

        if (!title || !category || !author || !image || !content) {
            return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
        }

        const articles = await readJSON(DATA_FILE);
        const newArticle = {
            id: Date.now(),
            title: title.trim(),
            category: category.trim(),
            author: author.trim(),
            image: image.trim(),
            content: content.trim(),
            created_at: new Date().toISOString(),
            likes: 0,
            comments: []
        };

        articles.unshift(newArticle);
        await writeJSON(DATA_FILE, articles);
        res.status(201).json(newArticle);
    } catch (err) {
        res.status(500).json({ error: "Maqola saqlashda xatolik." });
    }
});

// Maqolaga layk bosish
app.post('/api/articles/:id/like', async (req, res) => {
    try {
        const articleId = parseInt(req.params.id);
        const articles = await readJSON(DATA_FILE);
        const article = articles.find(a => a.id === articleId);

        if (!article) {
            return res.status(404).json({ error: "Maqola topilmadi" });
        }

        article.likes = (article.likes || 0) + 1;
        await writeJSON(DATA_FILE, articles);
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: "Layk saqlashda xatolik." });
    }
});

// Maqolaga izoh qoldirish
app.post('/api/articles/:id/comments', async (req, res) => {
    try {
        const articleId = parseInt(req.params.id);
        const { name, text } = req.body;

        if (!name || !text || !name.trim() || !text.trim()) {
            return res.status(400).json({ error: "Ism va izoh matni kiritilishi shart!" });
        }

        const articles = await readJSON(DATA_FILE);
        const article = articles.find(a => a.id === articleId);

        if (!article) {
            return res.status(404).json({ error: "Maqola topilmadi" });
        }

        if (!article.comments) article.comments = [];

        const newComment = {
            id: Date.now(),
            name: name.trim(),
            text: text.trim(),
            created_at: new Date().toISOString()
        };

        article.comments.push(newComment);
        await writeJSON(DATA_FILE, articles);
        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ error: "Izoh qo'shishda xatolik." });
    }
});

// Maqolani o'chirish (Faqat Admin)
app.delete('/api/articles/:id', requireAdmin, async (req, res) => {
    try {
        const articleId = parseInt(req.params.id);
        let articles = await readJSON(DATA_FILE);
        
        const initialLength = articles.length;
        articles = articles.filter(a => a.id !== articleId);

        if (articles.length === initialLength) {
            return res.status(404).json({ error: "Maqola topilmadi" });
        }

        await writeJSON(DATA_FILE, articles);
        res.json({ message: "Maqola o'chirildi" });
    } catch (err) {
        res.status(500).json({ error: "Maqolani o'chirishda xatolik." });
    }
});

// Poll: Ma'lumotlarni olish
app.get('/api/poll', async (req, res) => {
    try {
        const poll = await readJSON(POLL_FILE);
        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: "So'rovnomani o'qishda xatolik." });
    }
});

// Poll: Ovoz berish
app.post('/api/poll/vote', async (req, res) => {
    try {
        const { optionId } = req.body;
        const poll = await readJSON(POLL_FILE);

        const option = poll.options.find(o => o.id === parseInt(optionId));
        if (!option) {
            return res.status(400).json({ error: "Noto'g'ri variant tanlandi" });
        }

        option.votes += 1;
        await writeJSON(POLL_FILE, poll);
        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: "Ovoz berishda xatolik." });
    }
});

// SPA qo'llab-quvvatlash
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serverni ishga tushirish
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server faol: http://localhost:${PORT}`);
    });
});