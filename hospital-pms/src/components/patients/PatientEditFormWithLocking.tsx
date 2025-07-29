import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimisticLocking, prepareOptimisticUpdate } from '@/hooks/useOptimisticLocking';
import { ConflictResolutionModal } from '@/components/ConflictResolutionModal';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

interface PatientEditFormProps {
  patient: Patient;
  onSuccess?: () => void;
}

export function PatientEditFormWithLocking({ patient, onSuccess }: PatientEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: patient.name,
    phone: patient.phone || '',
    email: patient.email || '',
    address_detail: patient.address_detail || '',
  });
  const [showConflictModal, setShowConflictModal] = useState(false);

  const { handleUpdate, isUpdating, conflictError, clearConflict } = useOptimisticLocking<Patient>({
    onConflict: () => {
      setShowConflictModal(true);
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData = prepareOptimisticUpdate(patient, {
      ...formData,
      updated_at: new Date().toISOString(),
    });

    await handleUpdate(
      async (data) => {
        const { data: updated, error } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', patient.id)
          .eq('version', patient.version) // This ensures optimistic locking
          .select()
          .single();

        return { data: updated, error };
      },
      patient
    );
  };

  const handleForceUpdate = async () => {
    // Force update by incrementing version and ignoring conflict
    const forceUpdateData = {
      ...formData,
      version: (patient.version || 1) + 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('patients')
      .update(forceUpdateData)
      .eq('id', patient.id)
      .select()
      .single();

    if (!error) {
      toast.success('Successfully force updated');
      router.refresh();
    } else {
      toast.error('Failed to force update');
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Edit Patient Information</CardTitle>
          <p className="text-sm text-gray-500">
            Version: {patient.version || 1}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Address Detail</Label>
              <Input
                id="address"
                value={formData.address_detail}
                onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          clearConflict();
        }}
        onRefresh={handleRefresh}
        onForceUpdate={handleForceUpdate}
        error={conflictError}
        tableName="patient"
      />
    </>
  );
}