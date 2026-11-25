#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1db16a860df7a2e17240d9010512090ba3ff71752ef3764b2cd82f1356b430cf/contract';
import endContract from '../../snapshots/1db16a860df7a2e17240d9010512090ba3ff71752ef3764b2cd82f1356b430cf/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'ExpenseStatus',
        members: ['RECORDED', 'PAID', 'VOID'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Occupancy',
        members: ['OCCUPIED', 'VACANT'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'PayMethod',
        members: ['CASH', 'BANK_TRANSFER', 'MOBILE_FINANCIAL_SERVICE', 'OTHER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Priority',
        members: ['NORMAL', 'IMPORTANT', 'URGENT'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Role',
        members: ['SUPER_ADMIN', 'MANAGER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'TaskStatus',
        members: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      }),
      this.createTable({
        schema: 'public',
        table: 'AuditLog',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('after', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('at', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('before', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('entity', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entityId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ChargeSetting',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('effectiveFrom', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Counter',
        columns: [
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('value', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Expense',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('categoryId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('createdById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('expenseDate', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', '"PayMethod"', {
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'PayMethod' } },
          }),
          col('paidOn', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('receiptUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"ExpenseStatus"', {
            notNull: true,
            default: lit('RECORDED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'ExpenseStatus' } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('vendor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voidReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ExpenseCategory',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Flat',
        columns: [
          col('customCharge', 'numeric(12,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('floor', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('occupancy', '"Occupancy"', {
            notNull: true,
            default: lit('OCCUPIED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Occupancy' } },
          }),
          col('ownerName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tenantName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'FlatResident',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('flatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MaintenanceTask',
        columns: [
          col('actualCost', 'numeric(12,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('assignee', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('completedOn', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('estimatedCost', 'numeric(12,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('expectedEnd', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('expenseId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('status', '"TaskStatus"', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'TaskStatus' } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MonthClose',
        columns: [
          col('closedAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('closedById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('month', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['month'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MonthlyCharge',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('flatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('month', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('waived', 'numeric(12,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('waiverNote', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Notice',
        columns: [
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priority', '"Priority"', {
            notNull: true,
            default: lit('NORMAL'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Priority' } },
          }),
          col('publishedAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Payment',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('createdById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('flatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', '"PayMethod"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'PayMethod' } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proofUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('receiptNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedOn', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voidReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voidedAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PaymentAllocation',
        columns: [
          col('amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('chargeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paymentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Setting',
        columns: [
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('permissions', 'jsonb', {
            notNull: true,
            default: lit({}),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('role', '"Role"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Role' } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_entity_entityId_idx',
        columns: ['entity', 'entityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Expense',
        index: 'Expense_expenseDate_idx',
        columns: ['expenseDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Expense',
        index: 'Expense_status_idx',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ExpenseCategory',
        index: 'ExpenseCategory_name_key',
        columns: ['name'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Flat',
        index: 'Flat_floor_idx',
        columns: ['floor'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Flat',
        index: 'Flat_number_key',
        columns: ['number'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'FlatResident',
        index: 'FlatResident_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'MonthlyCharge',
        index: 'MonthlyCharge_flatId_month_key',
        columns: ['flatId', 'month'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'MonthlyCharge',
        index: 'MonthlyCharge_month_idx',
        columns: ['month'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Payment',
        index: 'Payment_flatId_idx',
        columns: ['flatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Payment',
        index: 'Payment_receiptNo_key',
        columns: ['receiptNo'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Payment',
        index: 'Payment_receivedOn_idx',
        columns: ['receivedOn'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PaymentAllocation',
        index: 'PaymentAllocation_chargeId_idx',
        columns: ['chargeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Expense',
        foreignKey: {
          name: 'Expense_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'ExpenseCategory', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FlatResident',
        foreignKey: {
          name: 'FlatResident_flatId_fkey',
          columns: ['flatId'],
          references: { schema: 'public', table: 'Flat', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MaintenanceTask',
        foreignKey: {
          name: 'MaintenanceTask_expenseId_fkey',
          columns: ['expenseId'],
          references: { schema: 'public', table: 'Expense', columns: ['id'] },
          onDelete: 'setNull',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MonthlyCharge',
        foreignKey: {
          name: 'MonthlyCharge_flatId_fkey',
          columns: ['flatId'],
          references: { schema: 'public', table: 'Flat', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_flatId_fkey',
          columns: ['flatId'],
          references: { schema: 'public', table: 'Flat', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PaymentAllocation',
        foreignKey: {
          name: 'PaymentAllocation_paymentId_fkey',
          columns: ['paymentId'],
          references: { schema: 'public', table: 'Payment', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PaymentAllocation',
        foreignKey: {
          name: 'PaymentAllocation_chargeId_fkey',
          columns: ['chargeId'],
          references: { schema: 'public', table: 'MonthlyCharge', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
