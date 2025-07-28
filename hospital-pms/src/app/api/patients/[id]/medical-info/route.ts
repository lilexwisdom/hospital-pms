import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { medicalInfoFormSchema } from '@/lib/validations/medical-info';

export const runtime = 'nodejs';

// GET /api/patients/[id]/medical-info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch medical records
    const { data: medicalRecords, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (recordsError) {
      console.error('Error fetching medical records:', recordsError);
      return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 });
    }

    // Transform data into the expected format
    const medicalInfo = {
      medicalHistories: medicalRecords
        ?.filter(r => r.record_type === 'diagnosis')
        .map(r => ({
          condition: r.title,
          diagnosisYear: r.record_date ? new Date(r.record_date).getFullYear().toString() : undefined,
          notes: r.description || '',
        })) || [],
      
      medications: medicalRecords
        ?.filter(r => r.record_type === 'medication')
        .map(r => ({
          name: r.title,
          dosage: (r.metadata as any)?.dosage || '',
          frequency: (r.metadata as any)?.frequency || '',
          startDate: r.record_date,
          purpose: r.description || '',
        })) || [],
      
      surgeries: medicalRecords
        ?.filter(r => r.record_type === 'surgery')
        .map(r => ({
          name: r.title,
          date: r.record_date,
          hospital: (r.metadata as any)?.hospital || '',
          notes: r.description || '',
        })) || [],
      
      allergies: medicalRecords
        ?.filter(r => r.record_type === 'allergy')
        .map(r => ({
          type: (r.metadata as any)?.type || 'other',
          name: r.title,
          reaction: (r.metadata as any)?.reaction || '',
          severity: (r.metadata as any)?.severity || 'mild',
        })) || [],
      
      familyHistory: medicalRecords
        ?.find(r => r.record_type === 'note' && r.title === 'Family History')
        ?.description || '',
    };

    return NextResponse.json(medicalInfo);
  } catch (error) {
    console.error('Error in GET /api/patients/[id]/medical-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/medical-info
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('POST /api/patients/[id]/medical-info called');
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const validatedData = medicalInfoFormSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
    }

    if (!profile) {
      console.error('Profile not found for user:', user.id);
      // For now, use the user.id as created_by since profile might not exist
      // return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete existing medical records for this patient
    await supabase
      .from('medical_records')
      .delete()
      .eq('patient_id', id);

    // Prepare records to insert
    const records = [];
    // RLS policy requires created_by to be auth.uid() (user.id)
    const createdBy = user.id; // Must use auth user ID, not profile ID

    // Medical histories
    for (const history of validatedData.medicalHistories) {
      records.push({
        patient_id: id,
        record_type: 'diagnosis' as const,
        record_date: history.diagnosisYear ? `${history.diagnosisYear}-01-01` : new Date().toISOString().split('T')[0],
        title: history.condition,
        description: history.notes || null,
        metadata: {},
        created_by: createdBy,
      });
    }

    // Medications
    for (const med of validatedData.medications) {
      records.push({
        patient_id: id,
        record_type: 'medication' as const,
        record_date: med.startDate || new Date().toISOString().split('T')[0],
        title: med.name,
        description: med.purpose || null,
        metadata: { 
          dosage: med.dosage,
          frequency: med.frequency,
        },
        created_by: createdBy,
      });
    }

    // Surgeries
    for (const surgery of validatedData.surgeries) {
      records.push({
        patient_id: id,
        record_type: 'surgery' as const,
        record_date: surgery.date || new Date().toISOString().split('T')[0],
        title: surgery.name,
        description: surgery.notes || null,
        metadata: { hospital: surgery.hospital },
        created_by: createdBy,
      });
    }

    // Allergies
    for (const allergy of validatedData.allergies) {
      records.push({
        patient_id: id,
        record_type: 'allergy' as const,
        record_date: new Date().toISOString().split('T')[0],
        title: allergy.name,
        description: null,
        metadata: { 
          type: allergy.type,
          reaction: allergy.reaction,
          severity: allergy.severity,
        },
        created_by: createdBy,
      });
    }

    // Family history
    if (validatedData.familyHistory) {
      records.push({
        patient_id: id,
        record_type: 'note' as const,
        record_date: new Date().toISOString().split('T')[0],
        title: 'Family History',
        description: validatedData.familyHistory,
        metadata: {},
        created_by: createdBy,
      });
    }

    // Insert all records
    if (records.length > 0) {
      const { error: insertError } = await supabase
        .from('medical_records')
        .insert(records);

      if (insertError) {
        console.error('Error inserting medical records:', insertError);
        console.error('Records to insert:', JSON.stringify(records, null, 2));
        return NextResponse.json({ error: 'Failed to save medical records', details: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in POST /api/patients/[id]/medical-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}