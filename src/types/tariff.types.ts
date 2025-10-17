export interface WarehouseTariff {
    warehouse_name: string;
    geo_name: string;
    box_delivery_base: number | null;
    box_delivery_liter: number | null;
    box_delivery_marketplace_base: number | null;
    box_delivery_marketplace_liter: number | null;
    box_storage_base: number | null;
    box_storage_liter: number | null;
    effective_date: Date;
    dt_till_max: Date | null;
}

export interface WBApiResponse {
    response: {
        data: {
            warehouseList: Array<{
                warehouseName: string;
                geoName: string;
                boxDeliveryBase: string;
                boxDeliveryLiter: string;
                boxDeliveryMarketplaceBase: string;
                boxDeliveryMarketplaceLiter: string;
                boxStorageBase: string;
                boxStorageLiter: string;
            }>;
            dtTillMax: string | null;
        };
    };
}