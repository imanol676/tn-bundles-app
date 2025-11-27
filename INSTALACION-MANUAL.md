# Instalación Manual del Widget

Ya que Tiendanube no permite instalar scripts con URL personalizada desde la API, necesitas agregarlo manualmente al tema.

## Pasos:

1. **Ve al panel de tu tienda** → Diseño → Personalizar tema

2. **Abre el editor de código** (botón "Editar código HTML/CSS")

3. **Busca el archivo `product.tpl` o `theme.tpl`** (dependiendo del tema)

4. **Agrega este código ANTES de la etiqueta `</body>`:**

```html
<script src="https://tn-bundles-app.vercel.app/widget.js"></script>
```

5. **Guarda los cambios**

6. **Ve a una página de producto** y refresca (F5)

7. **Abre la consola** (F12) y deberías ver:
   ```
   [TN Bundles] 🚀 Iniciando Widget v17 (onfirstinteraction compatible)...
   ```

## Verificar que funciona:

- El widget debería aparecer debajo del selector de variantes
- Deberías ver los packs configurados en el admin
- El botón original "Agregar al carrito" debe estar oculto

---

## Acceso al Admin para configurar productos:

```
https://tn-bundles-app.vercel.app/admin.html?store_id=6973970&product_id=TU_PRODUCTO_ID
```

Reemplaza `TU_PRODUCTO_ID` con el ID del producto que quieres configurar.
