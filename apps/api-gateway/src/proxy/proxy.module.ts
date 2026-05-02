import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JobProxyController } from './job-proxy.controller';
import { UserProxyController } from './user-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [JobProxyController, UserProxyController],
})
export class ProxyModule {}
