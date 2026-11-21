import { useEffect, useState } from "react";

export default function StatCard({
  title,
  value,
  suffix = "",
  subtitle,
  icon,
  accent = "gold",
}) {
  const numericTarget = typeof value === "number" ? value : null;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate =
    numericTarget !== null && numericTarget !== 0 && !prefersReducedMotion;

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    const duration = 550;
    const startTime = performance.now();
    let frameId;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * numericTarget));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [shouldAnimate, numericTarget]);

  const displayValue = shouldAnimate ? animatedValue : value;

  const formattedValue =
    typeof displayValue === "number"
      ? displayValue.toLocaleString("fr-FR")
      : displayValue;

  return (
    <div className={`velora-stat-card accent-${accent}`}>
      <div className="velora-stat-top">
        <span className="velora-stat-title">{title}</span>
        {icon && <span className="velora-stat-icon">{icon}</span>}
      </div>

      <div className="velora-stat-value">
        {formattedValue}
        {suffix ? <span className="velora-stat-suffix"> {suffix}</span> : null}
      </div>

      {subtitle && <div className="velora-stat-sub">{subtitle}</div>}
    </div>
  );
}