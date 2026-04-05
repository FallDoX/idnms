import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { parseTripData, calculateSummary, filterData, getAccelerationForThresholds } from '../src/utils/parser.js';
import { generateChartBuffer } from './chart-generator.js';
const BOT_TOKEN = process.env.BOT_TOKEN || '7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg';
if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not set!');
    process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);
const userSessions = new Map();
bot.command('start', async (ctx) => {
    await ctx.reply('📊 *Trip Log Analyzer Bot*\n\n' +
        'Загрузите CSV файл с логом поездки, и я проанализирую:\n' +
        '• Скорость, мощность, ток\n' +
        '• Ускорение (0-100 км/ч по 10)\n' +
        '• Расход энергии\n' +
        '• GPS трек\n\n' +
        '📤 Отправьте CSV файл или используйте /reanalyze для повторного анализа последнего файла.', { parse_mode: 'Markdown' });
});
bot.command('help', async (ctx) => {
    await ctx.reply('❓ *Как использовать бота:*\n\n' +
        '1. 📤 Отправьте CSV файл с логом поездки\n' +
        '2. ⏳ Дождитесь обработки (обычно 5-10 секунд)\n' +
        '3. 📊 Получите графики и статистику\n\n' +
        '*Команды:*\n' +
        '/start - Начать работу\n' +
        '/help - Помощь\n' +
        '/reanalyze - Повторный анализ последнего файла\n\n' +
        '*Или:* Ответьте "анализ" на сообщение с файлом для повторного анализа.', { parse_mode: 'Markdown' });
});
bot.command('reanalyze', async (ctx) => {
    const session = userSessions.get(ctx.from.id);
    if (!session) {
        await ctx.reply('❌ Нет сохраненного файла. Сначала отправьте CSV файл.');
        return;
    }
    await processAndSendResults(ctx, session.data, session.fileName);
});
async function processAndSendResults(ctx, parsedData, fileName) {
    const processingMsg = await ctx.reply('⏳ Обрабатываю файл...');
    try {
        const { filtered } = filterData(parsedData);
        const summary = calculateSummary(filtered);
        const thresholds = [
            { id: '0to10', label: '0-10 км/ч', value: 10 },
            { id: '0to20', label: '0-20 км/ч', value: 20 },
            { id: '0to30', label: '0-30 км/ч', value: 30 },
            { id: '0to40', label: '0-40 км/ч', value: 40 },
            { id: '0to50', label: '0-50 км/ч', value: 50 },
            { id: '0to60', label: '0-60 км/ч', value: 60 },
            { id: '0to70', label: '0-70 км/ч', value: 70 },
            { id: '0to80', label: '0-80 км/ч', value: 80 },
            { id: '0to90', label: '0-90 км/ч', value: 90 },
            { id: '0to100', label: '0-100 км/ч', value: 100 },
        ];
        summary.accelerationResults = getAccelerationForThresholds(filtered, thresholds);
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        const summaryText = formatSummary(summary, fileName, filtered.length);
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Повторный анализ', 'reanalyze_last')]
        ]);
        await ctx.reply(summaryText, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        const chartBuffer = await generateChartBuffer(filtered, 'main');
        await ctx.replyWithPhoto({ source: chartBuffer }, { caption: '📈 Основные показатели' });
        if (summary.accelerationResults && Object.keys(summary.accelerationResults).length > 0) {
            const accelBuffer = await generateChartBuffer(filtered, 'acceleration');
            await ctx.replyWithPhoto({ source: accelBuffer }, { caption: '🚀 Анализ ускорения' });
            const accelText = formatAccelerationSummary(summary.accelerationResults);
            if (accelText) {
                await ctx.reply(accelText, { parse_mode: 'Markdown' });
            }
        }
        const hasGPS = filtered.some(e => e.Latitude && e.Longitude);
        if (hasGPS) {
            const gpsBuffer = await generateChartBuffer(filtered, 'gps');
            await ctx.replyWithPhoto({ source: gpsBuffer }, { caption: '🗺️ GPS трек' });
        }
    }
    catch (error) {
        console.error('Error processing file:', error);
        await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '❌ Ошибка при обработке файла. Попробуйте другой файл.');
    }
}
bot.action('reanalyze_last', async (ctx) => {
    await ctx.answerCbQuery('🔄 Переанализирую...');
    const session = userSessions.get(ctx.from.id);
    if (!session) {
        await ctx.reply('❌ Нет сохраненного файла. Сначала отправьте CSV файл.');
        return;
    }
    await processAndSendResults(ctx, session.data, session.fileName);
});
bot.on(message('document'), async (ctx) => {
    const doc = ctx.message.document;
    if (!doc.file_name?.toLowerCase().endsWith('.csv')) {
        return;
    }
    const processingMsg = await ctx.reply('⏳ Загружаю файл...');
    try {
        const fileLink = await ctx.telegram.getFileLink(doc.file_id);
        const response = await fetch(fileLink.href);
        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        const csvContent = await response.text();
        const parsedData = parseTripData(csvContent);
        if (parsedData.length === 0) {
            await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '❌ Не удалось распарсить файл. Проверьте формат CSV.');
            return;
        }
        userSessions.set(ctx.from.id, { data: parsedData, fileName: doc.file_name });
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        await processAndSendResults(ctx, parsedData, doc.file_name);
    }
    catch (error) {
        console.error('Error processing file:', error);
        await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, undefined, '❌ Ошибка при загрузке файла. Попробуйте другой файл.');
    }
});
function formatSummary(summary, fileName, dataPoints) {
    const formatTime = (ms) => {
        const seconds = ms / 1000;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0)
            return `${hours}ч ${mins}м ${secs}с`;
        if (mins > 0)
            return `${mins}м ${secs}с`;
        return `${secs}с`;
    };
    let text = `📊 *Сводка: ${fileName}*\n\n`;
    text += `📈 *Основная статистика:*\n`;
    text += `• Точек данных: ${dataPoints.toLocaleString()}\n`;
    text += `• Макс. скорость: ${summary.maxSpeed?.toFixed(1) || 0} км/ч\n`;
    text += `• Средняя скорость: ${summary.avgSpeed?.toFixed(1) || 0} км/ч\n`;
    text += `• Макс. мощность: ${summary.maxPower?.toFixed(0) || 0} Вт\n`;
    text += `• Макс. ток: ${(summary.maxCurrent ?? 0).toFixed(1)} А\n`;
    if (summary.movingDuration) {
        text += `• Время в движении: ${formatTime(summary.movingDuration)}\n`;
    }
    if (summary.totalDistance !== undefined && summary.totalDistance > 0) {
        text += `• Расстояние: ${summary.totalDistance.toFixed(1)} км\n`;
    }
    if (summary.maxBatteryDrop !== undefined && summary.maxBatteryDrop > 0) {
        text += `• Макс. просадка батареи: ${summary.maxBatteryDrop.toFixed(1)}%\n`;
    }
    if (summary.consumptionPerKm !== undefined && summary.consumptionPerKm > 0) {
        text += `• Расход: ${summary.consumptionPerKm.toFixed(1)} Вт⋅ч/км\n`;
    }
    return text;
}
function formatAccelerationSummary(accelResults) {
    if (!accelResults || Object.keys(accelResults).length === 0)
        return '';
    let text = '🚀 *Результаты ускорения:*\n\n';
    const thresholds = [
        { id: '0to10', label: '0-10 км/ч' },
        { id: '0to20', label: '0-20 км/ч' },
        { id: '0to30', label: '0-30 км/ч' },
        { id: '0to40', label: '0-40 км/ч' },
        { id: '0to50', label: '0-50 км/ч' },
        { id: '0to60', label: '0-60 км/ч' },
        { id: '0to70', label: '0-70 км/ч' },
        { id: '0to80', label: '0-80 км/ч' },
        { id: '0to90', label: '0-90 км/ч' },
        { id: '0to100', label: '0-100 км/ч' },
    ];
    let hasAnyResult = false;
    for (const t of thresholds) {
        const result = accelResults[t.id];
        if (result && result.time !== null) {
            hasAnyResult = true;
            const timeStr = result.time < 1
                ? `${(result.time * 1000).toFixed(0)} мс`
                : `${result.time.toFixed(2)} с`;
            text += `• ${t.label}: ${timeStr}`;
            if (result.bestRun?.peakAcceleration) {
                const gForce = result.bestRun.peakAcceleration / 9.8;
                text += ` (пик: ${result.bestRun.peakAcceleration.toFixed(2)} м/с² / ${gForce.toFixed(2)}g)`;
            }
            text += '\n';
        }
    }
    if (!hasAnyResult) {
        return '🚀 *Результаты ускорения:*\n\n⚠️ Нет данных о разгоне с места.\n_Для измерения ускорения нужен лог с началом движения от 0 км/ч._\n';
    }
    return text;
}
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});
bot.telegram.setMyCommands([
    { command: 'start', description: 'Начать работу с ботом' },
    { command: 'help', description: 'Помощь и инструкции' },
    { command: 'reanalyze', description: 'Повторный анализ последнего файла' },
]);
console.log('🤖 Starting Telegram bot...');
bot.launch()
    .then(() => {
    console.log('✅ Bot started successfully!');
    console.log('📝 Bot username: @Ksndr3000_bot');
})
    .catch((err) => {
    console.error('Failed to start bot:', err);
    process.exit(1);
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=bot.js.map