// AGNT token — 8STH8GbpZr1Qw5Qu4154HA72TJDD2MQPthH89vbSpump
import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'

const AGNT_MINT = new PublicKey('8STH8GbpZr1Qw5Qu4154HA72TJDD2MQPthH89vbSpump')
const RPC = 'https://api.mainnet-beta.solana.com'
const BONUS_THRESHOLD = 1_000_000 // 1M AGNT to unlock bonus waves

export async function getAgntBalance(walletAddress) {
  try {
    const connection = new Connection(RPC, 'confirmed')
    const owner = new PublicKey(walletAddress)
    const ata = await getAssociatedTokenAddress(AGNT_MINT, owner)
    const account = await getAccount(connection, ata)
    return Number(account.amount)
  } catch {
    return 0
  }
}

export async function hasBonusAccess(walletAddress) {
  const balance = await getAgntBalance(walletAddress)
  return balance >= BONUS_THRESHOLD
}
