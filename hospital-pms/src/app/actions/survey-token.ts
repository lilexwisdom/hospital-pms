'use server';

import { createClient } from '@/lib/supabase/server';
import { actionSuccess, actionError, type ActionResponse } from './types';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const createTokenSchema = z.object({
  patientName: z.string().min(1, '환자 이름은 필수입니다'),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email().optional(),
  expiresInHours: z.number().min(1).max(168).default(24), // 1 hour to 7 days, default 24 hours
  metadata: z.record(z.any()).optional(),
});

const validateTokenSchema = z.object({
  token: z.string().uuid('유효하지 않은 토큰 형식입니다'),
});

// Types
export type CreateTokenInput = z.infer<typeof createTokenSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;

export interface SurveyToken {
  token: string;
  patientName: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  patientId?: string | null;
  surveyData?: any | null;
}

export interface TokenValidationResult {
  valid: boolean;
  token?: SurveyToken;
  reason?: string;
}

/**
 * Generate a new survey token
 */
export async function createSurveyToken(
  formData: FormData
): Promise<ActionResponse<{ token: string; url: string; expiresAt: string }>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return actionError('인증이 필요합니다', 'UNAUTHORIZED');
    }

    // Parse and validate input
    const input = createTokenSchema.parse({
      patientName: formData.get('patientName'),
      patientPhone: formData.get('patientPhone') || undefined,
      patientEmail: formData.get('patientEmail') || undefined,
      expiresInHours: formData.get('expiresInHours') 
        ? Number(formData.get('expiresInHours'))
        : 24,
      metadata: formData.get('metadata')
        ? JSON.parse(formData.get('metadata') as string)
        : undefined,
    });

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

    // Insert token into database
    const { data, error } = await supabase
      .from('survey_tokens')
      .insert({
        token,
        patient_name: input.patientName,
        patient_phone: input.patientPhone,
        patient_email: input.patientEmail,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        survey_data: input.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Token creation error:', error);
      return actionError('토큰 생성에 실패했습니다', 'DATABASE_ERROR', { error });
    }

    // Generate survey URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const surveyUrl = `${baseUrl}/survey/${token}`;

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'survey_token_created',
      table_name: 'survey_tokens',
      record_id: token,
      new_data: { patient_name: input.patientName },
    });

    return actionSuccess({
      token,
      url: surveyUrl,
      expiresAt: expiresAt.toISOString(),
    }, '설문 토큰이 생성되었습니다');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError('입력 데이터가 올바르지 않습니다', 'VALIDATION_ERROR', {
        errors: error.errors,
      });
    }
    console.error('Unexpected error:', error);
    return actionError('설문 토큰 생성 중 오류가 발생했습니다', 'UNKNOWN_ERROR');
  }
}

/**
 * Validate a survey token
 */
export async function validateSurveyToken(
  token: string
): Promise<ActionResponse<TokenValidationResult>> {
  try {
    const supabase = await createClient();
    
    // Validate input
    const { token: validatedToken } = validateTokenSchema.parse({ token });

    // Get token from database
    const { data, error } = await supabase
      .from('survey_tokens')
      .select('*')
      .eq('token', validatedToken)
      .single();

    if (error || !data) {
      return actionSuccess({
        valid: false,
        reason: '토큰을 찾을 수 없습니다',
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      return actionSuccess({
        valid: false,
        reason: '토큰이 만료되었습니다',
      });
    }

    // Check if token is already used
    if (data.used_at) {
      return actionSuccess({
        valid: false,
        reason: '이미 사용된 토큰입니다',
      });
    }

    // Token is valid
    return actionSuccess({
      valid: true,
      token: {
        token: data.token,
        patientName: data.patient_name,
        patientPhone: data.patient_phone,
        patientEmail: data.patient_email,
        createdBy: data.created_by,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        usedAt: data.used_at,
        patientId: data.patient_id,
        surveyData: data.survey_data,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return actionError('유효하지 않은 토큰 형식입니다', 'VALIDATION_ERROR');
    }
    console.error('Unexpected error:', error);
    return actionError('토큰 검증 중 오류가 발생했습니다', 'UNKNOWN_ERROR');
  }
}

/**
 * Mark a token as used
 */
export async function markTokenAsUsed(
  token: string,
  patientId?: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('survey_tokens')
      .update({
        used_at: new Date().toISOString(),
        patient_id: patientId,
      })
      .eq('token', token);

    if (error) {
      console.error('Token update error:', error);
      return actionError('토큰 업데이트에 실패했습니다', 'DATABASE_ERROR');
    }

    return actionSuccess(undefined, '토큰이 사용 처리되었습니다');
  } catch (error) {
    console.error('Unexpected error:', error);
    return actionError('토큰 업데이트 중 오류가 발생했습니다', 'UNKNOWN_ERROR');
  }
}

/**
 * Get all tokens created by the current user
 */
export async function getUserSurveyTokens(): Promise<ActionResponse<SurveyToken[]>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return actionError('인증이 필요합니다', 'UNAUTHORIZED');
    }

    // Get tokens
    const { data, error } = await supabase
      .from('survey_tokens')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Token fetch error:', error);
      return actionError('토큰 목록을 가져올 수 없습니다', 'DATABASE_ERROR');
    }

    const tokens: SurveyToken[] = data.map(row => ({
      token: row.token,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      patientEmail: row.patient_email,
      createdBy: row.created_by,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      patientId: row.patient_id,
      surveyData: row.survey_data,
    }));

    return actionSuccess(tokens);
  } catch (error) {
    console.error('Unexpected error:', error);
    return actionError('토큰 목록 조회 중 오류가 발생했습니다', 'UNKNOWN_ERROR');
  }
}

/**
 * Delete expired tokens (cleanup function)
 */
export async function cleanupExpiredTokens(): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const supabase = await createClient();
    
    // Delete tokens that are expired and unused
    const { data, error } = await supabase
      .from('survey_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .select();

    if (error) {
      console.error('Cleanup error:', error);
      return actionError('만료 토큰 정리에 실패했습니다', 'DATABASE_ERROR');
    }

    const deletedCount = data?.length || 0;

    // Log cleanup
    await supabase.from('audit_logs').insert({
      user_id: 'system',
      action: 'survey_tokens_cleanup',
      table_name: 'survey_tokens',
      new_data: { deleted_count: deletedCount },
    });

    return actionSuccess(
      { deletedCount },
      `${deletedCount}개의 만료된 토큰이 삭제되었습니다`
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return actionError('토큰 정리 중 오류가 발생했습니다', 'UNKNOWN_ERROR');
  }
}