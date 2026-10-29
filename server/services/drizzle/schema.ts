import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'

import type { TCatalogueAttributes } from '~~/server/types/catalogue/CatalogueAttributes'
import type { TCitedFact } from '~~/shared/schemas/trips/CitedFactSchema'
import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'
import type { TTransportDetails } from '~~/shared/schemas/trips/TransportDetailsSchema'
import type { TUnverifiedFact } from '~~/shared/schemas/trips/UnverifiedFactSchema'
import type { TCity } from '~~/shared/schemas/cities/CitySchema'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()

// RLS on with no policies: the Supabase Data API can't read these tables; the server connects as the owner
export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  subId: uuid().notNull().unique().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: varchar({ length: 320 }).notNull().unique(),
  fullName: varchar({ length: 200 }).notNull(),
  homeCity: jsonb().notNull().$type<TCity>(),
  createdAt: createdAt()
}).enableRLS()

export const peopleTable = pgTable('people', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  role: varchar({ length: 20 }).notNull(),
  // null for the traveller: their name is users.full_name
  name: varchar({ length: 100 }),
  createdAt: createdAt()
}, t => [
  index('people_user_id_idx').on(t.userId),
  uniqueIndex('people_user_id_traveller_unique').on(t.userId).where(sql`${t.role} = 'traveller'`)
]).enableRLS()

export const profileFactsTable = pgTable('profile_facts', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  // null = the party
  subjectPersonId: uuid().references(() => peopleTable.id, { onDelete: 'cascade' }),
  kind: varchar({ length: 30 }).notNull(),
  domain: varchar({ length: 20 }).notNull(),
  value: text().notNull(),
  ruleStatus: varchar({ length: 20 }).notNull(),
  rule: jsonb().$type<TRule>(),
  ruleSummary: text(),
  ruleNote: text(),
  createdAt: createdAt(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [
  index('profile_facts_user_id_idx').on(t.userId)
]).enableRLS()

export const catalogueEntriesTable = pgTable('catalogue_entries', {
  id: uuid().primaryKey().defaultRandom(),
  ref: varchar({ length: 32 }).notNull().unique(),
  kind: varchar({ length: 20 }).notNull(),
  // GeoNames id (= TCity.id); for transport, the departure city
  cityId: integer().notNull(),
  cityName: varchar({ length: 100 }).notNull(),
  name: varchar({ length: 200 }).notNull(),
  description: text().notNull(),
  priceAmount: numeric({ precision: 10, scale: 2, mode: 'number' }),
  priceCurrency: char({ length: 3 }),
  priceUnit: varchar({ length: 20 }),
  attributes: jsonb().notNull().$type<TCatalogueAttributes>()
}, t => [
  index('catalogue_entries_kind_city_id_idx').on(t.kind, t.cityId)
]).enableRLS()

export const tripsTable = pgTable('trips', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  origin: jsonb().notNull().$type<TCity>(),
  destination: jsonb().notNull().$type<TCity>(),
  startDate: date().notNull(),
  // inclusive
  endDate: date().notNull(),
  notes: text(),
  // The traveller's IANA zone at request time: "today" and "now" when planning
  timeZone: varchar({ length: 64 }).notNull().default('UTC'),
  status: varchar({ length: 20 }).notNull(),
  failureReason: text(),
  whatsappNumber: varchar({ length: 20 }),
  whatsappOptIn: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
}, t => [
  index('trips_user_id_idx').on(t.userId)
]).enableRLS()

export const tripTravellersTable = pgTable('trip_travellers', {
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  personId: uuid().notNull().references(() => peopleTable.id, { onDelete: 'restrict' })
}, t => [
  primaryKey({ columns: [t.tripId, t.personId] }),
  index('trip_travellers_person_id_idx').on(t.personId)
]).enableRLS()

export const tripDaysTable = pgTable('trip_days', {
  id: uuid().primaryKey().defaultRandom(),
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  position: integer().notNull(),
  date: date().notNull(),
  title: varchar({ length: 200 }),
  note: text(),
  titleSetByTraveller: boolean().notNull().default(false)
}, t => [
  uniqueIndex('trip_days_trip_id_date_unique').on(t.tripId, t.date),
  uniqueIndex('trip_days_trip_id_position_unique').on(t.tripId, t.position)
]).enableRLS()

export const tripItemsTable = pgTable('trip_items', {
  id: uuid().primaryKey().defaultRandom(),
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  dayId: uuid().notNull().references(() => tripDaysTable.id, { onDelete: 'cascade' }),
  position: integer().notNull(),
  kind: varchar({ length: 20 }).notNull(),
  catalogueEntryId: uuid().notNull().references(() => catalogueEntriesTable.id),
  // catalogue ref — the item's source of fact
  source: varchar({ length: 32 }).notNull(),
  name: varchar({ length: 200 }).notNull(),
  time: time().notNull(),
  endTime: time(),
  priceAmount: numeric({ precision: 10, scale: 2, mode: 'number' }),
  priceCurrency: char({ length: 3 }),
  priceUnit: varchar({ length: 20 }),
  transport: jsonb().$type<TTransportDetails>(),
  why: text().notNull(),
  citedFacts: jsonb().notNull().$type<TCitedFact[]>().default([]),
  status: varchar({ length: 20 }).notNull(),
  note: text(),
  removedAt: timestamp({ withTimezone: true })
}, t => [
  index('trip_items_trip_id_idx').on(t.tripId),
  // Removed items keep their slot until the next plan replaces the rest, so only live items need unique positions
  uniqueIndex('trip_items_day_id_position_unique').on(t.dayId, t.position).where(sql`${t.removedAt} is null`)
]).enableRLS()

export const tripGapsTable = pgTable('trip_gaps', {
  id: uuid().primaryKey().defaultRandom(),
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  date: date(),
  kind: varchar({ length: 20 }).notNull(),
  reason: varchar({ length: 30 }).notNull(),
  facts: jsonb().notNull().$type<TCitedFact[]>().default([])
}, t => [
  index('trip_gaps_trip_id_idx').on(t.tripId)
]).enableRLS()

export const tripMessagesTable = pgTable('trip_messages', {
  id: uuid().primaryKey().defaultRandom(),
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  author: varchar({ length: 20 }).notNull(),
  kind: varchar({ length: 20 }).notNull(),
  body: text().notNull(),
  createdAt: createdAt(),
  // Messages written in one transaction share createdAt (now() is the tx start); this keeps their insert order
  seq: bigint({ mode: 'number' }).generatedAlwaysAsIdentity()
}, t => [
  index('trip_messages_trip_id_created_at_idx').on(t.tripId, t.createdAt)
]).enableRLS()

export const tripRunsTable = pgTable('trip_runs', {
  id: uuid().primaryKey().defaultRandom(),
  tripId: uuid().notNull().references(() => tripsTable.id, { onDelete: 'cascade' }),
  status: varchar({ length: 20 }).notNull(),
  failureReason: text(),
  // last plan accepted by save_plan
  draftPlan: jsonb().$type<TSavedPlan>(),
  rejections: integer().notNull().default(0),
  exclusions: jsonb().notNull().$type<TRunExclusion[]>().default([]),
  unverifiedFacts: jsonb().notNull().$type<TUnverifiedFact[]>().default([]),
  startedAt: timestamp({ withTimezone: true }),
  finishedAt: timestamp({ withTimezone: true }),
  // WhatsApp outcome; null while the run is open and on runs that finished before it was tracked
  notificationStatus: varchar({ length: 20 }),
  // Twilio message SID when sent, the error reference when failed
  notificationRef: varchar({ length: 64 }),
  notifiedAt: timestamp({ withTimezone: true }),
  createdAt: createdAt()
}, t => [
  index('trip_runs_trip_id_created_at_idx').on(t.tripId, t.createdAt)
]).enableRLS()
