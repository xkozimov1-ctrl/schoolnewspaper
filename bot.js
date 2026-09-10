const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(__dirname, 'articles.json');

let bot = null;

function initBot() {
    const token = process.env.BOT_TOKEN;

    if (!token || token.trim() === '' || token.includes('BotFather')) {
        console.warn("⚠️ BOT_TOKEN topilmadi yoki xato kiritilgan. Telegram bot faollashtirilmadi.");
        return null;
    }

    try {
        // Bot obyektini yaratish
        bot = new TelegramBot(token, { polling: true });

        // /start buyrug'i
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const firstName = msg.from?.first_name || 'Foydalanuvchi';
            
            bot.sendMessage(
                chatId,
                `Xush kelibsiz, *${escapeMarkdown(firstName)}*!\n\n` +
                `📰 *School Gazette* maktab gazetasi botiga xush kelibsiz.\n\n` +
                `📌 *Mavjud buyruqlar:*\n` +
                `• /latest - Eng so'nggi maqolani o'qish\n` +
                `• /help - Yordam va ma'lumot`,
                { parse_mode: 'Markdown' }
            );
        });

        // /help buyrug'i
        bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(
                chatId,
                `ℹ️ *School Gazette Bot Yordam*\n\n` +
                `Ushbu bot orqali maktabimizdagi eng so'nggi yangilik va maqolalardan xabardor bo'lishingiz mumkin.`,
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
                    return bot.sendMessage(chatId, "📭 Hozircha hech qanday maqola chop etilmagan.");
                }

                const latest = articles[0];
                const caption = `📌 *${escapeMarkdown(latest.title)}*\n\n` +
                                `✍️ *Muallif:* ${escapeMarkdown(latest.author)}\n` +
                                `📂 *Kategoriya:* ${escapeMarkdown(latest.category)}\n\n` +
                                `${escapeMarkdown(latest.content.substring(0, 300))}...`;

                if (latest.image) {
                    await bot.sendPhoto(chatId, latest.image, { caption, parse_mode: 'Markdown' });
                } else {
                    await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
                }
            } catch (err) {
                console.error("Bot /latest xatolik:", err);
                bot.sendMessage(chatId, "⚠️ Maqolani yuklashda xatolik yuz berdi.");
            }
        });

        // Polling xatolarini ushlash
        bot.on('polling_error', (error) => {
            console.error(`[Telegram Bot Polling Error]: ${error.code} - ${error.message}`);
        });

        console.log("🤖 Telegram Bot muvaffaqiyatli ishga tushdi!");
        return bot;

    } catch (error) {
        console.error("Telegram botni initsializatsiya qilishda xatolik:", error.message);
        return null;
    }
}

// Telegram kanaliga yoki guruhga yangi maqola post qilish funksiyasi
async function notifyNewArticle(channelId, article) {
    if (!bot) {
        console.warn("⚠️ Bot faol emas, xabar yuborilmadi.");
        return;
    }

    if (!channelId) return;

    const message = `📣 *YANGI MAQOLA CHOP ETILDI!*\n\n` +
                    `📰 *${escapeMarkdown(article.title)}*\n\n` +
                    `✍️ *Muallif:* ${escapeMarkdown(article.author)}\n` +
                    `📂 *Kategoriya:* ${escapeMarkdown(article.category)}\n\n` +
                    `${escapeMarkdown(article.content.substring(0, 250))}...`;

    try {
        if (article.image) {
            await bot.sendPhoto(channelId, article.image, { caption: message, parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
        }
        console.log(`✅ Telegram kanalga (${channelId}) xabar muvaffaqiyatli yuborildi.`);
    } catch (err) {
        console.error("Telegram kanalga xabar yuborishda xatolik:", err.message);
    }
}

// Markdown belgilarni xavfsiz qilish uchun yordamchi funksiya
function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*`\[\]]/g, '\\$&');
}

module.exports = { initBot, notifyNewArticle };