/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("warehouse_tariffs", (table) => {
        table.bigIncrements("id").primary();
        table.string("warehouse_name").notNullable();
        table.string("geo_name");
        table.decimal("box_delivery_base", 10, 2);
        table.decimal("box_delivery_liter", 10, 2);
        table.decimal("box_delivery_marketplace_base", 10, 2);
        table.decimal("box_delivery_marketplace_liter", 10, 2);
        table.decimal("box_storage_base", 10, 2);
        table.decimal("box_storage_liter", 10, 2);
        table.date("effective_date").notNullable();
        table.date("dt_till_max");
        table.timestamps(true, true);
        
        table.index("warehouse_name");
        table.index("effective_date");
        table.unique(["warehouse_name", "effective_date"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("warehouse_tariffs");
}