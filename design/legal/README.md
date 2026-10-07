# 약관·개인정보처리방침

`terms-en.md`, `privacy-en.md`가 원문이다. 베트남어·태국어 본문은 P11 검수자에게 함께 맡긴다(법률 문서라 기계번역 초안을 그대로 쓰지 않는다). 둘 다 **초안**이며 출시 전 현지 법률 검토를 권한다.

쓰는 곳:

1. 앱 안 화면 A13·B13: 이 Markdown을 빌드 시 앱에 번들하고 `react-native-markdown-display`류로 렌더. 언어는 앱 언어를 따르고, 없는 언어는 en.
2. App Store Connect 개인정보처리방침 URL·고객지원 URL: 같은 본문을 GitHub Pages(P21)에 올린 페이지.
3. 페이월 하단 "Terms" / "Privacy" 링크 → A13·B13.

퍼블리셔 이름은 Chagyung으로 확정(2026-10-07). 연락처는 nunicozy@gmail.com, 주소는 개인 개발자로 "Seoul, Republic of Korea"까지만 기재. 남은 자리표시자: `[EFFECTIVE DATE]` (출시일에 채움).

App Store 개인정보 라벨(앱 정보 › App Privacy)은 `privacy-en.md` 2절 표와 일치시킨다:

| 라벨 항목 | 선택 |
| --- | --- |
| Identifiers › Device ID | 수집, 사용자와 연결 안 됨, 분석 목적 |
| Usage Data › Product Interaction | 수집, 연결 안 됨, 분석 목적 |
| Diagnostics › Crash Data, Performance Data | 수집, 연결 안 됨, 앱 기능 목적 |
| Purchases › Purchase History | 수집, 연결 안 됨, 앱 기능 목적 |
| Photos, Contacts, Location, Contact Info, User Content | 수집 안 함 |

분석 동의: 첫 실행 온보딩 마지막 장에 "익명 사용 통계 보내기" 토글(기본 켜짐)을 두고 Settings › Privacy에서 끌 수 있게 한다. 끄면 Firebase `setAnalyticsCollectionEnabled(false)`.
