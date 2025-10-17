/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex('spreadsheets')
    .insert([
      { spreadsheet_id: '1SDvqFHuPhumrkdbk5zXtxzaNsRwMVLuYMvj7eIvtPAM' }
    ])
    .onConflict('spreadsheet_id')
    .ignore();      
}