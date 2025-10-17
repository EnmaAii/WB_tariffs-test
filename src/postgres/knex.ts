import _knex from "knex";
import knexConfig from "#config/knex/knexfile.js";

const knex = _knex(knexConfig);
export default knex;

function logMigrationResults(action: string, result: [number, string[]]) {
    if (result[1].length === 0) {
        console.log(["latest", "up"].includes(action) ? "All migrations are up to date" : "All migrations have been rolled back");
        return;
    }
    console.log(`Batch ${result[0]} ${["latest", "up"].includes(action) ? "ran" : "rolled back"} the following migrations:`);
    for (const migration of result[1]) {
        console.log("- " + migration);
    }
}

function logMigrationList(list: [{ name: string }[], { file: string }[]]) {
    console.log(`Found ${list[0].length} Completed Migration file/files.`);
    for (const migration of list[0]) {
        console.log("- " + migration.name);
    }
    console.log(`Found ${list[1].length} Pending Migration file/files.`);
    for (const migration of list[1]) {
        console.log("- " + migration.file);
    }
}

function logSeedRun(result: [string[]]) {
    if(result[0].length === 0) {
        console.log("No seeds to run");
        return; // ДОБАВЛЕНО: return чтобы не выводить лишнее
    }
    console.log(`Ran ${result[0].length} seed files`);
    for(const seed of result[0]) {
        console.log("- " + seed?.split(/\/|\\/).pop());
    }
}

function logSeedMake(name: string) {
    console.log(`Created seed: ${name.split(/\/|\\/).pop()}`);
}

// ДОБАВЛЕНО: Функция для определения расширения файла
function getMigrationExtension(): string {
    return process.env.NODE_ENV === 'production' ? 'js' : 'js'; // Всегда используем JS для CommonJS
}

export const migrate = {
    latest: async () => {
        try {
            logMigrationResults("latest", await knex.migrate.latest());
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    },
    rollback: async () => {
        try {
            logMigrationResults("rollback", await knex.migrate.rollback());
        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    },
    down: async (name?: string) => {
        try {
            logMigrationResults("down", await knex.migrate.down({ name }));
        } catch (error) {
            console.error('Migration down failed:', error);
            throw error;
        }
    },
    up: async (name?: string) => {
        try {
            logMigrationResults("up", await knex.migrate.up({ name }));
        } catch (error) {
            console.error('Migration up failed:', error);
            throw error;
        }
    },
    list: async () => {
        try {
            logMigrationList(await knex.migrate.list());
        } catch (error) {
            console.error('Migration list failed:', error);
            throw error;
        }
    },
    make: async (name: string) => {
        if (!name) {
            console.error("Please provide a migration name");
            process.exit(1);
        }
        try {
            const extension = getMigrationExtension();
            const result = await knex.migrate.make(name, { extension });
            console.log(`Created migration: ${result}`);
        } catch (error) {
            console.error('Migration make failed:', error);
            throw error;
        }
    },
};

export const seed = {
    run: async () => {
        try {
            logSeedRun(await knex.seed.run());
        } catch (error) {
            console.error('Seed run failed:', error);
            throw error;
        }
    },
    make: async (name: string) => {
        if (!name) {
            console.error("Please provide a seed name");
            process.exit(1);
        }
        try {
            logSeedMake(await knex.seed.make(name));
        } catch (error) {
            console.error('Seed make failed:', error);
            throw error;
        }
    },
};


process.on('SIGINT', async () => {
    console.log('\nClosing database connection...');
    await knex.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nClosing database connection...');
    await knex.destroy();
    process.exit(0);
});