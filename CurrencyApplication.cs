public static class CurrencyApplication
{
    public static WebApplication Create(string[] args)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            Args = args,
            ContentRootPath = AppContext.BaseDirectory,
            WebRootPath = "public"
        });

        if (string.IsNullOrWhiteSpace(builder.Configuration["urls"]))
        {
            var port = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var value)
                && value is > 0 and <= 65535 ? value : 3000;
            builder.WebHost.UseUrls($"http://localhost:{port}");
        }

        var app = builder.Build();
        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.UseRouting();

        app.MapGet("/about", () => Results.File(
            Path.Combine(app.Environment.WebRootPath, "about.html"), "text/html; charset=utf-8"));

        app.MapGet("/api/rates/{currency}", (string currency) =>
        {
            var result = CurrencyRates.Get(currency);
            return result is null
                ? Results.Json(new { error = "Currency not supported" }, statusCode: 404)
                : Results.Ok(result);
        });

        app.MapFallback("{**path}", () => Results.Json(new { error = "Not found" }, statusCode: 404));
        return app;
    }
}
