require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
const Article = require('./models/Article');

// Node.js ichki DNS so'rovlarini majburiy Google DNS (8.8.8.8) orqali yuborish (EREFUSED xatosini bartaraf etish uchun)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Baza bo'sh bo'lganda avtomatik sample ma'lumotlar joylash funksiyasi
const seedSampleArticles = async () => {
  try {
    const count = await Article.countDocuments();
    if (count === 0) {
      await Article.insertMany([
        {
          title: "Maktabimiz o'quvchilari respublika fan olimpiadasida 1-o'rinni egalladi!",
          category: "Maktab Hayoti",
          author: "Jasur Rahimov",
          image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
          content: "O'quvchilarimiz viloyat va respublika bosqichlarida yuqori natijalarni ko'rsatib, maktabimiz sharafini munosib himoya qilishdi. G'oliblarga maxsus stipendiyalar va diplomlar topshirildi.",
          likes: 15,
          comments: [
            { name: "Sardor", text: "Tabriklayman, barakalla!", date: "2026-09-08" }
          ]
        },
        {
          title: "Kiber-sport va AI bo'yicha maktab ichki turniri o'tkaziladi",
          category: "Fan va Texnologiya",
          author: "Sardor Aliyev",
          image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
          content: "Kelasi hafta maktabimizning Axborot Texnologiyalari markazida o'quvchilar o'rtasida sun'iy intellekt va dasturlash bo'yicha musobaqa bo'lib o'tadi.",
          likes: 9,
          comments: []
        }
      ]);
      console.log("Sample ma'lumotlar MongoDB bazasiga muvaffaqiyatli yuklandi.");
    }
  } catch (err) {
    console.error("Seed qilishda xatolik:", err);
  }
};

// MongoDB Atlas ulanishi
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('MongoDB: School Gazette bazasiga ulandi!');
    seedSampleArticles();
  })
  .catch((err) => console.error('MongoDB ulanish xatosi:', err));

// REST API ENDPOINTS

// 1. Barcha maqolalarni olish
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Yangi maqola yaratish (Admin)
app.post('/api/articles', async (req, res) => {
  const { title, category, author, image, content } = req.body;
  try {
    const newArticle = new Article({ title, category, author, image, content });
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Maqolani o'chirish (Admin)
app.delete('/api/articles/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: "Maqola muvaffaqiyatli o'chirildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Layk bosish
app.post('/api/articles/:id/like', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Maqola topilmadi" });
    article.likes += 1;
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Izoh qoldirish
app.post('/api/articles/:id/comments', async (req, res) => {
  const { name, text } = req.body;
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Maqola topilmadi" });
    article.comments.unshift({ name, text });
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Frontend SPA routing (Barcha noma'lum so'rovlarni index.html ga yo'naltirish)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ishlamoqda: http://localhost:${PORT}`);
});