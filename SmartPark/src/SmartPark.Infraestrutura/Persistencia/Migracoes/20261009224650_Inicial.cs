using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartPark.Infraestrutura.Persistencia.Migracoes
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Acessos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Pessoa = table.Column<string>(type: "TEXT", nullable: false),
                    Identificador = table.Column<string>(type: "TEXT", nullable: false),
                    Metodo = table.Column<string>(type: "TEXT", nullable: false),
                    Direcao = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Manual = table.Column<bool>(type: "INTEGER", nullable: false),
                    Horario = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MotivoNegacao = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Acessos", x => x.Id);
                    table.CheckConstraint("CK_Acessos_Direcao", "Direcao IN ('Entrada', 'Saida')");
                    table.CheckConstraint("CK_Acessos_Metodo", "Metodo IN ('Lpr', 'Rfid', 'QrCode', 'Manual')");
                    table.CheckConstraint("CK_Acessos_Status", "Status IN ('Pendente', 'Liberado', 'Negado')");
                    table.CheckConstraint("CK_Acessos_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                });

            migrationBuilder.CreateTable(
                name: "Convenios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    TipoBeneficio = table.Column<string>(type: "TEXT", nullable: false),
                    ValorBeneficio = table.Column<int>(type: "INTEGER", nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Convenios", x => x.Id);
                    table.CheckConstraint("CK_Convenios_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.CheckConstraint("CK_Convenios_TipoBeneficio", "TipoBeneficio IN ('Isencao', 'Percentual', 'HorasGratis')");
                    table.CheckConstraint("CK_Convenios_ValorBeneficio", "ValorBeneficio >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Tarifas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Ativa = table.Column<bool>(type: "INTEGER", nullable: false),
                    TipoEstrategia = table.Column<string>(type: "TEXT", nullable: false),
                    Valor = table.Column<double>(type: "REAL", nullable: false),
                    ValorMaximoDiario = table.Column<double>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tarifas", x => x.Id);
                    table.CheckConstraint("CK_Tarifas_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.CheckConstraint("CK_Tarifas_TipoEstrategia", "TipoEstrategia IN ('PorHora', 'Diaria', 'Isenta')");
                    table.CheckConstraint("CK_Tarifas_Valor", "Valor >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Documento = table.Column<string>(type: "TEXT", nullable: false),
                    Perfil = table.Column<string>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.CheckConstraint("CK_Usuarios_Perfil", "Perfil IN ('Motorista', 'Morador', 'Funcionario', 'Visitante', 'Operador', 'Administrador', 'Manobrista')");
                    table.CheckConstraint("CK_Usuarios_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.CheckConstraint("CK_Usuarios_Tipo", "Tipo IN ('Motorista', 'Morador', 'Visitante', 'Funcionario', 'Paciente', 'Acompanhante')");
                });

            migrationBuilder.CreateTable(
                name: "Vagas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Codigo = table.Column<string>(type: "TEXT", nullable: false),
                    Setor = table.Column<string>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vagas", x => x.Id);
                    table.CheckConstraint("CK_Vagas_Status", "Status IN ('Livre', 'Ocupada', 'Bloqueada', 'Reservada')");
                    table.CheckConstraint("CK_Vagas_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                });

            migrationBuilder.CreateTable(
                name: "Veiculos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Placa = table.Column<string>(type: "TEXT", nullable: false),
                    Modelo = table.Column<string>(type: "TEXT", nullable: false),
                    Cor = table.Column<string>(type: "TEXT", nullable: false),
                    Apelido = table.Column<string>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<int>(type: "INTEGER", nullable: true),
                    TagRfid = table.Column<string>(type: "TEXT", nullable: true),
                    Unidade = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiculos", x => x.Id);
                    table.CheckConstraint("CK_Veiculos_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                });

            migrationBuilder.CreateTable(
                name: "Atendimentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Numero = table.Column<string>(type: "TEXT", nullable: false),
                    Paciente = table.Column<string>(type: "TEXT", nullable: false),
                    ConvenioId = table.Column<int>(type: "INTEGER", nullable: false),
                    DataAtendimento = table.Column<DateTime>(type: "TEXT", nullable: false),
                    BeneficioAplicado = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Atendimentos", x => x.Id);
                    table.CheckConstraint("CK_Atendimentos_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.ForeignKey(
                        name: "FK_Atendimentos_Convenios_ConvenioId",
                        column: x => x.ConvenioId,
                        principalTable: "Convenios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reservas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    VeiculoId = table.Column<int>(type: "INTEGER", nullable: false),
                    VagaId = table.Column<int>(type: "INTEGER", nullable: false),
                    Data = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Hora = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    DuracaoHoras = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ValorEstimado = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservas", x => x.Id);
                    table.CheckConstraint("CK_Reservas_DuracaoHoras", "DuracaoHoras > 0");
                    table.CheckConstraint("CK_Reservas_Status", "Status IN ('Pendente', 'Confirmada', 'Cancelada', 'Concluida')");
                    table.CheckConstraint("CK_Reservas_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.ForeignKey(
                        name: "FK_Reservas_Vagas_VagaId",
                        column: x => x.VagaId,
                        principalTable: "Vagas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservas_Veiculos_VeiculoId",
                        column: x => x.VeiculoId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Pagamentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenantId = table.Column<string>(type: "TEXT", nullable: false),
                    Codigo = table.Column<Guid>(type: "TEXT", nullable: false),
                    VeiculoId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReservaId = table.Column<int>(type: "INTEGER", nullable: true),
                    AtendimentoId = table.Column<int>(type: "INTEGER", nullable: true),
                    DuracaoHoras = table.Column<int>(type: "INTEGER", nullable: false),
                    ValorTarifa = table.Column<double>(type: "REAL", nullable: false),
                    Valor = table.Column<double>(type: "REAL", nullable: false),
                    Forma = table.Column<string>(type: "TEXT", nullable: false),
                    Parcelas = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ValorCobrado = table.Column<double>(type: "REAL", nullable: false),
                    Detalhe = table.Column<string>(type: "TEXT", nullable: false),
                    Comprovante = table.Column<string>(type: "TEXT", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pagamentos", x => x.Id);
                    table.CheckConstraint("CK_Pagamentos_DuracaoHoras", "DuracaoHoras > 0");
                    table.CheckConstraint("CK_Pagamentos_Forma", "Forma IN ('Pix', 'Credito', 'Debito')");
                    table.CheckConstraint("CK_Pagamentos_Status", "Status IN ('Pendente', 'Aprovado', 'Estornado')");
                    table.CheckConstraint("CK_Pagamentos_TenantId", "TenantId IN ('shopping', 'condominium', 'hospital', 'company')");
                    table.CheckConstraint("CK_Pagamentos_Valor", "Valor >= 0");
                    table.ForeignKey(
                        name: "FK_Pagamentos_Atendimentos_AtendimentoId",
                        column: x => x.AtendimentoId,
                        principalTable: "Atendimentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pagamentos_Reservas_ReservaId",
                        column: x => x.ReservaId,
                        principalTable: "Reservas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pagamentos_Veiculos_VeiculoId",
                        column: x => x.VeiculoId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Atendimentos_ConvenioId",
                table: "Atendimentos",
                column: "ConvenioId");

            migrationBuilder.CreateIndex(
                name: "IX_Atendimentos_TenantId_Numero",
                table: "Atendimentos",
                columns: new[] { "TenantId", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Convenios_TenantId_Nome",
                table: "Convenios",
                columns: new[] { "TenantId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pagamentos_AtendimentoId",
                table: "Pagamentos",
                column: "AtendimentoId",
                unique: true,
                filter: "AtendimentoId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Pagamentos_ReservaId",
                table: "Pagamentos",
                column: "ReservaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagamentos_VeiculoId",
                table: "Pagamentos",
                column: "VeiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_VagaId",
                table: "Reservas",
                column: "VagaId",
                unique: true,
                filter: "Status = 'Confirmada'");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_VeiculoId",
                table: "Reservas",
                column: "VeiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_Tarifas_TenantId",
                table: "Tarifas",
                column: "TenantId",
                unique: true,
                filter: "Ativa = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_TenantId_Documento",
                table: "Usuarios",
                columns: new[] { "TenantId", "Documento" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vagas_TenantId_Codigo",
                table: "Vagas",
                columns: new[] { "TenantId", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veiculos_TenantId_Placa",
                table: "Veiculos",
                columns: new[] { "TenantId", "Placa" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Acessos");

            migrationBuilder.DropTable(
                name: "Pagamentos");

            migrationBuilder.DropTable(
                name: "Tarifas");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Atendimentos");

            migrationBuilder.DropTable(
                name: "Reservas");

            migrationBuilder.DropTable(
                name: "Convenios");

            migrationBuilder.DropTable(
                name: "Vagas");

            migrationBuilder.DropTable(
                name: "Veiculos");
        }
    }
}
