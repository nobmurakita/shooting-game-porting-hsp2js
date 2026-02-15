//////////ゲームオブジェクトレジストリ//////////
// シングルトンインスタンスとコレクションを一元管理し、
// モジュール間の循環参照を防止する。

// シングルトン
export let player = null;
export let boss = null;

export function setPlayer(p) { player = p; }
export function setBoss(b) { boss = b; }

// コレクション
export const enemies = new Set();
export const bossParts = new Set();
export const playerShots = new Set();
export const lasers = new Set();
export const enemyShots = new Set();
export const enemyShots2 = new Set();
