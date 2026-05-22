using MultiPExec.Api.Hubs;
using MultiPExec.Application.Interfaces;
using MultiPExec.Infrastructure.Execution;
using MultiPExec.Infrastructure.State;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; 
});

builder.Services.AddSingleton<IWorkspaceManager, WorkspaceManager>();
builder.Services.AddSingleton<Executor>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ViteCors", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetValue<string>("Frontend:BaseUrl") ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build(); // -------------------

app.UseCors("ViteCors");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseAuthorization();
app.MapControllers();

app.MapHub<EditorHub>("/editor");

app.Run();