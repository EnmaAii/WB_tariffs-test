CREATE TABLE IF NOT EXISTS warehouse_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Основная информация о складе
    warehouse_name VARCHAR(255) NOT NULL,
    geo_name VARCHAR(255),
    
    -- Тарифы доставки FBS
    box_delivery_base NUMERIC(10,2),
    box_delivery_coef_expr VARCHAR(50),
    box_delivery_liter NUMERIC(10,2),
    
    -- Тарифы доставки маркетплейс FBO
    box_delivery_marketplace_base NUMERIC(10,2),
    box_delivery_marketplace_coef_expr VARCHAR(50),
    box_delivery_marketplace_liter NUMERIC(10,2),
    
    -- Тарифы хранения
    box_storage_base NUMERIC(10,2),
    box_storage_coef_expr VARCHAR(50),
    box_storage_liter NUMERIC(10,2),
    
    -- Метаданные
    effective_date DATE NOT NULL,
    dt_till_max DATE,
    dt_next_box DATE,
    
    -- Временные метки
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Миграция для таблицы spreadsheet_registry
CREATE TABLE spreadsheet_registry (
    date DATE PRIMARY KEY,
    stocks_spreadsheet_id VARCHAR(255) NOT NULL,
    coefficients_spreadsheet_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spreadsheet_registry_date ON spreadsheet_registry(date);