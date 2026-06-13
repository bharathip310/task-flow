import { Request, Response, NextFunction } from 'express';
import { getOrCreateUser } from '../db/users.ts';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthRequest extends Request {
  user?: any;
  dbUserId?: number;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw error || new Error('User not found');
    }
    
    req.user = user;
    
    // Sync to DB
    const dbUser = await getOrCreateUser(
      user.id, 
      user.email || '', 
      user.user_metadata?.full_name || '', 
      user.user_metadata?.avatar_url || ''
    );
    req.dbUserId = dbUser.id; // numeric pg ID
    
    next();
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
