import 'dotenv/config';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { KongWebhookSchema, OutputSchema } from './types/schemas';
import { computeFapy } from './output';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();
app.use(express.json());


function verifyWebhookSignature(
  signatureHeader: string,
  secret: string,
  body: string,
  toleranceSeconds = 300 // 5 minutes
): boolean {
  try {
    // Parse signature header: "t=1234567890,v1=abc123..."
    const elements = signatureHeader.split(',')
    const timestampElement = elements.find(el => el.startsWith('t='))
    const signatureElement = elements.find(el => el.startsWith('v1='))

    if (!timestampElement || !signatureElement) {
      return false
    }

    const timestamp = parseInt(timestampElement.split('=')[1])
    const receivedSignature = signatureElement.split('=')[1]

    // Check timestamp tolerance to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000)
    if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
      return false
    }

    // Generate expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`, 'utf8')
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      new Uint8Array(Buffer.from(receivedSignature, 'hex')),
      new Uint8Array(Buffer.from(expectedSignature, 'hex'))
    )
  } catch (error) {
    console.error(error)
    return false
  }
}


// Liveness
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.post('/webhook/fapy', async (req: Request, res: Response) => {
  const signature = req.headers["Kong-Signature"];

  if (!signature) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  if (!verifyWebhookSignature(signature as string, process.env.KONG_SECRET || 'NO SECRET', JSON.stringify(req.body))) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  try {
    const hook = KongWebhookSchema.parse(req.body);

    // Compute outputs (placeholder zeros for now)
    const outputs = await computeFapy(hook);

    // BigInt-safe JSON stringify
    const replacer = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v);

    res.setHeader('Kong-Api-Key', process.env.KONG_SECRET || 'NO API KEY');
    res.status(200).send(JSON.stringify(OutputSchema.array().parse(outputs), replacer));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid payload', issues: err.issues });
    }
    console.error('fapy webhook error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

const port = Number(process.env.PORT || 3030);
app.listen(port, () => {
  console.log(`fapy-hook listening on http://localhost:${port}`);
});
