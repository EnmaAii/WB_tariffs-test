import { wbApiService } from './wb-api-service.js';
import { spreadsheetManager } from './spreadsheet-manager.js';

export class SchedulerService {
    private intervalId: NodeJS.Timeout | null = null;
    private spreadsheetIds: string[] = []; 

    constructor() {
        
        this.spreadsheetIds = [
            '1MgGV_x-4VZIcOyCmP1UXwhv3iSBcGUW_FuCdfs04vxw',
            '1sJvvOA9ca-e7eOhuPRkysvmgLh6VIQ6EBMHZ2LJm4IU'
        ];
    }

    startHourlyUpdates(): void {
        this.hourlyUpdate();
        this.intervalId = setInterval(() => this.hourlyUpdate(), 60 * 60 * 1000);
    }

    stopUpdates(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async hourlyUpdate(): Promise<void> {
        const today = new Date();
        console.log(`Hourly update started at ${today.toISOString()}`);
        
        try {
            // Получаем данные с WB API
            await wbApiService.fetchAndSaveTariffs();
            console.log(`WB API data updated`);
            
            // Обновляем все Google таблицы
            await this.updateAllSpreadsheets();
            console.log(`All Google Sheets updated`);
            
        } catch (error) {
            console.error('Hourly update failed:', error);
        }
    }

    private async updateAllSpreadsheets(): Promise<void> {
        for (const spreadsheetId of this.spreadsheetIds) {
            try {
                await spreadsheetManager.updateSpreadsheetById(spreadsheetId);
                console.log(`Updated spreadsheet: ${spreadsheetId}`);
            } catch (error) {
                console.error(`Failed to update spreadsheet ${spreadsheetId}:`, error);
            }
        }
    }

    addSpreadsheet(spreadsheetId: string): void {
        if (!this.spreadsheetIds.includes(spreadsheetId)) {
            this.spreadsheetIds.push(spreadsheetId);
            console.log(`Added spreadsheet to auto-update: ${spreadsheetId}`);
        }
    }

    async manualUpdate(): Promise<void> {
        console.log('Manual update triggered');
        await this.hourlyUpdate();
    }
}

export const schedulerService = new SchedulerService();