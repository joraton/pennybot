import type { Client } from './types'

export const INITIAL_CLIENTS: Client[] = [
  { id: 'a', name: 'Atelier Dupont',     suffix: 'SAS',  initial: 'A', tone: 'green', siren: '824 619 503', sub: '14 documents en attente', subTone: 'attn', recent: true,  lastSeen: 'à l\'instant', sector: 'Artisanat' },
  { id: 'b', name: 'Boulangerie Lopez',  suffix: 'SARL', initial: 'B', tone: 'teal',  siren: '519 442 187', sub: 'À jour',                   subTone: 'ok',   recent: true,  lastSeen: 'il y a 2 h',   sector: 'Commerce' },
  { id: 'c', name: 'Studio Mercier',     suffix: '',     initial: 'S', tone: 'mint',  siren: '912 003 884', sub: '3 factures à valider',     subTone: 'attn', recent: true,  lastSeen: 'hier',         sector: 'Communication' },
  { id: 'd', name: 'Cabinet Aubert',     suffix: 'SCP',  initial: 'C', tone: 'teal',  siren: '733 105 920', sub: 'Rapprochement bancaire',   subTone: 'pend', recent: false, lastSeen: '12 mars',      sector: 'Services' },
  { id: 'e', name: 'Bistrot le Marais',  suffix: 'EURL', initial: 'M', tone: 'green', siren: '618 770 134', sub: 'À jour',                   subTone: 'ok',   recent: false, lastSeen: '10 mars',      sector: 'Restauration' },
  { id: 'f', name: 'Tech Solutions IDF', suffix: 'SAS',  initial: 'T', tone: 'mint',  siren: '882 091 247', sub: 'TVA à déclarer',           subTone: 'attn', recent: false, lastSeen: '8 mars',       sector: 'Tech' },
  { id: 'g', name: 'Maison Petit Père',  suffix: '',     initial: 'P', tone: 'teal',  siren: '441 209 308', sub: 'À jour',                   subTone: 'ok',   recent: false, lastSeen: '6 mars',       sector: 'Commerce' },
  { id: 'h', name: 'Garage Moreau',      suffix: 'SARL', initial: 'G', tone: 'green', siren: '702 558 119', sub: 'Note de frais à classer',  subTone: 'pend', recent: false, lastSeen: '4 mars',       sector: 'Automobile' },
]

export const MOCK_NEW_CLIENT: Client = {
  id: 'new-' + Date.now(),
  name: 'Dupont & Fils',
  suffix: 'SARL',
  initial: 'D',
  tone: 'green',
  siren: '751 482 390',
  sub: 'Connecté via API',
  subTone: 'ok',
  recent: true,
  lastSeen: 'à l\'instant',
  sector: 'Commerce de gros',
  ca: '234 800 €',
  invoices: '41',
  year: '2025',
}

export function avatarClass(tone: string) {
  return { green: 'av-green', teal: 'av-teal', mint: 'av-mint' }[tone] ?? 'av-teal'
}

export function statusDotClass(subTone: string) {
  return { ok: 'sd-ok', attn: 'sd-attn', pend: 'sd-pend' }[subTone] ?? 'sd-pend'
}

export function greetingByHour() {
  const h = new Date().getHours()
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
}
