function formatHorses(value) {
  if (Number.isNaN(value)) {
    throw new TypeError("formatHorses expects a valid number");
  }

  const truncated = Math.trunc(value);
  const absoluteValue = Math.abs(truncated);
  const sign = truncated < 0 ? "-" : "";
  const suffixes = [
    { limit: 1_000_000_000_000, divisor: 1_000_000_000, suffix: "B" },
    { limit: 1_000_000_000_000_000, divisor: 1_000_000_000_000, suffix: "T" },
  ];

  if (absoluteValue < 1000) {
    return String(truncated);
  }

  if (absoluteValue < 1_000_000) {
    return `${sign}${(absoluteValue / 1000).toFixed(1)}K`;
  }

  if (absoluteValue < 1_000_000_000) {
    return `${sign}${(absoluteValue / 1_000_000).toFixed(1)}M`;
  }

  for (const { limit, divisor, suffix } of suffixes) {
    if (absoluteValue < limit) {
      return `${sign}${(absoluteValue / divisor).toFixed(1)}${suffix}`;
    }
  }

  return `${sign}${(absoluteValue / 1_000_000_000_000_000).toFixed(1)}P`;
}

export { formatHorses };
