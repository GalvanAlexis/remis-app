import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('debug/log')
  logMobileError(@Body() body: any) {
    console.log('\n\n🔴🔴🔴 [MOBILE ERROR REPORT 🔴🔴🔴');
    console.log(JSON.stringify(body, null, 2));
    console.log('--------------------------------------------------\n\n');
    return { received: true };
  }
}
