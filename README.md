# TN Bundles App

Aplicación de Bundles para Tiendanube que permite crear packs con descuentos y upsells.

## Características

- 🎁 **Packs con descuentos**: Crea hasta 3 packs por producto (ej: Pack x2, Pack x3)
- 💰 **Descuentos progresivos**: Porcentaje o monto fijo
- ⬆️ **Upsells**: Hasta 2 productos relacionados con descuentos opcionales
- 🎫 **Cupones automáticos**: Genera cupones para descuentos en upsells
- 📱 **Widget responsive**: Se adapta al diseño de cualquier tienda
- ⚙️ **Configuración por producto**: Cada producto tiene su configuración única

## Instalación

### Variables de Entorno

Crea un archivo `.env` con:

```env
PORT=4000
TN_CLIENT_ID=tu_client_id
TN_CLIENT_SECRET=tu_client_secret
APP_BASE_URL=https://tu-dominio.vercel.app
TN_ACCESS_TOKEN=tu_access_token
```

### Desarrollo Local

```bash
npm install
npm run dev
```

### Deploy en Vercel

1. Conecta tu repositorio en Vercel
2. Configura las variables de entorno
3. Deploy automático

## Uso

1. Instala la app en tu tienda Tiendanube
2. Ve al admin: `/admin.html?store_id=TU_STORE_ID&product_id=PRODUCTO_ID`
3. Configura packs y upsells
4. El widget aparecerá automáticamente en las páginas de producto

## Tecnologías

- Node.js + Express + TypeScript
- Tiendanube API v1
- Vanilla JavaScript para el widget
