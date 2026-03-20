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
    const { type, message } = body;
    let icon = '⚪'; // Log por defecto
    if (type === 'ERROR' || type === 'FATAL') icon = '🔴';
    if (type === 'WARN') icon = '🟡';

    console.log(`\n\n${icon}${icon}${icon} [MOBILE ${type} REPORT] ${icon}${icon}${icon}`);
    console.log(JSON.stringify(body, null, 2));
    console.log('--------------------------------------------------\n\n');
    return { received: true };
  }
}
