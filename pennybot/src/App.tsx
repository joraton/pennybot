import { useState, useCallback } from 'react'
import { Header } from './components/Header'
import { ClientSelector } from './components/ClientSelector'
import { ChatView } from './components/ChatView'
import { AddClientFlow } from './components/AddClientFlow'
import { SettingsPanel } from './components/SettingsPanel'
import { useClients } from './hooks/useClients'
import { useChat } from './hooks/useChat'
import type { Client, Screen } from './lib/types'

export function App() {
  const [screen, setScreen] = useState<Screen>('client')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  const { recent, others, query, setQuery, addClient } = useClients()
  const { messages, suggestions, isTyping, send, resetForClient } = useChat(selectedClient)

  const handleSelectClient = useCallback((client: Client) => {
    setSelectedClient(client)
    setScreen('chat')
    resetForClient(client)
    setQuery('')
  }, [resetForClient, setQuery])

  const handleBack = useCallback(() => {
    setScreen('client')
    setSelectedClient(null)
  }, [])

  const handleAddClient = useCallback((client: Client) => {
    addClient(client)
  }, [addClient])

  return (
    <>
      <div className="glow glow-tr" aria-hidden="true" />
      <div className="glow glow-bl" aria-hidden="true" />

      <Header
        screen={screen}
        onBack={handleBack}
        onSettings={() => setShowSettings(true)}
      />

      {screen === 'client' ? (
        <ClientSelector
          recent={recent}
          others={others}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelectClient}
          onAddClient={() => setShowAddClient(true)}
        />
      ) : selectedClient ? (
        <ChatView
          client={selectedClient}
          messages={messages}
          suggestions={suggestions}
          isTyping={isTyping}
          onSend={send}
          onSuggestionClick={send}
        />
      ) : null}

      <AddClientFlow
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onAdd={handleAddClient}
      />

      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  )
}
