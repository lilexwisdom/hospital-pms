'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/database.types';
import { Bell, UserPlus, FileCheck } from 'lucide-react';

type SurveyResponse = Database['public']['Tables']['survey_responses']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface NotificationPayload {
  type: 'survey_submitted' | 'patient_created' | 'survey_started';
  data: any;
  timestamp: string;
}

export function useRealtimeNotifications(userRole?: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const showNotification = useCallback((payload: NotificationPayload) => {
    const { type, data } = payload;

    switch (type) {
      case 'survey_submitted':
        toast({
          title: '새로운 설문 응답',
          description: `${data.patient_name || '환자'}님이 설문을 완료했습니다.`,
          action: (
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span>확인</span>
            </div>
          ),
        });
        break;

      case 'patient_created':
        toast({
          title: '신규 환자 등록',
          description: `${data.name}님이 등록되었습니다.`,
          action: (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>확인</span>
            </div>
          ),
        });
        break;

      case 'survey_started':
        toast({
          title: '설문 시작됨',
          description: `${data.patient_name}님이 설문을 시작했습니다.`,
          action: (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>확인</span>
            </div>
          ),
        });
        break;
    }
  }, [toast]);

  useEffect(() => {
    // Only subscribe if user is BD or admin
    if (!userRole || !['bd', 'admin'].includes(userRole)) {
      return;
    }

    // Prevent multiple subscriptions
    if (channel) {
      return;
    }

    const setupRealtimeSubscription = async () => {
      try {
        const supabase = createClient();
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Create channel for BD notifications
        const channelName = `bd-notifications:${user.id}`;
        const newChannel = supabase.channel(channelName);

        // Subscribe to survey_responses inserts
        newChannel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'survey_responses',
            },
            async (payload: RealtimePostgresChangesPayload<SurveyResponse>) => {
              // Get patient info for the notification
              const { data: patient } = await supabase
                .from('patients')
                .select('name, phone')
                .eq('id', payload.new.patient_id!)
                .single();

              showNotification({
                type: 'survey_submitted',
                data: {
                  response_id: payload.new.id,
                  patient_id: payload.new.patient_id,
                  patient_name: patient?.name,
                  patient_phone: patient?.phone,
                  completed_at: payload.new.completed_at,
                },
                timestamp: new Date().toISOString(),
              });
            }
          )
          // Subscribe to patients inserts (new patient registrations)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'patients',
            },
            (payload: RealtimePostgresChangesPayload<Patient>) => {
              // Only notify if created by survey (not by the BD themselves)
              if (payload.new.created_by !== user.id) {
                showNotification({
                  type: 'patient_created',
                  data: {
                    patient_id: payload.new.id,
                    name: payload.new.name,
                    phone: payload.new.phone,
                    created_at: payload.new.created_at,
                  },
                  timestamp: new Date().toISOString(),
                });
              }
            }
          )
          // Subscribe to channel
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('Realtime notifications connected');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              console.log('Realtime notifications disconnected');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Realtime channel error');
              setIsConnected(false);
            }
          });

        setChannel(newChannel);
      } catch (error) {
        console.error('Error setting up realtime notifications:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [userRole, showNotification, channel]);

  return {
    isConnected,
    channel,
  };
}

// Hook for tracking survey progress
export function useSurveyProgress(token: string) {
  const [progress, setProgress] = useState<any>(null);

  const saveProgress = useCallback(async (step: number, data: any) => {
    try {
      const progressData = {
        token,
        step,
        data,
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem(`survey_progress_${token}`, JSON.stringify(progressData));

      // Also save to database if needed
      const supabase = createClient();
      const { error } = await supabase
        .from('survey_tokens')
        .update({
          survey_data: progressData,
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) {
        console.error('Error saving progress to database:', error);
      }
    } catch (error) {
      console.error('Error saving survey progress:', error);
    }
  }, [token]);

  const loadProgress = useCallback(async () => {
    try {
      // First try localStorage
      const localData = localStorage.getItem(`survey_progress_${token}`);
      if (localData) {
        setProgress(JSON.parse(localData));
        return;
      }

      // Then try database
      const supabase = createClient();
      const { data, error } = await supabase
        .from('survey_tokens')
        .select('survey_data')
        .eq('token', token)
        .single();

      if (!error && data?.survey_data) {
        setProgress(data.survey_data);
      }
    } catch (error) {
      console.error('Error loading survey progress:', error);
    }
  }, [token]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(`survey_progress_${token}`);
    setProgress(null);
  }, [token]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    saveProgress,
    loadProgress,
    clearProgress,
  };
}