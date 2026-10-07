import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/fourpop/schema.ts',
  out: './drizzle/fourpop',
});
