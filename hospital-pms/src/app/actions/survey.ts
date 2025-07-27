'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/actions';
import { redirect } from 'next/navigation';

// Survey submission schema - matches the form schema
const surveySubmissionSchema = z.object({
  // Personal Information
  name: z.string().min(2),
  birthDate: z.string(),
  gender: z.enum(['male', 'female']),
  ssn: z.string(),
  
  // Contact Information
  phone: z.string(),
  email: z.string().optional(),
  address: z.string(),
  addressDetail: z.string().optional(),
  postalCode: z.string(),
  
  // Medical History & Diseases
  // Disease checkboxes
  flagHypertension: z.boolean(),
  flagDiabetes: z.boolean(),
  flagHyperlipidemia: z.boolean(),
  flagAnticoagulant: z.boolean(),
  flagAsthma: z.boolean(),
  flagAllergy: z.boolean(),
  flagCardiovascular: z.boolean(),
  flagPregnancy: z.boolean(),
  flagNone: z.boolean(),
  // Additional medical info
  hasAllergies: z.boolean(),
  allergies: z.string().optional(),
  hasMedications: z.boolean(),
  medications: z.string().optional(),
  hasMedicalHistory: z.boolean(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.string(),
  emergencyRelation: z.string(),
  
  // Desired Examinations
  examHeart: z.boolean(),
  examEndoscopy: z.boolean(),
  examCT: z.boolean(),
  examMRI: z.boolean(),
  examOther: z.string().optional(),
  
  // Agreements
  agreePrivacy: z.boolean(),
  agreeMedical: z.boolean(),
});

type SurveySubmissionData = z.infer<typeof surveySubmissionSchema>;

import { validateSSN } from '@/lib/security/ssn-encryption';

/**
 * Check if a patient already exists with the given SSN
 */
export async function checkPatientExists(
  ssn: string
): Promise<ActionResponse<{ exists: boolean; patientName?: string }>> {
  try {
    const supabase = await createClient();
    
    // Validate SSN format
    if (!validateSSN(ssn)) {
      return {
        success: false,
        error: '유효하지 않은 주민등록번호 형식입니다',
      };
    }
    
    const { data, error } = await supabase
      .rpc('check_patient_exists_by_ssn', { p_ssn: ssn });
    
    if (error) {
      console.error('Patient check error:', error);
      return {
        success: false,
        error: '환자 정보 확인 중 오류가 발생했습니다',
      };
    }
    
    return {
      success: true,
      data: {
        exists: data.exists,
        patientName: data.patient_name,
      },
    };
  } catch (error) {
    console.error('Patient existence check error:', error);
    return {
      success: false,
      error: '환자 정보 확인 중 오류가 발생했습니다',
    };
  }
}

export async function submitSurvey(
  token: string,
  data: SurveySubmissionData
): Promise<ActionResponse<{ patientId: string; responseId: string; isNewPatient: boolean }>> {
  console.log('[Server] submitSurvey called with token:', token);
  
  try {
    const supabase = await createClient();
    
    // Validate the data
    console.log('[Server] Validating data...');
    const validatedData = surveySubmissionSchema.parse(data);
    
    // Validate SSN format before processing
    if (!validateSSN(validatedData.ssn)) {
      return {
        success: false,
        error: '유효하지 않은 주민등록번호 형식입니다',
      };
    }
    
    // Prepare patient data
    const patientData = {
      name: validatedData.name,
      date_of_birth: validatedData.birthDate,
      gender: validatedData.gender,
      phone: validatedData.phone,
      email: validatedData.email || null,
      address: {
        street: validatedData.address,
        detail: validatedData.addressDetail || null,
        postal_code: validatedData.postalCode,
      },
      emergency_contact: {
        phone: validatedData.emergencyContact,
        relation: validatedData.emergencyRelation,
      },
      // Disease flags
      flag_hypertension: validatedData.flagHypertension,
      flag_diabetes: validatedData.flagDiabetes,
      flag_hyperlipidemia: validatedData.flagHyperlipidemia,
      flag_anticoagulant: validatedData.flagAnticoagulant,
      flag_asthma: validatedData.flagAsthma,
      flag_allergy: validatedData.flagAllergy,
      flag_cardiovascular: validatedData.flagCardiovascular,
      flag_pregnancy: validatedData.flagPregnancy,
    };
    
    // Prepare survey responses
    const surveyResponses = {
      personal_info: {
        name: validatedData.name,
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
      },
      contact_info: {
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address,
        addressDetail: validatedData.addressDetail,
        postalCode: validatedData.postalCode,
      },
      medical_info: {
        diseases: {
          hypertension: validatedData.flagHypertension,
          diabetes: validatedData.flagDiabetes,
          hyperlipidemia: validatedData.flagHyperlipidemia,
          anticoagulant: validatedData.flagAnticoagulant,
          asthma: validatedData.flagAsthma,
          allergy: validatedData.flagAllergy,
          cardiovascular: validatedData.flagCardiovascular,
          pregnancy: validatedData.flagPregnancy,
          none: validatedData.flagNone,
        },
        hasAllergies: validatedData.hasAllergies,
        allergies: validatedData.allergies,
        hasMedications: validatedData.hasMedications,
        medications: validatedData.medications,
        hasMedicalHistory: validatedData.hasMedicalHistory,
        medicalHistory: validatedData.medicalHistory,
        emergencyContact: validatedData.emergencyContact,
        emergencyRelation: validatedData.emergencyRelation,
      },
      examinations: {
        heart: validatedData.examHeart,
        endoscopy: validatedData.examEndoscopy,
        ct: validatedData.examCT,
        mri: validatedData.examMRI,
        other: validatedData.examOther,
      },
      agreements: {
        privacy: validatedData.agreePrivacy,
        medical: validatedData.agreeMedical,
        agreedAt: new Date().toISOString(),
      },
    };
    
    // Prepare medical data if any
    const medicalData = (validatedData.hasAllergies || validatedData.hasMedications || validatedData.hasMedicalHistory)
      ? {
          allergies: validatedData.hasAllergies ? validatedData.allergies : null,
          medications: validatedData.hasMedications ? validatedData.medications : null,
          medical_history: validatedData.hasMedicalHistory ? validatedData.medicalHistory : null,
        }
      : null;
    
    // Call the transaction function
    console.log('[Server] Calling submit_survey_with_patient RPC...');
    console.log('[Server] RPC params:', {
      p_token: token,
      p_patient_data: patientData,
      p_ssn: validatedData.ssn.substring(0, 6) + '-*******', // Mask SSN for logging
      p_survey_responses: surveyResponses,
      p_medical_data: medicalData,
    });
    
    const { data: result, error: submitError } = await supabase
      .rpc('submit_survey_with_patient', {
        p_token: token,
        p_patient_data: patientData,
        p_ssn: validatedData.ssn,
        p_survey_responses: surveyResponses,
        p_medical_data: medicalData,
      });
      
    console.log('[Server] RPC response:', { result, error: submitError });
      
    if (submitError) {
      console.error('[Server] Survey submission error:', submitError);
      
      // Handle specific error codes
      if (submitError.code === 'invalid_parameter_value') {
        if (submitError.message.includes('Token expired')) {
          return {
            success: false,
            error: '토큰이 만료되었습니다',
          };
        }
        if (submitError.message.includes('Token already used')) {
          return {
            success: false,
            error: '이미 사용된 토큰입니다',
          };
        }
        if (submitError.message.includes('Invalid token')) {
          return {
            success: false,
            error: '유효하지 않은 토큰입니다',
          };
        }
      }
      
      return {
        success: false,
        error: '설문 제출 중 오류가 발생했습니다',
      };
    }
    
    if (!result || !result.success) {
      console.error('[Server] Result indicates failure:', result);
      return {
        success: false,
        error: '설문 제출에 실패했습니다',
      };
    }
    
    console.log('[Server] Submission successful!');
    console.log('[Server] Result details:', {
      patient_id: result.patient_id,
      response_id: result.response_id,
      is_new_patient: result.is_new_patient,
    });
    
    // TODO: Task 5.6 - Send real-time notification to BD
    // This will be implemented in Task 5.6
    
    // Revalidate the survey tokens page
    revalidatePath('/survey-tokens');
    
    const response = {
      success: true,
      data: {
        patientId: result.patient_id,
        responseId: result.response_id,
        isNewPatient: result.is_new_patient,
      },
    };
    
    console.log('[Server] Returning response:', response);
    return response;
  } catch (error) {
    console.error('Survey submission error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: '입력된 데이터가 올바르지 않습니다',
      };
    }
    
    return {
      success: false,
      error: '설문 제출 중 오류가 발생했습니다',
    };
  }
}