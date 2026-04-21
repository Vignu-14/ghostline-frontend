export function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  return <span className={`spinner ${size === "sm" ? "spinner--sm" : ""}`} aria-label="Loading" />;
}
