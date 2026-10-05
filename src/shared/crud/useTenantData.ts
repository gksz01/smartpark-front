import { useEffect, useState } from 'react'
import { useTenant } from '../../core/app-context'
import type { TenantId } from '../../core/types'

/**
 * Carrega dados do tenant ativo pela API.
 * Recarrega ao trocar de tenant e após "Restaurar dados" (dataVersion),
 * e ignora respostas antigas que cheguem depois de uma troca de tenant.
 * `load` deve ser uma função estável (definida fora do componente).
 */
export function useTenantData<T>(load: (tenantId: TenantId) => Promise<T>, initial: T, errorMessage: string) {
  const { tenant, dataVersion } = useTenant()
  const [data, setData] = useState<T>(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    load(tenant.id)
      .then((loaded) => {
        if (!current) return
        setData(loaded)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setData(initial)
        setError(`${errorMessage}: ${failure.message}`)
      })
    return () => { current = false }
    // `initial` só é usado em caso de erro; não precisa disparar um novo carregamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id, dataVersion, load, errorMessage])

  const reload = async () => setData(await load(tenant.id))

  return { data, setData, error, reload }
}
