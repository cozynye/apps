import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/nuni/schema.ts',
  out: './drizzle/nuni',
});
