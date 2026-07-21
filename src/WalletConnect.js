// Phantom wallet adapter — connect + sign message for score submission
export class WalletConnect {
  constructor() {
    this.provider = null
    this.publicKey = null
  }

  get isAvailable() {
    return typeof window !== 'undefined' && !!window.solana?.isPhantom
  }

  async connect() {
    if (!this.isAvailable) throw new Error('Phantom wallet not found')
    const resp = await window.solana.connect()
    this.provider = window.solana
    this.publicKey = resp.publicKey.toString()
    return this.publicKey
  }

  async disconnect() {
    await this.provider?.disconnect()
    this.publicKey = null
  }

  async signScore(score, wave) {
    if (!this.provider || !this.publicKey) throw new Error('Not connected')
    const msg = new TextEncoder().encode(
      `agent-wars:score:${score}:wave:${wave}:wallet:${this.publicKey}`
    )
    const { signature } = await this.provider.signMessage(msg, 'utf8')
    return { signature: btoa(String.fromCharCode(...signature)), publicKey: this.publicKey }
  }
}
