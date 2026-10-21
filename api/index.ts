import app from '../server';

// Standard Vercel Serverless Function handler
export default function handler(req: any, res: any) {
  // If running in AWS Lambda / Vercel Serverless runtime:
  // prevent lambda from hanging waiting for open background event loop handles (like Firestore connections)
  if (req?.context) {
    req.context.callbackWaitsForEmptyEventLoop = false;
  }
  return app(req, res);
}
