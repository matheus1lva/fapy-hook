import 'dotenv/config';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { KongWebhookSchema, OutputSchema } from '../src/types/schemas';
import { computeFapy } from '../src/index';

const app = express();
app.use(express.json());

// Liveness
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.post('/webhook/fapy', async (req: Request, res: Response) => {
  try {
    const hook = KongWebhookSchema.parse(req.body);

    // Compute outputs (placeholder zeros for now)
    const outputs = await computeFapy(hook);

    console.log('outputs', outputs);
    // BigInt-safe JSON stringify
    const replacer = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v);

    res.setHeader('Kong-Api-Key', process.env.KONG_API_KEY || 'NO API KEY');
    res.status(200).send(JSON.stringify(OutputSchema.array().parse(outputs), replacer));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid payload', issues: err.issues });
    }
    console.error('fapy webhook error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Export for Vercel
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT || 3030);
  app.listen(port, () => {
    console.log(`fapy-hook listening on http://localhost:${port}`);
  });
}
