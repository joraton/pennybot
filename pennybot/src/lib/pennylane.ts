const FIRM_BASE = 'https://app.pennylane.com/api/external/firm/v1'

export interface PLFirmCompany {
  id: number
  name: string
  reg_no: string
  client_code?: string
}

export interface PLFirmCompaniesResponse {
  companies: PLFirmCompany[]
  total_pages?: number
  current_page?: number
}

export interface PLInvoiceSummary {
  total: number
  hasMore: boolean
  unpaid: number
  late: number
  draft: number
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchFirmCompanies(apiKey: string): Promise<PLFirmCompany[]> {
  const url = `${FIRM_BASE}/companies`
  console.log('[Pennybot] fetchFirmCompanies →', url)
  const res = await fetch(url, { headers: authHeaders(apiKey) })
  console.log('[Pennybot] fetchFirmCompanies status:', res.status)
  if (res.status === 401) {
    const body = await res.text().catch(() => '')
    console.log('[Pennybot] 401 body:', body)
    throw new Error('Clé API invalide — vérifiez dans Penny Lane.')
  }
  if (!res.ok) throw new Error(`Erreur Penny Lane (${res.status})`)
  const data: PLFirmCompaniesResponse = await res.json()
  return data.companies ?? []
}

export async function fetchFirmCompany(apiKey: string, companyId: number): Promise<PLFirmCompany> {
  const url = `${FIRM_BASE}/companies/${companyId}`
  const res = await fetch(url, { headers: authHeaders(apiKey) })
  if (!res.ok) throw new Error(`Erreur Penny Lane (${res.status})`)
  const data = await res.json()
  return data.company ?? data
}

export async function fetchInvoiceSummary(apiKey: string, companyId: number): Promise<PLInvoiceSummary> {
  const url = `https://app.pennylane.com/api/external/v2/customer_invoices?limit=100`
  console.log('[Pennybot] fetchInvoiceSummary companyId:', companyId)
  const res = await fetch(url, {
    headers: {
      ...authHeaders(apiKey),
      'X-Company-Id': String(companyId),
    },
  })
  if (!res.ok) throw new Error(`Erreur factures Penny Lane (${res.status})`)
  const data = await res.json()
  const items: Array<{ paid: boolean; draft: boolean; status: string }> = data.items ?? []
  return {
    total: items.length,
    hasMore: data.has_more ?? false,
    unpaid: items.filter(i => !i.paid && !i.draft && i.status !== 'credit_note').length,
    late: items.filter(i => i.status === 'late').length,
    draft: items.filter(i => i.draft).length,
  }
}

export function formatSiren(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`
  if (digits.length === 14) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  return raw
}
