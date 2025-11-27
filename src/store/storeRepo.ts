import fs from 'fs';
import path from 'path';

// Base de datos persistente en database.json
const DB_PATH = path.join(__dirname, '../../database.json');

interface StoreData {
  accessToken: string;
}

function readDatabase(): any {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeDatabase(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function saveStore(storeId: number, accessToken: string) {
  const db = readDatabase();
  const storeKey = `store_${storeId}`;
  
  db[storeKey] = {
    storeId,
    accessToken,
    updatedAt: new Date().toISOString()
  };
  
  writeDatabase(db);
  console.log(`[StoreRepo] ✅ Tienda ${storeId} guardada en database.json`);
}

export function getStoreToken(storeId: number): string | undefined {
  const db = readDatabase();
  const storeKey = `store_${storeId}`;
  return db[storeKey]?.accessToken;
}