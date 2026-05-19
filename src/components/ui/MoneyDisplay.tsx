type MoneyDisplayProps = {
  amount: number;
  currency?: string;
  className?: string;
};

export function MoneyDisplay({ amount, currency = "ARS", className = "" }: MoneyDisplayProps) {
  const abs = Math.abs(amount);
  const isNegative = amount < 0;
  const [integer, decimals] = abs
    .toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(",");

  return (
    <span className={`tabular-nums inline-flex items-baseline gap-1 ${className}`}>
      <span className="text-byg-muted text-[0.82em] font-medium">
        {isNegative ? "−" : ""}{currency}
      </span>
      <span>
        {integer}
        <span className="text-byg-muted opacity-70">,{decimals}</span>
      </span>
    </span>
  );
}
