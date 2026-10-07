/* eslint-disable @typescript-eslint/no-require-imports */
import type { Icon } from 'phosphor-react-native';

// Phosphor Regular (MIT), loaded per icon so the full set is not bundled. The per-icon entry points
// ship as .tsx source, so they are required (typed via the public `Icon` type) rather than imported,
// which would make tsc typecheck the library's own source.
export const CalendarBlankIcon: Icon = require('phosphor-react-native/src/icons/CalendarBlank').CalendarBlankIcon;
export const CameraIcon: Icon = require('phosphor-react-native/src/icons/Camera').CameraIcon;
export const CaretLeftIcon: Icon = require('phosphor-react-native/src/icons/CaretLeft').CaretLeftIcon;
export const CaretRightIcon: Icon = require('phosphor-react-native/src/icons/CaretRight').CaretRightIcon;
export const ChartBarIcon: Icon = require('phosphor-react-native/src/icons/ChartBar').ChartBarIcon;
export const CloudIcon: Icon = require('phosphor-react-native/src/icons/Cloud').CloudIcon;
export const GearSixIcon: Icon = require('phosphor-react-native/src/icons/GearSix').GearSixIcon;
export const LockSimpleIcon: Icon = require('phosphor-react-native/src/icons/LockSimple').LockSimpleIcon;
export const PlusIcon: Icon = require('phosphor-react-native/src/icons/Plus').PlusIcon;
export const XIcon: Icon = require('phosphor-react-native/src/icons/X').XIcon;
export type { Icon, IconProps } from 'phosphor-react-native';
