// src/customers/customers.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.createCustomer(body);
  }

  @Get()
  search(@Query('search') search?: string) {
    return this.customersService.searchCustomers(search);
  }
}