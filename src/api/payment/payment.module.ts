import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../../core';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CustomJwtModule } from 'src/infrastructure';
import { DebtModule } from '../debt/debt.module';
import { DebtorModule } from '../debtors/debtor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    DebtModule,
    DebtorModule,
    CustomJwtModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
