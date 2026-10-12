import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';

import type { ReminderTime } from '../reminder-plan';

export interface TimePickerProps {
  value: ReminderTime;
  onChange: (t: ReminderTime) => void;
  /** `wheel` for A12, `compact` (a tappable time chip) for settings rows. */
  variant?: 'wheel' | 'compact';
  testID: string;
}

/** Native iOS time picker (SwiftUI via @expo/ui); follows the device 12/24h setting. */
export function TimePicker({ value, onChange, variant = 'wheel', testID }: TimePickerProps) {
  const selection = new Date(2000, 0, 1, value.hour, value.minute);
  return (
    <Host matchContents testID={testID}>
      <DatePicker
        selection={selection}
        displayedComponents={['hourAndMinute']}
        onDateChange={(d) => onChange({ hour: d.getHours(), minute: d.getMinutes() })}
        modifiers={[datePickerStyle(variant), labelsHidden()]}
      />
    </Host>
  );
}
