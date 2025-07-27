'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle 
} from 'lucide-react';
import { Database } from '@/types/database.types';

interface SurveyStats {
  totalTokens: number;
  completedSurveys: number;
  pendingTokens: number;
  expiredTokens: number;
  responseRate: number;
  averageCompletionTime: number;
  todayResponses: number;
  weeklyTrend: number;
}

export function SurveyResponseStats() {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(now.setDate(now.getDate() - 7));

        // Get current user for BD-specific stats
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch total tokens created by this BD
        const { count: totalTokens } = await supabase
          .from('survey_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);

        // Fetch completed surveys
        const { count: completedSurveys } = await supabase
          .from('survey_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .not('used_at', 'is', null);

        // Fetch pending tokens
        const { count: pendingTokens } = await supabase
          .from('survey_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .is('used_at', null)
          .gte('expires_at', now.toISOString());

        // Fetch expired tokens
        const { count: expiredTokens } = await supabase
          .from('survey_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .is('used_at', null)
          .lt('expires_at', now.toISOString());

        // Fetch today's responses
        const { count: todayResponses } = await supabase
          .from('survey_responses')
          .select('survey_tokens!inner(created_by)', { count: 'exact', head: true })
          .eq('survey_tokens.created_by', user.id)
          .gte('completed_at', todayStart.toISOString());

        // Fetch this week's responses for trend
        const { count: weekResponses } = await supabase
          .from('survey_responses')
          .select('survey_tokens!inner(created_by)', { count: 'exact', head: true })
          .eq('survey_tokens.created_by', user.id)
          .gte('completed_at', weekAgo.toISOString());

        // Fetch last week's responses for comparison
        const lastWeekStart = new Date(weekAgo);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const { count: lastWeekResponses } = await supabase
          .from('survey_responses')
          .select('survey_tokens!inner(created_by)', { count: 'exact', head: true })
          .eq('survey_tokens.created_by', user.id)
          .gte('completed_at', lastWeekStart.toISOString())
          .lt('completed_at', weekAgo.toISOString());

        // Calculate stats
        const responseRate = totalTokens ? (completedSurveys! / totalTokens) * 100 : 0;
        const weeklyTrend = lastWeekResponses 
          ? ((weekResponses! - lastWeekResponses) / lastWeekResponses) * 100 
          : 0;

        setStats({
          totalTokens: totalTokens || 0,
          completedSurveys: completedSurveys || 0,
          pendingTokens: pendingTokens || 0,
          expiredTokens: expiredTokens || 0,
          responseRate,
          averageCompletionTime: 15, // Placeholder - would need to calculate from actual data
          todayResponses: todayResponses || 0,
          weeklyTrend,
        });
      } catch (error) {
        console.error('Error fetching survey stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>설문 응답 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          설문 응답 통계
          <Badge variant="outline" className="ml-2">
            실시간
          </Badge>
        </CardTitle>
        <CardDescription>
          내가 발송한 설문 토큰의 응답 현황
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">응답률</span>
            <span className="text-muted-foreground">
              {stats.completedSurveys} / {stats.totalTokens}
            </span>
          </div>
          <Progress value={stats.responseRate} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.responseRate.toFixed(1)}%</span>
            <span className="flex items-center gap-1">
              {stats.weeklyTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
              )}
              {Math.abs(stats.weeklyTrend).toFixed(1)}% vs 지난주
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>전체 토큰</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalTokens}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>완료</span>
            </div>
            <p className="text-2xl font-bold">{stats.completedSurveys}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>대기중</span>
            </div>
            <p className="text-2xl font-bold">{stats.pendingTokens}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>만료</span>
            </div>
            <p className="text-2xl font-bold">{stats.expiredTokens}</p>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">오늘의 응답</p>
              <p className="text-2xl font-bold">{stats.todayResponses}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">평균 완료 시간</p>
              <p className="text-lg font-medium">{stats.averageCompletionTime}분</p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        {stats.expiredTokens > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-sm">
                {stats.expiredTokens}개의 토큰이 만료되었습니다. 
                재발송을 고려해보세요.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}