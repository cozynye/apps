# EAS 빌드·제출 (P22 이후)

`apps/nuni/eas.json`, `apps/fourpop/eas.json`에 프로필 4개가 있다: `development`(시뮬레이터 dev client), `development-device`(실기기 dev client), `preview`(TestFlight 내부, `EXPO_PUBLIC_ENV=preview`), `production`. Node 버전은 `.nvmrc`(22).

## Cozy가 한 번 하는 것

1. `npm i -g eas-cli && eas login` (Expo 계정).
2. 앱마다 프로젝트 생성: `cd apps/nuni && eas init` → `app.json`의 `extra.eas.projectId`가 채워짐. Fourpop도 같게. — **완료 2026-10-15**: `@cco33/nuni`(a8367f7a…), `@cco33/fourpop`(6a43354f…), owner `cco33`.
3. 시크릿 등록(앱별, production/preview 환경):
   - (v1.1, 결제를 켤 때만) `eas env:create --scope project --name EXPO_PUBLIC_RC_IOS_KEY_NUNI --value appl_... --environment production` (Fourpop은 `_FOURPOP`)
   - `eas env:create --scope project --name EXPO_PUBLIC_CDN_BASE_URL --value https://... --environment production` (Fourpop)
   - plist는 파일 시크릿: `eas env:create --scope project --name GOOGLE_SERVICES_PLIST_NUNI --type file --value ./GoogleService-Info.plist --environment production --visibility secret` (Fourpop은 `_FOURPOP`, `app.config.ts`가 읽음; eas-cli 24에서는 deprecated 경고가 나오지만 동작) — **Nuni는 2026-10-15 production·preview에 등록 완료**
   - preview 환경에도 같은 값을 넣는다(Test Store 키는 release 빌드에서 크래시하므로 preview에도 실제 `appl_` 키).
   - `EXPO_PUBLIC_MONETIZATION`은 등록하지 않는다 — 비어 있으면 결제 코드가 꺼진 무료 빌드(1.0, Cozy 결정 2026-10-15). RevenueCat 키도 필요 없다.
4. App Store Connect 앱이 있으면 `eas submit -p ios --profile production`에서 ascAppId를 물어본다(또는 `submit.production.ios.ascAppId`에 적어 둔다).

## 첫 빌드는 Cozy 터미널에서 (Apple 자격 증명)

첫 `eas build`는 Apple 계정 로그인(2단계 인증)과 배포 인증서·프로비저닝 프로파일 생성을 대화형으로 묻는다 — Claude Code 세션(비대화형)에서는 `Credentials are not set up. Run this command again in interactive mode.`로 멈춘다(2026-10-15 확인). Nuni는 타깃이 2개(앱 + `NuniWidget`)라 프로파일을 2개 만든다. 한 번 만들어지면 이후 빌드는 비대화형으로도 된다.

## 빌드 명령

```
cd apps/nuni        # 또는 apps/fourpop
eas build -p ios --profile preview      # TestFlight 내부 테스트용
eas build -p ios --profile production   # 심사 제출용
eas submit -p ios --profile production  # 릴리스 게이트 통과 후에만 (CLAUDE.md §5)
```

## 주의

- 1.0은 `EXPO_PUBLIC_MONETIZATION` 없이 빌드한다(무료): RevenueCat SDK 미초기화, 페이월·구독 설정 숨김, 모든 기능 해제.
- RevenueCat Test Store 키(`test_`)는 Debug 빌드 전용. preview/production 빌드에 들어가면 앱이 즉시 종료된다(결제를 켠 빌드에서만 해당).
- `EXPO_PUBLIC_MOCK_CAMERA`, `EXPO_PUBLIC_FORCE_LOCALE`은 개발·E2E 전용이며 EAS 환경에 넣지 않는다.
- OTA 업데이트(expo-updates)는 쓰지 않으므로 프로필에 `channel`을 두지 않는다(두면 빌드마다 경고).
- 모노레포라 EAS는 저장소 루트를 올린다(`pnpm` 워크스페이스 자동 인식). `.easignore`는 아직 없다.
