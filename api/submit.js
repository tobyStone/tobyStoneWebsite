import { connectToDatabase } from './database.js';
import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

// Prevent model recompilation error in serverless
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        // Parse body (Vercel serverless parses JSON automatically?)
        // In Bun/Native fetch it might be different, but Vercel Node runtime standardizes this.
        // If using straight Bun.serve locally, might need req.json().
        // Vercel Serverless Functions signature: (req, res) -> Express-like.

        const { name, email, message } = req.body;

        const newSubmission = new Submission({ name, email, message });
        await newSubmission.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
