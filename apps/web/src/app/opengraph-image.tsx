import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

export const alt = "Titan — Adaptive Fitness Coach";
export const contentType = "image/png";
export const size = { height: 630, width: 1200 };

// The OG card is rendered by Satori (next/og), a standalone flexbox surface that
// does not run Panda or read our token CSS. The brand constants are therefore
// inlined here as literals, mirrored from the design tokens: `background` and
// `accent`, plus the `foreground`/`muted` text shades used across the app.
const BACKGROUND = "#0A0A0B";
const ACCENT = "#3D7BFF";
const FOREGROUND = "#FAFAFA";
const MUTED = "#A1A1AA";

// The brand faces, vendored alongside this route (Barlow / Barlow Condensed,
// SIL OFL) so the wordmark renders in the real typeface rather than Satori's
// fallback. The card is statically prerendered, so these are read once at build.
const CONDENSED = "Barlow Condensed";
const SANS = "Barlow";

/** The social share card served at `/opengraph-image`. */
const OpengraphImage = async (): Promise<ImageResponse> => {
  const [condensed, sans] = await Promise.all([
    readFile(new URL("./_fonts/BarlowCondensed-Bold.woff", import.meta.url)),
    readFile(new URL("./_fonts/Barlow-Regular.woff", import.meta.url)),
  ]);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: BACKGROUND,
        display: "flex",
        flexDirection: "column",
        gap: 56,
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Monolith />
      <div
        style={{
          color: FOREGROUND,
          display: "flex",
          fontFamily: CONDENSED,
          fontSize: 150,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        TITAN
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: SANS,
          fontSize: 40,
          textAlign: "center",
        }}
      >
        Adaptive strength coaching that adjusts every session.
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { data: condensed, name: CONDENSED, style: "normal", weight: 700 },
        { data: sans, name: SANS, style: "normal", weight: 400 },
      ],
    },
  );
};

export default OpengraphImage;

// "The Monolith" mark — an accent slab resting on three pillars — drawn with
// boxes so it renders without an external asset. Proportions and rounding are
// scaled 2.5× from the 96-unit `TitanMark` viewBox: a 72×14 slab centered over
// three 14×54 pillars set 7 apart, all with a 2-unit corner radius.
const Monolith = () => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: 15,
    }}
  >
    <div
      style={{ background: ACCENT, borderRadius: 5, height: 35, width: 180 }}
    />
    <div style={{ display: "flex", gap: 17.5 }}>
      <Pillar />
      <Pillar />
      <Pillar />
    </div>
  </div>
);

const Pillar = () => (
  <div
    style={{ background: FOREGROUND, borderRadius: 5, height: 135, width: 35 }}
  />
);
