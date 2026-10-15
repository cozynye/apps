# 에셋과 콘텐츠 매니페스트

`manifest.json`이 앱 번들 콘텐츠(프레임 base 10종 + pop 10종 + y2k 10종, 스티커 base 22종 + pop 20종 + y2k 18종)의 단일 매니페스트다. CDN의 `manifest.json`도 **같은 스키마**를 쓴다(기획서 ‘앱 B 구현 명세 › 콘텐츠 매니페스트’가 이 파일을 가리킨다).

```ts
type Manifest = { schemaVersion: 1; version: number; minAppVersion: string; packs: Pack[] };
type Pack = {
  id: string;                     // "base" | "stickers-base" | "tet-2027"
  type: "frame" | "sticker";
  productId: string | null;       // App Store 상품 ID. null = 무료
  entitlementId: string | null;   // RevenueCat 권한. 규칙: productId와 동일 문자열
  free: boolean; bundled: boolean; category: "basic" | "season" | "collab";
  minAppVersion: string;          // 팩 단위. 앱 버전이 낮으면 이 팩만 숨김
  availableFrom?: string; availableUntil?: string;   // ISO 날짜, 상점 노출 기간
  title: { en: string; vi: string; th: string };
  thumbnail?: string;             // 팩 썸네일 (CDN 팩은 필수)
  items: FrameItem[] | StickerItem[];
};
type FrameItem = { id: string; layout: "strip4"; image: string; thumbnail: string;
  canvas: { w: 1200; h: 3600 }; slots: Slot[]; captionSlot: Slot; title: {en,vi,th} };
type StickerItem = { id: string; image: string; size: 512; canvas: { w: 512; h: 512 } };
type Slot = { x: number; y: number; w: number; h: number };  // canvas 좌표계
```

규칙:

- `image` 경로는 번들 팩이면 `assets/` 상대 경로(앱은 `bundledAssets.ts`의 `id → require()` 정적 맵으로 연결), CDN 팩이면 `packs/<id>/<version>/<file>` 불변 경로.
- 모르는 `schemaVersion`은 무시하고 마지막 캐시본을 쓴다. `version`은 단조 증가.
- MVP 레이아웃은 **strip4 하나**. 2×2·1×3은 v1.1에서 `layout` 값과 `canvas`를 추가해 확장한다.
- 좌표는 전부 canvas 공간(고화질 1200×3600). 일반 화질은 같은 장면을 0.5배로 그린다.

폴더: `app-icons/` `splash/` `mascot/` `onboarding/` `frames/base/` `stickers/base/`. 각 폴더 README에 쓰임새가 있다.
