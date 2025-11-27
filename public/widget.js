(function () {
  var scriptSrc = document.currentScript ? document.currentScript.src : '';
  var APP_BASE_URL = scriptSrc ? new URL(scriptSrc).origin : 'https://pretelephonic-tiesha-unteamed.ngrok-free.dev';
  
  // Agregar animación CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
  `;
  document.head.appendChild(style);
  
  // CAMBIO: Versión 16 (Notificación de Cupón)
  console.log("[TN Bundles] 🚀 Iniciando Widget v16 (Notificación Cupón)...");

  var MAX_RETRIES = 5;

  function formatARS(value) {
    return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  if (document.readyState === 'complete') {
    startPolling(0);
  } else {
    window.addEventListener('load', function() { startPolling(0); });
  }

  // --- 1. DETECCIÓN DE DATOS ---
  function startPolling(attempt) {
    let variants = [];
    let storeId = null;
    let productId = null;

    if (window.LS) {
        if(window.LS.store) storeId = window.LS.store.id;
        if(window.LS.product) productId = window.LS.product.id;
    }
    
    if (!storeId) storeId = '6973970'; 
    if (!productId) {
         const pInput = document.querySelector('input[name="product_id"]');
         if(pInput) productId = pInput.value;
    }

    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const html = script.innerHTML;
        if (html.includes('LS.variants') || (html.includes('variants') && html.includes('id'))) {
            try {
                const match = html.match(/["']?variants["']?\s*:\s*(\[[\s\S]*?\])/) || html.match(/LS\.variants\s*=\s*(\[[\s\S]*?\]);/);
                if (match && match[1]) {
                    const data = new Function("return " + match[1])();
                    if (Array.isArray(data) && data.length > 0) {
                        variants = parseVariants(data);
                        break;
                    }
                }
            } catch (e) {}
        }
    }

    let domPrice = tryScrapePrice();
    
    if (storeId && productId) {
        console.log(`[TN Bundles] Datos base: Store ${storeId}, Prod ${productId}, DOM Price: ${domPrice}`);
        fetchConfigAndRender(storeId, productId, variants, domPrice);
    } else {
        if (attempt < MAX_RETRIES) {
            setTimeout(() => startPolling(attempt + 1), 1000);
        } else {
            fetchConfigAndRender(storeId, productId || '0', [], domPrice);
        }
    }
  }

  function tryScrapePrice() {
      const selectors = [
          '#price_display', '.js-price-display', '[itemprop="price"]', 
          '.product-price', '.price', '#product_price'
      ];
      
      for (let sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
              const text = el.innerText || el.content; 
              const clean = text.replace(/[^0-9,.]/g, '').replace(',', '.'); 
              const val = parseFloat(clean);
              if (!isNaN(val) && val > 0) {
                  const arsClean = text.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
                  return parseFloat(arsClean);
              }
          }
      }
      return 0;
  }

  function parseVariants(data) {
      return data.map(v => {
          let name = v.option0 || v.name;
          if (v.option1) name += " / " + v.option1;
          return { id: v.id, name: name, price: v.price_short || v.price, stock: v.stock };
      });
  }

  function fetchConfigAndRender(storeId, productId, variants, domPrice) {
     if(document.getElementById('tn-bundle-widget')) return;

     const timestamp = new Date().getTime();
     const configUrl = `${APP_BASE_URL}/public/config?store_id=${storeId}&product_id=${productId}&t=${timestamp}`;
     
     fetch(configUrl, { headers: { 'ngrok-skip-browser-warning': '1' } })
        .then((r) => r.json())
        .then((config) => {
          if (!config || config.enabled === false) return;
          renderBundleWidget(config, variants, domPrice);
        })
        .catch((err) => console.error(err));
  }

  // --- 2. RENDERIZADO ---
  function renderBundleWidget(config, variants, domPrice) {
      const productForm = document.querySelector('[data-store^="product-form-"]');
      if (!productForm) return; 

      let dynamicPrice = 0;
      if (variants && variants.length > 0) {
          const prices = variants.map(v => Number(v.price) || 0).filter(p => p > 0);
          if (prices.length > 0) dynamicPrice = Math.min(...prices);
      }
      if (dynamicPrice > 10000000) dynamicPrice = dynamicPrice / 100; 

      let basePrice = dynamicPrice > 0 ? dynamicPrice : (domPrice > 0 ? domPrice : (config.basePrice || 0));
      if (basePrice === 0) basePrice = 1000; 

      // Colores del tema
      const theme = config.theme || {};
      const primaryColor = theme.primaryColor || '#ff4fa3';
      const primaryHoverColor = theme.primaryHoverColor || '#e63e8d';
      const backgroundColor = theme.backgroundColor || '#fff';
      const textColor = theme.textColor || '#333';
      const priceColor = theme.priceColor || '#28a745';
      const discountColor = theme.discountColor || '#dc3545';
      const borderColor = theme.borderColor || '#e5e5e5';
      const highlightColor = theme.highlightColor || '#ffc107';

      const container = document.createElement('div');
      container.id = 'tn-bundle-widget';
      container.style.cssText = `border: 1px solid ${borderColor}; border-radius: 16px; padding: 16px; margin: 16px 0; background: ${backgroundColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); font-family: sans-serif;`;

      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <h3 style="margin:0; font-size:18px; color:${textColor}">Llevá & Ahorrá</h3>
            <div style="flex:1; height:1px; background:#f0f0f0; margin-left:12px;"></div>
        </div>
      `;

      (config.packs || []).forEach(function (pack, index) {
        const qty = pack.quantity || 1;
        
        const normalTotalPack = basePrice * qty;
        let packTotalOnly = normalTotalPack;
        const discVal = Number(pack.discountValue || 0);
        
        if (pack.discountType === 'percent') packTotalOnly = normalTotalPack * (1 - discVal / 100);
        else if (pack.discountType === 'fixed_amount') packTotalOnly = Math.max(normalTotalPack - discVal, 0);

        const perUnit = packTotalOnly / qty;
        const ahorroInicial = normalTotalPack - packTotalOnly;

        // C) UPSELLS HTML (MÚLTIPLES, SOLO ACTIVOS)
        let upsellsPrice = 0;
        let upsellsHtml = '';
        
        if (pack.upsells && Array.isArray(pack.upsells)) {
            // Filtrar solo upsells activos
            const activeUpsells = pack.upsells.filter(u => u.enabled !== false);
            
            activeUpsells.forEach(upsell => {
                const upsellPrice = Number(upsell.price) || 0;
                const variantId = upsell.discountVariantId || '';
                const couponCode = upsell.couponCode || '';
                
                // Calcular precio con descuento
                let finalPrice = upsellPrice;
                if (upsell.discountValue > 0) {
                    if (upsell.discountType === 'percent') {
                        finalPrice = upsellPrice * (1 - upsell.discountValue / 100);
                    } else {
                        finalPrice = Math.max(upsellPrice - upsell.discountValue, 0);
                    }
                }
                
                // Ahora sumamos el precio con descuento al total
                upsellsPrice += finalPrice;
                
                const upsellImgSrc = upsell.image || '';
                const hasDiscount = upsell.discountValue > 0;
                
                // Mostrar descuento visualmente
                const discountLabel = hasDiscount 
                    ? `<div style="font-size:10px; color:#00c853; font-weight:600;">🎁 Oferta con cupón: -${upsell.discountValue}${upsell.discountType === 'percent' ? '%' : '$'}</div>`
                    : '';
                
                upsellsHtml += `
                    <div class="tn-upsell-row" style="margin-top:10px; padding:8px; background:#f8f9fa; border-radius:8px; display:flex; align-items:center; gap:10px; border:1px dashed #ccc; cursor:pointer;">
                        <input type="checkbox" class="tn-upsell-checkbox" 
                               data-price="${finalPrice}" 
                               data-id="${upsell.id}" 
                               data-variant-id="${variantId}"
                               data-coupon="${couponCode}"
                               style="width:18px; height:18px; cursor:pointer;">
                        
                        <div style="width:40px; height:40px; background:#fff; border-radius:4px; border:1px solid #eee; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                            <span style="font-size:20px; color:#ccc;">🎁</span>
                            <img src="${upsellImgSrc}" 
                                 style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;" 
                                 onerror="this.style.display='none'">
                        </div>
                        
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:bold; color:#333;">${upsell.name}</div>
                            <div style="font-size:11px; color:#666;">
                                ${hasDiscount ? `<span style="text-decoration:line-through; color:#999; margin-right:4px;">$ ${formatARS(upsellPrice)}</span>` : ''}
                                <span style="color:${primaryColor}; font-weight:700;">$ ${formatARS(finalPrice)}</span>
                            </div>
                            ${discountLabel}
                        </div>
                    </div>
                `;
            });
        } else if (pack.upsell && pack.upsell.id) {
            // Compatibilidad con formato antiguo (un solo upsell)
            const upsellPrice = Number(pack.upsell.price) || 0;
            upsellsPrice = upsellPrice;
            const upsellImgSrc = pack.upsell.image || '';
            const couponCode = pack.upsell.couponCode || '';
            
            upsellsHtml = `
                <div class="tn-upsell-row" style="margin-top:10px; padding:8px; background:#f8f9fa; border-radius:8px; display:flex; align-items:center; gap:10px; border:1px dashed #ccc; cursor:pointer;">
                    <input type="checkbox" class="tn-upsell-checkbox" data-price="${upsellPrice}" data-id="${pack.upsell.id}" data-coupon="${couponCode}" style="width:18px; height:18px; cursor:pointer;">
                    
                    <div style="width:40px; height:40px; background:#fff; border-radius:4px; border:1px solid #eee; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                        <span style="font-size:20px; color:#ccc;">🎁</span>
                        <img src="${upsellImgSrc}" 
                             style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;" 
                             onerror="this.style.display='none'">
                    </div>
                    
                    <div style="flex:1;">
                        <div style="font-size:13px; font-weight:bold; color:#333;">${pack.upsell.name}</div>
                        <div style="font-size:11px; color:#666;">Llevar también por <span style="color:${primaryColor}; font-weight:700;">$ ${formatARS(upsellPrice)}</span></div>
                    </div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'tn-pack-card';
        card.dataset.packId = pack.id;
        
        const isHighlighted = pack.highlight;
        const cardBorder = isHighlighted ? `2px solid ${highlightColor}` : `1px solid ${borderColor}`;
        
        card.style.cssText = `border: ${cardBorder}; border-radius: 12px; padding: 12px; margin-bottom: 10px; background: ${backgroundColor}; cursor: pointer; transition: all 0.2s;`;
        
        card.onclick = (e) => {
            if(e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT' && !e.target.closest('.tn-upsell-row')) {
                card.querySelector('input[type="radio"]').click();
            }
        };

        let badgesHtml = '';
        if (pack.highlight) badgesHtml += `<span style="background:${primaryColor}; color:#fff; border-radius:99px; padding:2px 8px; font-size:11px; font-weight:bold;">⭐ POPULAR</span>`;
        
        // HEADER CON PRECIO TACHADO
        // Nota: Usamos la clase .tn-old-price para poder referenciarla en el JS si necesitamos actualizarla, aunque en este diseño el precio tachado del pack NO cambia con el upsell.
        card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap: 8px;">
                    <div style="display:flex; align-items:center;">
                        <input type="radio" name="tn-selected-pack" value="${pack.id}" style="margin-right:8px; transform:scale(1.2); accent-color:${primaryColor};" ${index === 0 ? 'checked' : ''}>
                        <span style="font-weight:bold; color:${textColor};">${pack.label}</span>
                    </div>
                    
                    ${ahorroInicial > 0 ? `
                        <span class="tn-old-price" style="color:#999; text-decoration:line-through; font-size:13px; font-weight:600; margin-left:4px;">
                            $ ${formatARS(normalTotalPack)}
                        </span>
                    ` : ''}
                </div>
                
                <div>${badgesHtml}</div>
            </div>
            
            <div style="margin-top:6px; margin-left: 24px;">
                <div style="display:flex; align-items:baseline; gap:6px; flex-wrap:wrap;">
                    <span class="tn-display-unit" style="color:${priceColor}; font-weight:800; font-size:20px;">$ ${formatARS(perUnit)} c/u</span>
                    <span class="tn-display-total" style="color:#666; font-size:13px; font-weight:500;">(Total: $ ${formatARS(packTotalOnly)})</span>
                </div>
                
                <div style="font-size:12px; margin-top:2px;">
                    ${ahorroInicial > 0 ? `<span style="color:${discountColor}; font-weight:600;">Ahorrás $ ${formatARS(ahorroInicial)}</span>` : ''}
                </div>
            </div>

            <div class="tn-pack-variants" data-pack-id="${pack.id}" style="margin-top:8px; margin-left:24px;">
                <!-- Selectores de variantes (se oculta si no hay) -->
            </div>
            
            <div style="margin-left:24px;">
                ${upsellsHtml}
            </div>
        `;

        const varContainer = card.querySelector('.tn-pack-variants');
        // Solo mostrar variantes si existen Y tienen más de una opción real
        const hasRealVariants = variants && variants.length > 1;
        
        if (hasRealVariants) {
            varContainer.style.display = '';
            for (let i = 0; i < qty; i++) {
                const row = document.createElement('div');
                row.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:4px;";
                row.innerHTML = `<span style="font-size:12px; color:#666;">#${i + 1}</span>`;
                
                const select = document.createElement('select');
                select.className = 'tn-variant-select';
                select.style.cssText = "flex:1; padding:4px; border:1px solid #ddd; border-radius:4px; font-size:12px;";
                variants.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.id;
                    opt.textContent = v.name;
                    select.appendChild(opt);
                });
                row.appendChild(select);
                varContainer.appendChild(row);
            }
        } else {
            varContainer.style.display = 'none';
        }

        const upsellRows = card.querySelectorAll('.tn-upsell-row');
        upsellRows.forEach(upsellRow => {
            const upsellCheckbox = upsellRow.querySelector('.tn-upsell-checkbox');
            
            if (upsellRow && upsellCheckbox) {
                upsellRow.onclick = (e) => {
                    if (e.target !== upsellCheckbox) {
                        upsellCheckbox.checked = !upsellCheckbox.checked;
                        upsellCheckbox.dispatchEvent(new Event('change'));
                    }
                };

                upsellCheckbox.onchange = () => {
                    if (upsellCheckbox.checked) {
                        upsellRow.style.borderColor = primaryColor;
                        upsellRow.style.backgroundColor = '#fff0f6'; 
                    } else {
                        upsellRow.style.borderColor = '#ccc';
                        upsellRow.style.backgroundColor = '#f8f9fa';
                    }
                };
            }
        });

        container.appendChild(card);
      });

      const btn = document.createElement('button');
      btn.innerText = 'AGREGAR AL CARRITO';
      btn.style.cssText = `margin-top:12px; width:100%; padding:14px; border:none; border-radius:8px; background:${primaryColor}; color:#fff; font-size:14px; font-weight:bold; cursor:pointer; transition: all 0.2s;`;
      
      btn.onmouseover = () => btn.style.background = primaryHoverColor;
      btn.onmouseout = () => btn.style.background = primaryColor;
      
      btn.onclick = (e) => {
          e.preventDefault();
          handleAddToCart(config, variants);
      };

      container.appendChild(btn);
      productForm.parentNode.insertBefore(container, productForm);
      
      // --- OCULTAR BOTÓN ORIGINAL ---
      const originalBtn = document.querySelector('.js-prod-submit-form, .js-addtocart, input[type="submit"][value="Agregar al carrito"], .js-prod-submit-form input[type="submit"]');
      if (originalBtn) {
          originalBtn.style.visibility = 'hidden'; 
          originalBtn.style.position = 'absolute';
          originalBtn.style.opacity = '0';
          originalBtn.style.pointerEvents = 'none';
          originalBtn.style.height = '0';
          originalBtn.style.width = '0';
          originalBtn.style.padding = '0';
          originalBtn.style.margin = '0';
      }

      const radios = container.querySelectorAll('input[name="tn-selected-pack"]');
      const updateHighlight = () => {
          radios.forEach(r => {
              const c = r.closest('.tn-pack-card');
              const pack = config.packs.find(p => p.id === r.value);
              const isHighlighted = pack && pack.highlight;
              
              if(r.checked) {
                  c.style.border = `2px solid ${primaryColor}`;
                  // Agregar fondo sutil al seleccionado
                  const primaryRGB = hexToRGB(primaryColor);
                  c.style.backgroundColor = primaryRGB ? `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.08)` : `${primaryColor}15`;
              } else {
                  const defaultBorder = isHighlighted ? `2px solid ${primaryColor}` : `1px solid ${borderColor}`;
                  c.style.border = defaultBorder;
                  c.style.backgroundColor = backgroundColor;
              }
          });
      };
      radios.forEach(r => r.addEventListener('change', updateHighlight));
      updateHighlight();
  }

  // --- 3. LÓGICA DE COMPRA ---
  async function handleAddToCart(config, variants) {
      const selectedRadio = document.querySelector('input[name="tn-selected-pack"]:checked');
      if (!selectedRadio) return;

      const packId = selectedRadio.value;
      const pack = config.packs.find(p => p.id === packId);
      if(!pack) return;

      const btn = document.querySelector('#tn-bundle-widget button');
      const originalText = btn.innerText;
      btn.innerText = "Agregando...";
      btn.disabled = true;

      try {
          const packCard = selectedRadio.closest('.tn-pack-card');
          
          const itemsToProcess = [];
          const selects = packCard.querySelectorAll('select.tn-variant-select');
          
          if (selects.length > 0) {
              selects.forEach(select => {
                  let targetName = select.options[select.selectedIndex].text;
                  itemsToProcess.push({ name: targetName, qty: 1 });
              });
          } else {
              const activeBtn = document.querySelector('.js-insta-variant.selected, .btn-variant.selected');
              const name = activeBtn ? activeBtn.innerText.trim() : null; 
              itemsToProcess.push({ name: name, qty: pack.quantity });
          }

          // Agregar upsells seleccionados (siempre el producto original)
          const upsellCheckboxes = packCard.querySelectorAll('.tn-upsell-checkbox:checked');
          const couponCodes = [];
          
          for (const checkbox of upsellCheckboxes) {
              const upsellId = checkbox.getAttribute('data-id');
              const couponCode = checkbox.getAttribute('data-coupon');
              
              if (upsellId) {
                  console.log("[TN Bundles] ✅ Agregando upsell al carrito - ID:", upsellId);
                  await addUpsellToCart(upsellId);
                  
                  // Si tiene cupón asociado, guardarlo para aplicar después
                  if (couponCode && couponCode !== 'null' && couponCode !== 'undefined') {
                      couponCodes.push(couponCode);
                  }
                  
                  await new Promise(r => setTimeout(r, 300)); // Pequeña pausa entre upsells
              }
          }
          
          // Mostrar cupón al usuario para que lo aplique manualmente
          if (couponCodes.length > 0) {
              const uniqueCoupons = [...new Set(couponCodes)];
              showCouponNotification(uniqueCoupons[0]); // Mostrar el primer cupón único
          }

          for (let i = 0; i < itemsToProcess.length; i++) {
              const item = itemsToProcess[i];
              await robotClickAddToCart(item.name, item.qty);
              await new Promise(r => setTimeout(r, 600)); 
          }

          btn.innerText = "¡Listo!";
          
          setTimeout(() => { 
              const cartToggle = document.querySelector('.js-toggle-cart, .js-open-cart, #cart-link, a[aria-label="Carrito"]');
              if (cartToggle) {
                  console.log("[TN Bundles] Abriendo carrito...");
                  cartToggle.click();
              }
              btn.innerText = originalText; 
              btn.disabled = false;
          }, 1500);

      } catch (e) {
          console.error(e);
          btn.innerText = "Reintentar";
          setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
      }
  }

  async function addUpsellToCart(productId) {
      console.log("[TN Bundles] 🛒 Agregando producto upsell:", productId);
      
      try {
          const formData = new FormData();
          formData.append('add_to_cart', productId);
          formData.append('quantity', 1);
          
          const addResponse = await fetch('/cart/add', {
              method: 'POST',
              body: formData
          });
          
          if (addResponse.ok) {
              console.log("[TN Bundles] ✅ Upsell agregado al carrito");
          } else {
              console.error("[TN Bundles] ❌ Error:", await addResponse.text());
          }
          
          return addResponse;
      } catch (error) {
          console.error("[TN Bundles] ❌ Error agregando al carrito:", error);
      }
  }

  function showCouponNotification(couponCode) {
      // Crear notificación visual para que el usuario copie el cupón
      const notification = document.createElement('div');
      notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 99999;
          max-width: 400px;
          text-align: center;
          animation: slideIn 0.3s ease;
      `;
      
      notification.innerHTML = `
          <div style="font-size: 20px; margin-bottom: 12px;">🎉 ¡Descuento Disponible!</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 16px;">Usa este cupón en el carrito:</div>
          <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 16px; font-family: monospace;">
              ${couponCode}
          </div>
          <button onclick="navigator.clipboard.writeText('${couponCode}'); this.innerText='✅ Copiado!';" 
                  style="background: #e91e63; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 8px; font-weight: bold;">
              📋 Copiar Cupón
          </button>
          <button onclick="this.parentElement.remove()" 
                  style="background: #ddd; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Cerrar
          </button>
      `;
      
      document.body.appendChild(notification);
      
      // Auto cerrar después de 10 segundos
      setTimeout(() => {
          if (notification.parentElement) {
              notification.remove();
          }
      }, 10000);
  }

  async function applyCoupon(couponCode) {
      try {
          // Método 1: Usar la API AJAX de Tiendanube si está disponible
          if (window.LS && window.LS.cart && typeof window.LS.cart.applyCoupon === 'function') {
              try {
                  await window.LS.cart.applyCoupon(couponCode);
                  console.log(`[TN Bundles] ✅ Cupón aplicado (LS API): ${couponCode}`);
                  return true;
              } catch (e) {
                  console.warn(`[TN Bundles] API LS falló:`, e);
              }
          }
          
          // Método 2: POST a /cart/coupon
          const formData = new FormData();
          formData.append('code', couponCode);
          
          let response = await fetch('/cart/coupon', { 
              method: 'POST', 
              body: formData,
              headers: {
                  'X-Requested-With': 'XMLHttpRequest'
              }
          });
          
          if (response.ok) {
              console.log(`[TN Bundles] ✅ Cupón aplicado (POST): ${couponCode}`);
              return true;
          }
          
          // Método 3: Intentar actualizar el carrito con cupón
          const cartData = new FormData();
          cartData.append('update', '1');
          cartData.append('coupon', couponCode);
          
          response = await fetch('/cart', {
              method: 'POST',
              body: cartData
          });
          
          if (response.ok) {
              console.log(`[TN Bundles] ✅ Cupón aplicado (UPDATE): ${couponCode}`);
              return true;
          }
          
          // Método 4: Guardar para aplicar al abrir carrito
          sessionStorage.setItem('tn_pending_coupon', couponCode);
          console.log(`[TN Bundles] 📝 Cupón guardado para aplicar al abrir carrito: ${couponCode}`);
          
          return false;
      } catch (e) {
          console.error(`[TN Bundles] Error aplicando cupón:`, e);
          sessionStorage.setItem('tn_pending_coupon', couponCode);
          return false;
      }
  }

  async function robotClickAddToCart(targetName, qty) {
      console.log(`[TN Bundles] Robot: Intentando agregar "${targetName}" x${qty}`);

      if (targetName) {
          const visualButtons = Array.from(document.querySelectorAll('.js-insta-variant, .btn-variant, .variant-label, label'));
          const buttonToClick = visualButtons.find(b => {
              const txt = b.innerText.trim().toLowerCase();
              return txt === targetName.trim().toLowerCase();
          });

          if (buttonToClick) {
              buttonToClick.click();
              const inner = buttonToClick.querySelector('input');
              if(inner) inner.click();
              await new Promise(r => setTimeout(r, 200)); 
          }
      }

      const qtyInput = document.querySelector('input[name="quantity"]');
      if (qtyInput) {
          qtyInput.value = qty;
          qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const buyBtn = document.querySelector('.js-prod-submit-form, .js-addtocart, input[type="submit"][value="Agregar al carrito"]');
      if (buyBtn) {
          buyBtn.click();
      } else {
          console.error("[TN Bundles] No encontré el botón de compra original.");
      }
  }

})();