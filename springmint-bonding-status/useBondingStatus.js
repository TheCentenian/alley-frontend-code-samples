import { useEffect, useMemo, useState } from 'react';
import { fetchBondingState } from '../lib/tokens-api.js';
import {
  bondingSummaryFromPublicState,
  DIRECTORY_POLL_MS,
  resolveBondingSummary,
  shouldRefreshBondingStatus,
} from '../lib/bonding-status.js';

/**
 * Registry summary immediately, then a public read while the sale can still change.
 * A failed read drops the remote copy so the registry summary stays on screen.
 * @param {Record<string, unknown> | null | undefined} entry
 * @param {{ refresh?: boolean }} [opts]
 */
export function useBondingStatus(entry, opts = {}) {
  const refresh = opts.refresh !== false;
  /** What the list can show before the public read returns. */
  const base = useMemo(() => resolveBondingSummary(entry), [entry]);
  const buildId = String(entry?.buildId ?? entry?.id ?? '').trim();
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(false);

  const needsRefresh = refresh && shouldRefreshBondingStatus(base) && Boolean(buildId);

  useEffect(() => {
    if (!needsRefresh) {
      setRemote(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const state = await fetchBondingState(buildId, { tier: 'directory' });
        if (!cancelled) {
          setRemote(bondingSummaryFromPublicState(state));
        }
      } catch {
        if (!cancelled) setRemote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), DIRECTORY_POLL_MS);
    return () => {
      // Ignore a response that arrives after unmount or after polling stops.
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [needsRefresh, buildId]);

  const bonding = remote ?? base;
  return {
    bonding,
    hasBonding: Boolean(bonding),
    /** First fetch only. Later polls should not flash "Updating…" over a summary we already have. */
    loading: needsRefresh && loading && !remote,
    source: remote?.source ?? base?.source ?? 'registry',
  };
}
