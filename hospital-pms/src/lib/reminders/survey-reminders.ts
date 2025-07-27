import { createClient } from '@/lib/supabase/server';

interface SurveyReminder {
  tokenId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Schedule a reminder for an incomplete survey
 */
export async function scheduleSurveyReminder(
  tokenId: string,
  reminderType: 'email' | 'sms',
  scheduledAt: Date,
  metadata?: any
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('schedule_survey_reminder', {
      p_token_id: tokenId,
      p_reminder_type: reminderType,
      p_scheduled_at: scheduledAt.toISOString(),
      p_metadata: metadata,
    });
    
  if (error) {
    console.error('Error scheduling reminder:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get all pending survey tokens that need reminders
 */
export async function getPendingSurveyTokens(): Promise<SurveyReminder[]> {
  const supabase = await createClient();
  
  // Get tokens that:
  // 1. Haven't been used
  // 2. Haven't expired
  // 3. Are at least 24 hours old (give them time to complete)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const { data, error } = await supabase
    .from('survey_tokens')
    .select(`
      token,
      patient_name,
      patient_email,
      patient_phone,
      expires_at,
      created_at
    `)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .lt('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching pending tokens:', error);
    return [];
  }
  
  return data.map(token => ({
    tokenId: token.token,
    patientName: token.patient_name,
    patientEmail: token.patient_email,
    patientPhone: token.patient_phone,
    expiresAt: token.expires_at,
    createdAt: token.created_at,
  }));
}

/**
 * Send reminder email (placeholder - would integrate with email service)
 */
export async function sendReminderEmail(
  to: string,
  patientName: string,
  surveyLink: string,
  expiresAt: Date
) {
  // This would integrate with your email service (SendGrid, SES, etc.)
  console.log('Sending reminder email to:', to, {
    patientName,
    surveyLink,
    expiresAt,
  });
  
  // Example email content:
  const emailContent = `
    안녕하세요 ${patientName}님,
    
    아직 설문조사를 완료하지 않으셨습니다.
    
    설문조사는 ${new Date(expiresAt).toLocaleDateString('ko-KR')}까지 유효합니다.
    
    아래 링크를 클릭하여 설문조사를 완료해 주세요:
    ${surveyLink}
    
    감사합니다.
  `;
  
  // TODO: Implement actual email sending
  return true;
}

/**
 * Send reminder SMS (placeholder - would integrate with SMS service)
 */
export async function sendReminderSMS(
  to: string,
  patientName: string,
  surveyLink: string
) {
  // This would integrate with your SMS service (Twilio, etc.)
  console.log('Sending reminder SMS to:', to, {
    patientName,
    surveyLink,
  });
  
  // Example SMS content:
  const smsContent = `[병원명] ${patientName}님, 설문조사를 아직 완료하지 않으셨습니다. 링크: ${surveyLink}`;
  
  // TODO: Implement actual SMS sending
  return true;
}

/**
 * Process all pending reminders
 */
export async function processPendingReminders() {
  const pendingTokens = await getPendingSurveyTokens();
  
  for (const token of pendingTokens) {
    try {
      // Calculate when to send reminder (e.g., 2 days before expiry)
      const expiryDate = new Date(token.expiresAt);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - 2);
      
      // Only schedule if reminder date hasn't passed
      if (reminderDate > new Date()) {
        // Schedule email reminder if email exists
        if (token.patientEmail) {
          await scheduleSurveyReminder(
            token.tokenId,
            'email',
            reminderDate,
            {
              patientName: token.patientName,
              email: token.patientEmail,
            }
          );
        }
        
        // Schedule SMS reminder if phone exists
        if (token.patientPhone) {
          await scheduleSurveyReminder(
            token.tokenId,
            'sms',
            reminderDate,
            {
              patientName: token.patientName,
              phone: token.patientPhone,
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing reminder for token:', token.tokenId, error);
    }
  }
}