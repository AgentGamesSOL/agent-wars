// Submit score to on-chain leaderboard program
const PROGRAM_ENDPOINT = 'https://agent-wars-score.vercel.app/api/submit'

export async function submitScore({ score, wave, signature, publicKey }) {
  const res = await fetch(PROGRAM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, wave, signature, publicKey }),
  })
  if (!res.ok) throw new Error(`Leaderboard submit failed: ${res.status}`)
  return res.json()
}

export async function fetchTop(limit = 10) {
  const res = await fetch(`${PROGRAM_ENDPOINT.replace('/submit', '/top')}?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json() // [{ rank, publicKey, score, wave, ts }]
}
