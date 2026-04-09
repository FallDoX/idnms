import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { parseTripData, calculateSummary, filterData, getAccelerationForThresholds } from '../src/utils/parser.js';
import { generateChartBuffer } from './chart-generator.js';
import type { TripEntry, BotTripSummary } from './types.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '7919748217:AAH2nLOPmW7XMzEEgfqyuM_pbFcdN5TRJAg';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN not set!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const userSessions = new Map<number, { data: TripEntry[]; fileName: string }>();

// Start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    '📊 *Trip Log Analyzer Bot*\n\n' +
    'Загрузите CSV файл с логом поездки, и я проанализирую:\n' +
    '• Скорость, мощность, ток\n' +
    '• Ускорение (0-100 км/ч по 10)\n' +
    '• Расход энергии\n' +
    '• GPS трек\n\n' +
    '📤 Отправьте CSV файл или используйте /reanalyze для повторного анализа последнего файла.',
    { parse_mode: 'Markdown' }
  );
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    '❓ *Как использовать бота:*\n\n' +
    '1. 📤 Отправьте CSV файл с логом поездки\n' +
    '2. ⏳ Дождитесь обработки (обычно 5-10 секунд)\n' +
    '3. 📊 Получите графики и статистику\n\n' +
    '*Команды:*\n' +
    '/start - Начать работу\n' +
    '/help - Помощь\n' +
    '/reanalyze - Повторный анализ последнего файла\n\n' +
    '*Или:* Ответьте "анализ" на сообщение с файлом для повторного анализа.',
    { parse_mode: 'Markdown' }
  );
});

// Reanalyze command - reanalyze last uploaded file
bot.command('reanalyze', async (ctx) => {
  const session = userSessions.get(ctx.from.id);
  
  if (!session) {
    await ctx.reply('❌ Нет сохраненного файла. Сначала отправьте CSV файл.');
    return;
  }
  
  await processAndSendResults(ctx, session.data, session.fileName);
});

// Process data and send results (extracted function)
async function processAndSendResults(ctx: any, parsedData: TripEntry[], fileName: string) {
  const processingMsg = await ctx.reply('⏳ Обрабатываю файл...');

  try {
    // Filter data
    const { filtered } = filterData(parsedData);

    // Calculate summary
    const summary = calculateSummary(filtered) as BotTripSummary;

    // Calculate acceleration results - thresholds from 0 to 100 km/h by 10
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

    // Delete processing message
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

    // Send summary text with reanalyze button
    const summaryText = formatSummary(summary, fileName, filtered.length);
    
    // Create inline keyboard with reanalyze button
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Повторный анализ', 'reanalyze_last')]
    ]);
    
    await ctx.reply(summaryText, { 
      parse_mode: 'Markdown',
      ...keyboard
    });

    // Generate and send main chart
    const chartBuffer = await generateChartBuffer(filtered, 'main');
    await ctx.replyWithPhoto({ source: chartBuffer }, { caption: '📈 Основные показатели' });

    // Generate and send acceleration chart if available
    if (summary.accelerationResults && Object.keys(summary.accelerationResults).length > 0) {
      const accelBuffer = await generateChartBuffer(filtered, 'acceleration');
      await ctx.replyWithPhoto({ source: accelBuffer }, { caption: '🚀 Анализ ускорения' });

      // Send acceleration summary
      const accelText = formatAccelerationSummary(summary.accelerationResults);
      if (accelText) {
        await ctx.reply(accelText, { parse_mode: 'Markdown' });
      }
    }

    // Send GPS track if available
    const hasGPS = filtered.some(e => e.Latitude && e.Longitude);
    if (hasGPS) {
      const gpsBuffer = await generateChartBuffer(filtered, 'gps');
      await ctx.replyWithPhoto({ source: gpsBuffer }, { caption: '🗺️ GPS трек' });
    }

  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      undefined,
      '❌ Ошибка при обработке файла. Попробуйте другой файл.'
    );
  }
}

// Handle inline keyboard callback
bot.action('reanalyze_last', async (ctx) => {
  await ctx.answerCbQuery('🔄 Переанализирую...');
  
  const session = userSessions.get(ctx.from.id);
  
  if (!session) {
    await ctx.reply('❌ Нет сохраненного файла. Сначала отправьте CSV файл.');
    return;
  }
  
  await processAndSendResults(ctx, session.data, session.fileName);
});

// Handle document (CSV file) - silently ignore non-CSV files
bot.on(message('document'), async (ctx) => {
  const doc = ctx.message.document;
  
  // Silently ignore non-CSV files
  if (!doc.file_name?.toLowerCase().endsWith('.csv')) {
    return; // Just ignore, don't send any message
  }

  const processingMsg = await ctx.reply('⏳ Загружаю файл...');

  try {
    // Download file
    const fileLink = await ctx.telegram.getFileLink(doc.file_id);
    const response = await fetch(fileLink.href);
    
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const csvContent = await response.text();

    // Parse data
    const parsedData = parseTripData(csvContent);

    if (parsedData.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        undefined,
        '❌ Не удалось распарсить файл. Проверьте формат CSV.'
      );
      return;
    }

    // Store in session
    userSessions.set(ctx.from.id, { data: parsedData, fileName: doc.file_name });
    
    // Delete loading message
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

    // Process and send results
    await processAndSendResults(ctx, parsedData, doc.file_name);

  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      undefined,
      '❌ Ошибка при загрузке файла. Попробуйте другой файл.'
    );
  }
});

// Bot only responds to commands and CSV files - no text message handling

function formatSummary(summary: BotTripSummary, fileName: string, dataPoints: number): string {
  // movingDuration is in milliseconds, convert to seconds for display
  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}ч ${mins}м ${secs}с`;
    if (mins > 0) return `${mins}м ${secs}с`;
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

function formatAccelerationSummary(accelResults: any): string {
  if (!accelResults || Object.keys(accelResults).length === 0) return '';

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

  // If no acceleration data found, show informative message
  if (!hasAnyResult) {
    return '🚀 *Результаты ускорения:*\n\n⚠️ Нет данных о разгоне с места.\n_Для измерения ускорения нужен лог с началом движения от 0 км/ч._\n';
  }

  return text;
}

// Error handling
bot.catch((err: unknown, ctx: Context) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Set up bot commands menu
bot.telegram.setMyCommands([
  { command: 'start', description: 'Начать работу с ботом' },
  { command: 'help', description: 'Помощь и инструкции' },
  { command: 'reanalyze', description: 'Повторный анализ последнего файла' },
]);

// Start bot
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

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
