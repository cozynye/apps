import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, environment, labelsHidden } from '@expo/ui/swift-ui/modifiers';
import { isLanguage, useTranslation, type Language } from '@nf/i18n';
import { useTheme } from '@nf/ui';

import type { ReminderTime } from '../reminder-plan';

/**
 * SwiftUI locale per app language (vi/th show 24-hour time like the rest of the app). @expo/ui only
 * applies identifiers listed in `Locale.availableIdentifiers`, so no `@calendar=` suffix (time only).
 */
const SWIFT_LOCALE: Record<Language, string> = { en: 'en_US', vi: 'vi_VN', th: 'th_TH' };

export interface TimePickerProps {
  value: ReminderTime;
  onChange: (t: ReminderTime) => void;
  /** `wheel` for A12, `compact` (a tappable time chip) for settings rows. */
  variant?: 'wheel' | 'compact';
  testID: string;
}

/** Native iOS time picker (SwiftUI via @expo/ui) in the app's language and theme, not the device's. */
export function TimePicker({ value, onChange, variant = 'wheel', testID }: TimePickerProps) {
  const { i18n } = useTranslation();
  const { scheme } = useTheme();
  const locale = SWIFT_LOCALE[isLanguage(i18n.language) ? i18n.language : 'en'];
  const selection = new Date(2000, 0, 1, value.hour, value.minute);
  return (
    <Host matchContents testID={testID}>
      <DatePicker
        selection={selection}
        displayedComponents={['hourAndMinute']}
        onDateChange={(d) => onChange({ hour: d.getHours(), minute: d.getMinutes() })}
        modifiers={[
          datePickerStyle(variant),
          labelsHidden(),
          environment('locale', locale),
          environment('colorScheme', scheme),
        ]}
      />
    </Host>
  );
}
