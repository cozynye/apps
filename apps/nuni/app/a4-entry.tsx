import { track } from '@nf/analytics';
import { formatMonthYear, formatWeekdayDayMonth, fromLocalDateString, isLanguage } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import {
  Button,
  CameraIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  Chip,
  IconButton,
  Mascot,
  PlusIcon,
  radius,
  space,
  Text,
  useTheme,
  useToast,
  useTypography,
  XIcon,
  type Mood,
} from '@nf/ui';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAppState } from '../src/app-state';
import { MonthCalendar } from '../src/components/MonthCalendar';
import { addDays, addMonths, startOfMonth, monthGrid } from '../src/dates';
import { useDbStatus } from '../src/db';
import {
  createCustomTag,
  FREE_CUSTOM_TAGS,
  loadEntry,
  photoUri,
  preparePhoto,
  saveEntry,
  type DraftPhoto,
} from '../src/entries';
import { useCalendarMoods, useTags } from '../src/queries';
import { useToday } from '../src/today';

const MOODS: Mood[] = [1, 2, 3, 4, 5];
const VISIBLE_TAGS = 15;
const NOTE_LIMIT = { free: 200, premium: 2000 };
const PHOTO_LIMIT = { free: 1, premium: 10 };
type Source = 'fab' | 'widget' | 'notification' | 'calendar';
const SOURCES: Source[] = ['fab', 'widget', 'notification', 'calendar'];

/**
 * A4 entry sheet: create (?date=&source=) or edit (?id=). The date is fixed when the sheet opens,
 * so an entry started before midnight keeps that day (DECISIONS 2026-10-08).
 */
export default function EntryScreen() {
  const params = useLocalSearchParams<{ date?: string; id?: string; source?: string }>();
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const type = useTypography();
  const toast = useToast();
  const navigation = useNavigation();
  const premium = useEntitlement('mood_premium');
  const readOnly = useDbStatus((s) => s.status === 'readonly');
  const today = useToday();
  const tags = useTags();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';

  const [openedOn] = useState(today);
  const [date, setDate] = useState(params.date ?? openedOn);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Edits keep what an entry already has after premium ends (PLAN 예외 › 구독 만료).
  const [existing, setExisting] = useState({ noteLength: 0, photoCount: 0 });

  useEffect(() => {
    if (!params.id) return;
    void loadEntry(params.id).then((entry) => {
      if (!entry) return router.back();
      setDate(entry.date);
      setMood(entry.mood);
      setNote(entry.note);
      setTagIds(entry.tagIds);
      setPhotos(entry.photos);
      setExisting({ noteLength: entry.note.length, photoCount: entry.photos.length });
    });
  }, [params.id]);

  // Swipe-down would drop unsaved changes; require the close button (with confirm) instead.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirty });
  }, [navigation, dirty]);

  const noteLimit = premium ? NOTE_LIMIT.premium : Math.max(NOTE_LIMIT.free, existing.noteLength);
  const photoLimit = premium ? PHOTO_LIMIT.premium : Math.max(PHOTO_LIMIT.free, existing.photoCount);
  const customCount = tags.filter((tag) => tag.nameKey === null).length;

  function change<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
    };
  }

  function dayLabel(d: string) {
    if (d === openedOn) return t('entry.today');
    if (d === addDays(openedOn, -1)) return t('entry.yesterday');
    return formatWeekdayDayMonth(language, fromLocalDateString(d));
  }

  function toggleTag(id: string) {
    change(setTagIds)(tagIds.includes(id) ? tagIds.filter((x) => x !== id) : [...tagIds, id]);
  }

  function addCustomTag() {
    if (!premium && customCount >= FREE_CUSTOM_TAGS) {
      router.push({ pathname: '/a9-paywall', params: { source: 'tag' } });
      return;
    }
    Alert.prompt(
      t('tags.custom'),
      t('tags.customPlaceholder'),
      [
        { text: t('action.cancel'), style: 'cancel' },
        {
          text: t('action.save'),
          onPress: (value?: string) => {
            const name = value?.trim();
            if (!name) return;
            void createCustomTag(name).then((id) => change(setTagIds)([...tagIds, id]));
          },
        },
      ],
      'plain-text',
    );
  }

  function onChangeNote(text: string) {
    if (text.length > noteLimit) {
      if (!premium) router.push({ pathname: '/a9-paywall', params: { source: 'note' } });
      text = text.slice(0, noteLimit);
    }
    change(setNote)(text);
  }

  async function addPhoto() {
    if (photos.length >= photoLimit) {
      if (!premium) router.push({ pathname: '/a9-paywall', params: { source: 'photo' } });
      return;
    }
    // PHPicker: no photo library permission needed (PLAN 기술 스택 › 미디어).
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    try {
      const prepared = await preparePhoto(asset.uri, asset.width, asset.height);
      change(setPhotos)([...photos, prepared]);
    } catch {
      toast(t('error.generic'), 'error');
    }
  }

  function close() {
    if (!dirty) return router.back();
    Alert.alert(t('entry.discardConfirm'), undefined, [
      { text: t('entry.keepEditing'), style: 'cancel' },
      { text: t('entry.discard'), style: 'destructive', onPress: () => router.back() },
    ]);
  }

  async function save() {
    if (!mood || saving) return;
    if (readOnly) return toast(t('error.generic'), 'error');
    setSaving(true);
    try {
      await saveEntry({ id: params.id, date, mood, note, tagIds, photos });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!params.id) {
        const source = SOURCES.find((s) => s === params.source) ?? 'fab';
        track('entry_create', { tag_count: tagIds.length, has_photo: photos.length > 0, has_note: note.trim().length > 0, source });
      }
      router.back();
    } catch (error) {
      // Keep the sheet and its contents open (PLAN 예외 › 저장 공간 부족).
      const full = /full|ENOSPC|space/i.test(String(error));
      toast(t(full ? 'error.storageFull' : 'error.generic'), 'error');
      setSaving(false);
    }
  }

  const visibleTags =
    showAllTags ? tags : tags.filter((tag, i) => i < VISIBLE_TAGS || tagIds.includes(tag.id));

  return (
    <ScrollView
      style={{ backgroundColor: colors.surface0 }}
      contentContainerStyle={styles.content}
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">{t('entry.titleFor', { day: dayLabel(date) })}</Text>
          <Pressable
            testID="a4.date"
            accessibilityRole="button"
            onPress={() => setPickingDate(!pickingDate)}
            style={styles.dateLine}
          >
            <Text variant="bodySm" style={{ color: accent.deep }}>
              {formatWeekdayDayMonth(language, fromLocalDateString(date))}
            </Text>
            <CaretDownIcon size={16} color={accent.deep} />
          </Pressable>
        </View>
        <IconButton
          testID="a4.close"
          accessibilityLabel={t('a11y.close')}
          onPress={close}
          renderIcon={(c) => <XIcon size={24} color={c} />}
        />
      </View>

      {pickingDate && (
        <DatePicker
          selected={date}
          today={today}
          onPick={(d) => {
            change(setDate)(d);
            setPickingDate(false);
          }}
        />
      )}

      <View style={styles.moods}>
        {MOODS.map((m) => {
          const selected = mood === m;
          return (
            <Pressable
              key={m}
              testID={`a4.mood.${m}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`mood.${m}`)}
              onPress={() => {
                void Haptics.selectionAsync();
                change(setMood)(m);
              }}
              style={[styles.mood, selected && { backgroundColor: accent.soft }]}
            >
              <Mascot mood={m} size={44} />
              <Text variant="caption" align="center" style={{ color: selected ? accent.deep : colors.inkMuted }}>
                {t(`mood.${m}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionRow}>
        <Text variant="bodySm" color="inkMuted">
          {t('entry.whatDidYouDo')}
        </Text>
        {!showAllTags && tags.length > VISIBLE_TAGS && (
          <Pressable testID="a4.showAllTags" accessibilityRole="button" onPress={() => setShowAllTags(true)} hitSlop={space[3]}>
            <Text variant="bodySm" style={{ color: accent.deep }}>
              {t('entry.showAllTags')}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={styles.tags}>
        {visibleTags.map((tag) => (
          <Chip
            key={tag.id}
            testID={`a4.tag.${tag.id}`}
            label={tag.nameKey ? t(tag.nameKey) : (tag.customName ?? '')}
            selected={tagIds.includes(tag.id)}
            onPress={() => toggleTag(tag.id)}
          />
        ))}
        {showAllTags && (
          <Chip
            testID="a4.newTag"
            label={t('tags.custom')}
            icon={<PlusIcon size={16} color={colors.ink} />}
            onPress={addCustomTag}
          />
        )}
      </View>

      <Text variant="bodySm" color="inkMuted">
        {t('entry.noteLabel')}
      </Text>
      <View style={styles.noteRow}>
        <TextInput
          testID="a4.note"
          value={note}
          onChangeText={onChangeNote}
          placeholder={t('entry.notePlaceholder', { max: noteLimit })}
          placeholderTextColor={colors.inkMuted}
          multiline
          // A one-line note that may wrap: Return closes the keyboard instead of adding a line.
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          maxFontSizeMultiplier={1.65}
          style={[
            type.body,
            styles.note,
            { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface0 },
          ]}
        />
        <IconButton
          testID="a4.addPhoto"
          accessibilityLabel={t('entry.addPhoto')}
          onPress={() => void addPhoto()}
          renderIcon={(c) => <CameraIcon size={24} color={c} />}
        />
      </View>
      {photos.length > 0 && (
        <ScrollView horizontal contentContainerStyle={styles.photos} showsHorizontalScrollIndicator={false}>
          {photos.map((photo, i) => (
            <View key={photo.kind === 'saved' ? photo.id : photo.cacheUri}>
              <Image
                source={{ uri: photo.kind === 'saved' ? photoUri(photo.fileName) : photo.cacheUri }}
                style={[styles.photo, { backgroundColor: colors.surface2 }]}
              />
              <Pressable
                testID={`a4.removePhoto.${i}`}
                accessibilityRole="button"
                accessibilityLabel={t('action.delete')}
                onPress={() => change(setPhotos)(photos.filter((_, j) => j !== i))}
                hitSlop={space[3]}
                style={[styles.removePhoto, { backgroundColor: colors.ink }]}
              >
                <XIcon size={12} color={colors.surface0} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {!mood && (
        <Text variant="bodySm" color="inkMuted" align="center" testID="a4.pickMood">
          {t('entry.pickMood')}
        </Text>
      )}
      <Button testID="a4.save" label={t('action.save')} disabled={!mood} loading={saving} onPress={() => void save()} />
    </ScrollView>
  );
}

/** Inline calendar under the date line; future days are disabled. */
function DatePicker({ selected, today, onPick }: { selected: string; today: string; onPick: (d: string) => void }) {
  const { t, i18n } = useTranslation();
  const installDate = useAppState((s) => s.installDate);
  const [month, setMonth] = useState(() => startOfMonth(fromLocalDateString(selected)));
  const days = monthGrid(month).flat().filter((d): d is string => d !== null);
  const moods = useCalendarMoods(days[0]!, days.at(-1)!);
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  return (
    <View testID="a4.datePicker">
      <View style={styles.pickerHeader}>
        <IconButton
          testID="a4.prevMonth"
          accessibilityLabel={t('a11y.prevMonth')}
          onPress={() => setMonth(addMonths(month, -1))}
          renderIcon={(c) => <CaretLeftIcon size={20} color={c} />}
        />
        <Text variant="bodyStrong">{formatMonthYear(language, month)}</Text>
        <IconButton
          testID="a4.nextMonth"
          accessibilityLabel={t('a11y.nextMonth')}
          disabled={days.includes(today)}
          onPress={() => setMonth(addMonths(month, 1))}
          renderIcon={(c) => <CaretRightIcon size={20} color={c} />}
        />
      </View>
      <MonthCalendar month={month} today={today} installDate={installDate} moods={moods} selected={selected} onPressDay={onPick} />
    </View>
  );
}

const PHOTO = 72;

const styles = StyleSheet.create({
  content: { padding: space[4], gap: space[4], paddingBottom: space[8] },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, gap: space[1] },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: 32 },
  moods: { flexDirection: 'row', gap: space[1] },
  mood: { flex: 1, alignItems: 'center', gap: space[1], paddingVertical: space[3], borderRadius: radius.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  note: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    paddingTop: space[3],
    paddingBottom: space[3],
  },
  photos: { gap: space[2] },
  photo: { width: PHOTO, height: PHOTO, borderRadius: radius.sm },
  removePhoto: {
    position: 'absolute',
    top: space[1],
    right: space[1],
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
