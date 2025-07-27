import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ssnDecryptionMiddleware, checkRateLimit } from '@/lib/security/ssn-middleware';
import { logSSNAccess, decryptSSN } from '@/lib/security/ssn-encryption';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: patientId } = await params;
  
  return ssnDecryptionMiddleware(request, async (req, context) => {
    try {
      // Check rate limit
      if (!checkRateLimit(context.userId)) {
        await logSSNAccess({
          userId: context.userId,
          patientId,
          action: 'decrypt',
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: 'Rate limit exceeded'
        });
        
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      
      const supabase = await createClient();
      
      // Call the database function to get decrypted SSN
      const { data, error } = await supabase
        .rpc('get_patient_ssn', { patient_id: patientId });
      
      if (error) {
        await logSSNAccess({
          userId: context.userId,
          patientId,
          action: 'decrypt',
          timestamp: new Date(),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          success: false,
          errorMessage: error.message
        });
        
        return NextResponse.json(
          { error: 'Failed to decrypt SSN' },
          { status: 500 }
        );
      }
      
      // Log successful access
      await logSSNAccess({
        userId: context.userId,
        patientId,
        action: 'decrypt',
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true
      });
      
      // Return decrypted SSN with additional security headers
      return NextResponse.json(
        { ssn: data },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    } catch (error) {
      console.error('SSN decryption error:', error);
      
      await logSSNAccess({
        userId: context.userId,
        patientId,
        action: 'decrypt',
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}