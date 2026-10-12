import { bundledManifest, buildCatalog, loadRemoteManifest } from '@nf/content';
import { newId, type MigrationResult } from '@nf/db';
import { entries, entryTags, photos, tags } from '@nf/db/nuni';
import { toLocalDateString } from '@nf/i18n';
import { Button, Card, Screen, space, Text } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { count, eq } from 'drizzle-orm';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { db, initDatabase, sqlite } from '../../src/db';

// Dev-only: exercises @nf/db (migrations, FK cascade) and @nf/content (manifest catalog).
export default function DevData() {
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((l) => [...l, line]);

  async function runDb() {
    const result: MigrationResult = await initDatabase();
    append(`migrate: ${result.status} v${result.schemaVersion}`);
    if (result.status !== 'ok') return;

    const now = Date.now();
    const entryId = newId();
    const tagId = newId();
    await db.insert(tags).values({ id: tagId, customName: 'dev', icon: 'Moon', sortOrder: 99 });
    await db.insert(entries).values({ id: entryId, date: toLocalDateString(new Date()), mood: 4, createdAt: now, updatedAt: now });
    await db.insert(entryTags).values({ entryId, tagId });
    await db.insert(photos).values({ id: newId(), entryId, fileName: 'x.jpg', sortOrder: 0 });
    try {
      await db.insert(entries).values({ id: newId(), date: '2026-10-07', mood: 9, createdAt: now, updatedAt: now });
      append('CHECK mood 9: NOT rejected (bad)');
    } catch {
      append('CHECK mood 9: rejected (ok)');
    }
    await db.delete(entries).where(eq(entries.id, entryId));
    const [left] = await db.select({ n: count() }).from(photos).where(eq(photos.entryId, entryId));
    const [links] = await db.select({ n: count() }).from(entryTags).where(eq(entryTags.entryId, entryId));
    append(`cascade: photos ${left?.n}, entry_tags ${links?.n} (expect 0, 0)`);
    await db.delete(tags).where(eq(tags.id, tagId));
    const fk = sqlite.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    const wal = sqlite.getFirstSync<{ journal_mode: string }>('PRAGMA journal_mode');
    append(`pragma: foreign_keys=${fk?.foreign_keys} journal_mode=${wal?.journal_mode}`);
  }

  async function runContent() {
    const loaded = await loadRemoteManifest(process.env.EXPO_PUBLIC_CDN_BASE_URL, (e) => append(`manifest error: ${e.message}`));
    const catalog = buildCatalog({
      bundled: bundledManifest,
      remote: loaded.remote,
      installed: [],
      appVersion: nativeApplicationVersion ?? '0.0.0',
    });
    append(`manifest: ${loaded.source}, packs ${catalog.packs.map((p) => `${p.id}(${p.items.length})`).join(', ')}`);
  }

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Button testID="dev.data.db" label="Run DB check" onPress={() => void runDb().catch((e: Error) => append(`db error: ${e.message}`))} />
        <Button testID="dev.data.content" variant="secondary" label="Run content check" onPress={() => void runContent()} />
        <Card testID="dev.data.log">
          {log.map((line, i) => (
            <Text key={i} variant="bodySm">
              {line}
            </Text>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: space[3], paddingVertical: space[6] } });
