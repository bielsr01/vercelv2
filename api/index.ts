import serverlessExpress from '@vendia/serverless-express';
import app, { initializeApp } from "../server/app";

let serverlessExpressInstance: any = null;
let isInitialized = false;

async function setup() {
  if (isInitialized) return;
  
  try {
    console.log('🚀 Initializing app...');
    await initializeApp();
    serverlessExpressInstance = serverlessExpress({ app });
    isInitialized = true;
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
}

const initPromise = setup();

export default async function handler(req: any, res: any) {
  try {
    await initPromise;
    
    if (!serverlessExpressInstance) {
      throw new Error('Serverless instance not initialized');
    }
    
    return serverlessExpressInstance(req, res);
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}
