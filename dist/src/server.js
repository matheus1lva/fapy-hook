"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const types_1 = require("./types/types");
const _1 = require(".");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Liveness
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.post('/webhook/fapy', async (req, res) => {
    try {
        const hook = types_1.KongWebhookSchema.parse(req.body);
        // Compute outputs (placeholder zeros for now)
        const outputs = await (0, _1.computeFapy)(hook);
        // BigInt-safe JSON stringify
        const replacer = (_, v) => (typeof v === 'bigint' ? v.toString() : v);
        res.setHeader('Kong-Api-Key', process.env.KONG_API_KEY || 'NO API KEY');
        res.status(200).send(JSON.stringify(types_1.OutputSchema.array().parse(outputs), replacer));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
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
