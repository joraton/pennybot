export type ClientTone = 'green' | 'teal' | 'mint'
export type ClientSubTone = 'ok' | 'attn' | 'pend'
export type Screen = 'client' | 'chat'

export interface Client {
  id: string
  name: string
  suffix: string
  initial: string
  tone: ClientTone
  siren: string
  sub: string
  subTone: ClientSubTone
  recent: boolean
  lastSeen: string
  sector?: string
  ca?: string
  invoices?: string
  year?: string
}

export interface Message {
  id: string
  role: 'user' | 'bot'
  html: string
}
