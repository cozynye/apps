import { requireNativeModule } from 'expo-modules-core';

/** Local Expo module (Swift): writes widget.json to the App Group and reloads the widget. */
export const WidgetBridge = requireNativeModule<{ write(json: string): Promise<void> }>('WidgetBridge');
