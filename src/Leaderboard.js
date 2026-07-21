// Submit score to on-chain leaderboard program
const PROGRAM_ENDPOINT = 'https://agent-wars-score.vercel.app/api/submit'

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }
}

export async function submitScore({ score, wave, signature, publicKey }) {
  const res = await fetchWithRetry(PROGRAM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, wave, signature, publicKey }),
  })
  return res.json()
}

export async function fetchTop(limit = 10) {
  const res = await fetchWithRetry(
    `${PROGRAM_ENDPOINT.replace('/submit', '/top')}?limit=${limit}`
  )
  return res.json() // [{ rank, publicKey, score, wave, ts }]
}
