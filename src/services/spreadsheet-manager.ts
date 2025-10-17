import { googleSheetsService } from './google-sheets-service.js';
import { databaseManager } from './database-manager.js';
import knex from '#postgres/knex.js';

export class SpreadsheetManager {

    // Обновляем Google таблицу по её ID (дата определяется автоматически из названия таблицы БД)
    async updateSpreadsheetById(googleSpreadsheetId: string): Promise<void> {
        try {
            // Получаем все таблицы из БД и находим подходящую по дате
            const tables = await databaseManager.getDailyTables();
            
            if (tables.length === 0) {
                throw new Error('No tariff tables found in database');
            }

            // Берем самую свежую таблицу (первую в списке)
            const latestTable = tables[0];
            const targetDate = this.extractDateFromTableName(latestTable);
            
            if (!targetDate) {
                throw new Error(`Cannot extract date from table name: ${latestTable}`);
            }

            console.log(`Using data from table ${latestTable} for Google Sheet ${googleSpreadsheetId}`);

            // Обновляем данные в Google таблице
            await googleSheetsService.updateDailySpreadsheet(googleSpreadsheetId, targetDate);
            console.log(`Updated Google Sheet ${googleSpreadsheetId} with data from ${latestTable}`);
            
        } catch (error: any) {
            console.error('Failed to update Google Sheet by ID:', error.message);
            throw error;
        }
    }

    // Обновляем Google таблицу для конкретной даты
    async updateSpreadsheetForDate(googleSpreadsheetId: string, date: Date): Promise<void> {
        try {
            const tableName = `tariffs_${date.toISOString().split('T')[0].replace(/-/g, '_')}`;
            
            // Проверяем, существует ли таблица в БД
            const tableExists = await knex.schema.hasTable(tableName);
            if (!tableExists) {
                throw new Error(`Table ${tableName} does not exist in database`);
            }

            // Обновляем данные в Google таблице
            await googleSheetsService.updateDailySpreadsheet(googleSpreadsheetId, date);
            console.log(`Updated Google Sheet ${googleSpreadsheetId} for date ${date.toISOString().split('T')[0]}`);
            
        } catch (error: any) {
            console.error('Failed to update Google Sheet for date:', error.message);
            throw error;
        }
    }

    // Извлекаем дату из названия таблицы БД
    private extractDateFromTableName(tableName: string): Date | null {
        try {
            const dateMatch = tableName.match(/tariffs_(\d{4})_(\d{2})_(\d{2})/);
            if (dateMatch) {
                const [, year, month, day] = dateMatch;
                return new Date(`${year}-${month}-${day}`);
            }
            return null;
        } catch (error) {
            console.error('Error extracting date from table name:', error);
            return null;
        }
    }
}

export const spreadsheetManager = new SpreadsheetManager();