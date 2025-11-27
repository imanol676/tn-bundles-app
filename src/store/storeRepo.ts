// Simulación de base de datos en memoria
interface StoreData {
  accessToken: string;
}

const stores = new Map<number, StoreData>();

export function saveStore(storeId: number, accessToken: string) {
  stores.set(storeId, { accessToken });
  console.log(`[StoreRepo] Tienda ${storeId} guardada en memoria.`);
}

export function getStoreToken(storeId: number): string | undefined {
  return stores.get(storeId)?.accessToken;
}