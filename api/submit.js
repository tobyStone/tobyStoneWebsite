import { connectToDatabase } from './database.js';
import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, maxlength: 150, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    timestamp: { type: Date, default: Date.now }
}, { collection: 'tobyStone' });

// Prevent model recompilation error in serverless
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Content-Type and Size Validation immediately
        if (req.headers['content-type'] !== 'application/json') {
            return res.status(415).json({ error: 'Unsupported Media Type: expected application/json' });
        }

        // Extremely crude payload length cutoff (e.g., if req.body is larger than ~2KB)
        // Note: Vercel standardizes standard req.body as parsed object, but we can check stringified size
        if (JSON.stringify(req.body).length > 2000) {
            return res.status(413).json({ error: 'Payload Too Large' });
        }

        // 2. Explicit Origin/Referer Allowlist to prevent Cross-Site Request Abuse
        const origin = req.headers.origin;
        const referer = req.headers.referer;

        const ALLOWED_ORIGINS = [
            'https://www.tobystone.com',
            'https://tobystone.com',
            'http://localhost:3000',
            'http://localhost:5173'
        ];

        let isAllowed = false;

        if (origin && ALLOWED_ORIGINS.includes(origin)) {
            isAllowed = true;
        } else if (referer) {
            // Referers usually have trailing slashes or paths, so we check if it starts with an allowed origin
            isAllowed = ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
        }

        if (!isAllowed && process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Forbidden: Origin not in allowlist' });
        }

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { name, email, message } = req.body;

        // Strict input validation
        if (!name || typeof name !== 'string' || name.length > 100) {
            return res.status(400).json({ error: 'Invalid or missing name' });
        }
        if (!email || typeof email !== 'string' || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid or missing email' });
        }
        if (!message || typeof message !== 'string' || message.length > 1000) {
            return res.status(400).json({ error: 'Invalid or missing message' });
        }

        // Prevent mass assignment (unexpected fields)
        const allowedKeys = ['name', 'email', 'message'];
        const bodyKeys = Object.keys(req.body);
        if (bodyKeys.some(key => !allowedKeys.includes(key))) {
            return res.status(400).json({ error: 'Unexpected fields in request' });
        }

        await connectToDatabase();

        const newSubmission = new Submission({ name: name.trim(), email: email.trim(), message: message.trim() });
        await newSubmission.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Submission error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
