# 온보딩 일러스트

1024×768 SVG, 토큰 색만 사용. 각 장은 둥근 카드(모서리 48) 안에 그려져 있어 화면 배경(`surface-1`) 위에 그대로 올린다.

| 파일 | 화면 | 제목(en 원문) | 본문(en 원문) |
| --- | --- | --- | --- |
| `nuni-onboarding-1.svg` | A2 · 1/3 | Log your day in 10 seconds | Pick a cloud, tap a few tags. That's it. |
| `nuni-onboarding-2.svg` | A2 · 2/3 | See what lifts you | Nuni shows which days and activities feel best. |
| `nuni-onboarding-3.svg` | A2 · 3/3 | A gentle nudge, never a nag | One reminder a day, at the time you choose. |
| `fourpop-onboarding-1.svg` | B2 · 1/2 | Shoot like a real booth | Countdown, 8 shots, pick your best 4. |
| `fourpop-onboarding-2.svg` | B2 · 2/2 | Frames for every season | Decorate, then share to Stories or TikTok in a tap. |

온보딩 화면 레이아웃 (A2, B2 공통):

1. 상단 여백 `space-12`, 일러스트는 화면 너비 − `space-4`×2, 비율 4:3 유지
2. `space-8` 아래 제목 `display-xl`, `space-2` 아래 본문 `body` + `ink-muted`, 모두 가운데 정렬, 최대 너비 320
3. 하단: 페이지 점 3개(활성 = 앱 주 색, 나머지 `line`), `space-6` 아래 Primary 버튼 "Continue" (마지막 장은 "Get started"), 오른쪽 위에 "Skip" 텍스트 버튼
4. 3장(Nuni)의 알림 시간 선택은 마지막 장 버튼을 누른 뒤 시스템 권한 요청과 함께 표시
5. iPad: 일러스트 최대 너비 560, 나머지는 같음

Fourpop은 2장 뒤에 바로 카메라·사진 권한을 요청한다.
