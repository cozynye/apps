# i18n 문구

`packages/i18n`에 그대로 복사해 쓴다. 네임스페이스 3개(`common`, `nuni`, `fourpop`), 언어 3개(`en` 원문, `vi`, `th`). i18next 형식: `{{var}}` 보간, `_one` / `_other` 복수형(베트남어·태국어는 복수형 구분이 없어 두 키가 같은 값).

- `en.json`이 원문이다. 키를 추가하거나 바꿀 때 en을 먼저 고치고 vi·th에 같은 키를 넣는다. 키 누락은 CI에서 실패시킨다.
- `vi.json`, `th.json`은 **초안**이다. 네이티브 검수는 생략하고 초안으로 출시한 뒤 리뷰·TestFlight 피드백으로 고친다(기획서 P11 결정). 수정 시 이 파일만 고친다.
- `common.paywall.legal`은 심사 가이드라인 3.1.2 고지 문구다. 세 언어 모두 페이월 하단에 그대로 보여주고 줄이지 않는다.
- 권한 팝업 문구(`NSCameraUsageDescription` 등)는 여기가 아니라 `app.json`의 `locales`에 넣는다. iOS가 시스템 언어로 고른다.
- 날짜·숫자·통화는 문구로 쓰지 않고 `Intl`로 포맷한다. vi·th 모두 `dd/MM/yyyy`, 연도는 서기로 통일(불기 연도 안 씀). 주 시작 요일은 vi·th 모두 월요일. Fourpop 날짜 스탬프는 `decorate.dateFormats`의 3가지 중 사용자가 고른다(기본 첫 번째).
- 배열 값(`home.weekdays`, `capture.poses`, `decorate.dateFormats`)은 `t(key, { returnObjects: true })`로 읽는다.
- 섹션 라벨은 대문자 변환 없이 문장형(`body-sm` 600)으로 그린다. 목업의 대문자 라벨은 스타일이 아니라 문구 그대로 쓰지 않는다.
- 대문자 변환(`textTransform: uppercase`) 금지. 성조 부호와 태국어 모음 부호가 깨진다.
- 태국어는 상하 부호 때문에 줄 간격이 필요하다. `body` 22px 행간은 그대로 둔다.

| 파일 | 키 수 | 상태 |
| --- | --- | --- |
| `common/en.json` · `vi.json` · `th.json` | 92 | en 확정, vi·th 초안 |
| `nuni/en.json` · `vi.json` · `th.json` | 121 | en 확정, vi·th 초안 |
| `fourpop/en.json` · `vi.json` · `th.json` | 110 | en 확정, vi·th 초안 |
