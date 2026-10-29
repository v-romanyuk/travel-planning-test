import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/services/drizzle/schema.ts',
  out: './drizzle-out',
  dialect: 'postgresql',
  casing: 'snake_case',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL!
  }
})
