import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';

import type { ReminderTime } from '../reminder-plan';

/** Native iOS wheel time picker (SwiftUI via @expo/ui); follows the device 12/24h setting. */
export function TimePicker({ value, onChange, testID }: { value: ReminderTime; onChange: (t: ReminderTime) => void; testID: string }) {
  const selection = new Date(2000, 0, 1, value.hour, value.minute);
  return (
    <Host matchContents testID={testID}>
      <DatePicker
        selection={selection}
        displayedComponents={['hourAndMinute']}
        onDateChange={(d) => onChange({ hour: d.getHours(), minute: d.getMinutes() })}
        modifiers={[datePickerStyle('wheel'), labelsHidden()]}
      />
    </Host>
  );
}
