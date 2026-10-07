import { openDatabase } from '../open';
import migrations from './migrations';
import * as schema from './schema';

export { schema, migrations };
export * from './schema';

export const NUNI_DB_FILE = 'nuni.db';

export function openNuniDatabase() {
  return openDatabase(NUNI_DB_FILE, schema);
}
