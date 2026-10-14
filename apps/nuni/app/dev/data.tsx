import { bundledManifest, buildCatalog, loadRemoteManifest } from '@nf/content';
import { newId, type MigrationResult } from '@nf/db';
import { entries, entryTags, photos, tags } from '@nf/db/nuni';
import { toLocalDateString } from '@nf/i18n';
import { Button, Card, Screen, space, Text } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { count, eq } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays } from '../../src/dates';
import { db, initDatabase, sqlite } from '../../src/db';
import { saveEntry } from '../../src/entries';

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
    await db
      .insert(entries)
      .values({ id: entryId, date: toLocalDateString(new Date()), mood: 4, createdAt: now, updatedAt: now });
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
    const loaded = await loadRemoteManifest(process.env.EXPO_PUBLIC_CDN_BASE_URL, (e) =>
      append(`manifest error: ${e.message}`),
    );
    const catalog = buildCatalog({
      bundled: bundledManifest,
      remote: loaded.remote,
      installed: [],
      appVersion: nativeApplicationVersion ?? '0.0.0',
    });
    append(`manifest: ${loaded.source}, packs ${catalog.packs.map((p) => `${p.id}(${p.items.length})`).join(', ')}`);
  }

  async function runReminders() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dates = scheduled.map((n) => {
      const trigger = n.trigger as { date?: number | string; value?: number } | null;
      const when = trigger?.date ?? trigger?.value;
      return when ? new Date(when).toISOString() : '?';
    });
    append(`reminders: ${scheduled.length}`);
    if (dates.length) append(`first: ${dates.sort()[0]}`);
  }

  /** Dev only: a month of sample entries for store screenshots (deterministic, skips a few days). */
  async function seedSampleMonth() {
    const today = toLocalDateString(new Date());
    const moods = [4, 3, 5, 4, 2, 4, 5, 3, 4, 4, 1, 3, 5, 4, 3, 4, 5, 2, 4, 3, 4, 5, 4, 3] as const;
    const tagSets = [
      ['friends', 'music'],
      ['work', 'cafe'],
      ['exercise', 'sleep'],
      ['family', 'food'],
      ['study'],
      ['travel', 'photos'],
      ['movies', 'games'],
      ['reading', 'weather'],
    ];
    let n = 0;
    for (let i = 1; i < 31; i += 1) {
      if (i % 7 === 5 || i === 11 || i === 19) continue;
      await saveEntry({ date: addDays(today, -i), mood: moods[n % moods.length] ?? 3, note: '', tagIds: tagSets[n % tagSets.length]!, photos: [] });
      n += 1;
    }
    append(`seeded ${n} entries`);
  }

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Button
          testID="dev.data.seed"
          variant="secondary"
          label="Seed sample month (screenshots)"
          onPress={() => void seedSampleMonth().catch((e: Error) => append(`seed error: ${e.message}`))}
        />
        <Button
          testID="dev.data.db"
          label="Run DB check"
          onPress={() => void runDb().catch((e: Error) => append(`db error: ${e.message}`))}
        />
        <Button
          testID="dev.data.content"
          variant="secondary"
          label="Run content check"
          onPress={() => void runContent()}
        />
        <Button
          testID="dev.data.reminders"
          variant="secondary"
          label="Scheduled reminders"
          onPress={() => void runReminders()}
        />
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
