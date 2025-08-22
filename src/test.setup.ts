import { setGlobalDispatcher, Agent } from 'undici'

const allow = process.env.ALLOW_INSECURE_TLS
if (allow && (allow === '1' || allow.toLowerCase() === 'true')) {
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }))
}