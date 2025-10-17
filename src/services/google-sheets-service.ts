import { google } from 'googleapis';
import { databaseManager } from './database-manager.js';

export class GoogleSheetsService {
    private sheets;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    // Добавляет данные в Google Таблицу
    async updateDailySpreadsheet(spreadsheetId: string, date: Date): Promise<void> {
        try {
            console.log(`Adding data to Google Sheet: ${spreadsheetId} for date ${date}`);

            // Получаем все данные за дату из БД
            const tariffs = await databaseManager.getDailyData(date);
            
            // Сначала проверяем, есть ли уже заголовки
            const currentData = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'A1:K1'
            });

            const values = [];

            // Добавляем заголовки только если их еще нет
            if (!currentData.data.values || currentData.data.values.length === 0) {
                values.push([
                    'warehouse_name', 
                    'geo_name', 
                    'box_delivery_base', 
                    'box_delivery_liter', 
                    'box_delivery_marketplace_base', 
                    'box_delivery_marketplace_liter', 
                    'box_storage_base', 
                    'box_storage_liter', 
                    'effective_date',
                    'dt_till_max',
                    'captured_at'
                ]);
            }

            // Добавляем данные
            values.push(...tariffs.map((tariff: any) => [
                tariff.warehouse_name,
                tariff.geo_name,
                tariff.box_delivery_base,
                tariff.box_delivery_liter,
                tariff.box_delivery_marketplace_base,
                tariff.box_delivery_marketplace_liter,
                tariff.box_storage_base,
                tariff.box_storage_liter,
                tariff.effective_date,
                tariff.dt_till_max ? tariff.dt_till_max.toISOString().split('T')[0] : '',
                tariff.captured_at ? tariff.captured_at.toISOString() : ''
            ]));

            // Добавляем данные в таблицу
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'A1',
                valueInputOption: 'RAW',
                requestBody: { values }
            });

            console.log(`Successfully added ${tariffs.length} records to Google Sheet`);

        } catch (error: any) {
            console.error(`Error adding data to Google Sheet ${spreadsheetId}:`, error.message);
            throw error;
        }
    }
}

export const googleSheetsService = new GoogleSheetsService();