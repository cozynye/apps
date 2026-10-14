/* eslint-disable @typescript-eslint/no-require-imports */
import type { Icon } from 'phosphor-react-native';

// Phosphor Regular (MIT), loaded per icon so the full set is not bundled. The per-icon entry points
// ship as .tsx source, so they are required (typed via the public `Icon` type) rather than imported,
// which would make tsc typecheck the library's own source.
export const ArrowCounterClockwiseIcon: Icon = require('phosphor-react-native/src/icons/ArrowCounterClockwise').ArrowCounterClockwiseIcon;
export const BackspaceIcon: Icon = require('phosphor-react-native/src/icons/Backspace').BackspaceIcon;
export const CalendarBlankIcon: Icon = require('phosphor-react-native/src/icons/CalendarBlank').CalendarBlankIcon;
export const CameraIcon: Icon = require('phosphor-react-native/src/icons/Camera').CameraIcon;
export const CameraRotateIcon: Icon = require('phosphor-react-native/src/icons/CameraRotate').CameraRotateIcon;
export const CaretDownIcon: Icon = require('phosphor-react-native/src/icons/CaretDown').CaretDownIcon;
export const CaretLeftIcon: Icon = require('phosphor-react-native/src/icons/CaretLeft').CaretLeftIcon;
export const CaretRightIcon: Icon = require('phosphor-react-native/src/icons/CaretRight').CaretRightIcon;
export const ChartBarIcon: Icon = require('phosphor-react-native/src/icons/ChartBar').ChartBarIcon;
export const ChatCircleIcon: Icon = require('phosphor-react-native/src/icons/ChatCircle').ChatCircleIcon;
export const CheckIcon: Icon = require('phosphor-react-native/src/icons/Check').CheckIcon;
export const CloudIcon: Icon = require('phosphor-react-native/src/icons/Cloud').CloudIcon;
export const DownloadSimpleIcon: Icon = require('phosphor-react-native/src/icons/DownloadSimple').DownloadSimpleIcon;
export const ExportIcon: Icon = require('phosphor-react-native/src/icons/Export').ExportIcon;
export const FlipHorizontalIcon: Icon = require('phosphor-react-native/src/icons/FlipHorizontal').FlipHorizontalIcon;
export const GearSixIcon: Icon = require('phosphor-react-native/src/icons/GearSix').GearSixIcon;
export const ImageIcon: Icon = require('phosphor-react-native/src/icons/Image').ImageIcon;
export const InstagramLogoIcon: Icon = require('phosphor-react-native/src/icons/InstagramLogo').InstagramLogoIcon;
export const LightningIcon: Icon = require('phosphor-react-native/src/icons/Lightning').LightningIcon;
export const LightningSlashIcon: Icon = require('phosphor-react-native/src/icons/LightningSlash').LightningSlashIcon;
export const LockSimpleIcon: Icon = require('phosphor-react-native/src/icons/LockSimple').LockSimpleIcon;
export const MessengerLogoIcon: Icon = require('phosphor-react-native/src/icons/MessengerLogo').MessengerLogoIcon;
export const PauseIcon: Icon = require('phosphor-react-native/src/icons/Pause').PauseIcon;
export const PencilSimpleIcon: Icon = require('phosphor-react-native/src/icons/PencilSimple').PencilSimpleIcon;
export const PlayIcon: Icon = require('phosphor-react-native/src/icons/Play').PlayIcon;
export const PlusIcon: Icon = require('phosphor-react-native/src/icons/Plus').PlusIcon;
export const ShareNetworkIcon: Icon = require('phosphor-react-native/src/icons/ShareNetwork').ShareNetworkIcon;
export const SparkleIcon: Icon = require('phosphor-react-native/src/icons/Sparkle').SparkleIcon;
export const TextTIcon: Icon = require('phosphor-react-native/src/icons/TextT').TextTIcon;
export const XIcon: Icon = require('phosphor-react-native/src/icons/X').XIcon;
export type { Icon, IconProps } from 'phosphor-react-native';
