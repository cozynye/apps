# Fourpop 프레임

`base/` = 앱 번들에 포함되는 무료 기본 프레임 10종 (strip4 레이아웃). MVP 레이아웃은 strip4만이다(2×2·1×3은 v1.1). 매니페스트는 상위 `assets/manifest.json` 하나로 통합됐다.

- 프레임 PNG: 1200×3600, 투명 슬롯 4개, 모서리 48px. 사진은 이 PNG **아래** 레이어에 그리고, 슬롯의 투명 구멍으로 보인다.
- 슬롯 좌표(모든 base 프레임 공통): x 60, w 1080, h 720, y = 80 + 780×i (i = 0..3). 슬롯 모서리 24px.
- 하단 460px은 캡션 영역(`captionSlot` x60 y3260 w1080 h220). 기본 캡션 "FOURPOP"은 PNG에 구워져 있고, 무료 워터마크는 캡션과 겹치지 않게 **캡션 영역 위 우측**(x 1140 기준 우정렬, y 3180, 높이 72, 불투명 70%)에 코드로 그린다. 날짜 스탬프 기본 위치는 captionSlot 좌측(y 3380).
- 썸네일: `*-thumb.png` 200×600, 홈(B3)·프레임 선택(B4) 그리드용.
- 매니페스트: `assets/manifest.json` (스키마는 `assets/README.md`). `bundled: true`인 팩은 네트워크 없이 사용 가능.
- 일반 화질 출력(600×1800)은 이 PNG를 0.5배로 그린다.

| id | 바탕 | 패턴 | 캡션 색 |
| --- | --- | --- | --- |
| classic | surface-0 | 없음 | ink |
| noir | ink | 없음 | 밝은 ink |
| coral | fourpop-primary | 없음 | ink |
| mint | fourpop-mint | 없음 | ink |
| peach | #ffd6cc (Fourpop 전용 피치) | 없음 | ink |
| sunny | mood-4 | 없음 | ink |
| dots | fourpop-soft | 흰 점(r16) | fourpop-deep |
| stripes | fourpop-soft | 흰 가로줄 | fourpop-deep |
| film | ink | 양쪽 스프로킷 | 밝은 ink, “FOURPOP · 35mm” |
| hearts | fourpop-primary | 작은 흰 하트 | ink |

프레임 원본은 `export/frames.py`(이 대화의 작업 폴더)에서 생성했다. 새 프레임은 같은 슬롯 좌표를 지키면 코드 변경 없이 매니페스트에만 추가하면 된다.

## `pop/` — Pop 팩 10종 (무료, 번들, 2026-10-15)

Cozy 요청(“좀더 예쁜 프레임”)으로 추가한 두 번째 기본 팩. 슬롯·캡션 좌표는 base와 동일, `scripts/content-gen/frames.ts`가 SVG → PNG(+썸네일)로 생성하고 `scripts/content-gen/manifest.ts`가 매니페스트 `pop` 팩을 갱신한다. 그라데이션 프레임은 B8이 JPEG 모서리를 가장자리 색으로 채우므로 바깥 30px를 단색 매트로 둔다.

| id | 바탕 | 장식 | 캡션 색 |
| --- | --- | --- | --- |
| sunset | fourpop-primary 매트 | 코랄→피치→mood-4 세로 그라데이션 | ink |
| stardust | 라벤더 #e6def7 | 흰·연보라 반짝임, 달 | #5a4a9c |
| gingham | 흰 | 분홍 깅엄 체크, 캡션 흰 알약 | fourpop-deep |
| confetti | #fffdf9 | 5색 색종이 | ink |
| sky | 하늘 #d9ecff | 흰 구름, 노란 해 | ink |
| checker | 흰/ink 체커보드 | 캡션 흰 알약(ink 테두리) | ink |
| ribbon | 크림 #fff8f0 | ink 이중 테두리, 코랄 리본 | fourpop-deep |
| daisy | 연민트 #d5f3ea | 흰 데이지(mood-4 중심) | ink |
| notebook | 흰 | 하늘색 모눈·펀치 구멍 | #3b6fb6 |
| waves | fourpop-soft | 민트·흰 물결 | ink |

## `y2k/` — Y2K 팩 10종 (무료, 번들, 2026-10-15)

Cozy 요청(“사진이기 때문에 MZ감성”)으로 추가한 세 번째 기본 팩. `scripts/content-gen/y2k-frames.ts`. 픽셀 캡션은 `common.ts`의 5×7 비트맵 글꼴, 글로우는 SVG 필터(feGaussianBlur).

| id | 바탕 | 장식 | 캡션 |
| --- | --- | --- | --- |
| chrome | ink 매트 + 은색 그라데이션 | 안쪽 ink 선 | ink |
| holo | 흰 매트 + 파스텔 홀로그램 그라데이션 | 흰 반짝임 | 흰 글자 + ink 외곽선 |
| pixel | #1b1b2f | 24px 픽셀 색종이(시안·마젠타·노랑·흰) | 픽셀 글꼴 시안(마젠타 그림자) |
| grain | #3b2a1f 필름 브라운 | 그레인 노이즈 | 픽셀 글꼴 주황 + 글로우(필름 날짜 도장 느낌) |
| receipt | #fbfbf7 | 바코드, 점선, “FOURPOP * 4 CUTS * THANK YOU” | ink |
| cyber | #0a0a0c | 시안 그리드, 마젠타 코너 점 | 시안 글로우 |
| kitsch | 핫핑크 #ff5fa2 | 검은 별, 흰 하트 | ink |
| mono | #0a0a0c | 슬롯 흰 테두리 | 흰, 부제 “PHOTO BOOTH · 4 CUTS” |
| neon | 네이비 #0f1230 | 마젠타·시안 이중 네온 테두리 | 마젠타 글로우 |
| heartcore | 핑크 매트 + 라벤더→핑크 그라데이션 | 블링 하트, 반짝임 | ink + 양옆 하트 |

