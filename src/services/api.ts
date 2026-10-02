/**
 * Lê a resposta da API. Se o status não for de sucesso,
 * lança um Error com a mensagem enviada pelo backend ({ erro: '...' }).
 */
export async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.erro ?? `Erro ${response.status} ao acessar a API.`)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

/** Restaura o banco com os dados de demonstração (POST /api/reset). */
export async function resetDatabase(): Promise<void> {
  await readResponse(await fetch('/api/reset', { method: 'POST' }))
}
