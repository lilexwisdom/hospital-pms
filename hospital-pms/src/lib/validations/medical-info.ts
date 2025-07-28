import { z } from 'zod';

// Medical History Schema
export const medicalHistorySchema = z.object({
  condition: z.string().min(1, "진단명을 입력해주세요"),
  diagnosisYear: z.string().optional(), // 연도만 입력
  notes: z.string().optional(),
});

// Medication Schema
export const medicationSchema = z.object({
  name: z.string().min(1, "약물명을 입력해주세요"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional(),
  purpose: z.string().optional(),
});

// Surgery Schema
export const surgerySchema = z.object({
  name: z.string().min(1, "수술명을 입력해주세요"),
  date: z.string().optional(),
  hospital: z.string().optional(),
  notes: z.string().optional(),
});

// Allergy Schema
export const allergySchema = z.object({
  type: z.enum(['medication', 'food', 'environmental', 'other']),
  name: z.string().min(1, "알러지 항목을 입력해주세요"),
  reaction: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
});

// Examination Result Schema
export const examinationResultSchema = z.object({
  type: z.string().min(1, "검사 종류를 입력해주세요"),
  date: z.string().min(1, "검사일을 선택해주세요"),
  result: z.string().min(1, "검사 결과를 입력해주세요"),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional(),
});

// Disease Keywords for auto-mapping
export const diseaseKeywords = {
  diabetes: ['당뇨', '혈당', 'diabetes', 'DM', '인슐린', 'insulin', 'HbA1c'],
  hypertension: ['고혈압', '혈압', 'hypertension', 'HTN', 'blood pressure'],
  hyperlipidemia: ['고지혈증', '콜레스테롤', 'hyperlipidemia', 'cholesterol', 'LDL', 'HDL', '중성지방'],
  cardiovascular: ['심장', '뇌졸중', '협심증', '심근경색', '부정맥', 'heart', 'stroke', 'angina', 'MI', 'arrhythmia'],
  asthma: ['천식', 'asthma', '호흡곤란', '기관지'],
  allergy: ['알레르기', '알러지', 'allergy', 'allergic', '두드러기', '아나필락시스'],
  anticoagulant: ['항응고제', '항혈소판제', '아스피린', '와파린', 'aspirin', 'warfarin', '혈전', 'anticoagulant'],
  pregnancy: ['임신', '출산', 'pregnancy', 'pregnant', '산부인과'],
};

// Main Medical Info Form Schema
export const medicalInfoFormSchema = z.object({
  // Medical histories
  medicalHistories: z.array(medicalHistorySchema).default([]),
  familyHistory: z.string().optional(),
  
  // Medications
  medications: z.array(medicationSchema).default([]),
  
  // Surgeries
  surgeries: z.array(surgerySchema).default([]),
  
  // Allergies
  allergies: z.array(allergySchema).default([]),
  
  // Disease flags - will be auto-detected
  detectedFlags: z.object({
    flag_diabetes: z.boolean().default(false),
    flag_hypertension: z.boolean().default(false),
    flag_hyperlipidemia: z.boolean().default(false),
    flag_cardiovascular: z.boolean().default(false),
    flag_asthma: z.boolean().default(false),
    flag_allergy: z.boolean().default(false),
    flag_anticoagulant: z.boolean().default(false),
    flag_pregnancy: z.boolean().default(false),
  }).optional(),
});

export type MedicalInfoFormData = z.infer<typeof medicalInfoFormSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type Surgery = z.infer<typeof surgerySchema>;
export type Allergy = z.infer<typeof allergySchema>;
export type ExaminationResult = z.infer<typeof examinationResultSchema>;

// Disease detection function
export function detectDiseaseFlags(formData: MedicalInfoFormData): Record<string, boolean> {
  const flags = {
    flag_diabetes: false,
    flag_hypertension: false,
    flag_hyperlipidemia: false,
    flag_cardiovascular: false,
    flag_asthma: false,
    flag_allergy: false,
    flag_anticoagulant: false,
    flag_pregnancy: false,
  };

  // Check medical histories
  const allText = [
    ...formData.medicalHistories.map(h => `${h.condition} ${h.notes || ''}`),
    ...formData.medications.map(m => `${m.name} ${m.purpose || ''}`),
    ...formData.surgeries.map(s => `${s.name} ${s.notes || ''}`),
    formData.familyHistory || '',
  ].join(' ').toLowerCase();

  // Check for disease keywords
  Object.entries(diseaseKeywords).forEach(([disease, keywords]) => {
    const hasKeyword = keywords.some(keyword => 
      allText.includes(keyword.toLowerCase())
    );
    if (hasKeyword) {
      flags[`flag_${disease}` as keyof typeof flags] = true;
    }
  });

  // Special check for allergies
  if (formData.allergies.length > 0) {
    flags.flag_allergy = true;
  }

  return flags;
}