import { canonicalize } from 'json-canonicalize'
import type { APProof } from './types'
import { useLogger } from '../lib/logger'
import { decodeMultibase, importPublicKey } from './keys'
import { getActorFromKeyId } from './lookup'
const log = useLogger('Object Integrity Proof')

// // Object Integrity Proof
// // https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md
// // Proof generation

// // The proof MUST be created according to the Data Integrity specification, section 4.2 Add Proof.
// // The process of proof generation consists of the following steps:
// //     Canonicalization is a transformation of a JSON object into the form suitable for hashing, according to some deterministic algorithm.
// //     Hashing is a process that calculates an identifier for the transformed data using a cryptographic hash function.
// //     Signature generation is a process that calculates a value that protects the integrity of the input data from modification.
// // The resulting proof is added to the original JSON object under the key proof. Objects SHOULD NOT contain more than one integrity proof.
// // The list of attributes used in integrity proof is defined in Data Integrity specification, section 2.1 Proofs. The proof type SHOULD be DataIntegrityProof, as specified in section 3.1 DataIntegrityProof. The value of proofPurpose attribute MUST be assertionMethod.
// // The value of the verificationMethod attribute of the proof can be an HTTP(S) URI or a DID URL.
// // The controlled identifier document where the verification method is expressed MUST be an actor object or a DID document that is provably associated with an ActivityPub actor (e.g. using a mechanism described in FEP-c390 or FEP-ef61). The verification method MUST be associated with the assertionMethod property of the controlled identifier document. If controlled identifier document is an actor object, implementers SHOULD use assertionMethod property as described in FEP-521a.

// export async function generateObjectIntegrityProof(object: Record<string, unknown>, verificationMethod: string): Promise<Record<string, unknown>> {
//   const proof = {
//     type: "DataIntegrityProof",
//     proofPurpose: "assertionMethod",
//     verificationMethod,
//   }
//   return { ...object, proof }
// }

const algoMap = {
  'rsa-v1_5-sha256': { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  'ed25519': { name: 'Ed25519' },
  'rsa-pss-sha512': { name: 'RSA-PSS', saltLength: 64 }
}
export async function verifyProof(activity: { proof: APProof, signature?: object }) {
  const actor = await getActorFromKeyId(activity.proof.verificationMethod)
  if (!actor || !actor.keys || actor.keys?.length === 0) {
    log.debug(`Actor ${activity.proof.verificationMethod} not found or has no keys`)
    return
  }
  // If both proof and signature are present in a received object,
  // the linked data signature MUST be removed before the verification of the integrity proof.
  if (activity?.signature) delete activity.signature
  const key = actor.keys?.[0]
  if (!key) throw new Error('Actor has no public key')
  const spki = key.public_key
  const publicKey = await importPublicKey(spki, algoMap[key.type])

  let signature
  try {
    signature = decodeMultibase(activity.proof.proofValue)
  } catch (error) {
    log.info(error)
    return
  }

  const proof = (({ proofValue, ...proof }) => proof)(activity.proof)
  const obj = (({ proof, ...obj }) => obj)(activity)

  const proofHash = await crypto.subtle.digest('SHA-256', Buffer.from(canonicalize(proof)))
  const objHash = await crypto.subtle.digest('SHA-256', Buffer.from(canonicalize(obj)))
  const data = Buffer.concat([Buffer.from(proofHash), Buffer.from(objHash)])

  const verified = await crypto.subtle.verify(algoMap[key.type], publicKey, Buffer.from(signature), Buffer.from(data))
  log.debug(`Verifying with key: %s, result: %s`, activity.proof.verificationMethod, verified)
  if (verified) {
    return actor
  }
}
