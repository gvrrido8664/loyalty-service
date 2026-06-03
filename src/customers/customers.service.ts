// src/customers/customers.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(data: { name: string; email?: string; phone?: string; dni?: string }) {
    // Si envían un email, verificamos que no exista previamente en la BD
    if (data.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        // Lanzamos un error HTTP 409 (Conflict) estándar en APIs
        throw new ConflictException('El correo ya está registrado en el sistema.');
      }
    }

    return this.prisma.customer.create({ data });
  }

  async searchCustomers(searchTerm?: string) {
    if (!searchTerm) {
      // Si no buscan nada, devolvemos los últimos 50 por defecto.
      return this.prisma.customer.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Buscamos coincidencias parciales (LIKE) en nombre, email o DNI
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { dni: { contains: searchTerm } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}