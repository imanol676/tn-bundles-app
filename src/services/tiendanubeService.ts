import fetch from 'node-fetch';
import { getStoreToken } from '../store/storeRepo';
import { env } from '../config/env';

const TN_API_BASE = 'https://api.tiendanube.com/v1';

interface PromoData {
  name: string;
  quantity: number;
  discountValue: number;
  discountType: 'percent' | 'fixed_amount';
  productId: number;
}

const getHeaders = (token: string) => ({
    'Authentication': `bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'TN Bundles App (Admin)'
});

interface CouponData {
    code: string;
    value: number;
    type: 'percentage' | 'absolute';
    productId: number;
}

interface DiscountScriptData {
    productId: number;
    discountValue: number;
    discountType: 'percent' | 'absolute';
}

// --- CREAR DESCUENTO AUTOMÁTICO EN EL CARRITO ---
export async function createCartDiscount(storeId: number, scriptData: DiscountScriptData): Promise<string | null> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        // Crear código único basado en producto + valor + tipo de descuento
        const discountCode = `UPSELL${scriptData.productId}_${scriptData.discountValue}${scriptData.discountType === 'percent' ? 'PCT' : 'ARS'}`;
        
        console.log(`[Descuento] Intentando crear cupón: ${discountCode} - ${scriptData.discountValue}${scriptData.discountType === 'percent' ? '%' : '$'} para producto ${scriptData.productId}`);
        
        const discountBody = {
            type: scriptData.discountType === 'percent' ? 'percentage' : 'absolute',
            value: scriptData.discountValue.toString(),
            code: discountCode,
            valid_from: new Date().toISOString().split('T')[0], // Solo fecha sin hora
            max_uses: null, // null = ilimitado
            min_price: "0.00"
        };
        
        console.log(`[Descuento] Body:`, JSON.stringify(discountBody, null, 2));

        const response = await fetch(`${TN_API_BASE}/${storeId}/coupons`, {
            method: 'POST',
            headers: getHeaders(accessToken),
            body: JSON.stringify(discountBody)
        });

        if (response.ok) {
            const result = await response.json() as any;
            console.log(`[Descuento] ✅ Cupón creado exitosamente: ${discountCode} (ID: ${result.id})`);
            return discountCode;
        } else {
            const errorText = await response.text();
            console.error(`[Descuento] ❌ Error creando cupón:`, errorText);
            
            // Si el error es que ya existe, retornar el código de todos modos
            if (errorText.includes('must be unique')) {
                console.log(`[Descuento] ♻️ Cupón ya existe, reutilizando: ${discountCode}`);
                return discountCode;
            }
            
            return null;
        }
    } catch (error) {
        console.error('[Descuento] Error:', error);
        return null;
    }
}

// --- GESTIÓN DE CUPONES PARA UPSELLS ---
export async function createOrUpdateUpsellCoupon(storeId: number, upsellData: CouponData): Promise<string | null> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        const couponCode = `UPSELL_${upsellData.productId}_${upsellData.value}${upsellData.type === 'percentage' ? 'PCT' : 'ARS'}`;
        
        // Buscar si ya existe un cupón para este producto
        const existingCoupons = await fetch(`${TN_API_BASE}/${storeId}/coupons?code=${couponCode}`, {
            headers: getHeaders(accessToken)
        });
        
        const coupons = await existingCoupons.json() as any[];
        
        // Si existe, eliminarlo primero
        if (Array.isArray(coupons) && coupons.length > 0) {
            for (const coupon of coupons) {
                await fetch(`${TN_API_BASE}/${storeId}/coupons/${coupon.id}`, {
                    method: 'DELETE',
                    headers: getHeaders(accessToken)
                });
                console.log(`[Cupón] ♻️ Eliminado cupón antiguo: ${couponCode}`);
            }
        }
        
        // Crear nuevo cupón
        const newCoupon = {
            code: couponCode,
            type: upsellData.type,
            value: upsellData.value.toString(),
            valid: true,
            max_uses: null, // Ilimitado
            products: [upsellData.productId.toString()]
        };
        
        const response = await fetch(`${TN_API_BASE}/${storeId}/coupons`, {
            method: 'POST',
            headers: getHeaders(accessToken),
            body: JSON.stringify(newCoupon)
        });
        
        if (response.ok) {
            console.log(`[Cupón] ✅ Creado: ${couponCode} (${upsellData.value}${upsellData.type === 'percentage' ? '%' : '$'} para producto ${upsellData.productId})`);
            return couponCode;
        } else {
            const error = await response.text();
            console.error(`[Cupón] ❌ Error creando cupón:`, error);
            return null;
        }
        
    } catch (error) {
        console.error('[Cupón] Error:', error);
        return null;
    }
}

export async function deleteUpsellCoupon(storeId: number, productId: number): Promise<void> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        // Buscar cupones que coincidan con el patrón del producto
        const response = await fetch(`${TN_API_BASE}/${storeId}/coupons`, {
            headers: getHeaders(accessToken)
        });
        
        const coupons = await response.json() as any[];
        
        if (Array.isArray(coupons)) {
            for (const coupon of coupons) {
                if (coupon.code && coupon.code.startsWith(`UPSELL_${productId}_`)) {
                    await fetch(`${TN_API_BASE}/${storeId}/coupons/${coupon.id}`, {
                        method: 'DELETE',
                        headers: getHeaders(accessToken)
                    });
                    console.log(`[Cupón] 🗑️ Eliminado: ${coupon.code}`);
                }
            }
        }
    } catch (error) {
        console.error('[Cupón] Error eliminando:', error);
    }
}

// --- GESTIÓN DE PRODUCTOS DUPLICADOS OCULTOS PARA UPSELLS ---
export async function createOrUpdateDiscountVariant(storeId: number, productId: number, discountData: {
    discountValue: number;
    discountType: 'percent' | 'absolute';
}): Promise<number | null> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        console.log(`[Producto Duplicado] 🔍 Obteniendo producto ${productId} de tienda ${storeId}...`);
        
        // Obtener producto original
        const productResponse = await fetch(`${TN_API_BASE}/${storeId}/products/${productId}`, {
            headers: getHeaders(accessToken)
        });
        
        if (!productResponse.ok) {
            const errorText = await productResponse.text();
            console.error(`[Producto Duplicado] ❌ Error obteniendo producto ${productId}:`, errorText);
            return null;
        }
        
        const originalProduct = await productResponse.json() as any;
        console.log(`[Producto Duplicado] 📦 Producto original:`, originalProduct.name?.es || originalProduct.name);
        
        // Obtener precio de la primera variante
        let basePrice = 0;
        if (originalProduct.variants && originalProduct.variants.length > 0) {
            basePrice = parseFloat(originalProduct.variants[0].price);
        } else if (originalProduct.price) {
            basePrice = parseFloat(originalProduct.price);
        }
        
        if (isNaN(basePrice) || basePrice <= 0) {
            console.error(`[Producto Duplicado] ❌ No se pudo obtener un precio válido del producto ${productId}`);
            return null;
        }
        
        let discountedPrice = basePrice;
        
        if (discountData.discountType === 'percent') {
            discountedPrice = basePrice * (1 - discountData.discountValue / 100);
        } else {
            discountedPrice = Math.max(basePrice - discountData.discountValue, 0);
        }
        
        console.log(`[Producto Duplicado] 💰 Precio original: $${basePrice}, Precio con descuento: $${discountedPrice.toFixed(2)} (${discountData.discountValue}${discountData.discountType === 'percent' ? '%' : '$'})`);
        
        // Buscar si ya existe un producto duplicado para este descuento
        const duplicateName = `UPSELL_${productId}_${discountData.discountValue}${discountData.discountType === 'percent' ? 'PCT' : 'ARS'}`;
        
        const searchResponse = await fetch(`${TN_API_BASE}/${storeId}/products?per_page=200`, {
            headers: getHeaders(accessToken)
        });
        
        if (searchResponse.ok) {
            const allProducts = await searchResponse.json() as any[];
            const existingDuplicate = allProducts.find((p: any) => p.sku === duplicateName);
            
            if (existingDuplicate) {
                console.log(`[Producto Duplicado] ♻️ Producto duplicado encontrado: ${existingDuplicate.id}, actualizando precio...`);
                
                // Actualizar precio del duplicado
                const updateResponse = await fetch(`${TN_API_BASE}/${storeId}/products/${existingDuplicate.id}`, {
                    method: 'PUT',
                    headers: getHeaders(accessToken),
                    body: JSON.stringify({
                        price: discountedPrice.toFixed(2),
                        published: true, // VISIBLE para que se pueda agregar al carrito
                        categories: [], // Sin categorías para que no aparezca en navegación
                        tags: 'tn-bundles-hidden' // Tag para identificarlo
                    })
                });
                
                if (updateResponse.ok) {
                    console.log(`[Producto Duplicado] ✅ Precio actualizado a $${discountedPrice.toFixed(2)}`);
                    // Retornar el ID de la primera variante del producto duplicado
                    const updatedProduct = await updateResponse.json() as any;
                    return updatedProduct.variants?.[0]?.id || existingDuplicate.id;
                }
            }
        }
        
        // Crear producto duplicado oculto
        console.log(`[Producto Duplicado] ➕ Creando producto duplicado oculto...`);
        
        const newProduct = {
            name: originalProduct.name,
            description: originalProduct.description,
            price: discountedPrice.toFixed(2),
            images: originalProduct.images || [],
            categories: [], // Sin categorías para que no aparezca en navegación
            brand: originalProduct.brand || null,
            published: true, // VISIBLE para que se pueda agregar al carrito
            free_shipping: originalProduct.free_shipping || false,
            sku: duplicateName, // Identificador único
            tags: 'tn-bundles-hidden', // Tag para identificarlo
            seo_title: '', // Sin SEO
            seo_description: '',
            weight: originalProduct.weight || "0.00",
            width: originalProduct.width || "0.00",
            height: originalProduct.height || "0.00",
            depth: originalProduct.depth || "0.00"
        };
        
        const createResponse = await fetch(`${TN_API_BASE}/${storeId}/products`, {
            method: 'POST',
            headers: getHeaders(accessToken),
            body: JSON.stringify(newProduct)
        });
        
        if (createResponse.ok) {
            const createdProduct = await createResponse.json() as any;
            console.log(`[Producto Duplicado] ✅ Producto duplicado creado: ID ${createdProduct.id}, VISIBLE pero sin categorías`);
            
            // Actualizar el precio de la variante creada automáticamente
            if (createdProduct.variants && createdProduct.variants.length > 0) {
                const variantId = createdProduct.variants[0].id;
                console.log(`[Producto Duplicado] 🔧 Actualizando precio de variante ${variantId} a $${discountedPrice.toFixed(2)}...`);
                
                const updateVariantResponse = await fetch(`${TN_API_BASE}/${storeId}/products/${createdProduct.id}/variants/${variantId}`, {
                    method: 'PUT',
                    headers: getHeaders(accessToken),
                    body: JSON.stringify({
                        price: discountedPrice.toFixed(2)
                    })
                });
                
                if (updateVariantResponse.ok) {
                    console.log(`[Producto Duplicado] ✅ Precio de variante actualizado a $${discountedPrice.toFixed(2)}`);
                    return variantId;
                } else {
                    const variantError = await updateVariantResponse.text();
                    console.error(`[Producto Duplicado] ❌ Error actualizando variante:`, variantError);
                }
            }
            
            // Retornar el ID de la primera variante del nuevo producto
            return createdProduct.variants?.[0]?.id || createdProduct.id;
        } else {
            const error = await createResponse.text();
            console.error(`[Producto Duplicado] ❌ Error creando producto:`, error);
        }
        
        return null;
    } catch (error) {
        console.error('[Producto Duplicado] Error:', error);
        return null;
    }
}

export async function deleteDiscountVariant(storeId: number, productId: number): Promise<void> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        // Buscar productos duplicados con SKU que empiece con UPSELL_{productId}_
        const searchResponse = await fetch(`${TN_API_BASE}/${storeId}/products?per_page=200`, {
            headers: getHeaders(accessToken)
        });
        
        if (!searchResponse.ok) return;
        
        const allProducts = await searchResponse.json() as any[];
        const duplicates = allProducts.filter((p: any) => 
            p.sku && p.sku.startsWith(`UPSELL_${productId}_`)
        );
        
        for (const duplicate of duplicates) {
            await fetch(`${TN_API_BASE}/${storeId}/products/${duplicate.id}`, {
                method: 'DELETE',
                headers: getHeaders(accessToken)
            });
            console.log(`[Producto Duplicado] 🗑️ Eliminado producto duplicado ${duplicate.id} (SKU: ${duplicate.sku})`);
        }
    } catch (error) {
        console.error('[Producto Duplicado] Error eliminando:', error);
    }
}

// Helper para borrar
async function deletePromotion(storeId: number, promoId: string, accessToken: string) {
    try {
        await fetch(`${TN_API_BASE}/${storeId}/promotions/${promoId}`, {
            method: 'DELETE',
            headers: getHeaders(accessToken)
        });
    } catch(e) { console.error(e); }
}

// Helper para obtener URL del admin
export async function getStoreDomain(storeId: number, accessToken: string): Promise<string> {
    try {
        const res = await fetch(`${TN_API_BASE}/${storeId}/store`, { headers: getHeaders(accessToken) });
        const data = await res.json();
        let rawUrl = data.admin_url || data.url_with_protocol || data.url || '';
        if (rawUrl && !rawUrl.startsWith('http')) rawUrl = `https://${rawUrl}`;
        if (rawUrl) return new URL(rawUrl).origin;
        return 'https://www.tiendanube.com';
    } catch (e) { return 'https://www.tiendanube.com'; }
}

// --- BUSCADOR DE PRODUCTOS OPTIMIZADO (Para Upsells) ---
export async function searchProducts(storeId: number, query: string): Promise<any[]> {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    try {
        let url = '';
        
        // LÓGICA DE DROPDOWN:
        if (!query || query.trim() === '') {
            // Si no hay texto, traemos productos publicados sin filtro de búsqueda
            console.log(`[TN Service] 🔽 Dropdown abierto: Trayendo productos recientes...`);
            url = `${TN_API_BASE}/${storeId}/products?per_page=15&published=true`;
        } else {
            // Si hay texto, buscamos por nombre
            console.log(`[TN Service] 🔍 Buscando: "${query}"`);
            url = `${TN_API_BASE}/${storeId}/products?q=${encodeURIComponent(query)}&per_page=15`;
        }

        const response = await fetch(url, { headers: getHeaders(accessToken) });
        
        if (!response.ok) {
            console.error(`[TN Service] Error API Productos: ${response.status}`);
            return [];
        }
        
        const products: any[] = await response.json();
        
        console.log(`[TN Service] ✅ Recibidos ${products.length} productos de la API`);
        
        return products.map((p: any) => {
            // Buscar la imagen principal del producto de múltiples formas
            let imageUrl = '';
            
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                // Buscar primero la imagen marcada como principal
                const mainImage = p.images.find((img: any) => img.position === 1);
                if (mainImage?.src) {
                    imageUrl = mainImage.src;
                } else if (p.images[0]?.src) {
                    imageUrl = p.images[0].src;
                }
            }
            
            // Fallback a la imagen de la primera variante si existe
            if (!imageUrl && p.variants && p.variants.length > 0 && p.variants[0].image) {
                imageUrl = p.variants[0].image;
            }
            
            // Último fallback: usar placeholder solo si realmente no hay imagen
            if (!imageUrl) {
                imageUrl = 'https://via.placeholder.com/50?text=Sin+Imagen';
            }
            
            console.log(`[TN Service] 📦 Producto ID ${p.id}: "${p.name || 'Sin nombre'}" | Imagen: ${imageUrl.substring(0, 60)}...`);
            
            // Obtener precio REAL del producto: usar promotional_price si existe, sino price
            let productPrice = 0;
            if (p.variants && p.variants.length > 0) {
                const firstVariant = p.variants[0];
                // Priorizar promotional_price (precio real) sobre price (precio tachado)
                productPrice = firstVariant.promotional_price || firstVariant.price || 0;
            }
            
            return {
                id: p.id,
                name: (typeof p.name === 'object') ? (p.name.es || Object.values(p.name)[0]) : p.name,
                image: imageUrl,
                price: productPrice,
                stock: p.variants?.[0]?.stock
            };
        });

    } catch (e) {
        console.error("Error buscando productos:", e);
        return [];
    }
}

// Función para mostrar instrucciones de promoción (API no soporta creación automática)
export async function createOrUpdatePromotion(storeId: number, data: PromoData): Promise<boolean> {
  try {
    let accessToken = getStoreToken(storeId);
    if (!accessToken || accessToken.length < 10) accessToken = env.tnAccessToken;

    const promoName = `Bundle Pack X${data.quantity}`; 
    const storeOrigin = await getStoreDomain(storeId, accessToken);
    const createUrl = `${storeOrigin}/admin/promotions/new`;
    
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  📋 PROMOCIÓN A CREAR MANUALMENTE                          ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Nombre: ${promoName.padEnd(48)} ║`);
    console.log(`║  Tipo: Descuento progresivo por cantidad                   ║`);
    console.log(`║  ────────────────────────────────────────────────────────  ║`);
    console.log(`║  📦 Al comprar: ${data.quantity.toString().padEnd(43)} ║`);
    console.log(`║  💰 Descuento: ${data.discountValue}${data.discountType === 'percent' ? '%' : ' pesos'} ${' '.repeat(40 - data.discountValue.toString().length - (data.discountType === 'percent' ? 1 : 6))} ║`);
    console.log(`║  🎯 Producto ID: ${data.productId.toString().padEnd(40)} ║`);
    console.log(`║  ────────────────────────────────────────────────────────  ║`);
    console.log(`║  🔗 Crear aquí:                                            ║`);
    console.log(`║  ${createUrl.padEnd(56)} ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
    
    return true;

  } catch (error) {
    console.error('[Promoción] Error:', error);
    return true;
  }
}