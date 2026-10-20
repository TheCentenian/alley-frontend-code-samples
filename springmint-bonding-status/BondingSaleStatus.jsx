import React from 'react';
import {
  bondingProgressView,
  bondingStatusLabel,
  bondingStatusTone,
  formatRelativeTradeTime,
  formatSuiFromMist,
  formatWholeTokens,
  soldBpsToPercent,
} from '../lib/bonding-status.js';

/**
 * Compact is the list row: a badge and a thin bar.
 * The default is the detail: badge, progress, reserve, and last trade.
 * Labels and tones come from the view model. This component does not interpret launch states.
 * @param {{
 *   bonding: import('../lib/bonding-status.js').BondingDirectorySummary;
 *   compact?: boolean;
 *   showProgress?: boolean;
 *   loading?: boolean;
 *   source?: string;
 * }} props
 */
export function BondingSaleStatus({
  bonding,
  compact = false,
  showProgress = true,
  loading = false,
  source,
}) {
  const tone = bondingStatusTone(bonding);
  const label = bondingStatusLabel(bonding);
  const progress = showProgress ? bondingProgressView(bonding) : null;
  const tradeHint = formatRelativeTradeTime(bonding.lastTradeAt);

  if (compact) {
    return (
      <div className="sm-bonding-status sm-bonding-status--compact">
        <span className={`sm-badge sm-badge--bonding sm-badge--bonding-${tone}`}>
          {loading ? 'Updating…' : label}
        </span>
        {progress && progress.percent > 0 && (
          <div className="sm-bonding-status-inline-track" aria-hidden>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sm-bonding-status">
      <div className="sm-bonding-status-head">
        <span className={`sm-badge sm-badge--bonding sm-badge--bonding-${tone}`}>
          {loading ? 'Updating sale…' : label}
        </span>
        {source && (
          <span className="sm-muted sm-bonding-status-source" title="Bonding state data source">
            {/* Public reads are tagged "sonar". Readers should see where the numbers came from. */}
            {source === 'sonar' ? 'On-chain' : 'Registry'}
          </span>
        )}
      </div>
      {progress && (
        <div className="sm-bonding-status-progress">
          <div className="sm-bonding-status-meta">
            <span>{progress.label}</span>
            <strong>{progress.detail}</strong>
          </div>
          <div className="sm-bonding-status-track" aria-hidden>
            {/* A live sale at 0% still shows a sliver, so the bar does not look missing. */}
            <span style={{ width: `${Math.max(progress.percent, bonding.isLive ? 2 : 0)}%` }} />
          </div>
        </div>
      )}
      <dl className="sm-bonding-status-facts">
        <div>
          <dt>Sale progress</dt>
          <dd>
            {soldBpsToPercent(bonding.soldBps).toLocaleString('en-US', {
              maximumFractionDigits: 1,
            })}
            %
          </dd>
        </div>
        <div>
          <dt>Trade reserve</dt>
          <dd>{formatSuiFromMist(bonding.suiReserve)}</dd>
        </div>
        <div>
          <dt>Tokens sold</dt>
          <dd>{formatWholeTokens(bonding.tokensSoldNet)}</dd>
        </div>
        <div>
          <dt>Remaining in sale</dt>
          <dd>{formatWholeTokens(bonding.tokensRemainingInSale)}</dd>
        </div>
        {tradeHint && (
          <div>
            <dt>Last trade</dt>
            <dd>{tradeHint}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
