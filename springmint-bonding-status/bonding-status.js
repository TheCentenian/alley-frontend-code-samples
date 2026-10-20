/**
 * Bonding-sale view model.
 * A saved registry row and a nested bonding object can disagree. This module
 * merges them into one summary, then turns amounts and states into the
 * strings BondingSaleStatus renders. Screens do not read raw launch states.
 */

/** Launch states that mean this row is a bonding sale. */
const BONDING_LAUNCH_STATES = new Set([
  'bonding_configured',
  'bonding_allocation_pending',
  'bonding_live',
  'bonding_paused',
  'bonding_graduation_ready',
  'bonding_graduation_pending',
  'bonding_graduated',
  'bonding_refunding',
  'bonding_cancelled',
  'bonding_settled',
]);

/**
 * Further-along state wins when the nested object and the registry row disagree.
 * Equal rank keeps the second argument, which is the registry row.
 * Cancelled ranks highest so an older "live" copy cannot cover a cancel.
 */
const BONDING_LAUNCH_STATE_RANK = {
  bonding_configured: 10,
  bonding_allocation_pending: 20,
  bonding_live: 30,
  bonding_paused: 35,
  bonding_graduation_ready: 40,
  bonding_graduation_pending: 45,
  bonding_refunding: 50,
  bonding_graduated: 60,
  bonding_settled: 70,
  bonding_cancelled: 80,
};

/** Empty loses. Otherwise the higher rank wins, and a tie keeps `b`. */
function pickBondingLaunchState(a, b) {
  const left = String(a ?? '').trim();
  const right = String(b ?? '').trim();
  if (!left) return right;
  if (!right) return left;
  const leftRank = BONDING_LAUNCH_STATE_RANK[left] ?? 0;
  const rightRank = BONDING_LAUNCH_STATE_RANK[right] ?? 0;
  return rightRank >= leftRank ? right : left;
}

/** 1 SUI = 1e9 mist. Integer math keeps a fractional reserve off floating point. */
const ONE_SUI_MIST = 1_000_000_000n;
/** How often a sale that can still change is re-read. */
const DIRECTORY_POLL_MS = 25_000;

/**
 * One sale, ready for the list and the detail page.
 * @typedef {{
 *   launchState: string;
 *   bondingSalePhase?: string | null;
 *   soldBps: number;
 *   suiReserve: string;
 *   tokensRemainingInSale: string;
 *   tokensSoldNet: string;
 *   isLive: boolean;
 *   isPaused: boolean;
 *   isGraduated: boolean;
 *   bondingSaleObjectId?: string | null;
 *   bondingSalePackageId?: string | null;
 *   lastTradeAt?: string | null;
 *   chainSyncedAt?: string | null;
 *   source?: string;
 * }} BondingDirectorySummary
 */

/** True when the launch state is a bonding state, or the row already has sale ids. */
function isBondingLaunchRow(entry) {
  const state = String(entry?.launchState ?? '').trim();
  if (BONDING_LAUNCH_STATES.has(state)) return true;
  return Boolean(
    entry?.bondingSaleObjectId || entry?.bondingFeeSnapshot || entry?.bondingSalePackageId
  );
}

/**
 * Saved registry row to the view model.
 * Remaining tokens fall back to the original allocation. Sync time prefers
 * the launch-state timestamp over the row's general update time.
 * @param {Record<string, unknown>} entry
 * @returns {BondingDirectorySummary}
 */
function bondingSummaryFromRegistryEntry(entry) {
  const launchState = String(entry?.launchState ?? '').trim();
  return {
    launchState,
    bondingSalePhase:
      entry.bondingSalePhase != null ? String(entry.bondingSalePhase) : null,
    soldBps: Number(entry.soldBps) || 0,
    suiReserve: String(entry.suiReserve ?? '0'),
    tokensRemainingInSale: String(
      entry.tokensRemainingInSale ?? entry.bondingSaleAllocation ?? '0'
    ),
    tokensSoldNet: String(entry.tokensSoldNet ?? '0'),
    isLive: launchState === 'bonding_live',
    isPaused: launchState === 'bonding_paused',
    isGraduated:
      launchState === 'bonding_graduated' || launchState === 'bonding_settled',
    bondingSaleObjectId:
      entry.bondingSaleObjectId != null ? String(entry.bondingSaleObjectId) : null,
    bondingSalePackageId:
      entry.bondingSalePackageId != null ? String(entry.bondingSalePackageId) : null,
    lastTradeAt:
      entry.lastBondingTradeAt != null ? String(entry.lastBondingTradeAt) : null,
    chainSyncedAt:
      entry.launchStateUpdatedAt != null
        ? String(entry.launchStateUpdatedAt)
        : entry.updatedAt != null
          ? String(entry.updatedAt)
          : null,
    source: 'registry',
  };
}

/**
 * One summary from the registry row, the nested bonding object, or both.
 * Registry fields overwrite the nested object. Launch state is then chosen
 * by rank, and the live, paused, and graduated flags are rebuilt from that
 * winner so they cannot disagree with it.
 * @param {Record<string, unknown> | null | undefined} entry
 * @returns {BondingDirectorySummary | null}
 */
export function resolveBondingSummary(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const fromEntry = isBondingLaunchRow(entry) ? bondingSummaryFromRegistryEntry(entry) : null;
  const nested =
    entry.bonding && typeof entry.bonding === 'object'
      ? /** @type {BondingDirectorySummary} */ (entry.bonding)
      : null;
  if (!fromEntry && !nested) return null;
  if (!nested) return fromEntry;
  if (!fromEntry) return nested;

  const launchState = pickBondingLaunchState(nested.launchState, fromEntry.launchState);
  return {
    ...nested,
    ...fromEntry,
    launchState,
    isLive: launchState === 'bonding_live',
    isPaused: launchState === 'bonding_paused',
    isGraduated:
      launchState === 'bonding_graduated' || launchState === 'bonding_settled',
    bondingSaleObjectId: fromEntry.bondingSaleObjectId ?? nested.bondingSaleObjectId,
    bondingSalePackageId: fromEntry.bondingSalePackageId ?? nested.bondingSalePackageId,
    tokensRemainingInSale:
      fromEntry.tokensRemainingInSale ?? nested.tokensRemainingInSale,
    tokensSoldNet: fromEntry.tokensSoldNet ?? nested.tokensSoldNet,
    soldBps: fromEntry.soldBps ?? nested.soldBps,
    suiReserve: fromEntry.suiReserve ?? nested.suiReserve,
    bondingSalePhase: fromEntry.bondingSalePhase ?? nested.bondingSalePhase,
    lastTradeAt: fromEntry.lastTradeAt ?? nested.lastTradeAt,
    chainSyncedAt: fromEntry.chainSyncedAt ?? nested.chainSyncedAt,
    source: fromEntry.source ?? nested.source,
  };
}

/**
 * Same summary shape, from the public on-chain read.
 * `tradeOpen` and `pause` count even when the launch-state string has not caught up.
 * @param {Record<string, unknown> | null | undefined} state
 * @returns {BondingDirectorySummary | null}
 */
export function bondingSummaryFromPublicState(state) {
  if (!state || typeof state !== 'object') return null;
  const launchState = String(state.launchState ?? '').trim();
  if (!launchState) return null;
  return {
    launchState,
    bondingSalePhase:
      state.bondingSalePhase != null ? String(state.bondingSalePhase) : null,
    soldBps: Number(state.soldBps) || 0,
    suiReserve: String(state.suiReserve ?? '0'),
    tokensRemainingInSale: String(state.tokensRemainingInSale ?? '0'),
    tokensSoldNet: String(state.tokensSoldNet ?? '0'),
    isLive: launchState === 'bonding_live' || state.tradeOpen === true,
    isPaused: launchState === 'bonding_paused' || Boolean(state.pause),
    isGraduated:
      launchState === 'bonding_graduated' || launchState === 'bonding_settled',
    bondingSaleObjectId:
      state.bondingSaleObjectId != null ? String(state.bondingSaleObjectId) : null,
    bondingSalePackageId:
      state.bondingSalePackageId != null ? String(state.bondingSalePackageId) : null,
    lastTradeAt: state.lastTradeAt != null ? String(state.lastTradeAt) : null,
    chainSyncedAt: state.chainSyncedAt != null ? String(state.chainSyncedAt) : null,
    source: state.source != null ? String(state.source) : 'registry',
  };
}

/**
 * Configured and finished sales do not move on a timer.
 * Poll only live, paused, graduating, and refunding sales.
 * @param {BondingDirectorySummary | null | undefined} bonding
 */
export function shouldRefreshBondingStatus(bonding) {
  if (!bonding) return false;
  const state = String(bonding.launchState ?? '');
  return (
    bonding.isLive ||
    bonding.isPaused ||
    state === 'bonding_graduation_ready' ||
    state === 'bonding_graduation_pending' ||
    state === 'bonding_refunding'
  );
}

export { DIRECTORY_POLL_MS };

/**
 * Basis points to a 0–100 display percent. Out-of-range values clamp.
 * @param {number | string | null | undefined} soldBps
 */
export function soldBpsToPercent(soldBps) {
  const bps = Number(soldBps);
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Math.max(0, Math.min(100, bps / 100));
}

/**
 * Mist integer to a short SUI string. At most four fractional digits.
 * Invalid input renders an em dash instead of throwing into the row.
 * @param {string | number | bigint | null | undefined} mist
 */
export function formatSuiFromMist(mist) {
  try {
    const value = BigInt(String(mist ?? '0'));
    const whole = value / ONE_SUI_MIST;
    const fraction = value % ONE_SUI_MIST;
    if (fraction === 0n) return `${whole.toLocaleString('en-US')} SUI`;
    const fractionText = fraction
      .toString()
      .padStart(9, '0')
      .replace(/0+$/, '')
      .slice(0, 4);
    return `${whole.toLocaleString('en-US')}.${fractionText} SUI`;
  } catch {
    return '—';
  }
}

/** Whole-token count for the facts list. Invalid input renders an em dash. */
export function formatWholeTokens(raw) {
  try {
    const value = BigInt(String(raw ?? '0'));
    return `${value.toLocaleString('en-US')} tokens`;
  } catch {
    return '—';
  }
}

/** "Traded 5m ago", or null when the timestamp is missing so the row can be omitted. */
export function formatRelativeTradeTime(iso) {
  const text = String(iso ?? '').trim();
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const deltaMs = Date.now() - at;
  if (deltaMs < 60_000) return 'Traded just now';
  if (deltaMs < 3_600_000) {
    const mins = Math.max(1, Math.round(deltaMs / 60_000));
    return `Traded ${mins}m ago`;
  }
  if (deltaMs < 86_400_000) {
    const hours = Math.max(1, Math.round(deltaMs / 3_600_000));
    return `Traded ${hours}h ago`;
  }
  const days = Math.max(1, Math.round(deltaMs / 86_400_000));
  return `Traded ${days}d ago`;
}

/** Badge text. A live sale includes the percent once any of it has sold. */
export function bondingStatusLabel(bonding) {
  if (!bonding) return '';
  const state = String(bonding.launchState ?? '');
  if (state === 'bonding_configured') return 'Bonding configured';
  if (state === 'bonding_allocation_pending') return 'Awaiting sale allocation';
  if (state === 'bonding_live') {
    if (bonding.isPaused) return 'Bonding paused';
    const pct = soldBpsToPercent(bonding.soldBps);
    return pct > 0 ? `Live · ${pct.toFixed(1)}% sold` : 'Live bonding sale';
  }
  if (state === 'bonding_paused') return 'Bonding paused';
  if (state === 'bonding_graduation_ready') return 'Graduation ready';
  if (state === 'bonding_graduation_pending') return 'Graduating';
  if (state === 'bonding_graduated') return 'Graduated';
  if (state === 'bonding_refunding') return 'Refunding';
  if (state === 'bonding_cancelled') return 'Cancelled';
  if (state === 'bonding_settled') return 'Settled';
  if (bonding.bondingSalePhase) {
    return `Bonding · ${bonding.bondingSalePhase.replace(/_/g, ' ')}`;
  }
  return 'Bonding';
}

/**
 * Badge class suffix. The component does not switch on launch-state strings.
 * @param {BondingDirectorySummary | null | undefined} bonding
 * @returns {'live' | 'paused' | 'graduation' | 'refunding' | 'complete' | 'setup' | 'neutral'}
 */
export function bondingStatusTone(bonding) {
  if (!bonding) return 'neutral';
  const state = String(bonding.launchState ?? '');
  if (state === 'bonding_live' && !bonding.isPaused) return 'live';
  if (state === 'bonding_paused' || bonding.isPaused) return 'paused';
  if (state === 'bonding_graduation_ready' || state === 'bonding_graduation_pending') {
    return 'graduation';
  }
  if (state === 'bonding_refunding') return 'refunding';
  if (state === 'bonding_graduated' || state === 'bonding_settled') return 'complete';
  if (state === 'bonding_configured' || state === 'bonding_allocation_pending') return 'setup';
  return 'neutral';
}

/**
 * Bar label and detail, or null when there is nothing to draw.
 * A live or paused sale with 0% sold still returns "Sale open".
 * @param {BondingDirectorySummary | null | undefined} bonding
 */
export function bondingProgressView(bonding) {
  if (!bonding) return null;
  const percent = soldBpsToPercent(bonding.soldBps);
  if (percent <= 0 && !bonding.isLive && !bonding.isPaused) return null;
  return {
    percent,
    label:
      percent > 0
        ? `${percent.toLocaleString('en-US', { maximumFractionDigits: 1 })}% of sale sold`
        : 'Sale open',
    detail: `${formatWholeTokens(bonding.tokensSoldNet)} sold · ${formatSuiFromMist(bonding.suiReserve)} in reserve`,
  };
}
