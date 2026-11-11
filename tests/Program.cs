using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;

await using var app = CurrencyApplication.Create([
    "--urls", "http://127.0.0.1:0", "--Logging:LogLevel:Default", "Warning"]);
await app.StartAsync();
var address = app.Services.GetRequiredService<IServer>()
    .Features.Get<IServerAddressesFeature>()!.Addresses.Single();
using var client = new HttpClient { BaseAddress = new Uri(address) };
var passed = 0;

try
{
    foreach (var (code, expectedAverage) in new[] { ("USD", 92.61m), ("EUR", 100.90m), ("CNY", 12.75m) })
    {
        using var response = await client.GetAsync($"/api/rates/{code}");
        Equal(HttpStatusCode.OK, response.StatusCode);
        using var data = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Equal("application/json", response.Content.Headers.ContentType!.MediaType);
        Equal(code, data.RootElement.GetProperty("currency").GetString());
        Equal(7, data.RootElement.GetProperty("rates").GetArrayLength());
        Equal(expectedAverage, data.RootElement.GetProperty("avg").GetDecimal());
        passed++;
    }

    var upper = await client.GetStringAsync("/api/rates/CNY");
    Equal(upper, await client.GetStringAsync("/api/rates/cny"));
    Equal(upper, await client.GetStringAsync("/api/rates/CNY?days=2&format=short"));
    passed++;

    await ExpectError("/api/rates/RUB", "Currency not supported");
    await ExpectError("/api/rates/toString", "Currency not supported");
    await ExpectError("/missing", "Not found");
    await ExpectError("/api/rates", "Not found");
    await ExpectError("/missing.css", "Not found");

    foreach (var (path, text) in new[]
    {
        ("/", "Курсы валют за неделю"), ("/index.html", "Курсы валют за неделю"),
        ("/about", "Владимир Кияев"), ("/about.html", "Владимир Кияев"),
        ("/styles.css", ":root"), ("/main.js", "loadRates"),
        ("/sw.js", "currency-week-v2"), ("/manifest.json", "icons"),
        ("/icons/currency-192.svg", "<svg"), ("/icons/currency-512.svg", "<svg")
    })
    {
        using var response = await client.GetAsync(path);
        Equal(HttpStatusCode.OK, response.StatusCode);
        Check((await response.Content.ReadAsStringAsync()).Contains(text, StringComparison.Ordinal),
            $"Expected content at {path}");
        passed++;
    }

    Console.WriteLine($"PASS: {passed} HTTP checks (currencies, errors, pages, PWA assets).");
}
finally
{
    await app.StopAsync();
}

async Task ExpectError(string path, string message)
{
    using var response = await client.GetAsync(path);
    Equal(HttpStatusCode.NotFound, response.StatusCode);
    using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    Equal(message, body.RootElement.GetProperty("error").GetString());
    passed++;
}

static void Equal<T>(T expected, T actual) => Check(EqualityComparer<T>.Default.Equals(expected, actual),
    $"Expected {expected}, got {actual}");

static void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}
