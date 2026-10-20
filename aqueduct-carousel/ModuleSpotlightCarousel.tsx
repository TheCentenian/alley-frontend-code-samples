'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import type { ModuleEntry } from '@/lib/modules-catalog';
import { marketingStyles as styles } from '@/lib/marketing-styles';

/**
 * Horizontal module row.
 * CSS places the arrows: beside the track from 640px up, centered underneath on a phone.
 * This component only measures one card and enables or disables those arrows.
 */

/** Live CSS gap, so a stylesheet change does not desync the scroll step. Falls back to 12px. */
function scrollGapPx(el: HTMLElement): number {
  const g = getComputedStyle(el).gap;
  if (g.endsWith('px')) return parseFloat(g) || 12;
  return 12;
}

/** Shared arrow button. Both the side pair and the phone pair use it. */
const navBtn: CSSProperties = {
  flexShrink: 0,
  width: 44,
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(148,163,184,0.10)',
  color: '#E8EEF8',
  cursor: 'pointer',
  fontSize: 20,
  lineHeight: 1,
};

/** End of the row: the arrow stays in place and does not accept clicks. */
const navBtnDisabled: CSSProperties = {
  opacity: 0.25,
  pointerEvents: 'none',
};

/** Equal-height card so a short description does not shrink the row. */
const cardShell: CSSProperties = {
  ...styles.card,
  minHeight: 168,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  boxSizing: 'border-box',
};

export function ModuleSpotlightCarousel({ modules }: { modules: ModuleEntry[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  /** True when that direction still has a card outside the visible area. */
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  /** Compare scroll position to the track's overflow. A few pixels of slack hide subpixel rounding. */
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    // Card width follows the viewport, so resize has to recompute the arrows too.
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, modules.length]);

  /** Move one card plus the gap. -1 is previous, 1 is next. Both button pairs call this. */
  const step = useCallback((dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>('[data-carousel-item]');
    if (!card) return;
    const gap = scrollGapPx(scroller);
    const w = card.getBoundingClientRect().width;
    scroller.scrollBy({ left: dir * (w + gap), behavior: 'smooth' });
  }, []);

  if (modules.length === 0) {
    return null;
  }

  // One card already fits. Arrows and the swipe hint would have nothing to do.
  const showArrows = modules.length > 1;

  return (
    <div style={{ marginTop: 8 }} role="region" aria-label="Highlighted modules carousel">
      <div className="aq-module-carousel">
        {/* Side previous control. Hidden below 640px by .aq-module-carousel-prev. */}
        {showArrows ? (
          <button
            type="button"
            className="aq-module-carousel-prev"
            aria-label="Previous modules"
            disabled={!canPrev}
            onClick={() => step(-1)}
            style={{ ...navBtn, ...(canPrev ? {} : navBtnDisabled) }}
          >
            <span aria-hidden style={{ display: 'block', marginTop: -2 }}>
              ‹
            </span>
          </button>
        ) : null}

        {/* Snap-scrolling track. tabIndex lets keyboard users focus the row. */}
        <ul
          ref={scrollerRef}
          className="aq-module-carousel-track"
          tabIndex={0}
          style={{
            outline: 'none',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {/* data-carousel-item marks each card so step() can measure the first one. */}
          {modules.map((m) => (
            <li
              key={m.name}
              data-carousel-item
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                width: 'min(280px, 100%)',
                boxSizing: 'border-box',
              }}
            >
              <div style={cardShell}>
                <h3 style={{ ...styles.cardTitle, fontSize: 17, marginBottom: m.subtitle ? 4 : 10 }}>{m.name}</h3>
                {m.subtitle ? (
                  <p
                    style={{
                      margin: '0 0 10px',
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: 'rgba(226,232,240,0.62)',
                    }}
                  >
                    {m.subtitle}
                  </p>
                ) : null}
                <p style={{ ...styles.cardBody, fontSize: 14, flex: 1 }}>{m.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Side next control. Hidden below 640px by .aq-module-carousel-next. */}
        {showArrows ? (
          <button
            type="button"
            className="aq-module-carousel-next"
            aria-label="Next modules"
            disabled={!canNext}
            onClick={() => step(1)}
            style={{ ...navBtn, ...(canNext ? {} : navBtnDisabled) }}
          >
            <span aria-hidden style={{ display: 'block', marginTop: -2 }}>
              ›
            </span>
          </button>
        ) : null}

        {/* Phone controls, centered under the track. Hidden from 640px up. */}
        {showArrows ? (
          <div className="aq-module-carousel-mobile-nav">
            <button
              type="button"
              aria-label="Previous modules"
              disabled={!canPrev}
              onClick={() => step(-1)}
              style={{ ...navBtn, ...(canPrev ? {} : navBtnDisabled) }}
            >
              <span aria-hidden style={{ display: 'block', marginTop: -2 }}>
                ‹
              </span>
            </button>
            <button
              type="button"
              aria-label="Next modules"
              disabled={!canNext}
              onClick={() => step(1)}
              style={{ ...navBtn, ...(canNext ? {} : navBtnDisabled) }}
            >
              <span aria-hidden style={{ display: 'block', marginTop: -2 }}>
                ›
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Shown only when the row can actually move. */}
      {showArrows ? (
        <p style={{ ...styles.small, marginTop: 10, textAlign: 'center' }}>
          Swipe the row horizontally to browse, or use the arrows. Cards snap into place. Several can show at once on
          wider screens.
        </p>
      ) : null}
    </div>
  );
}
