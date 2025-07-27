'use client';

import { useState } from 'react';
import { submitSurvey } from '@/app/actions/survey';
import { validateSSN } from '@/lib/security/ssn-encryption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestSubmissionPage() {
  const [token, setToken] = useState('');
  const [ssn, setSsn] = useState('900101-1234567');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  const testSSNValidation = () => {
    const isValid = validateSSN(ssn);
    setValidationResult(isValid);
    console.log('SSN Validation Result:', isValid);
    console.log('SSN:', ssn);
  };

  const handleTestSubmit = async () => {
    if (!token) {
      alert('Please enter a token');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    const testData = {
      // Step 1 - Personal Information
      name: 'Test User',
      birthDate: '1990-01-01',
      gender: 'male' as const,
      ssn: ssn,
      
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
      console.log('=== TEST SUBMISSION START ===');
      console.log('Token:', token);
      console.log('SSN:', ssn);
      console.log('SSN Valid?', validateSSN(ssn));
      
      const response = await submitSurvey(token, testData);
      console.log('=== RESPONSE ===');
      console.log(response);
      
      setResult(response);
      
      if (response.success && response.data) {
        console.log('=== SUCCESS - ATTEMPTING REDIRECT ===');
        const params = new URLSearchParams({
          patientId: response.data.patientId,
          responseId: response.data.responseId,
          isNewPatient: response.data.isNewPatient ? 'true' : 'false',
        });
        
        const redirectUrl = `/survey/complete?${params.toString()}`;
        console.log('Redirect URL:', redirectUrl);
        
        // Test redirect in new tab
        window.open(redirectUrl, '_blank');
      }
    } catch (err) {
      console.error('=== ERROR ===');
      console.error(err);
      setResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsSubmitting(false);
      console.log('=== TEST SUBMISSION END ===');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Survey Submission Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token">Survey Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter survey token (e.g., 4a73cc6f-e24a-4635-8ded-0e951c1bbfad)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssn">Test SSN</Label>
            <div className="flex gap-2">
              <Input
                id="ssn"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder="YYMMDD-XXXXXXX"
              />
              <Button type="button" onClick={testSSNValidation} variant="outline">
                Validate
              </Button>
            </div>
            {validationResult !== null && (
              <p className={`text-sm ${validationResult ? 'text-green-600' : 'text-red-600'}`}>
                SSN is {validationResult ? 'valid' : 'invalid'}
              </p>
            )}
          </div>

          <Button
            onClick={handleTestSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Test Submit'}
          </Button>

          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Check the browser console for detailed logs.</p>
            <p>Open Developer Tools (F12) → Console tab</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}