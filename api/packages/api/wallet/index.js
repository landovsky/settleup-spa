const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
const MAX_BODY_SIZE = 512 * 1024;

function generateCode() {
    const group = () => Array.from({ length: 3 }, () =>
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
    return `${group()}-${group()}-${group()}`;
}

function respond(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}

function getS3Client() {
    return new S3Client({
        endpoint: `https://${process.env.SPACES_ENDPOINT}`,
        region: process.env.SPACES_ENDPOINT.split('.')[0],
        credentials: {
            accessKeyId: process.env.SPACES_KEY,
            secretAccessKey: process.env.SPACES_SECRET,
        },
        forcePathStyle: false,
    });
}

async function objectExists(s3, key) {
    try {
        await s3.send(new HeadObjectCommand({
            Bucket: process.env.SPACES_BUCKET,
            Key: key,
        }));
        return true;
    } catch (e) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false;
        throw e;
    }
}

async function getWallet(s3, code) {
    if (!code || !CODE_PATTERN.test(code)) {
        return respond(400, { error: 'Invalid wallet code' });
    }
    try {
        const obj = await s3.send(new GetObjectCommand({
            Bucket: process.env.SPACES_BUCKET,
            Key: `wallets/${code}.json`,
        }));
        const body = await obj.Body.transformToString();
        return respond(200, body);
    } catch (e) {
        if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
            return respond(404, { error: 'Wallet not found' });
        }
        throw e;
    }
}

async function createWallet(s3, walletData) {
    let code;
    for (let i = 0; i < 10; i++) {
        const candidate = generateCode();
        if (!(await objectExists(s3, `wallets/${candidate}.json`))) {
            code = candidate;
            break;
        }
    }
    if (!code) {
        return respond(500, { error: 'Could not generate unique code' });
    }

    const stored = {
        code,
        name: walletData.name || '',
        people: walletData.people || [],
        expenses: walletData.expenses || [],
        settlements: walletData.settlements || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await s3.send(new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: `wallets/${code}.json`,
        Body: JSON.stringify(stored),
        ContentType: 'application/json',
    }));

    return respond(201, stored);
}

async function updateWallet(s3, code, walletData) {
    if (!code || !CODE_PATTERN.test(code)) {
        return respond(400, { error: 'Invalid wallet code' });
    }

    if (!(await objectExists(s3, `wallets/${code}.json`))) {
        return respond(404, { error: 'Wallet not found' });
    }

    const stored = {
        code,
        name: walletData.name || '',
        people: walletData.people || [],
        expenses: walletData.expenses || [],
        settlements: walletData.settlements || [],
        updatedAt: new Date().toISOString(),
    };

    await s3.send(new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: `wallets/${code}.json`,
        Body: JSON.stringify(stored),
        ContentType: 'application/json',
    }));

    return respond(200, stored);
}

async function main(args) {
    const method = (args.__ow_method || 'get').toUpperCase();

    if (method === 'OPTIONS') {
        return { statusCode: 204 };
    }

    const s3 = getS3Client();

    try {
        if (method === 'GET') {
            return await getWallet(s3, args.code);
        }

        // Parse body for POST/PUT
        let body;
        if (args.__ow_body) {
            const raw = Buffer.isBuffer(args.__ow_body)
                ? args.__ow_body.toString()
                : args.__ow_body;

            // Base64 decode if needed (DO Functions may base64-encode bodies)
            let decoded;
            try {
                decoded = Buffer.from(raw, 'base64').toString('utf-8');
                JSON.parse(decoded);
            } catch {
                decoded = raw;
            }

            if (decoded.length > MAX_BODY_SIZE) {
                return respond(413, { error: 'Wallet data too large' });
            }
            body = JSON.parse(decoded);
        } else {
            // Args may contain the wallet data directly (DO Functions auto-parses JSON)
            body = { wallet: args.wallet };
        }

        const walletData = body.wallet;
        if (!walletData) {
            return respond(400, { error: 'Missing wallet data' });
        }

        if (method === 'POST') {
            return await createWallet(s3, walletData);
        }

        if (method === 'PUT') {
            return await updateWallet(s3, args.code, walletData);
        }

        return respond(405, { error: 'Method not allowed' });
    } catch (err) {
        console.error('Function error:', err);
        return respond(500, { error: 'Internal server error' });
    }
}

exports.main = main;
