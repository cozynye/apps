# iOS permission strings (Info.plist)

Per-app `NS*UsageDescription` strings, one file per language. Apps load them in `app.config.ts`:
`en.json` becomes the base Info.plist value, and every file is passed to Expo `locales`
(InfoPlist.strings), so iOS shows the device language. vi/th are drafts (no native review).
Changing these is a release-relevant decision: record it in docs/DECISIONS.md.

| Key | Nuni | Fourpop |
| --- | --- | --- |
| NSFaceIDUsageDescription | app lock (A11) | — |
| NSCameraUsageDescription | — | booth capture (B5) |
| NSPhotoLibraryAddUsageDescription | save share card from the share sheet (A7) | save strips / GIF (B8) |

Not needed: notifications (no plist string), photo picking (PHPicker), microphone (no video).
