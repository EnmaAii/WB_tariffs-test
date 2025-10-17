/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable('daily_spreadsheets', function(table) {
        table.increments('id').primary();
        table.string('spreadsheet_id', 255).notNullable().unique();
        table.date('date').notNullable().unique();
        table.string('title', 255).nullable();
        table.timestamps(true, true);
        
        table.index(['date']);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable('daily_spreadsheets');
}