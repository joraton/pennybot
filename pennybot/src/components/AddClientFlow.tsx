import { useState, useRef, useEffect } from 'react'
import { fetchFirmCompanies, fetchCompanyByClientKey, formatSiren } from '../lib/pennylane'
import type { PLFirmCompany } from '../lib/pennylane'
import { avatarClass } from '../lib/data'
import type { Client, ClientTone, ClientSubTone } from '../lib/types'

type Step = 'input' | 'loading' | 'pick' | 'success'

const LOADING_STEPS = [
  'Vérification de la clé API…',
  'Récupération des dossiers clients…',
  'Synchronisation du cabinet…',
]

const TONES: ClientTone[] = ['green', 'teal', 'mint']

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
}

function companyToClient(company: PLFirmCompany, apiKey: string): Client {
  const name = company.name
  const tone = TONES[company.id % TONES.length]
  return {
    id: `pl-${company.id}`,
    name,
    suffix: '',
    initial: name[0]?.toUpperCase() ?? '?',
    tone,
    siren: formatSiren(company.reg_no ?? ''),
    sub: 'Connecté via API',
    subTone: 'ok' as ClientSubTone,
    recent: true,
    lastSeen: 'à l\'instant',
    pennylaneApiKey: apiKey,
  }
}

export function AddClientFlow({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0])
  const [companies, setCompanies] = useState<PLFirmCompany[]>([])
  const [selected, setSelected] = useState<PLFirmCompany | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep('input')
      setApiKey('')
      setError('')
      setShowKey(false)
      setCompanies([])
      setSelected(null)
      setTimeout(() => inputRef.current?.focus(), 180)
    }
  }, [open])

  async function handleConnect() {
    const key = apiKey.trim()
    if (!key) { setError('Veuillez saisir une clé API.'); return }
    if (key.length < 8) { setError('Clé trop courte — vérifiez dans Penny Lane.'); return }

    setError('')
    setStep('loading')

    let i = 0
    setLoadingText(LOADING_STEPS[0])
    const interval = setInterval(() => {
      i++
      if (i < LOADING_STEPS.length) setLoadingText(LOADING_STEPS[i])
    }, 800)

    try {
      // Essai 1 : clé cabinet (Firm API)
      let list: PLFirmCompany[] | null = null
      try {
        list = await fetchFirmCompanies(key)
      } catch {
        list = null
      }

      if (list && list.length > 0) {
        clearInterval(interval)
        if (list.length === 1) {
          setSelected(list[0])
          setStep('success')
        } else {
          setCompanies(list)
          setStep('pick')
        }
        return
      }

      // Essai 2 : clé client (Company API v2)
      const company = await fetchCompanyByClientKey(key)
      clearInterval(interval)
      setSelected(company)
      setStep('success')
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Erreur de connexion à Penny Lane.')
      setStep('input')
    }
  }

  function handlePick(company: PLFirmCompany) {
    setSelected(company)
    setStep('success')
  }

  function handleConfirm() {
    if (selected) {
      onAdd(companyToClient(selected, apiKey.trim()))
      onClose()
    }
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
                  <h3 className="add-title">Connecter un dossier</h3>
                  <p className="add-sub">Clé API cabinet Penny Lane</p>
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
                  Clé API <strong>cabinet ou client</strong> dans <strong>Penny Lane → Paramètres → Connectivité → Développeurs</strong>.
                </p>
              </div>

              <div className="add-field">
                <label className="settings-label">Clé API Penny Lane</label>
                <div className={`api-key-input-wrap${error ? ' error' : ''}`}>
                  <svg className="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  <input
                    ref={inputRef}
                    type={showKey ? 'text' : 'password'}
                    className="api-key-field"
                    placeholder="Token généré dans Penny Lane…"
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
                {error && <p className="add-field-error">{error}</p>}
              </div>

              <button className="btn-connect" onClick={handleConnect}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7"/>
                </svg>
                Connecter le dossier
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

        {step === 'pick' && (
          <>
            <div className="add-header">
              <div className="add-header-left">
                <div className="add-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h3 className="add-title">Choisir un dossier</h3>
                  <p className="add-sub">{companies.length} dossiers trouvés</p>
                </div>
              </div>
              <button className="btn-icon" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="add-body">
              <div className="pick-list">
                {companies.map(c => (
                  <button key={c.id} className="pick-item" onClick={() => handlePick(c)}>
                    <div className={`client-avatar-sm ${avatarClass(TONES[c.id % TONES.length])}`}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="pick-info">
                      <span className="pick-name">{c.name}</span>
                      {c.reg_no && <span className="pick-siren">{formatSiren(c.reg_no)}</span>}
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M5 12h14M13 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 'success' && selected && (
          <>
            <div className="add-header">
              <div className="add-header-left">
                <div className="add-icon add-icon-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="add-title">Dossier trouvé !</h3>
                  <p className="add-sub">Données récupérées depuis Penny Lane</p>
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
                <div className={`preview-avatar ${avatarClass(TONES[selected.id % TONES.length])}`}>
                  {selected.name[0]?.toUpperCase()}
                </div>
                <div className="preview-info">
                  <div className="preview-name">{selected.name}</div>
                  {selected.reg_no && <div className="preview-meta">SIREN {formatSiren(selected.reg_no)}</div>}
                </div>
                <span className="preview-badge">Vérifié</span>
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
