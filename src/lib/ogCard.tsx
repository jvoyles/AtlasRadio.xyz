// Shared 1200x630 social card (rendered by next/og). Satori only supports
// flexbox and a CSS subset, so the "globe" is a gradient circle with dots.

const DOTS: [number, number, number][] = [
  [92, 60, 14], [150, 120, 10], [210, 80, 12], [250, 170, 16], [120, 210, 12], [190, 250, 10],
  [70, 160, 9], [260, 250, 11], [140, 300, 13], [225, 315, 9], [300, 120, 9], [60, 250, 10],
];
const STARS: [number, number, number][] = [
  [600, 40, 2], [780, 60, 3], [900, 40, 2], [1100, 80, 3], [1150, 300, 2], [1130, 420, 3],
  [980, 580, 3], [860, 595, 2], [700, 590, 3], [1040, 560, 2], [740, 300, 2], [30, 300, 2],
];

export function OgCard({
  eyebrow,
  title,
  subtitle,
  chips = [],
  cta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  chips?: string[];
  cta?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "radial-gradient(ellipse at 70% 50%, #12305a 0%, #0C1B33 45%, #081222 100%)",
        color: "#e7ebf0",
        fontFamily: "sans-serif",
      }}
    >
      {STARS.map(([x, y, r], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: 999, background: "rgba(255,255,255,0.75)" }} />
      ))}

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 64px 72px", width: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <span style={{ fontSize: 44 }}>🌍</span>
          <span>{eyebrow}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: title.length > 40 ? 58 : 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.35, color: "rgba(231,235,240,0.72)" }}>{subtitle}</div>
          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {chips.map((c) => (
                <div key={c} style={{ display: "flex", padding: "8px 20px", borderRadius: 999, background: "rgba(255,255,255,0.1)", fontSize: 24 }}>{c}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: "#ff8a52", fontWeight: 700 }}>
          <div style={{ display: "flex", width: 16, height: 16, borderRadius: 999, background: "#ff6a2b" }} />
          <span>{cta ?? "Listen live — free, no account"}</span>
        </div>
      </div>

      <div style={{ display: "flex", position: "absolute", right: 60, top: 115, width: 400, height: 400 }}>
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 400,
            height: 400,
            borderRadius: 999,
            background: "radial-gradient(circle at 34% 30%, #8fbfff 0%, #2f6feb 45%, #15328f 100%)",
            boxShadow: "0 0 90px 24px rgba(107,150,245,0.45)",
          }}
        >
          {DOTS.map(([x, y, r], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: r * 2,
                height: r * 2,
                borderRadius: 999,
                background: "#ff6a2b",
                border: "3px solid rgba(255,255,255,0.9)",
                boxShadow: "0 0 18px 4px rgba(255,106,43,0.55)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
