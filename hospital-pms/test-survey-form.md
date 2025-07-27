# Survey Form Test Results

## Changes Made

### 1. Updated Survey Form Schema
Added the following new fields to the survey schema:

#### Disease Flags (Step 3):
- `flagHypertension` - 고혈압 (Hypertension)
- `flagDiabetes` - 당뇨 (Diabetes)
- `flagHyperlipidemia` - 고지혈증 (Hyperlipidemia)
- `flagAnticoagulant` - 항응고제/항혈소판제 복용 (Anticoagulant)
- `flagAsthma` - 천식 (Asthma)
- `flagAllergy` - 특정 약물/음식 알러지 (Allergy)
- `flagCardiovascular` - 뇌/심장 질환 (Cardiovascular)
- `flagPregnancy` - 임신 가능성 (Pregnancy possibility - for females only)
- `flagNone` - 위에 해당하는 사항 없음 (None of the above - DEFAULT CHECKED)

#### Examination Preferences (Step 4):
- `examHeart` - 심장검사 (Heart examination)
- `examEndoscopy` - 위/대장 내시경 (Endoscopy)
- `examCT` - CT 촬영 (CT scan)
- `examMRI` - MRI 촬영 (MRI scan)
- `examOther` - 기타 희망 검사 (Other examinations - text field)

### 2. Updated Survey Steps
Changed from 4 steps to 5 steps:
1. **개인정보** - Personal Information
2. **연락처 정보** - Contact Information
3. **건강 정보** - Health Information (includes disease checkboxes)
4. **희망 검사** - Desired Examinations (NEW)
5. **확인 및 동의** - Confirmation and Agreement

### 3. Created New Components
- `Step4Examinations` - New component for examination preferences
- Renamed `Step4Confirmation` to `Step5Confirmation`

### 4. Updated Step3MedicalHistory
- Added disease checkboxes with Korean labels
- Implemented mutually exclusive logic for "None of the above"
- Shows pregnancy option only for female patients
- Maintains existing allergy, medication, and medical history sections

### 5. Database Migration
Created migration file: `20250723100000_add_disease_flags_to_patients.sql`
- Adds 8 disease flag columns to patients table
- Updates `submit_survey_with_patient` function to handle new fields

### 6. Updated Survey Submission
- Modified `submitSurvey` action to include disease flags in patient data
- Added examination preferences to survey responses
- Disease information is stored in both patient table (as flags) and survey responses

## Implementation Details

### Mutually Exclusive Logic
The "None of the above" checkbox works as follows:
- When checked: All other disease checkboxes are unchecked
- When any disease is checked: "None of the above" is automatically unchecked
- Default state: "None of the above" is checked

### Gender-Specific Fields
- Pregnancy possibility checkbox only appears for female patients
- Uses form watch to monitor gender field and conditionally render

### Data Structure
Survey responses now include:
```json
{
  "medical_info": {
    "diseases": {
      "hypertension": false,
      "diabetes": false,
      // ... other diseases
    },
    // ... existing fields
  },
  "examinations": {
    "heart": false,
    "endoscopy": false,
    "ct": false,
    "mri": false,
    "other": "유방촬영술"
  }
}
```

## Testing Required
1. Verify disease checkbox mutual exclusivity works correctly
2. Test pregnancy checkbox only shows for females
3. Confirm data saves correctly to database
4. Verify examination preferences are captured
5. Test form validation for all steps