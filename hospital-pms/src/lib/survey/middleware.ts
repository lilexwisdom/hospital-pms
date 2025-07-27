import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function validateSurveyTokenMiddleware(
  request: NextRequest,
  token: string
) {
  const supabase = await createClient();

  // Get token from database
  const { data, error } = await supabase
    .from('survey_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return {
      valid: false,
      reason: 'TOKEN_NOT_FOUND',
      response: NextResponse.redirect(new URL('/survey/error?reason=invalid', request.url))
    };
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  
  if (now > expiresAt) {
    return {
      valid: false,
      reason: 'TOKEN_EXPIRED',
      response: NextResponse.redirect(new URL('/survey/error?reason=expired', request.url))
    };
  }

  // Check if token is already used
  if (data.used_at) {
    return {
      valid: false,
      reason: 'TOKEN_USED',
      response: NextResponse.redirect(new URL('/survey/error?reason=used', request.url))
    };
  }

  // Token is valid
  return {
    valid: true,
    tokenData: {
      token: data.token,
      patientName: data.patient_name,
      patientPhone: data.patient_phone,
      patientEmail: data.patient_email,
      createdBy: data.created_by,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      surveyData: data.survey_data,
    }
  };
}