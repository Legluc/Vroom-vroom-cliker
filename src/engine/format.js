function formatHorses(value) {
  if (Number.isNaN(value)) {
    throw new TypeError("formatHorses expects a valid number");
  }

  const truncated = Math.trunc(value);
  const absoluteValue = Math.abs(truncated);
  const sign = truncated < 0 ? "-" : "";

  if (absoluteValue < 1000) {
    return String(truncated);
  }

  if (absoluteValue < 1_000_000) {
    return `${sign}${Math.trunc(absoluteValue / 1000)}K`;
  }

  if (absoluteValue < 1_000_000_000) {
    return `${sign}${Math.trunc(absoluteValue / 1_000_000)}M`;
  }

  return `${sign}${Math.trunc(absoluteValue / 1_000_000_000)}MM`;
}

module.exports = {
  formatHorses,
};
