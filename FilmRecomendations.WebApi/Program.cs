using FilmRecomendations.Services;
using FilmRecomendations.Db;
using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Db.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;
using FilmRecomendations.Db.Repos;
using Microsoft.Extensions.FileProviders;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using System.ClientModel;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

Environment.SetEnvironmentVariable("OPENAI_API_KEY", builder.Configuration["OpenAI:ApiKey"]);
Environment.SetEnvironmentVariable("TMDb:ApiKey", builder.Configuration["TMDb:ApiKey"]);
Environment.SetEnvironmentVariable("GROK_API_KEY", builder.Configuration["GROK:ApiKey"]);
Environment.SetEnvironmentVariable("TMDb:BaseUrl", builder.Configuration["TMDb:BaseUrl"]);

// 1) Options
builder.Services.Configure<AiOptions>(builder.Configuration.GetSection("AI"));


// 2) Caching
builder.Services.AddMemoryCache();


// 3) ChatClient singleton
builder.Services.AddSingleton<ChatClient>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<AiOptions>>().Value;


    // Prefer environment variable over config file
    var apiKey = Environment.GetEnvironmentVariable("GROK_API_KEY")
    ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY")
    ?? opts.ApiKey;


    if (string.IsNullOrWhiteSpace(apiKey))
        throw new InvalidOperationException("AI API key is missing. Set GROK_API_KEY/OPENAI_API_KEY or AI:ApiKey.");


    var cred = new ApiKeyCredential(apiKey);
    var clientOptions = new OpenAI.OpenAIClientOptions { Endpoint = opts.Endpoint };


    return new ChatClient(opts.Model, cred, clientOptions);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        //avoiding circular references in json objects:
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

//dbservice - MongoDB Configuration
builder.Services.Configure<MongoSettings>(builder.Configuration.GetSection("MongoDB"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(settings.DatabaseName);
});

// Register MongoDB Context and Services
builder.Services.AddScoped<MongoDbContext>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMongoIndexService, MongoIndexService>();

// Register ASP.NET Core Identity PasswordHasher for secure password hashing
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, PasswordHasher<ApplicationUser>>();

// Configure Rate Limiting for authentication endpoints
builder.Services.AddRateLimiter(options =>
{
    // Strict rate limiting policy for authentication endpoints (login/register)
    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIdentifier(context),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5, // Allow 5 attempts
                Window = TimeSpan.FromMinutes(15), // Per 15-minute window
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0 // No queueing for auth endpoints - fail fast
            }));

    // Global rate limiting policy (more lenient for general API usage)
    options.AddPolicy("GlobalPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetClientIdentifier(context),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100, // Allow 100 requests
                Window = TimeSpan.FromMinutes(1), // Per minute
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            }));

    // Configure rejection response with security headers
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = 429; // Too Many Requests
        context.HttpContext.Response.Headers["Retry-After"] = "900"; // 15 minutes for auth endpoints
        context.HttpContext.Response.Headers["X-RateLimit-Limit"] = "5";
        context.HttpContext.Response.Headers["X-RateLimit-Remaining"] = "0";

        await context.HttpContext.Response.WriteAsync(
            "Rate limit exceeded. Too many authentication attempts. Please try again later.",
            cancellationToken);
    };
});

// Helper function to get client identifier for rate limiting
static string GetClientIdentifier(HttpContext context)
{
    // Check for forwarded IP first (in case behind proxy/load balancer)
    var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
    if (!string.IsNullOrEmpty(forwardedFor))
    {
        return forwardedFor.Split(',')[0].Trim();
    }

    // Fallback to connection remote IP
    return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
        {
            var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwtKey))
                {
                    KeyId = "myKeyId"
                }
            };
        });

// Register application services
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<IMovieRepo, MovieRepo>();
builder.Services.AddHttpClient<ITMDBService, TMDBService>();


// Update CORS policy so that only the frontend on http://localhost:5173 is allowed.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://mango-pebble-07db6db03.3.azurestaticapps.net")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Create MongoDB indexes on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var indexService = scope.ServiceProvider.GetRequiredService<IMongoIndexService>();
        await indexService.CreateIndexesAsync();
        Console.WriteLine("MongoDB indexes created successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Failed to create MongoDB indexes: {ex.Message}");
        // Don't fail startup if index creation fails
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.MapOpenApi();
}

app.UseSwagger();
app.UseStaticFiles();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
});

string webRootPath = builder.Environment.WebRootPath;
if (string.IsNullOrEmpty(webRootPath))
{
    webRootPath = builder.Environment.ContentRootPath; // Fallback to project root
    Console.WriteLine($"WebRootPath is null, falling back to ContentRootPath: {webRootPath}");
}

var uploadsPath = Path.Combine(webRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"Created Uploads directory at: {uploadsPath}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/Uploads"
});

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseRateLimiter(); // Add rate limiting middleware

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
