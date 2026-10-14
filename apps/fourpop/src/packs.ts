import { recordError, track } from '@nf/analytics';
import { bundledAssets, fileName, packFiles, type Pack } from '@nf/content';
import { installedPacks } from '@nf/db/fourpop';
import { getProducts, purchaseProduct, type PurchaseOutcome } from '@nf/purchases';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';

import { cdnUrl, installedFile, packsDir, refreshCatalog, useCatalog } from './catalog';
import { ensureDiskSpace } from './compose';
import { db } from './db';

/** Downloads land here first; the folder moves to Documents/packs/<id>/ only when every file passed. */
const tmpRoot = new Directory(Paths.cache, 'packs-tmp');
const ATTEMPTS = 3;

export type InstallState =
  | { status: 'downloading'; done: number; total: number }
  | { status: 'failed' }
  | { status: 'done' };

/** Per-pack install progress for the shop cards. */
export const useInstalls = create<Record<string, InstallState>>(() => ({}));
const setInstall = (packId: string, state: InstallState) => useInstalls.setState({ [packId]: state });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');

/** One file: download, verify SHA-256 when the manifest has one, retry with exponential backoff (1 s, 2 s). */
async function downloadVerified(url: string, dest: File, expected: string | undefined) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      if (dest.exists) dest.delete();
      await File.downloadFileAsync(url, dest);
      if (expected) {
        const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, await dest.bytes());
        if (toHex(digest) !== expected.toLowerCase()) throw new Error(`sha256 mismatch: ${dest.name}`);
      }
      return;
    } catch (error) {
      if (dest.exists) dest.delete();
      if (attempt >= ATTEMPTS - 1) throw error;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

/**
 * Downloads a whole pack to a temporary folder, verifies it, moves it to Documents/packs/<id>/
 * atomically and records it in `installed_packs` (PLAN 다운로드 · 설치 기록). Throws on failure
 * (temporary files removed); the caller shows "try again".
 */
export async function installPack(pack: Pack): Promise<void> {
  // Bundled paths (dev fixtures can reuse them) need no download.
  const files = packFiles(pack).filter((path) => !(path in bundledAssets));
  const names = new Set(files.map(fileName));
  if (names.size !== files.length) throw new Error(`pack ${pack.id}: duplicate file names`);

  const tmp = new Directory(tmpRoot, pack.id);
  setInstall(pack.id, { status: 'downloading', done: 0, total: files.length });
  try {
    ensureDiskSpace();
    if (tmp.exists) tmp.delete();
    tmp.create({ intermediates: true });
    let done = 0;
    for (const path of files) {
      await downloadVerified(cdnUrl(path), new File(tmp, fileName(path)), pack.sha256?.[path]);
      done += 1;
      setInstall(pack.id, { status: 'downloading', done, total: files.length });
    }

    packsDir.create({ intermediates: true, idempotent: true });
    const target = new Directory(packsDir, pack.id);
    if (target.exists) target.delete();
    tmp.move(target);
    const missing = files.find((path) => !installedFile(pack.id, path).exists);
    if (missing) throw new Error(`pack ${pack.id}: ${fileName(missing)} missing after move`);

    const row = {
      manifestJson: JSON.stringify(pack),
      installedAt: Date.now(),
      version: useCatalog.getState().manifestVersion,
    };
    await db
      .insert(installedPacks)
      .values({ id: pack.id, ...row })
      .onConflictDoUpdate({ target: installedPacks.id, set: row });
    await refreshCatalog();
    setInstall(pack.id, { status: 'done' });
  } catch (error) {
    if (tmp.exists) tmp.delete();
    recordError(error as Error, 'installPack');
    setInstall(pack.id, { status: 'failed' });
    throw error;
  }
}

export type PackPurchase = PurchaseOutcome['status'] | 'unavailable';

/**
 * Buys a pack as a non-consumable (`booth_pack_<id>`, PLAN 상품·권한 매핑) and starts its download.
 * A failed download does not undo the purchase: the entitlement unlocks the pack and the shop card
 * offers "try again". `unavailable` = no product (purchases disabled, offline, or not yet registered).
 */
export async function purchasePack(pack: Pack): Promise<PackPurchase> {
  if (!pack.productId) return 'unavailable';
  const [product] = await getProducts([pack.productId]).catch(() => []);
  if (!product) return 'unavailable';
  const outcome = await purchaseProduct(product);
  if (outcome.status !== 'success') return outcome.status;
  track('pack_unlock', { pack_id: pack.id, method: 'single' });
  void installPack(pack).catch(() => undefined); // recorded inside; the shop shows retry
  return 'success';
}

/** Premium subscribers already have access; downloading keeps the pack usable offline and after it leaves the manifest. */
export async function downloadForPremium(pack: Pack): Promise<void> {
  track('pack_unlock', { pack_id: pack.id, method: 'premium' });
  await installPack(pack);
}

/** Retry after a failed download (bought or Premium); no event, the unlock was already counted. */
export const retryInstall = (pack: Pack) => installPack(pack);
