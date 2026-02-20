import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const password = process.env.databasePassword;
const connectionString = `mongodb+srv://tstone4:${password}@cluster0.ntuqn.mongodb.net/tobyStone?appName=Cluster0`;

let cachedConnection = null;

export async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (!password) {
        throw new Error('databasePassword environment variable is not defined');
    }

    try {
        const opts = {
            bufferCommands: false,
        };

        const connection = await mongoose.connect(connectionString, opts);
        cachedConnection = connection;
        console.log('Connected to MongoDB');
        return connection;
    } catch (e) {
        console.error('MongoDB connection error:', e);
        throw e;
    }
}
