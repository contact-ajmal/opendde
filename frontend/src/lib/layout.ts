/**
 * Global layout / sizing constants for OpenDDE.
 *
 * These are the single source of truth for pixel measurements used across
 * the app. Prefer importing from here over hard-coding heights/widths so
 * that future global adjustments only need to touch one file.
 *
 * Tailwind arbitrary values can reference these via inline style; for
 * class-based usage, keep the Tailwind literal close to the constant
 * (e.g. h-9 = 36px = SECTION_HEADER_HEIGHT).
 */

// ── Chrome ─────────────────────────────────────────────────
export const SIDEBAR_WIDTH_COLLAPSED = 56;
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const TOPBAR_HEIGHT = 48;
export const ACTION_BAR_HEIGHT = 40;
export const SECTION_HEADER_HEIGHT = 36;

// ── Content primitives ────────────────────────────────────
export const TABLE_ROW_HEIGHT = 44;
export const COMPACT_CARD_HEIGHT = 64;
export const CHART_HEIGHT = 280;
export const VIEWER_MIN_HEIGHT = 400;

// ── Buttons / inputs / tabs / badges ──────────────────────
export const BUTTON_HEIGHT_SM = 28;
export const BUTTON_HEIGHT_DEFAULT = 36;
export const BUTTON_HEIGHT_LG = 40;
export const INPUT_HEIGHT = 40;
export const TAB_HEIGHT = 36;
export const BADGE_HEIGHT = 24;

// ── Content widths ────────────────────────────────────────
export const MARKETING_MAX_WIDTH = 1200;
export const DOCS_MAX_WIDTH = 720;
export const LEARN_MAX_WIDTH = 680;

// ── Spacing ────────────────────────────────────────────────
export const SECTION_GAP = 16;   // between major sections
export const CARD_GAP = 8;       // between cards in a grid
export const ELEMENT_GAP = 8;    // between elements within a card
export const PANEL_PADDING = 12; // padding inside panels
export const LABEL_GAP = 4;      // between a label and its content
export const HEADING_BODY_GAP = 8; // between heading and body text

// ── Radius ─────────────────────────────────────────────────
export const RADIUS_CARD = 8;
export const RADIUS_BUTTON = 6;
export const RADIUS_INPUT = 6;
export const RADIUS_BADGE = 4;
export const RADIUS_PANEL = 0;   // panels are flush with layout
export const RADIUS_VIEWER = 0;  // 3D viewer is flush
