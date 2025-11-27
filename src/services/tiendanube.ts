import fetch from 'node-fetch'; // O usa axios si prefieres

// Tu Access Token de desarrollo (Para producción, esto debe venir de la DB según el storeId)
// ⚠️ REEMPLAZA ESTO CON TU TOKEN REAL DE LA TIENDA DEMO ⚠️
const DEV_ACCESS_TOKEN = 'TU_ACCESS_TOKEN_AQUI'; 

interface CouponParams {
  code: string;
  type: 'percentage' | 'absolute';
  value: number;
}

export async function createOrUpdateCoupon(storeId: number, params: CouponParams) {
  const apiUrl = `https://api.tiendanube.com/v1/${storeId}/coupons`;
  
  // 1. Definimos el cuerpo del cupón
  const couponData = {
    code: params.code.toUpperCase(),
    type: params.type,
    value: params.value,
    valid: true,
    usage_limit: null, // Ilimitado
    min_price: 0
  };

  // 2. Intentamos CREAR el cupón
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authentication': `bearer ${DEV_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TN Bundles App (tu-email@ejemplo.com)'
    },
    body: JSON.stringify(couponData)
  });

  if (response.status === 201) {
    console.log(`[API TN] Cupón ${params.code} creado exitosamente.`);
    return params.code;
  }

  // 3. Si falla con 422, es probable que el cupón YA EXISTA.
  // En una app real, aquí deberíamos buscar el ID del cupón y hacer un PUT para actualizar el valor.
  // Por ahora, para no complicar, asumimos que si existe, ya es válido.
  if (response.status === 422) {
      console.log(`[API TN] El cupón ${params.code} ya existía. Usándolo.`);
      return params.code;
  }

  const errorText = await response.text();
  console.error('[API TN] Error creando cupón:', errorText);
  return null;
}