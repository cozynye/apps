import { useTranslation } from 'react-i18next';
import type { TextStyle } from 'react-native';

import { typography, typographyTh, type TypographyName } from './generated/tokens';

export type Typography = Record<TypographyName, TextStyle>;

const latin: Typography = typography;
const thOverrides = typographyTh as Partial<Record<TypographyName, TextStyle>>;
// Thai replaces the styles it defines (th-*). body-strong has no th- style, so it takes th-body
// metrics in SemiBold; anything else just swaps the family to Prompt.
const thai: Typography = Object.fromEntries(
  (Object.keys(typography) as TypographyName[]).map((name) => {
    const base: TextStyle = typography[name];
    const fontFamily = (base.fontFamily ?? '').replace('BeVietnamPro', 'Prompt');
    const metrics = thOverrides[name] ?? (name === 'bodyStrong' ? thOverrides.body : undefined);
    return [name, { ...base, ...metrics, fontFamily, letterSpacing: 0 }];
  }),
) as Typography;

export function typographyFor(language: string | undefined): Typography {
  return language === 'th' ? thai : latin;
}

export function useTypography(): Typography {
  const { i18n } = useTranslation();
  return typographyFor(i18n.language);
}
