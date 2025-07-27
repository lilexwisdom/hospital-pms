'use client';

import { useState } from 'react';
import { submitSurvey } from '@/app/actions/survey';

export function DebugSurveySubmission({ token }: { token: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const testData = {
      // Step 1 - Personal Information
      name: 'Test User',
      birthDate: '1990-01-01',
      gender: 'male' as const,
      ssn: '900101-1234567',
      
      // Step 2 - Contact Information
      phone: '010-1234-5678',
      email: 'test@example.com',
      address: 'Seoul Test Address 123',
      addressDetail: 'Apt 101',
      postalCode: '12345',
      
      // Step 3 - Medical History & Diseases
      flagHypertension: false,
      flagDiabetes: false,
      flagHyperlipidemia: false,
      flagAnticoagulant: false,
      flagAsthma: false,
      flagAllergy: false,
      flagCardiovascular: false,
      flagPregnancy: false,
      flagNone: true,
      
      hasAllergies: false,
      allergies: '',
      hasMedications: false,
      medications: '',
      hasMedicalHistory: false,
      medicalHistory: '',
      emergencyContact: '010-9876-5432',
      emergencyRelation: 'Spouse',
      
      // Step 4 - Desired Examinations
      examHeart: false,
      examEndoscopy: false,
      examCT: false,
      examMRI: false,
      examOther: '',
      
      // Step 5 - Confirmation
      agreePrivacy: true,
      agreeMedical: true,
    };

    try {
      console.log('Submitting survey with token:', token);
      console.log('Test data:', testData);
      
      const response = await submitSurvey(token, testData);
      
      console.log('Response received:', response);
      setResult(response);
      
      if (response.success && response.data) {
        console.log('Success! Attempting redirect...');
        const params = new URLSearchParams({
          patientId: response.data.patientId,
          responseId: response.data.responseId,
          isNewPatient: response.data.isNewPatient ? 'true' : 'false',
        });
        
        const redirectUrl = `/survey/complete?${params.toString()}`;
        console.log('Redirect URL:', redirectUrl);
        
        // Try redirect
        window.location.href = redirectUrl;
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Debug Survey Submission</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Token: {token}</p>
        
        <button
          onClick={handleTestSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Test Submit'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-3 bg-gray-50 border rounded">
          <p className="font-semibold">Result:</p>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}