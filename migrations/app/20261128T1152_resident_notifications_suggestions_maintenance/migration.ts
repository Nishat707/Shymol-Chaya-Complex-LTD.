#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1db16a860df7a2e17240d9010512090ba3ff71752ef3764b2cd82f1356b430cf/contract';
import startContract from '../../snapshots/1db16a860df7a2e17240d9010512090ba3ff71752ef3764b2cd82f1356b430cf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/655584a5eb21117f201f3d9815f9ef5753b5394d31c8f8a15b10f81736f34f16/contract';
import endContract from '../../snapshots/655584a5eb21117f201f3d9815f9ef5753b5394d31c8f8a15b10f81736f34f16/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'MaintenanceCategory',
        members: [
          'PLUMBING',
          'ELECTRICAL',
          'ELEVATOR',
          'CLEANING',
          'SECURITY',
          'COMMON_AREA',
          'OTHER',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'NoticeCategory',
        members: ['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'PAYMENT_REMINDER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'NotificationType',
        members: ['NOTICE', 'PAYMENT', 'CHARGE', 'SUGGESTION', 'MAINTENANCE', 'SYSTEM'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'RequestStatus',
        members: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'SuggestionCategory',
        members: ['MAINTENANCE', 'SECURITY', 'CLEANLINESS', 'MANAGEMENT', 'OTHER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'SuggestionStatus',
        members: ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      }),
      this.createTable({
        schema: 'public',
        table: 'MaintenanceRequest',
        columns: [
          col('adminComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('category', '"MaintenanceCategory"', {
            notNull: true,
            default: lit('OTHER'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'MaintenanceCategory' } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('flatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('residentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"RequestStatus"', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RequestStatus' } },
          }),
          col('submittedAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Notification',
        columns: [
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('href', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('readAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('recipientEmail', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', '"NotificationType"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'NotificationType' } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ResidentSuggestion',
        columns: [
          col('adminResponse', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('category', '"SuggestionCategory"', {
            notNull: true,
            default: lit('OTHER'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'SuggestionCategory' } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('flatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priority', '"Priority"', {
            notNull: true,
            default: lit('NORMAL'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Priority' } },
          }),
          col('residentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"SuggestionStatus"', {
            notNull: true,
            default: lit('SUBMITTED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'SuggestionStatus' } },
          }),
          col('submittedAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'FlatResident',
        column: col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'FlatResident',
        column: col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Notice',
        column: col('category', '"NoticeCategory"', {
          notNull: true,
          default: lit('GENERAL'),
          codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'NoticeCategory' } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Notice',
        column: col('pinned', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'MaintenanceRequest',
        index: 'MaintenanceRequest_flatId_idx',
        columns: ['flatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MaintenanceRequest',
        index: 'MaintenanceRequest_residentId_idx',
        columns: ['residentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MaintenanceRequest',
        index: 'MaintenanceRequest_status_idx',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_recipientEmail_idx',
        columns: ['recipientEmail'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_recipientEmail_readAt_idx',
        columns: ['recipientEmail', 'readAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ResidentSuggestion',
        index: 'ResidentSuggestion_flatId_idx',
        columns: ['flatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ResidentSuggestion',
        index: 'ResidentSuggestion_residentId_idx',
        columns: ['residentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ResidentSuggestion',
        index: 'ResidentSuggestion_status_idx',
        columns: ['status'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
