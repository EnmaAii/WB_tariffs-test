import { migrate, seed } from "#postgres/knex.js";
import express from 'express';
import { schedulerService } from './services/scheduler-service.js';
import { spreadsheetManager } from './services/spreadsheet-manager.js';
import { databaseManager } from './services/database-manager.js';
import knex from '#postgres/knex.js';

async function initializeApplication() {
    console.log('Initializing application...');
    
    await migrate.latest();
    await seed.run();
    
    // Создаем таблицы за несколько дней
    const dates = [
        new Date('2025-10-16'),
        new Date('2025-10-17')
    ];
    
    for (const date of dates) {
        await databaseManager.createDailyTable(date);
        console.log(`Database table created for ${date.toISOString().split('T')[0]}`);
    }
    
    console.log('Application initialized successfully');
}

async function startServer() {
    await initializeApplication();

    const app = express();
    const PORT = process.env.APP_PORT || 5000;

    app.use(express.json());

    // Обновить Google Таблицу по её ID (использует данные из последней таблицы БД)
    app.post('/spreadsheets/update-by-id', async (req, res) => {
        try {
            const { spreadsheetId } = req.body;
            
            if (!spreadsheetId) {
                return res.status(400).json({ error: 'Spreadsheet ID is required' });
            }

            await spreadsheetManager.updateSpreadsheetById(spreadsheetId);
            
            res.json({ 
                success: true,
                message: `Google Sheet updated successfully with latest data`,
                spreadsheetId: spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            });
            
        } catch (error: any) {
            console.error('Error in /spreadsheets/update-by-id:', error);
            res.status(500).json({ error: error.message || 'Failed to update Google Sheet' });
        }
    });

    // Обновить Google Таблицу для конкретной даты
    app.post('/spreadsheets/update-for-date', async (req, res) => {
        try {
            const { spreadsheetId, date } = req.body;
            
            if (!spreadsheetId || !date) {
                return res.status(400).json({ error: 'Spreadsheet ID and date are required' });
            }

            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            await spreadsheetManager.updateSpreadsheetForDate(spreadsheetId, targetDate);
            
            res.json({ 
                success: true,
                message: `Google Sheet updated successfully for date ${date}`,
                spreadsheetId: spreadsheetId,
                date: date,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            });
            
        } catch (error: any) {
            console.error('Error in /spreadsheets/update-for-date:', error);
            res.status(500).json({ error: error.message || 'Failed to update Google Sheet' });
        }
    });

    // Добавить Google таблицу в автообновление
    app.post('/spreadsheets/auto-update', async (req, res) => {
        try {
            const { spreadsheetId } = req.body;
            
            if (!spreadsheetId) {
                return res.status(400).json({ error: 'Spreadsheet ID is required' });
            }

            schedulerService.addSpreadsheet(spreadsheetId);
            
            res.json({ 
                success: true,
                message: `Google Sheet added to auto-update`,
                spreadsheetId: spreadsheetId
            });
            
        } catch (error) {
            console.error('Error in /spreadsheets/auto-update:', error);
            res.status(500).json({ error: 'Failed to add spreadsheet to auto-update' });
        }
    });

    // Получить данные за конкретную дату
    app.get('/tariffs/:date', async (req, res) => {
        try {
            const { date } = req.params;
            const targetDate = new Date(date);
            
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const data = await databaseManager.getDailyData(targetDate);
            res.json({ 
                date: date,
                records: data,
                count: data.length
            });
        } catch (error) {
            console.error('Error in /tariffs/:date:', error);
            res.status(500).json({ error: 'Failed to get daily data' });
        }
    });

    // Получить список всех дат с данными
    app.get('/tariffs/dates', async (req, res) => {
        try {
            const tables = await databaseManager.getDailyTables();
            const dates = tables.map(tableName => {
                return tableName.replace('tariffs_', '').replace(/_/g, '-');
            });
            
            res.json({ dates });
        } catch (error) {
            console.error('Error in /tariffs/dates:', error);
            res.status(500).json({ error: 'Failed to get dates list' });
        }
    });

    app.get('/health', async (req, res) => {
        try {
            await knex.raw('SELECT 1');
            const tables = await databaseManager.getDailyTables();
            
            res.json({ 
                status: 'ok', 
                database: 'connected',
                tables_count: tables.length,
                tables: tables
            });
        } catch (error) {
            res.status(500).json({ status: 'error', database: 'disconnected' });
        }
    });

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        schedulerService.startHourlyUpdates();
        console.log('Hourly updates started');
    });

    process.on('SIGTERM', async () => {
        console.log('Shutting down gracefully...');
        schedulerService.stopUpdates();
        server.close(() => {
            process.exit(0);
        });
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});