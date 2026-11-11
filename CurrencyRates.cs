public static class CurrencyRates
{
    private static readonly IReadOnlyDictionary<string, decimal[]> WeeklyRates =
        new Dictionary<string, decimal[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["USD"] = [92.14m, 91.87m, 92.33m, 93.05m, 92.76m, 93.18m, 92.91m],
            ["EUR"] = [100.52m, 100.31m, 100.84m, 101.16m, 100.95m, 101.43m, 101.08m],
            ["CNY"] = [12.71m, 12.68m, 12.74m, 12.79m, 12.76m, 12.82m, 12.78m]
        };

    public static RatesResponse? Get(string currency)
    {
        if (!WeeklyRates.TryGetValue(currency, out var rates))
        {
            return null;
        }

        return new RatesResponse(currency.ToUpperInvariant(), [.. rates],
            decimal.Round(rates.Average(), 2, MidpointRounding.AwayFromZero));
    }
}

public sealed record RatesResponse(string Currency, decimal[] Rates, decimal Avg);
