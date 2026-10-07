# 결정 기록

문서(PLAN)에 없거나 모호해서 Claude Code가 정한 것. 형식: `날짜 — 결정 — 이유`. 되돌리기 어려운 결정은 Cozy 확인 후 기록.

## 기획 단계에서 이미 정한 것 (2026-10-07)

- 2026-10-07 — 패키지 매니저 pnpm workspaces + `node-linker=hoisted` — RN 네이티브 모듈 호환
- 2026-10-07 — 카메라 expo-camera (vision-camera 사용 안 함) — 실시간 프레임 처리 불필요
- 2026-10-07 — 페이월 자체 구현, RevenueCat은 Offering·가격만 — 고지 문구를 앱 안에 둬야 함
- 2026-10-07 — Fourpop MVP 레이아웃 1×4만, Nuni 스킨 상점 v1.1 — 1인 MVP 범위
- 2026-10-07 — 미확정 사항은 배포 전 해결, 개발 중에는 자리표시자 — Cozy 결정
- 2026-10-07 — vi·th 네이티브 검수 생략, 초안으로 출시 후 보완 — Cozy 결정

## 개발 중 결정

- 2026-10-07 — GitHub 리포(P22)·도메인 없이 S1 진행. CI 워크플로 파일과 `web/legal` 페이지는 만들되 실행·배포는 리포·도메인 수령 후 — Cozy: 당장 배포 안 함

- 2026-10-07 — S1 결제 검증은 RevenueCat Test Store 키(`test_`)로 진행. production 빌드에는 실제 iOS 키(`appl_`)로 교체 필수 — App Store Connect(P15) 보류 중에도 구매·복원 흐름 검증 가능
