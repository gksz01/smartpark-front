using SmartPark.Aplicacao.Veiculos;
using SmartPark.Aplicacao.Veiculos.Atualizar;
using SmartPark.Aplicacao.Veiculos.Criar;
using SmartPark.Aplicacao.Veiculos.Excluir;
using SmartPark.Aplicacao.Veiculos.Listar;

namespace SmartPark.Aplicacao.Testes;

public class VeiculosTestes : CenarioAplicacao
{
    [Fact]
    public async Task CriarAsync_DeveGravarPlacaNormalizada_EAparecerNaLista()
    {
        var criado = Sucesso(await new CriarVeiculoManipulador(Contexto).ExecutarAsync(new("shopping", new DadosVeiculo("Novo", "abc-1234", "Gol", "Prata"))));

        Assert.Equal("ABC1234", criado.Placa);
        Assert.Equal("ABC-1234", criado.PlacaFormatada);
        var lista = Sucesso(await new ListarVeiculosManipulador(Contexto).ExecutarAsync(new("shopping")));
        Assert.Contains(lista, veiculo => veiculo.Placa == "ABC1234");
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoPlacaJaExistirNoTenant()
    {
        var erro = Falha(await new CriarVeiculoManipulador(Contexto).ExecutarAsync(new("shopping", new DadosVeiculo("Repetido", "bra-2e19", "X", "Y"))));

        Assert.Equal("Já existe um veículo com a placa BRA2E19 neste cliente.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveExigirCampoDaLps_QuandoEmpresaSemTagRfid()
    {
        var erro = Falha(await new CriarVeiculoManipulador(Contexto).ExecutarAsync(new("company", new DadosVeiculo("Carro", "ABC1D23", "Onix", "Preto"))));

        Assert.Equal("Informe o campo Tag RFID.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoPlacaInvalida()
    {
        var erro = Falha(await new CriarVeiculoManipulador(Contexto).ExecutarAsync(new("shopping", new DadosVeiculo("Carro", "12ABC34", "Onix", "Preto"))));

        Assert.Equal("Placa inválida. Use o padrão ABC1234 ou ABC1D23.", erro);
    }

    [Fact]
    public async Task AtualizarAsync_NaoDeveAlterarVeiculoDeOutroTenant()
    {
        var idDoShopping = IdVeiculo("shopping", "SPK1A23");

        var erro = Falha(await new AtualizarVeiculoManipulador(Contexto).ExecutarAsync(new("hospital", idDoShopping, new DadosVeiculo("X", "ABC1234", "Y", "Z"))));

        Assert.Equal("Veículo não encontrado.", erro);
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoVeiculoPossuiReservas()
    {
        var erro = Falha(await new ExcluirVeiculoManipulador(Contexto).ExecutarAsync(new("shopping", IdVeiculo("shopping", "BRA2E19"))));

        Assert.Equal("Este veículo possui reservas. Exclua as reservas dele antes.", erro);
    }

    [Fact]
    public async Task ExcluirAsync_DeveRemover_QuandoVeiculoSemVinculos()
    {
        Sucesso(await new ExcluirVeiculoManipulador(Contexto).ExecutarAsync(new("company", IdVeiculo("company", "NXR5D67"))));

        await using var leitura = CriarContexto();
        Assert.DoesNotContain(leitura.Veiculos, veiculo => veiculo.Placa == "NXR5D67");
    }
}
