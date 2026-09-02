import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startsAt: text('starts_at').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const songs = sqliteTable(
  'songs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    artist: text('artist').notNull().default(''),
    language: text('language').notNull().default(''),
    category: text('category').notNull().default(''),
    key: text('key').notNull().default(''),
    notes: text('notes').notNull().default(''),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_songs_enabled_title').on(table.enabled, table.title)],
);

export const requests = sqliteTable(
  'requests',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull(),
    songId: integer('song_id'),
    customTitle: text('custom_title').notNull().default(''),
    customArtist: text('custom_artist').notNull().default(''),
    nickname: text('nickname').notNull(),
    message: text('message').notNull().default(''),
    status: text('status').notNull().default('new'),
    priority: integer('priority').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_requests_event_status_created').on(table.eventId, table.status, table.createdAt),
    index('idx_requests_song_id').on(table.songId),
  ],
);

export const performances = sqliteTable(
  'performances',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull(),
    songId: integer('song_id'),
    requestId: text('request_id'),
    title: text('title').notNull(),
    artist: text('artist').notNull().default(''),
    performedAt: text('performed_at').notNull(),
  },
  (table) => [index('idx_performances_event_date').on(table.eventId, table.performedAt)],
);

export const performanceRequests = sqliteTable(
  'performance_requests',
  {
    performanceId: text('performance_id').notNull(),
    requestId: text('request_id').notNull(),
  },
  (table) => [
    index('idx_performance_requests_performance').on(table.performanceId),
    index('idx_performance_requests_request').on(table.requestId),
  ],
);
