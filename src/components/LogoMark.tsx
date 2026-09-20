// The logo is the globe emoji, matching the product: a world you tune into.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Airwave"
      className="block select-none leading-none"
      style={{ fontSize: size, width: size, height: size, lineHeight: `${size}px`, textAlign: "center" }}
    >
      🌍
    </span>
  );
}
