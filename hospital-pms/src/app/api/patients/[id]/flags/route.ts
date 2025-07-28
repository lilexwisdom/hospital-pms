import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/patients/[id]/flags
export async function PATCH(
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

    // Parse request body
    const flags = await request.json();

    // Validate flags
    const validFlags = [
      'flag_diabetes',
      'flag_hypertension',
      'flag_hyperlipidemia',
      'flag_cardiovascular',
      'flag_asthma',
      'flag_allergy',
      'flag_anticoagulant',
      'flag_pregnancy',
    ];

    const updateData: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(flags)) {
      if (validFlags.includes(key) && typeof value === 'boolean') {
        updateData[key] = value;
      }
    }

    // Update patient flags
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating patient flags:', updateError);
      return NextResponse.json({ error: 'Failed to update patient flags' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/patients/[id]/flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}