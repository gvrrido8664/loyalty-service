import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: 'file:./dev.db' }),
});

// Función sencilla para capitalizar nombres (ej: "TOMAS" -> "Tomas")
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

async function main() {
  const results: any[] = [];
  const csvPath = path.join(__dirname, 'customers.csv');

  console.log('Leyendo el archivo CSV...');

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`CSV cargado. Procesando ${results.length} clientes...`);

      for (const row of results) {
        // 1. Limpieza del nombre
        const rawName = row.name ? row.name.trim() : 'Sin Nombre';
        const cleanName = toTitleCase(rawName);
        
        // 2. Limpieza y validación básica del email
        let cleanEmail = row.email ? row.email.trim().toLowerCase() : null;
        // Si el email no tiene '@' o es basura como '________', lo dejamos nulo
        if (cleanEmail && (!cleanEmail.includes('@') || cleanEmail.includes('___'))) {
          cleanEmail = null;
        }

        // 3. Limpieza del teléfono (quitar espacios)
        let cleanPhone = row.phone ? row.phone.replace(/\s+/g, '') : null;
        // Si dice "sin telefono" o puras letras, lo dejamos nulo
        if (cleanPhone && !cleanPhone.startsWith('+') && !cleanPhone.match(/^\d/)) {
          cleanPhone = null;
        }

        // 4. Limpieza del DNI
        const cleanDni = row.dni && row.dni.trim() !== '' ? row.dni.trim() : null;

        // 5. Inserción en la BD
        try {
          if (cleanEmail) {
            // Si tiene email válido, usamos UPSERT para evitar duplicados del CSV
            await prisma.customer.upsert({
              where: { email: cleanEmail },
              update: {
                name: cleanName,
                phone: cleanPhone,
                dni: cleanDni,
              },
              create: {
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                dni: cleanDni,
              },
            });
          } else {
            // Si no tiene email, lo creamos como un cliente aislado
            await prisma.customer.create({
              data: {
                name: cleanName,
                email: null,
                phone: cleanPhone,
                dni: cleanDni,
              }
            });
          }
        } catch (error) {
          console.error(`Error al guardar a ${cleanName}:`, error);
        }
      }
      
      console.log('¡Base de datos poblada exitosamente! Ya podemos armar la API.');
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });