import { useState, useRef, useEffect } from 'react'
import { MOCK_NEW_CLIENT, avatarClass } from '../lib/data'
import type { Client } from '../lib/types'

type Step = 'input' | 'loading' | 'success'

const LOADING_STEPS = [
  'Vérification de la clé API…',
  'Récupération des données client…',
  'Synchronisation du dossier…',
]

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
}

export function AddClientFlow({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0])
  const [preview, setPreview] = useState<Client | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep('input')
      setApiKey('')
      setError('')
      setShowKey(false)
      setTimeout(() => inputRef.current?.focus(), 180)
    }
  }, [open])

  function handleConnect() {
    if (!apiKey.trim()) { setError('Veuillez saisir une clé API.'); return }
    if (apiKey.trim().length < 8) { setError('Clé trop courte — vérifiez dans Penny Lane.'); return }
    setError('')
    setStep('loading')

    let i = 0
    setLoadingText(LOADING_STEPS[0])
    const interval = setInterval(() => {
      i++
      if (i < LOADING_STEPS.length) setLoadingText(LOADING_STEPS[i])
    }, 700)

    setTimeout(() => {
      clearInterval(interval)
      setPreview({ ...MOCK_NEW_CLIENT, id: 'new-' + Date.now() })
      setStep('success')
    }, 2200)
  }

  function handleConfirm() {
    if (preview) { onAdd(preview); onClose() }
  }

  if (!open) return null

  return (
    <div className="add-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="add-panel">

        {step === 'input' && (
          <>
            <div className="add-header">
              <div className="add-header-left">
                <div className="add-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="add-title">Connecter un client</h3>
                  <p className="add-sub">Via l'API Penny Lane</p>
                </div>
              </div>
              <button className="btn-icon" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="add-body">
              <div className="add-info-block">
                <div className="add-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p className="add-info-text">
                  Trouvez votre clé dans <strong>Penny Lane → Paramètres → Intégrations → API</strong>. Chaque client a sa propre clé.
                </p>
              </div>

              <div className="add-field">
                <label className="settings-label">Clé API du client</label>
                <div className={`api-key-input-wrap${error ? ' error' : ''}`}>
                  <svg className="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  <input
                    ref={inputRef}
                    type={showKey ? 'text' : 'password'}
                    className="api-key-field"
                    placeholder="pl_live_xxxxxxxxxxxx…"
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleConnect()}
                    autoComplete="off"
                  />
                  <button className="btn-eye" onClick={() => setShowKey(v => !v)} title="Afficher/masquer">
                    {showKey ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="add-field-hint">{error}</p>
              </div>

              <button className="btn-connect" onClick={handleConnect}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7"/>
                </svg>
                Connecter le client
              </button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="add-loading">
            <div className="loading-dots">
              <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
            </div>
            <p className="loading-text">Connexion à Penny Lane…</p>
            <p className="loading-sub">{loadingText}</p>
          </div>
        )}

        {step === 'success' && preview && (
          <>
            <div className="add-header">
              <div className="add-header-left">
                <div className="add-icon add-icon-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="add-title">Client connecté !</h3>
                  <p className="add-sub">Données récupérées</p>
                </div>
              </div>
              <button className="btn-icon" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="add-body">
              <div className="client-preview">
                <div className={`preview-avatar ${avatarClass(preview.tone)}`}>{preview.initial}</div>
                <div className="preview-info">
                  <div className="preview-name">{preview.name}{preview.suffix ? ` ${preview.suffix}` : ''}</div>
                  <div className="preview-meta">SIREN {preview.siren} · {preview.sector}</div>
                </div>
                <span className="preview-badge">Vérifié</span>
              </div>

              <div className="preview-stats">
                <div className="stat-item">
                  <div className="stat-label">Exercice</div>
                  <div className="stat-value">{preview.year}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">CA annuel</div>
                  <div className="stat-value">{preview.ca}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Factures</div>
                  <div className="stat-value">{preview.invoices}</div>
                </div>
              </div>

              <button className="btn-connect" onClick={handleConfirm}>
                Ajouter à mes dossiers
              </button>
              <button className="btn-cancel" onClick={onClose}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
