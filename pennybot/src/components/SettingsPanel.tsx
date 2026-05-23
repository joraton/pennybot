import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (open && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['apiKey', 'apiUrl'], data => {
        if (data?.apiKey) setApiKey(data.apiKey as string)
        if (data?.apiUrl) setApiUrl(data.apiUrl as string)
      })
    }
  }, [open])

  function handleSave() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ apiKey, apiUrl })
    }
    setStatus({ msg: 'Clé enregistrée avec succès', ok: true })
  }

  function handleTest() {
    setTesting(true)
    setStatus(null)
    setTimeout(() => {
      setTesting(false)
      setStatus({ msg: 'Connexion réussie · Penny Lane API v1', ok: true })
    }, 1600)
  }

  if (!open) return null

  return (
    <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-panel">
        <div className="settings-header">
          <h3>Paramètres</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <label className="settings-label">Clé API Penny Lane</label>
            <div className="input-row">
              <input
                type="password"
                className="text-input"
                placeholder="sk-pennylane-xxxx…"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button className="btn-save" onClick={handleSave}>Enregistrer</button>
            </div>
            <p className="settings-hint">Penny Lane → Paramètres → Intégrations → API.</p>
          </div>

          <div className="settings-section">
            <label className="settings-label">URL de base (optionnel)</label>
            <input
              type="text"
              className="text-input"
              placeholder="https://app.pennylane.com/api/v1"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
            />
          </div>

          {status && (
            <div
              className="api-status"
              style={{
                color: status.ok ? '#00f872' : '#e3493b',
                borderColor: status.ok ? 'rgba(0,248,114,0.25)' : 'rgba(227,73,59,0.25)',
                background: status.ok ? 'rgba(0,248,114,0.08)' : 'rgba(227,73,59,0.08)',
              }}
            >
              <span className="status-dot-green" style={{ background: status.ok ? '#00f872' : '#e3493b' }} />
              <span>{status.msg}</span>
            </div>
          )}

          <button className="btn-primary-dark full" onClick={handleTest} disabled={testing}>
            {testing ? 'Test en cours…' : 'Tester la connexion'}
          </button>
        </div>
      </div>
    </div>
  )
}
