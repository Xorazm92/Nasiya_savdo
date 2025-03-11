import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity, PaymentType } from '../../common';
import { DebtEntity } from './';

@Entity('payment')
export class PaymentEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'debt_id' })
  debt_id: string;

  @Column({ type: 'decimal', name: 'sum' })
  sum: number;

  @Column({
    type: 'timestamp',
    name: 'date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.ONE_MONTH })
  type: PaymentType;

  @ManyToOne(() => DebtEntity, (debt) => debt.payments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'debt_id' })
  debt: DebtEntity;
}
