const weeklyRates = Object.freeze({
  USD: Object.freeze([92.14, 91.87, 92.33, 93.05, 92.76, 93.18, 92.91]),
  EUR: Object.freeze([100.52, 100.31, 100.84, 101.16, 100.95, 101.43, 101.08]),
  CNY: Object.freeze([12.71, 12.68, 12.74, 12.79, 12.76, 12.82, 12.78])
});

function getCurrencyRates(currency) {
  const code = String(currency).toUpperCase();
  const rates = weeklyRates[code];

  if (!rates) {
    return null;
  }

  const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

  return {
    currency: code,
    rates: [...rates],
    avg: Number(avg.toFixed(2))
  };
}

module.exports = { getCurrencyRates, weeklyRates };
