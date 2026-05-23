import { useState } from 'react'
import { INITIAL_CLIENTS } from '../lib/data'
import type { Client } from '../lib/types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? clients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.siren.replace(/\s/g, '').includes(query.replace(/\s/g, '')) ||
        c.suffix.toLowerCase().includes(query.toLowerCase())
      )
    : clients

  const recent = filtered.filter(c => c.recent)
  const others = filtered.filter(c => !c.recent)

  function addClient(client: Client) {
    setClients(prev => {
      if (prev.find(c => c.siren === client.siren)) return prev
      return [{ ...client, recent: true, lastSeen: 'à l\'instant' }, ...prev]
    })
  }

  return { clients, recent, others, query, setQuery, addClient }
}
