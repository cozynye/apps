# Nuni & Fourpop

베트남·태국 MZ를 위한 두 iOS 앱, Nuni(감정일기)와 Fourpop(포토부스)이 함께 쓰는 디자인 시스템. 톤은 파스텔 미니멀: 밝은 바닥, 둥근 도형, 앱마다 하나의 주 색. 구현자는 Claude Code이며 `tokens.json`의 이름을 그대로 코드의 테마 키로 쓴다.

## 원칙

1. **바닥은 조용하게, 색은 한 번만.** 화면은 `surface-1` 위에 `surface-0` 카드. 주 색(`nuni-primary` / `fourpop-primary`)은 화면당 한 곳, 가장 중요한 행동에만.
2. **선으로 구분하고 그림자는 떠 있는 것에만.** 카드는 `line` 테두리. `shadow-float`는 + 버튼과 촬영 버튼처럼 실제로 화면 위에 떠 있는 요소에만.
3. **파스텔 위에는 항상 `on-accent`.** 주 색은 밝아서 흰 글자가 안 읽히고, 다크 테마의 `ink`(밝은색)도 안 읽힌다. 주 색·mint·mood-4 위의 버튼 라벨, 칩 텍스트, FAB 아이콘은 테마와 무관하게 고정된 `on-accent`(#1f1f24). 글자 색으로 강조가 필요하면 `nuni-deep` / `fourpop-deep`.
4. **둥글되 말랑하지 않게.** 반지름은 네 단계만. 컨트롤은 `radius-md`, 바텀시트와 큰 카드는 `radius-lg`, 원형 요소는 `radius-pill`.
5. **문구는 짧고 번역 길이를 견딘다.** 베트남어는 영어보다 20~30% 길다. 버튼은 두 줄까지 허용하고 말줄임을 쓰지 않는다. **대문자 변환 금지**(성조 부호가 깨지고 태국어엔 대소문자가 없다). 섹션 라벨은 대문자 대신 `body-sm` 600 문장형("Yesterday", "What did you do?").

## 두 앱의 차이

| | Nuni | Fourpop |
| --- | --- | --- |
| 주 색 | `nuni-primary` 하늘색 | `fourpop-primary` 코랄 |
| 연한 배경 | `nuni-soft` | `fourpop-soft` |
| 텍스트 강조 | `nuni-deep` | `fourpop-deep` |
| 보조 색 | `nuni-lavender` | `fourpop-mint` |
| 분위기 | 차분함, 아침 하늘 | 들뜸, 플래시 터지는 순간 |
| 고유 요소 | 구름 마스코트, 감정 5색 | 카운트다운 숫자, 프레임 썸네일 |

중립 색, 타이포, 간격, 반지름은 전부 공유한다. 앱을 바꿔도 "같은 회사 제품"으로 읽히되 색만 보고 어느 앱인지 알 수 있어야 한다.

## 색

### 중립

`surface-0` → `surface-1` → `surface-2` 순으로 어두워진다. 텍스트는 `ink`(본문), `ink-muted`(보조), `ink-disabled`(비활성) 세 단계만. 다크 테마는 같은 이름이 자동으로 바뀌므로 코드에서 테마별 분기를 쓰지 않는다.

### 감정 5색 (Nuni)

`mood-1`부터 `mood-5`까지 비 → 흐림 → 빛줄기 → 맑음 → 노을 순. 인접 단계의 명도 차는 1.2~1.9로 작아 색만으로는 구분되지 않는다: 항상 **얼굴·장식이 있는 마스코트**와 함께 쓰고, 색 띠(통계)에는 `line` 구분선, 범례에는 아이콘 + 라벨. 캘린더 셀과 마스코트에만 쓰고, 텍스트 색으로는 쓰지 않는다.

### 촬영 화면 전용

`camera-surface`, `camera-control`, `camera-ink`, `camera-ink-muted`는 테마와 무관하게 고정된 어두운 팔레트다. Fourpop B5·B6은 라이트 테마에서도 이 토큰만 쓴다.

### 상태

`status-success`, `status-warning`, `status-error`는 텍스트·아이콘·토스트 테두리에만. 넓은 면으로 깔지 않는다.

## 타이포그래피

- **라틴·베트남어**: Be Vietnam Pro (Google Fonts). 베트남어 성조 부호가 디자인된 서체. 영어 UI도 같은 서체.
- **태국어**: Prompt (Google Fonts). 라틴 글리프도 Be Vietnam Pro와 어울리는 기하학 산세리프. 태국어 로케일이면 `thai` 패밀리로 전체 전환.
- 앱 번들에는 두 서체의 Regular(400), SemiBold(600), Bold(700) TTF 6개(`tokens.json` `type.fonts`, Google Fonts에서 받아 `packages/ui/fonts/`에 둔다, OFL 라이선스). `expo-font` config plugin으로 번들. RN은 weight별 `fontFamily`가 다르다: `BeVietnamPro-Regular` / `-SemiBold` / `-Bold`, `Prompt-Regular` / `-SemiBold` / `-Bold`.
- 태국어는 상하 모음·성조 부호 때문에 행간이 더 필요하다. `i18n.language === 'th'`이면 `useTypography()`가 **Thai overrides** 그룹(`th-*` 스타일: caption 12/16, body-sm 13/20, body 15/24, title 18/28, display-lg 24/34, display-xl 32/44, button 15/22)으로 치환하고 letterSpacing은 0.
- 베트남어 대문자 분음(Ầ, Ễ) 때문에 display 행간은 라틴 기준으로도 넉넉하다(display-xl 32/40, display-lg 24/32).
- `countdown`(96px)은 Fourpop 촬영 화면 숫자 전용. 다른 곳에 쓰지 않는다.

## 간격과 반지름

4px 배수. 화면 좌우 여백 `space-4`, 카드 패딩 `space-4`, 카드 사이 `space-5`, 섹션 사이 `space-6`. 터치 영역은 최소 44×44pt(`touch-min`): 시각 높이 36인 칩·세그먼트·pill은 `hitSlop={{top:4,bottom:4}}`로 채운다. 아이콘 전용 버튼은 44×44 박스.

iPad: `breakpoint-tablet` 744pt 이상에서 Nuni 콘텐츠 최대 너비 `layout-max-content` 600, Fourpop 사이드 패널 `layout-side-panel` 360.

## 아이콘

라인 아이콘 24px, 선 두께 1.75px, 끝은 둥글게. Phosphor Icons(Regular, MIT) 세트를 기본으로 쓰고, 활동 태그 20종처럼 세트에 없는 것만 같은 규격으로 직접 그린다. 아이콘 색은 항상 텍스트 색 토큰(`ink`, `ink-muted`)을 따른다.

## 마스코트 Nuni

둥근 구름 하나. 눈 두 개와 입으로만 표정을 만들고 팔다리는 없다. 감정 5단계마다 표정과 색(`mood-1`~`mood-5`)이 바뀌며, 1단계 빗방울, 3단계 빛줄기, 4단계 해, 5단계 반짝이가 붙는다. 얼굴은 `mascot-face` 고정색. 외곽선·음영 없음. 40pt 이하에서는 장식 없는 `-sm` 변형. 앱 아이콘, 빈 상태, 온보딩에 등장하고 Fourpop에는 등장하지 않는다. 상세는 `assets/mascot/README.md`.

## 컴포넌트 규칙 (구현 시)

| 컴포넌트 | 규칙 |
| --- | --- |
| Primary 버튼 | 높이 52, `radius-md`, 배경 주 색, 라벨 `button` 스타일 + `ink`. 비활성은 `surface-2` + `ink-disabled` |
| Secondary 버튼 | 배경 `surface-0`, 테두리 `line`, 라벨 `ink` |
| 칩 | 높이 36 + hitSlop 4, `radius-pill`, 기본 `surface-2`, 선택 시 앱의 soft 색 + deep 텍스트 |
| 빈 상태 | 마스코트(Nuni) 또는 스트립 일러스트(Fourpop) 120pt + `title` + `body-sm` muted + Primary 버튼 1개, 세로 중앙. 모든 리스트·캘린더 첫 달·갤러리·오프라인 상점에 필수 |
| 세그먼트 | 높이 36 + hitSlop 4, `surface-2` 트랙, 활성 `surface-0` + 그림자 없음. 잠긴 세그먼트는 자물쇠 아이콘 |
| 카드 | `surface-0`, 테두리 `line`, `radius-md`, 패딩 `space-4` |
| 바텀시트 | 상단 `radius-lg`, 손잡이 바 36×4 `line`, 뒤에 `overlay` |
| 탭 바 | `surface-0`, 상단 `line`, 활성 라벨 앱의 deep 색, 비활성 `ink-muted` |
| 토스트 | `ink` 배경 + `surface-0` 텍스트(테마 반전), 하단 `space-6` 위, 2.5초 |
| 페이월 카드 | `radius-lg`, 테두리 항상 2px(비선택 `line`, 선택 주 색) + soft 배경 — 전환 시 레이아웃 점프 없음 |
| 눌림 상태 | 모든 Pressable: 배경을 `surface-2`로(카드·셀), 버튼은 opacity 0.85. 포커스 링은 `nuni-deep`/`fourpop-deep` 2px |

## 모션과 햅틱

| 동작 | 값 |
| --- | --- |
| 바텀시트·모달 등장 | `duration-base` 280ms easeOut, 아래에서 위 |
| 탭 전환 | 크로스페이드 120ms |
| 캘린더에 구름 새김 (저장 직후) | scale 0.6→1 spring(damping 14), `duration-slow` |
| 카운트다운 숫자 | 120ms scale 1.2→1, 0에서 흰 플래시 120ms |
| 저장 성공 토스트 | 위로 8pt 슬라이드 + 페이드 |
| `reduceMotion` | 모든 이동·스케일 제거, 페이드만 |

햅틱(`expo-haptics`): 감정 선택 `selection`, 저장 `notificationSuccess`, 카운트다운 매초 `impactLight`, 셔터 `impactRigid`, 결제 성공 `notificationSuccess`, 오류 `notificationError`.

## 라이선스

Be Vietnam Pro, Prompt: SIL OFL 1.1. Phosphor Icons: MIT. 설정 › 오픈소스 라이선스 화면에 고지. 프레임·스티커·마스코트·일러스트: 자체 제작(Chagyung).

## 접근성

텍스트는 어느 테마에서든 바닥과 4.5:1 이상. 주 색 위의 `ink`, `surface` 위의 `ink-muted`, deep 색은 이 기준으로 골랐다. 감정 5색은 명도 차이로 구분된다. 터치 영역 44pt, Dynamic Type 2단계까지 레이아웃이 깨지지 않게.

## 소비 방법 (Claude Code)

`tokens.json`을 `packages/ui/tokens.ts`로 변환해 두 앱이 import한다. 하드코딩 hex 금지. 변환 규칙:

| tokens.json | tokens.ts |
| --- | --- |
| 토큰 이름 `surface-0`, `nuni-primary` | camelCase `surface0`, `nuniPrimary` |
| 색 `{light, dark}` | `colors.light.surface0`, `colors.dark.surface0`. 8자리 hex(`overlay`)는 그대로 RN이 읽음 |
| 길이 `"16px"` | 숫자 `16` |
| `shadow-float` CSS 문자열 | `{ shadowColor: '#1f1f24', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }` (수동 매핑, 다크는 색 `#000`, opacity 0.4) |
| 타이포 스타일 | `typography.body: TextStyle` (`fontFamily`는 weight별 이름으로 치환, `lineHeight` 숫자) |
| `th-*` 스타일 | `typographyTh` — `useTypography()`가 언어로 선택 |
| `motion.*` | `motion.durationBase = 280` |

`useTheme()`는 `settings.appearance`(system / light / dark, 기본 system) → `useColorScheme()`로 라이트/다크를 고른다. `on-accent`, `mascot-face`, `camera-*`는 두 테마에 같은 값이 들어 있으므로 코드에서 분기하지 않는다. 컴포넌트는 `useTheme().colors.nuniPrimary`처럼 토큰 이름으로만 색을 참조한다.
