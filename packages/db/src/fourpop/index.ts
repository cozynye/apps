import { openDatabase } from '../open';
import migrations from './migrations';
import * as schema from './schema';

export { schema, migrations };
export * from './schema';

export const FOURPOP_DB_FILE = 'fourpop.db';

export function openFourpopDatabase() {
  return openDatabase(FOURPOP_DB_FILE, schema);
}
