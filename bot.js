const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(__dirname, 'articles.json');

let bot = null;

function initBot() {
    const token = process.env.BOT_TOKEN;

    if (!token) {
        console.warn("⚠️ BOT_TOKEN topilmadi. Telegram bot ishga tushirilmadi.");
        return null;
    }

    bot = new TelegramBot(token, { polling: true });

    // /start buyrug'i
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(
            chatId,
            `Xush kelibsiz, ${msg.from.first_name}!\n\n` +
            `📰 *School Gazette* maktab gazetasi botiga xush kelibsiz.\n\n` +
            `Buyruqlar:\n` +
            ` /latest - Eng so'nggi maqolani o'qish\n` +
            ` /help - Yordam`,
            { parse_mode: 'Markdown' }
        );
    });

    // /latest buyrug'i
    bot.onText(/\/latest/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            const articles = JSON.parse(data);

            if (!articles || articles.length === 0) {
                return bot.sendMessage(chatId, "Hozircha hech qanday maqola chop etilmagan.");
            }

            const latest = articles[0];
            const caption = `📌 *${latest.title}*\n\n` +
                            `✍️ Muallif: ${latest.author}\n` +
                            `📂 Kategoriya: ${latest.category}\n\n` +
                            `${latest.content.substring(0, 300)}...`;

            if (latest.image) {
                await bot.sendPhoto(chatId, latest.image, { caption, parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
            }
        } catch (err) {
            bot.sendMessage(chatId, "Maqolani yuklashda xatolik yuz berdi.");
        }
    });

    console.log("🤖 Telegram Bot muvaffaqiyatli ishga tushdi.");
    return bot;
}

// Telegram kanaliga yangi maqola post qilish funksiyasi
async function notifyNewArticle(channelId, article) {
    if (!bot) return;

    const message = `📣 *Yangi Maqola!*\n\n` +
                    `📰 *${article.title}*\n` +
                    `✍️ Muallif: ${article.author}\n\n` +
                    `${article.content.substring(0, 200)}...`;

    try {
        if (article.image) {
            await bot.sendPhoto(channelId, article.image, { caption: message, parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error("Telegram kanalga yuborishda xatolik:", err.message);
    }
}

module.exports = { initBot, notifyNewArticle };