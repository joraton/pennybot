import { useState, useEffect } from 'react'
import { INITIAL_CLIENTS } from '../lib/data'
import type { Client } from '../lib/types'

const STORAGE_KEY = 'pennybot_clients'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')

  // Load from chrome.storage.local on mount
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY]
      setClients(Array.isArray(stored) && stored.length > 0 ? stored : INITIAL_CLIENTS)
      setLoaded(true)
    })
  }, [])

  // Persist to chrome.storage.local whenever clients change (after initial load)
  useEffect(() => {
    if (!loaded) return
    chrome.storage.local.set({ [STORAGE_KEY]: clients })
  }, [clients, loaded])

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

  function removeClient(siren: string) {
    setClients(prev => prev.filter(c => c.siren !== siren))
  }

  return { clients, recent, others, query, setQuery, addClient, removeClient, loaded }
}
