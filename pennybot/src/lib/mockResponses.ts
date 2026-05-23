import type { Client } from './types'

function invoiceRow(client: string, ref: string, amount: string, days: number, last = false) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;${last ? '' : 'border-bottom:1px solid #e5ece9;'}background:#fff">
    <div style="width:26px;height:26px;border-radius:7px;background:#fff4e0;display:flex;align-items:center;justify-content:center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a5b00" stroke-width="1.75" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
    </div>
    <div style="flex:1;min-width:0;line-height:1.25">
      <div style="font-size:13px;font-weight:600;color:#0e2222">${client}</div>
      <div style="font-size:10px;color:#51625f;font-variant-numeric:tabular-nums">${ref} · ${days} jours</div>
    </div>
    <div style="font-size:13px;font-weight:700;color:#0e2222;font-variant-numeric:tabular-nums">${amount} €</div>
  </div>`
}

export function getMockResponse(text: string, client: Client | null): string {
  const t = text.toLowerCase()
  const name = client?.name ?? 'ce client'

  if (t.includes('ca') || t.includes('chiffre') || t.includes('encaiss') || (t.includes('factur') && t.includes('mois'))) {
    return `
      <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0a5151;margin-bottom:4px">FACTURÉ EN MARS</div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#003d3d;line-height:1;margin-bottom:6px">
        22 700<span style="font-size:20px;color:#1c6a6a"> €</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">
        <span style="background:#e6fbef;color:#00802f;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700">↑ +12 % vs. février</span>
        <span style="font-size:11px;color:#51625f">17 factures</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:#effdf8;border:1px solid #b6f5e3;border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#0a5151">Encaissé</div>
          <div style="font-size:18px;font-weight:800;color:#003d3d;font-variant-numeric:tabular-nums;margin-top:2px">18 420 €</div>
          <div style="margin-top:5px;height:3px;background:rgba(255,255,255,.5);border-radius:999px;overflow:hidden">
            <div style="width:81%;height:100%;background:#00b855;border-radius:999px"></div>
          </div>
        </div>
        <div style="background:#fff4e0;border:1px solid #f5e2b9;border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#8a5b00">À encaisser</div>
          <div style="font-size:18px;font-weight:800;color:#003d3d;font-variant-numeric:tabular-nums;margin-top:2px">4 280 €</div>
          <div style="margin-top:5px;height:3px;background:rgba(255,255,255,.5);border-radius:999px;overflow:hidden">
            <div style="width:19%;height:100%;background:#f5a524;border-radius:999px"></div>
          </div>
        </div>
      </div>`
  }

  if (t.includes('relancer') || t.includes('retard') || t.includes('impayé')) {
    return `
      <div style="font-size:13px;color:#2a3a3a;line-height:1.55;margin-bottom:12px">
        <strong style="color:#003d3d">7 factures en retard</strong> pour un total de
        <strong style="font-variant-numeric:tabular-nums;color:#003d3d">4 280,00 €</strong>.
        La plus ancienne date du 12 février.
      </div>
      <div style="border:1px solid #e5ece9;border-radius:10px;overflow:hidden;margin-bottom:12px">
        ${invoiceRow('Studio Mercier', 'F-2026-0214', '1 250,00', 34)}
        ${invoiceRow('Boulangerie Lopez', 'F-2026-0228', '480,00', 20)}
        ${invoiceRow('Cabinet Aubert', 'F-2026-0231', '2 550,00', 17, true)}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button style="padding:7px 12px;border-radius:8px;border:none;background:#003d3d;color:#fff;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">Relancer les 3</button>
        <button style="padding:7px 12px;border-radius:8px;border:1px solid #cbd5d2;background:#fff;color:#003d3d;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">Voir les 7</button>
      </div>`
  }

  if (t.includes('rapproch') || t.includes('banque') || t.includes('bancaire')) {
    return `<div style="font-size:13px;color:#2a3a3a;line-height:1.55">
      Le rapprochement bancaire de <strong style="color:#003d3d">${name}</strong> est à jour jusqu'au <strong>15 mars</strong>.
      Il reste <strong style="color:#d97706">3 opérations</strong> non rapprochées (16–18 mars), pour un total de 1 840 €.
    </div>`
  }

  if (t.includes('note') || t.includes('frais')) {
    return `<div style="font-size:13px;color:#2a3a3a;line-height:1.55">
      <strong style="color:#003d3d">4 notes de frais</strong> en attente pour ${name}.
      Total : <strong style="font-variant-numeric:tabular-nums">320,00 €</strong>.
      Je peux les classer automatiquement par catégorie si vous le souhaitez.
    </div>`
  }

  return `<div style="font-size:13px;color:#2a3a3a;line-height:1.55">
    Compris. Je vais analyser les données de <strong style="color:#003d3d">${name}</strong>.
    Cette fonctionnalité sera connectée en temps réel à l'API Penny Lane dans la prochaine version.
  </div>`
}

export function getSuggestions(text: string): string[] {
  const t = text.toLowerCase()
  if (t.includes('ca') || t.includes('factur')) return ['Plus gros client de mars', 'Prévision avril', 'TVA collectée']
  if (t.includes('relancer') || t.includes('retard')) return ['Relances déjà envoyées', 'Programmer un rappel']
  if (t.includes('rapproch')) return ['Afficher les 3 opérations', 'Rapprocher automatiquement']
  return ['Comparer au mois dernier', 'Générer un rapport', 'Exporter en PDF']
}
