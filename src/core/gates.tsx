import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTenant } from './app-context'
import { FEATURE_LABELS, hasPermission, ROLE_LABELS } from './config'
import type { Feature, Permission, Role } from './types'
import { AccessDenied } from '../shared/ui'

export function FeatureGate({ feature, children, fallback = null }: { feature: Feature; children: ReactNode; fallback?: ReactNode }) {
  const { tenant } = useTenant()
  return tenant.features[feature] ? children : fallback
}

export function RoleGate({ roles, children, fallback = null }: { roles: Role[]; children: ReactNode; fallback?: ReactNode }) {
  const { state } = useTenant()
  return roles.includes(state.role) ? children : fallback
}

export function ProtectedRoute({ children, permission, features = [], roles }: { children: ReactNode; permission?: Permission; features?: Feature[]; roles?: Role[] }) {
  const { state, tenant, configurationError } = useTenant()
  const location = useLocation()
  if (configurationError && location.pathname !== '/') return <Navigate to="/" replace />
  const unavailable = features.find((feature) => !tenant.features[feature])
  if (unavailable) return <AccessDenied reason={`O módulo ${FEATURE_LABELS[unavailable]} não está disponível para ${tenant.name}.`} />
  if (roles && !roles.includes(state.role)) return <AccessDenied reason={`O perfil ${ROLE_LABELS[state.role]} não possui permissão para esta interface.`} />
  if (permission && !hasPermission(state.role, permission)) return <AccessDenied reason={`O perfil ${ROLE_LABELS[state.role]} não possui permissão para esta interface.`} />
  return children
}
