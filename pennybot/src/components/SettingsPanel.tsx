import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [hermesKey, setHermesKey] = useState('')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (open && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['apiKey', 'apiUrl', 'hermesKey'], data => {
        if (data?.apiKey) setApiKey(data.apiKey as string)
        if (data?.apiUrl) setApiUrl(data.apiUrl as string)
        if (data?.hermesKey) setHermesKey(data.hermesKey as string)
      })
    }
  }, [open])

  function handleSave() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ apiKey, apiUrl, hermesKey })
    }
    setStatus({ msg: 'Paramètres enregistrés', ok: true })
  }

  async function handleTest() {
    setTesting(true)
    setStatus(null)
    try {
      const res = await fetch('http://localhost:8642/v1/health')
      if (res.ok) {
        setStatus({ msg: 'Hermès gateway actif · localhost:8642', ok: true })
      } else {
        setStatus({ msg: `Gateway inaccessible (${res.status})`, ok: false })
      }
    } catch {
      setStatus({ msg: 'Hermès gateway non démarré — lance `hermes gateway`', ok: false })
    } finally {
      setTesting(false)
    }
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
            <label className="settings-label">Agent Hermès — Clé locale</label>
            <div className="input-row">
              <input
                type="password"
                className="text-input"
                placeholder="change-me-local-dev"
                value={hermesKey}
                onChange={e => setHermesKey(e.target.value)}
              />
              <button className="btn-save" onClick={handleSave}>Enregistrer</button>
            </div>
            <p className="settings-hint">
              Valeur de <code>API_SERVER_KEY</code> dans <code>~/.hermes/.env</code>.
              Lance <code>hermes gateway</code> avant d'utiliser le chat.
            </p>
          </div>

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
            <label className="settings-label">URL Penny Lane (optionnel)</label>
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
            {testing ? 'Test en cours…' : 'Tester Hermès gateway'}
          </button>
        </div>
      </div>
    </div>
  )
}
