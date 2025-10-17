import axios from 'axios';
import { databaseManager } from './database-manager.js';
import { WarehouseTariff, WBApiResponse } from '../types/tariff.types.js';

export class WBApiService {
    private apiUrl = 'https://common-api.wildberries.ru/api/v1/tariffs/box';
    private apiKey = process.env.WB_API_KEY;

    async fetchAndSaveTariffs(): Promise<void> {
        console.log('Fetching tariffs from WB API...');

        try {
            // Получаем данные за несколько дней
            const dates = [
                new Date('2025-10-16'),
                new Date('2025-10-17'),
                new Date() // сегодня
            ];

            for (const date of dates) {
                await this.fetchAndSaveForDate(date);
            }

        } catch (error: any) {
            console.error('API error:', error.response?.data || error.message);
            throw error;
        }
    }

    private async fetchAndSaveForDate(date: Date): Promise<void> {
        try {
            const dateString = date.toISOString().split('T')[0];
            console.log(`Fetching data for ${dateString}...`);

            const response = await axios.get<WBApiResponse>(this.apiUrl, {
                headers: { 'Authorization': this.apiKey },
                params: { date: dateString },
                timeout: 30000,
            });

            const data = response.data.response.data;
            
            // Создаем таблицу если не существует
            await databaseManager.createDailyTable(date);
            
            const tariffsToInsert: Omit<WarehouseTariff, 'id' | 'created_at' | 'updated_at'>[] = data.warehouseList.map(warehouse => ({
                warehouse_name: warehouse.warehouseName,
                geo_name: warehouse.geoName,
                box_delivery_base: this.parseNumber(warehouse.boxDeliveryBase),
                box_delivery_liter: this.parseNumber(warehouse.boxDeliveryLiter),
                box_delivery_marketplace_base: this.parseNumber(warehouse.boxDeliveryMarketplaceBase),
                box_delivery_marketplace_liter: this.parseNumber(warehouse.boxDeliveryMarketplaceLiter),
                box_storage_base: this.parseNumber(warehouse.boxStorageBase),
                box_storage_liter: this.parseNumber(warehouse.boxStorageLiter),
                effective_date: date,
                dt_till_max: data.dtTillMax ? new Date(data.dtTillMax) : null,
            }));

            await databaseManager.addHourlyData(date, tariffsToInsert);
            console.log(`Added ${tariffsToInsert.length} records to tariffs_${dateString.replace(/-/g, '_')}`);

        } catch (error: any) {
            console.error(`Failed to fetch data for ${date.toISOString().split('T')[0]}:`, error.message);
        }
    }

    async getTariffsForDate(date: Date): Promise<WarehouseTariff[]> {
        return await databaseManager.getDailyData(date);
    }

    private parseNumber(value: string): number | null {
        if (!value || value === '-' || value.trim() === '') return null;
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? null : parsed;
    }
}

export const wbApiService = new WBApiService();