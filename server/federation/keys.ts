import { APKey, type KeyType } from '../services/db'
import type { APActor } from './types'
import { useLogger } from '../lib/logger'

const log = useLogger('federation/keys')

export async function getActorKeys(actor: APActor) {
  const keys = []
  if (actor.publicKey) {
    log.debug(`create APKey with ap_id: ${actor.publicKey.id}`)
    const k = await APKey.upsert({
      ap_id: actor.publicKey.id,
      type: 'rsa-pss-sha512',
      public_key: decodePem(actor.publicKey.publicKeyPem),
      apUserApId: actor.id
    })
    keys.push(k)
  }

  if (actor.assertionMethod && Array.isArray(actor.assertionMethod)) {
    for (const assertion of actor.assertionMethod) {
      if (assertion.type === 'Multikey' && assertion.publicKeyMultibase) {
        log.debug(`create APKey with ap_id: ${assertion.id}`)
        const { type, keyData } = decodePublicKeyMultibase(assertion.publicKeyMultibase)
        const k = await APKey.upsert({
          ap_id: assertion.id,
          type,
          public_key: keyData,
          apUserApId: actor.id
        })
        keys.push(k)
      }
    }
  }
  return keys
}

export function decodePem(pem: string): Uint8Array {
  const lines = pem.split('\n')
  const base64 = lines.slice(1, -2).join('')
  return Buffer.from(base64, 'base64')
}

// https://datatracker.ietf.org/doc/html/draft-msporny-base58-03

// this is kinda dumb.
const TABLE = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// very silly.
export function encodeBase58(data: Uint8Array): string {
  const out: number[] = []
  let n = BigInt('0x' + Buffer.from(data).toString('hex'))
  while (n > 0) {
    out.push(Number(n % 58n))
    n = n / 58n
  }
  return out.reverse().map(x => TABLE[x]).join('')
}

// another n-squared algorithm. wackiness squared.
export function decodeBase58(s: string): Uint8Array {
  const data = [...s].map(ch => TABLE.indexOf(ch) ?? 0)
  const out: number[] = []
  for (const digit of data) {
    let carry = digit
    for (const i in out) {
      out[i] = out[i]! * 58 + carry
      carry = out[i] >> 8
      out[i] &= 0xff
    }
    if (carry > 0) out.push(carry)
  }
  return Uint8Array.from(out.reverse())
}

// AHA! https://multiformats.readthedocs.io/en/latest/implementation-report.html
// also: https://github.com/multiformats/multicodec/blob/master/table.csv
const PREFIX_ED25519_PUBLIC = 'ed01' // 0xed
const PREFIX_RSA_DER_PUBLIC = '8524' // 0x1205

export function decodePublicKeyMultibase(publicKeyMultibase: string): { type: KeyType, keyData: Uint8Array } {
  const prefix = publicKeyMultibase[0]
  let data
  if (prefix === 'z') {
    data = decodeBase58(publicKeyMultibase.slice(1))
  } else if (prefix === 'u') {
    data = Buffer.from(publicKeyMultibase.slice(1), 'base64url')
  } else {
    log.warn(`Unsupported multi-base prefix ${publicKeyMultibase}`)
    throw new Error(`Unsupported multi-base prefix: ${publicKeyMultibase}`)
  }

  const ident = Buffer.from(data.slice(0, 2)).toString('hex')
  if (ident == PREFIX_ED25519_PUBLIC) {
    return {
      type: 'ed25519',
      keyData: data.slice(2)
    }
  } else if (ident == PREFIX_RSA_DER_PUBLIC) {
    return {
      type: 'rsa-v1_5-sha256',
      keyData: data.slice(2) // This is the binary SPKI/DER structure
    }
  }
  throw new Error('Unknown Multicodec prefix in key data')
}

// for now, default to the hated base58
export function encodeMultiBase(data: Uint8Array): string {
  return 'z' + encodeBase58(data)
}

export function encodeMultiBase64(data: Uint8Array): string {
  return 'u' + Buffer.from(data).toString('base64url')
}
