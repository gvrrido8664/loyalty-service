# API de clientes

Proyecto personal de **Ignacio Garrido**, Ingeniero en Informática titulado. Desarrollo propio de la aplicación; librerías, plantillas, datos e imágenes de terceros conservan su autoría.

NestJS, TypeScript, Prisma y SQLite/libSQL. Implementa creación de clientes y búsqueda por nombre, correo o DNI. Valida los DTO y devuelve 409 al repetir un correo. **No incluye puntos, recompensas ni campañas de fidelización.**

## Instalación y demo
Node 22.12+:
```powershell
npm ci
npx prisma generate
npm run build
node demo.mjs
```
La demo crea una SQLite temporal con un cliente ficticio, arranca la API solo en 127.0.0.1:3012 y comprueba creación (201), duplicado (409), datos inválidos (400) y búsqueda persistida. Después detiene la API y retira únicamente su base temporal. Resultado en `demo-result.json`.

## Desarrollo normal
```powershell
npx prisma db push
npm run start:dev
```
Por defecto usa `file:./dev.db`. Para otra base define `DATABASE_URL` en el entorno; no hay carga automática de `.env`. Puerto por defecto 3000, configurable mediante `PORT`. Escucha solo en localhost.

```http
POST /customers
Content-Type: application/json

{"name":"Cliente Sintético","email":"demo@example.com","dni":"DEMO-001"}

GET /customers?search=DEMO-001
```

## Verificación y límites
Build e integración de la demo comprobados. En este Windows `prisma db push` produjo un error de schema engine; la demo inicializa exclusivamente su tabla temporal con la dependencia libSQL ya instalada y comprueba el servicio Prisma real. El esquema sigue definido en `prisma/schema.prisma`.

No hay autenticación ni autorización en esta API; úsala como demostración local. La búsqueda sin término devuelve los últimos 50 clientes. El DNI de la demo es ficticio y no valida documentos chilenos. Antes de ampliar uso se necesita resolver autenticación, paginación y el conflicto de creación concurrente de correos.

English: a focused customer API demonstrating DTO validation, unique email handling and persistent search, with a disposable local integration demo.
