import { useLogger } from '../lib/logger'
import jsonld from 'jsonld'
import crypto from 'crypto'
const log = useLogger('LDSignature')
import contexts from './contexts'

export async function verify(activity: any, publicKey: string) {
  const sig = activity.signature
  if (!sig) throw new Error('No signature')

  const { signatureValue } = sig

  const doc = { ...activity }
  delete doc.signature

  const sigOpts = {
    "@context": "https://w3id.org/identity/v1",
    ...sig,
  }

  delete sigOpts.type
  delete sigOpts.id
  delete sigOpts.signatureValue

  const sigOptsHash = await hashJsonLd(sigOpts)
  const docHash = await hashJsonLd(doc)

  const message = sigOptsHash + docHash

  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(message)
  verifier.end()

  return verifier.verify(publicKey, signatureValue, 'base64')
}

export async function sign(activity: any, privateKey: string, keyId: string) {

  // clone without signature
  const doc = { ...activity }
  delete doc.signature

  const sigOpts = {
    "@context": "https://w3id.org/identity/v1" as const,
    creator: keyId,
    created: new Date().toISOString()
  }
  
  const sigOptsHash = await hashJsonLd(sigOpts)
  const docHash = await hashJsonLd(activity)
  // concatenate
  const message = sigOptsHash + docHash

  // sign raw message (NO manual hashing)
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(message)
  signer.end()

  const signatureValue = signer.sign(privateKey).toString("base64")

  return {
    ...activity,
    signature: {
      ...sigOpts,
      signatureValue
    }
  }
}

const nodeDocumentLoader = jsonld.documentLoaders.node();
export async function hashJsonLd(activity: any) {
  console.error(activity)
  const canon = await jsonld.canonize(activity, {
    algorithm: 'URDNA2015',
    format: 'application/n-quads',
    documentLoader: async (url: string) => {
      if (contexts[url]) {
        return {
          contextUrl: null,
          document: contexts[url],
          documentUrl: url,
        }
      }
      return nodeDocumentLoader(url)
    },
  })
  return crypto.createHash('sha256').update(canon).digest('hex')
}