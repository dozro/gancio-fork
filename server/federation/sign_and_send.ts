import crypto from 'crypto'
import { useLogger } from '../utils/useLogger'
export async function _signAndSend(message: string, inbox: string, method: 'post' | 'get' = 'post', privkey: string) {
  const log = useLogger('sign_and_send')
  log.debug('[FEDI] Sign and %s %s', method, inbox)
  const inboxUrl = new URL(inbox)
  const signer = crypto.createSign('sha256')
  const d = new Date()

  let header
  let digest
  if (method === 'post') {
    digest = crypto.createHash('sha256')
      .update(message)
      .digest('base64')
    const stringToSign = `(request-target): post ${inboxUrl.pathname}\nhost: ${inboxUrl.hostname}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digest}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privkey)
    const signature_b64 = signature.toString('base64')
    header = `keyId="${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature_b64}"`
  } else {
    const stringToSign = `(request-target): get ${inboxUrl.pathname}\nhost: ${inboxUrl.hostname}\ndate: ${d.toUTCString()}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privkey)
    const signature_b64 = signature.toString('base64')
    header = `keyId="${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="${signature_b64}"`
  }
  try {
    const ret = await fetch(inbox, {
      headers: {
        'Host': inboxUrl.hostname,
        'Date': d.toUTCString(),
        'Signature': header,
        ...(method === 'post' && ({ Digest: `SHA-256=${digest}` })),
        'Content-Type': 'application/activity+json',
        'Accept': 'application/activity+json'
      },
      method,
      ...(method === 'post' && ({ body: message }))
    })

    const contentType = ret.headers.get('content-type')
    // check if content-type is json
    if (!contentType?.includes('json')) {
      log.error(`[FEDI] Error in sign and send, wrong content-type returned: ${contentType} - status: ${ret.status}`)
      console.error(await ret.text())
      return
    }

    if (ret.ok) {
      log.debug(`[FEDI] Signed and verified! ${ret.status} => ${contentType}`)
      return ret.json().catch(() => '')
    } else {
      const body = await ret.json()
      log.error('[FEDI] Error in sign and send status [%s]: %s', inbox, body)
      throw 'diocane'
    }
  } catch (e) {
    log.error('[FEDI] Error in sign and send [%s]: %s', inbox, e?.response?.data?.error ?? e?.response?.statusMessage ?? '' + ' ' + String(e))
    throw e
  }
}
