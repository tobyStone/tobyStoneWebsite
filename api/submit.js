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
        // Origin/Referer check to prevent Cross-Site Request Abuse
        const host = req.headers.host;
        const origin = req.headers.origin;
        const referer = req.headers.referer;

        if (origin && host) {
            try {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    return res.status(403).json({ error: 'Forbidden origin' });
                }
            } catch (e) {
                return res.status(400).json({ error: 'Invalid origin format' });
            }
        } else if (referer && host) {
            try {
                const refererHost = new URL(referer).host;
                if (refererHost !== host) {
                    return res.status(403).json({ error: 'Forbidden referer' });
                }
            } catch (e) {
                return res.status(400).json({ error: 'Invalid referer format' });
            }
        } else if (!origin && !referer && process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Forbidden, missing origin/referer' });
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
