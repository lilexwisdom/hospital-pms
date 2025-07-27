import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type SurveyToken = Database['public']['Tables']['survey_tokens']['Row'];
type SurveyResponse = Database['public']['Tables']['survey_responses']['Row'];
type NewSurveyToken = Database['public']['Tables']['survey_tokens']['Insert'];
type NewSurveyResponse = Database['public']['Tables']['survey_responses']['Insert'];

export interface SurveyTokenCreateData {
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  survey_data?: Record<string, any>;
}

export interface SurveyResponseData {
  survey_type?: string;
  responses: Record<string, any>;
  metadata?: Record<string, any>;
}

export class SurveyService {
  private supabase = createClient();

  /**
   * Create a new survey token for BD users
   */
  async createSurveyToken(data: SurveyTokenCreateData): Promise<SurveyToken> {
    const { data: token, error } = await this.supabase
      .from('survey_tokens')
      .insert({
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: data.patient_email,
        survey_data: data.survey_data || {},
        created_by: (await this.supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return token;
  }

  /**
   * Get survey token by UUID (for public survey page)
   */
  async getToken(tokenId: string): Promise<SurveyToken | null> {
    const { data, error } = await this.supabase
      .from('survey_tokens')
      .select('*')
      .eq('token', tokenId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Validate and use survey token
   */
  async useToken(tokenId: string, patientData?: any): Promise<SurveyToken> {
    const { data, error } = await this.supabase
      .rpc('use_survey_token', {
        token_uuid: tokenId,
        patient_data: patientData
      });

    if (error) {
      if (error.message.includes('already used')) {
        throw new Error('이미 사용된 설문 링크입니다.');
      }
      if (error.message.includes('expired')) {
        throw new Error('만료된 설문 링크입니다.');
      }
      if (error.message.includes('Invalid')) {
        throw new Error('유효하지 않은 설문 링크입니다.');
      }
      throw error;
    }

    return data;
  }

  /**
   * Save survey response
   */
  async saveSurveyResponse(
    tokenId: string,
    responseData: SurveyResponseData
  ): Promise<SurveyResponse> {
    const { data, error } = await this.supabase
      .from('survey_responses')
      .insert({
        survey_token: tokenId,
        survey_type: responseData.survey_type || 'pre_consultation',
        responses: responseData.responses,
        metadata: responseData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete survey response
   */
  async completeSurveyResponse(responseId: string): Promise<SurveyResponse> {
    const { data, error } = await this.supabase
      .from('survey_responses')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get survey responses for a patient
   */
  async getPatientSurveyResponses(patientId: string): Promise<SurveyResponse[]> {
    const { data, error } = await this.supabase
      .from('survey_responses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all survey tokens created by current user (BD)
   */
  async getMyTokens(): Promise<SurveyToken[]> {
    const { data, error } = await this.supabase
      .from('survey_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate survey link
   */
  generateSurveyLink(token: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/survey/${token}`;
  }

  /**
   * Cleanup expired tokens (admin function)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const { error } = await this.supabase
      .rpc('cleanup_expired_tokens');

    if (error) throw error;
  }
}