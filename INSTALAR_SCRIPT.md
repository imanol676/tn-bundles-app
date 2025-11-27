# Instalación Manual del Script

## Opción 1: Desde la Consola del Navegador

1. Ve al admin de tu app: https://tn-bundles-af9iu731q-imanolkremis505-4614s-projects.vercel.app/admin.html?store_id=6973970&product_id=123

2. Abre la consola del navegador (F12)

3. Pega este código y presiona Enter:

```javascript
fetch('/admin/install-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store_id: 6973970 })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

4. Deberías ver en la consola: `{ success: true, scriptId: XXX, message: '...' }`

5. Ve a una página de producto en tu tienda y refresca (F5)

6. En la consola deberías ver: `[TN Bundles] 🚀 Iniciando Widget v16`

---

## Opción 2: Usando cURL (PowerShell)

Ejecuta en PowerShell:

```powershell
$body = @{ store_id = 6973970 } | ConvertTo-Json
Invoke-RestMethod -Uri "https://tn-bundles-af9iu731q-imanolkremis505-4614s-projects.vercel.app/admin/install-script" -Method Post -Body $body -ContentType "application/json"
```

---

## Verificar que el script está instalado

Ejecuta en PowerShell:

```powershell
$headers = @{
    "Authentication" = "bearer 4ae9116317598bd89083a3bd755ef6059652e7a48a3f1da1"
    "User-Agent" = "TN Bundles App"
}
Invoke-RestMethod -Uri "https://api.tiendanube.com/v1/6973970/scripts" -Headers $headers | ConvertTo-Json
```

Deberías ver un script con `src` apuntando a `widget.js`.
