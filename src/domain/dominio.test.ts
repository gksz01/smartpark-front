import { describe, expect, it } from 'vitest'
import { Acesso, Atendimento, Convenio, Estacionamento, Notificacao, Pagamento, PagamentoCredito, PagamentoDebito, PagamentoPix, Reserva, Sensor, Tarifa, TarifaPorHora, Usuario, Vaga, Veiculo } from '.'

describe('Usuario', () => {
  it('usa a matriz de permissões existente', () => {
    const admin = new Usuario('u-1', 'Marina Costa', '123', 'admin', 'funcionario', 'hospital')
    expect(admin.possuiPermissao('configuration')).toBe(true)
    expect(admin.possuiPermissao('portal')).toBe(false)
  })

  it('usuário desativado perde as permissões', () => {
    const admin = new Usuario('u-1', 'Marina Costa', '123', 'admin', 'funcionario', 'hospital')
    admin.desativar()
    expect(admin.possuiPermissao('configuration')).toBe(false)
  })

  it('identifica visitantes, pacientes e o primeiro nome', () => {
    const visitante = new Usuario('u-2', 'Rafael Lima', '456', 'visitor', 'visitante', 'condominium')
    const acompanhante = new Usuario('u-3', 'Ana Souza', '789', 'visitor', 'acompanhante', 'hospital')
    expect(visitante.ehVisitante()).toBe(true)
    expect(visitante.primeiroNome()).toBe('Rafael')
    expect(acompanhante.ehPacienteOuAcompanhante()).toBe(true)
  })
})

describe('Veiculo', () => {
  it('valida placas no padrão antigo e Mercosul', () => {
    expect(new Veiculo('v-1', 'abc-1234', 'Gol', 'Prata', 'Antigo').validarPlaca()).toBe(true)
    expect(new Veiculo('v-2', 'bra2e19', 'Renegade', 'Branco', 'Família').validarPlaca()).toBe(true)
    expect(new Veiculo('v-3', '12ABC34', 'X', 'Y', 'Z').validarPlaca()).toBe(false)
  })

  it('formata a placa conforme o padrão', () => {
    const antigo = new Veiculo('v-1', 'abc1234', 'Gol', 'Prata', 'Antigo')
    const mercosul = new Veiculo('v-2', 'spk 1a23', 'City', 'Cinza', 'Meu carro')
    expect(antigo.placaFormatada()).toBe('ABC-1234')
    expect(mercosul.placaFormatada()).toBe('SPK1A23')
    expect(mercosul.ehPlacaMercosul()).toBe(true)
    expect(mercosul.descricao()).toBe('Meu carro · City · SPK1A23')
  })
})

describe('Vaga', () => {
  it('segue o ciclo livre → reservada → ocupada → livre', () => {
    const vaga = new Vaga('1', 'A-01', 'A', 'Comum')
    expect(vaga.estaDisponivel()).toBe(true)
    vaga.reservar()
    expect(vaga.status).toBe('Reservada')
    vaga.ocupar()
    expect(vaga.status).toBe('Ocupada')
    vaga.liberar()
    expect(vaga.estaDisponivel()).toBe(true)
  })

  it('impede operações inválidas', () => {
    const ocupada = new Vaga('2', 'A-02', 'A', 'PCD', 'Ocupada')
    expect(() => ocupada.reservar()).toThrow('não está livre')
    expect(() => ocupada.bloquear()).toThrow('está ocupada')

    const bloqueada = new Vaga('3', 'A-03', 'A', 'Comum', 'Bloqueada')
    expect(() => bloqueada.ocupar()).toThrow('não pode ser ocupada')
    expect(() => bloqueada.liberar()).toThrow('está bloqueada')
    bloqueada.desbloquear()
    expect(bloqueada.estaDisponivel()).toBe(true)
  })

  it('identifica vagas especiais', () => {
    expect(new Vaga('1', 'A-01', 'A', 'Comum').ehEspecial()).toBe(false)
    expect(new Vaga('2', 'C-21', 'C', 'Elétrico').ehEspecial()).toBe(true)
  })
})

describe('Estacionamento', () => {
  const criarEstacionamento = () => new Estacionamento('central', 'Estacionamento Central', 'Av. das Palmeiras, 450', true, false, [
    new Vaga('1', 'A-01', 'A', 'Comum', 'Livre'),
    new Vaga('2', 'A-02', 'A', 'PCD', 'Ocupada'),
    new Vaga('3', 'A-03', 'A', 'Elétrico', 'Reservada'),
    new Vaga('4', 'A-04', 'A', 'PCD', 'Livre'),
  ])

  it('calcula vagas livres e taxa de ocupação', () => {
    const estacionamento = criarEstacionamento()
    expect(estacionamento.totalVagas()).toBe(4)
    expect(estacionamento.vagasLivres()).toBe(2)
    expect(estacionamento.taxaOcupacao()).toBe(50)
    expect(estacionamento.estaLotado()).toBe(false)
  })

  it('busca vaga livre por tipo', () => {
    const estacionamento = criarEstacionamento()
    expect(estacionamento.buscarVagaLivre('PCD')?.codigo).toBe('A-04')
    expect(estacionamento.buscarVagaLivre('Elétrico')).toBeUndefined()
  })

  it('fica lotado quando não há vagas livres', () => {
    const estacionamento = criarEstacionamento()
    estacionamento.vagas.forEach((vaga) => { if (vaga.estaDisponivel()) vaga.ocupar() })
    expect(estacionamento.estaLotado()).toBe(true)
    expect(estacionamento.taxaOcupacao()).toBe(100)
  })

  it('não aceita códigos de vaga repetidos', () => {
    const estacionamento = criarEstacionamento()
    expect(() => estacionamento.adicionarVaga(new Vaga('5', 'A-01', 'A', 'Comum'))).toThrow('Já existe')
  })
})

describe('Tarifa', () => {
  it('cobra por hora iniciada', () => {
    const tarifa = new Tarifa('t-1', 'Padrão', new TarifaPorHora(12))
    expect(tarifa.calcular(2)).toBe(24)
    expect(tarifa.calcular(2.2)).toBe(36)
    expect(tarifa.calcular(0)).toBe(0)
  })

  it('respeita o valor máximo diário', () => {
    const tarifa = new Tarifa('t-1', 'Padrão', new TarifaPorHora(12, 60))
    expect(tarifa.calcular(8)).toBe(60)
    expect(tarifa.descricao()).toBe('Padrão: R$ 12,00/hora (máx. R$ 60,00/dia)')
  })
})

describe('Reserva', () => {
  const tarifa = new Tarifa('t-1', 'Padrão', new TarifaPorHora(12))

  it('calcula a estimativa com a tarifa', () => {
    const reserva = new Reserva('r-1', 'v-1', 'A-03', '2026-09-05', '18:30', 2)
    expect(reserva.calcularEstimativa(tarifa)).toBe(24)
    expect(reserva.valorEstimado).toBe(24)
  })

  it('confirma, altera e cancela', () => {
    const reserva = new Reserva('r-1', 'v-1', 'A-03', '2026-09-05', '18:30', 2)
    reserva.confirmar()
    expect(reserva.status).toBe('confirmada')
    reserva.alterar('2026-09-06', '10:00', 4)
    expect(reserva.duracaoHoras).toBe(4)
    reserva.cancelar()
    expect(reserva.estaAtiva()).toBe(false)
    expect(() => reserva.alterar('2026-09-07', '10:00', 1)).toThrow('Apenas reservas')
    expect(() => reserva.cancelar()).toThrow('não pode ser cancelada')
  })

  it('não aceita duração inválida', () => {
    const reserva = new Reserva('r-1', 'v-1', 'A-03', '2026-09-05', '18:30', 2)
    expect(() => reserva.alterar('2026-09-05', '18:30', 0)).toThrow('maior que zero')
  })

  it('expira após a tolerância de 15 minutos', () => {
    const reserva = new Reserva('r-1', 'v-1', 'A-03', '2026-09-05', '18:30', 2, 'confirmada')
    expect(reserva.expirou(new Date(2026, 8, 5, 18, 44))).toBe(false)
    expect(reserva.expirou(new Date(2026, 8, 5, 18, 46))).toBe(true)
  })
})

describe('Pagamento', () => {
  it('processa, gera comprovante e estorna', () => {
    const pagamento = new Pagamento('a1b2c3d4-0000', 28, new PagamentoPix(), 'v-1')
    pagamento.processar()
    expect(pagamento.estaAprovado()).toBe(true)
    expect(pagamento.comprovante).toBe('PIX-A1B2C3')
    expect(pagamento.valorFormatado()).toBe('R$ 28,00')
    pagamento.estornar()
    expect(pagamento.status).toBe('estornado')
  })

  it('impede processamento duplicado, valor zero e estorno sem aprovação', () => {
    const pagamento = new Pagamento('p-1', 28, new PagamentoCredito(), 'v-1')
    expect(() => pagamento.estornar()).toThrow('Apenas pagamentos aprovados')
    pagamento.processar()
    expect(() => pagamento.processar()).toThrow('já foi processado')
    expect(() => new Pagamento('p-2', 0, new PagamentoDebito(), 'v-1').processar()).toThrow('maior que zero')
  })
})

describe('Acesso', () => {
  it('começa pendente e pode ser liberado', () => {
    const acesso = new Acesso('ac-1', 'Marina Costa', 'BRA2E19', 'LPR', 'Entrada', false, new Date(2026, 8, 5, 14, 5))
    expect(acesso.status).toBe('Pendente')
    acesso.liberar()
    expect(acesso.status).toBe('Liberado')
    expect(acesso.ehEntrada()).toBe(true)
    expect(acesso.horarioFormatado()).toBe('14:05')
    expect(() => acesso.negar('Teste')).toThrow('já foi liberado')
  })

  it('exige motivo para negar', () => {
    const acesso = new Acesso('ac-3', 'Bruno Dias', 'DFK4J86', 'LPR', 'Entrada')
    expect(() => acesso.negar('   ')).toThrow('Informe o motivo da negação.')
    expect(acesso.status).toBe('Pendente')
  })

  it('registra o motivo da negação e identifica liberação manual', () => {
    const acesso = new Acesso('ac-2', 'Carlos Nunes', 'RF-44310', 'RFID', 'Saída', true)
    acesso.negar('Tag expirada')
    expect(acesso.status).toBe('Negado')
    expect(acesso.motivoNegacao).toBe('Tag expirada')
    expect(acesso.ehManual()).toBe(true)
  })
})

describe('Sensor', () => {
  it('detecta ocupação e liberação informando se o estado mudou', () => {
    const sensor = new Sensor('s-1', 'SN-A01', 'A-01')
    const momento = new Date(2026, 8, 5, 14, 0)
    expect(sensor.detectarOcupacao(momento)).toBe(true)
    expect(sensor.ocupado).toBe(true)
    expect(sensor.ultimaLeitura).toBe(momento)
    expect(sensor.detectarOcupacao()).toBe(false)
    expect(sensor.detectarLiberacao()).toBe(true)
    expect(sensor.ocupado).toBe(false)
  })

  it('não registra leituras quando desativado', () => {
    const sensor = new Sensor('s-1', 'SN-A01', 'A-01')
    sensor.desativar()
    expect(() => sensor.detectarOcupacao()).toThrow('está desativado')
    sensor.ativar()
    expect(sensor.detectarOcupacao()).toBe(true)
  })
})

describe('Convenio', () => {
  const tarifa = new Tarifa('t-1', 'Hospital', new TarifaPorHora(10))

  it('aplica cada tipo de benefício', () => {
    expect(new Convenio('c-1', 'Saúde Plena', 'isencao').aplicarBeneficio(tarifa, 3)).toBe(0)
    expect(new Convenio('c-2', 'VidaCare', 'percentual', 50).aplicarBeneficio(tarifa, 3)).toBe(15)
    expect(new Convenio('c-3', 'Bem Estar', 'horasGratis', 2).aplicarBeneficio(tarifa, 3)).toBe(10)
  })

  it('não concede benefício quando inativo', () => {
    expect(new Convenio('c-1', 'Saúde Plena', 'isencao', 0, false).aplicarBeneficio(tarifa, 3)).toBe(30)
  })

  it('descreve o benefício com os textos do módulo atual', () => {
    expect(new Convenio('c-1', 'Saúde Plena', 'isencao').descricaoBeneficio()).toBe('Isenção de 100%')
    expect(new Convenio('c-2', 'VidaCare', 'percentual', 50).descricaoBeneficio()).toBe('Desconto de 50%')
    expect(new Convenio('c-3', 'Bem Estar', 'horasGratis', 2).descricaoBeneficio()).toBe('2 horas gratuitas')
  })
})

describe('Atendimento', () => {
  const convenio = new Convenio('c-1', 'Saúde Plena', 'isencao')
  const dataAtendimento = new Date(2026, 8, 5, 9, 0)

  it('é elegível dentro de 24 horas e com número válido', () => {
    const atendimento = new Atendimento('at-1', 'ATD-48291', 'Helena Moreira', convenio, dataAtendimento)
    expect(atendimento.validarElegibilidade(new Date(2026, 8, 5, 15, 0))).toBe(true)
    expect(atendimento.validarElegibilidade(new Date(2026, 8, 6, 10, 0))).toBe(false)
    expect(new Atendimento('at-2', 'XYZ-1', 'Helena Moreira', convenio, dataAtendimento).validarElegibilidade(new Date(2026, 8, 5, 15, 0))).toBe(false)
  })

  it('não é elegível com convênio inativo', () => {
    const inativo = new Convenio('c-9', 'Antigo', 'isencao', 0, false)
    const atendimento = new Atendimento('at-1', 'ATD-48291', 'Helena Moreira', inativo, dataAtendimento)
    expect(atendimento.validarElegibilidade(new Date(2026, 8, 5, 15, 0))).toBe(false)
  })

  it('impede usar o benefício duas vezes', () => {
    const atendimento = new Atendimento('at-1', 'ATD-48291', 'Helena Moreira', convenio, dataAtendimento)
    const agora = new Date(2026, 8, 5, 15, 0)
    atendimento.aplicarBeneficio(agora)
    expect(atendimento.beneficioAplicado).toBe(true)
    expect(() => atendimento.aplicarBeneficio(agora)).toThrow('não está elegível')
  })
})

describe('Convenio e Atendimento reconstruídos a partir do banco', () => {
  const agora = new Date(2026, 9, 5, 12, 0)

  it('uma linha de convenios vira um Convenio com a descrição correta', () => {
    const linhas = [
      { id: 1, nome: 'Saúde Plena', tipo_beneficio: 'isencao' as const, valor_beneficio: 0, ativo: 1 },
      { id: 2, nome: 'VidaCare', tipo_beneficio: 'percentual' as const, valor_beneficio: 50, ativo: 1 },
      { id: 3, nome: 'Bem Estar', tipo_beneficio: 'horasGratis' as const, valor_beneficio: 2, ativo: 0 },
    ]
    const convenios = linhas.map((linha) => new Convenio(String(linha.id), linha.nome, linha.tipo_beneficio, linha.valor_beneficio, linha.ativo === 1))
    expect(convenios.map((convenio) => convenio.descricaoBeneficio())).toEqual(['Isenção de 100%', 'Desconto de 50%', '2 horas gratuitas'])
    expect(convenios[2].ativo).toBe(false)
  })

  it('motivoInelegibilidade explica cada regra de validarElegibilidade', () => {
    const ativo = new Convenio('1', 'Saúde Plena', 'isencao')
    const inativo = new Convenio('2', 'Plano Antigo', 'percentual', 30, false)
    const duasHorasAtras = new Date(2026, 9, 5, 10, 0)

    const elegivel = new Atendimento('1', 'ATD-48291', 'Helena Moreira', ativo, duasHorasAtras)
    const comInativo = new Atendimento('2', 'ATD-55120', 'João Lima', inativo, duasHorasAtras)
    const antigo = new Atendimento('3', 'ATD-30017', 'Marta Dias', ativo, new Date(2026, 9, 2, 12, 0))
    const usado = new Atendimento('4', 'ATD-90442', 'Paulo Reis', ativo, duasHorasAtras)
    usado.beneficioAplicado = true // como vem do banco (beneficio_aplicado = 1)
    const formato = new Atendimento('5', 'XYZ', 'Ana', ativo, duasHorasAtras)

    expect(elegivel.motivoInelegibilidade(agora)).toBeNull()
    expect(elegivel.validarElegibilidade(agora)).toBe(true)
    expect(comInativo.motivoInelegibilidade(agora)).toBe('O convênio Plano Antigo está inativo.')
    expect(antigo.motivoInelegibilidade(agora)).toBe('O atendimento tem mais de 24 horas.')
    expect(usado.motivoInelegibilidade(agora)).toBe('O benefício deste atendimento já foi utilizado.')
    expect(formato.motivoInelegibilidade(agora)).toBe('O número do atendimento deve seguir o formato ATD-00000.')
    expect([comInativo, antigo, usado, formato].every((atendimento) => !atendimento.validarElegibilidade(agora))).toBe(true)
  })
})

describe('Notificacao', () => {
  it('formata a mensagem com horário e pode ser marcada como lida', () => {
    const notificacao = new Notificacao('n-1', 'Vaga ocupada', 'A-01 foi ocupada.', 'alerta', new Date(2026, 8, 5, 14, 32))
    expect(notificacao.formatar()).toBe('[14:32] Vaga ocupada: A-01 foi ocupada.')
    expect(notificacao.ehAlerta()).toBe(true)
    expect(notificacao.lida).toBe(false)
    notificacao.marcarComoLida()
    expect(notificacao.lida).toBe(true)
  })
})
