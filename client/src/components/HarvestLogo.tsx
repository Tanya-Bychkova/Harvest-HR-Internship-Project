export function HarvestLogo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  return (
    <img
      src={variant === "dark" ? "/dark_logo.png" : "/logo.png"}
      alt="Harvest Agro"
      className={className}
    />
  );
}
