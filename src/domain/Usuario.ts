import { hasPermission } from '../core/config'
import type { PersonType, Permission, Role, TenantId } from '../core/types'

// A lista de tipos fica em core/types.ts, usada também pelo personTypes de cada tenant.
export type TipoUsuario = PersonType

/**
 * Pessoa que utiliza o SmartPark em algum cliente (tenant).
 * O perfil (Role) define as permissões; o tipo descreve quem a pessoa é no local.
 */
export class Usuario {
  id: string
  nome: string
  documento: string
  perfil: Role
  tipo: TipoUsuario
  tenantId: TenantId
  ativo: boolean

  constructor(id: string, nome: string, documento: string, perfil: Role, tipo: TipoUsuario, tenantId: TenantId, ativo = true) {
    this.id = id
    this.nome = nome
    this.documento = documento
    this.perfil = perfil
    this.tipo = tipo
    this.tenantId = tenantId
    this.ativo = ativo
  }

  /** Reaproveita a matriz ROLE_PERMISSIONS já existente em core/config.ts. */
  possuiPermissao(permissao: Permission): boolean {
    return this.ativo && hasPermission(this.perfil, permissao)
  }

  ehVisitante(): boolean {
    return this.tipo === 'visitante' || this.perfil === 'visitor'
  }

  ehPacienteOuAcompanhante(): boolean {
    return this.tipo === 'paciente' || this.tipo === 'acompanhante'
  }

  primeiroNome(): string {
    return this.nome.trim().split(' ')[0]
  }

  desativar(): void {
    this.ativo = false
  }
}
