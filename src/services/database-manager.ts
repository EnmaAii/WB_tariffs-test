import knex from '#postgres/knex.js';
import { WarehouseTariff } from '../types/tariff.types.js';

export class DatabaseManager {
    private currentDate: string = this.getCurrentDateString();

    async createDailyTable(date: Date): Promise<string> {
        const tableName = this.getTableName(date);
        
        const exists = await knex.schema.hasTable(tableName);
        if (!exists) {
            await knex.schema.createTable(tableName, (table) => {
                table.increments('id').primary();
                table.string('warehouse_name', 255).notNullable();
                table.string('geo_name', 255).notNullable();
                table.decimal('box_delivery_base', 10, 2).nullable();
                table.decimal('box_delivery_liter', 10, 2).nullable();
                table.decimal('box_delivery_marketplace_base', 10, 2).nullable();
                table.decimal('box_delivery_marketplace_liter', 10, 2).nullable();
                table.decimal('box_storage_base', 10, 2).nullable();
                table.decimal('box_storage_liter', 10, 2).nullable();
                table.timestamp('captured_at').defaultTo(knex.fn.now());
                table.date('effective_date').notNullable();
                table.date('dt_till_max').nullable();
                
                table.index(['warehouse_name']);
                table.index(['captured_at']);
                table.index(['effective_date']);
            });
            
            console.log(`Created daily table: ${tableName}`);
        }
        
        return tableName;
    }

    async addHourlyData(date: Date, tariffs: Omit<WarehouseTariff, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
        const tableName = await this.createDailyTable(date);
        
        if (tariffs.length > 0) {
            await knex(tableName).insert(tariffs);
            console.log(`Added ${tariffs.length} records to ${tableName}`);
        }
    }

    async getDailyData(date: Date): Promise<WarehouseTariff[]> {
        const tableName = this.getTableName(date);
        
        const exists = await knex.schema.hasTable(tableName);
        if (!exists) {
            return [];
        }

        return await knex(tableName)
            .select('*')
            .orderBy('box_delivery_liter', 'asc')
            .orderBy('captured_at', 'desc');
    }

    async getDailyTables(): Promise<string[]> {
        const result = await knex.raw(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'tariffs_%'
            ORDER BY table_name DESC
        `);
        
        return result.rows.map((row: any) => row.table_name);
    }

    async checkAndCreateNewDateTable(): Promise<string> {
        const today = new Date();
        const todayString = this.getCurrentDateString();
        
        if (todayString !== this.currentDate) {
            console.log(`Date changed from ${this.currentDate} to ${todayString}. Creating new table...`);
            this.currentDate = todayString;
            return await this.createDailyTable(today);
        }
        
        return this.getTableName(today);
    }

    private getTableName(date: Date): string {
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '_');
        return `tariffs_${dateString}`;
    }

    private getCurrentDateString(): string {
        return new Date().toISOString().split('T')[0].replace(/-/g, '_');
    }
}

export const databaseManager = new DatabaseManager();