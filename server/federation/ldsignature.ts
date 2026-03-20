import { useLogger } from '../lib/logger'
import jsonld from 'jsonld'
import crypto from 'crypto'
const log = useLogger('LDSignature')

export async function verify(activity: any, publicKey: string) {
  if (!activity.signature) {
    log.warn('No signature found')
    throw new Error('No signature found')
  }

  const { type, creator, created, signatureValue } = activity.signature

  if (type !== 'RsaSignature2017') {
    log.warn('Unsupported signature type: %s', type)
    throw new Error('Unsupported signature type')
  }

  // clone without signature
  const doc = { ...activity }
  delete doc.signature

  const canon = await canonicalize(doc)

  const hash = crypto.createHash('sha256')
    .update(canon)
    .digest()

  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(hash)
  verifier.end()

  return verifier.verify(publicKey, signatureValue, 'base64')
}

export async function sign(activity: any, privateKey: string, keyId: string) {
  const created = new Date().toISOString()

  // clone without signature
  const doc = { ...activity }
  delete doc.signature

  const canon = await canonicalize(doc)

  const hash = crypto.createHash('sha256')
    .update(canon)
    .digest()

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(hash)
  signer.end()

  const signatureValue = signer.sign(privateKey).toString('base64')

  return {
    type: 'RsaSignature2017',
    creator: keyId,
    created,
    signatureValue
  }
}

async function canonicalize(activity: any) {
  return jsonld.canonize(activity, {
    algorithm: 'URDNA2015',
    format: 'application/n-quads'
  })
}