using SmartPark.Aplicacao;
using SmartPark.Infraestrutura;
using SmartPark.Web;
using SmartPark.Web.Compartilhado.Crud;
using SmartPark.Web.Compartilhado.Sessao;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents().AddInteractiveServerComponents();

// Raiz de composição: só aqui a Web conhece a Infraestrutura, para registrar o banco.
builder.Services
    .AdicionarAplicacao()
    .AdicionarInfraestrutura(builder.Configuration);

builder.Services.AddScoped<SessaoUsuario>();
builder.Services.AddScoped<ExecutorCasosDeUso>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/erro", createScopeForErrors: true);
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/nao-encontrado", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>().AddInteractiveServerRenderMode();

// Aplica as migrações e popula as tabelas vazias com os dados de demonstração.
await app.Services.InicializarBancoAsync();

app.Run();
