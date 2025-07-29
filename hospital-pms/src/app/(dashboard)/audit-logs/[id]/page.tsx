'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, User, FileText, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { DiffViewer } from '@/components/DiffViewer';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export default function AuditLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchAuditLog(params.id as string);
    }
  }, [params.id]);

  const fetchAuditLog = async (id: string) => {
    setLoading(true);
    try {
      // Fetch the specific audit log
      const { data: logData, error: logError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (logError) {
        throw logError;
      }

      setLog(logData);

      // Fetch related logs for the same record
      if (logData) {
        const { data: related, error: relatedError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', logData.table_name)
          .eq('record_id', logData.record_id)
          .neq('id', id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!relatedError) {
          setRelatedLogs(related || []);
        }
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      toast.error('Failed to fetch audit log details');
      router.push('/audit-logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Loading audit log details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Audit log not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/audit-logs')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Audit Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Audit Log Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">ID: {log.id}</p>
            </div>
            <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'PPpp')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground">
                    {log.user_email || 'Unknown'} ({log.user_role || 'Unknown role'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Table & Record</p>
                  <p className="text-sm text-muted-foreground">
                    {log.table_name} / {log.record_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm text-muted-foreground">
                    {log.version_before && log.version_after
                      ? `${log.version_before} → ${log.version_after}`
                      : log.version_after || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {log.changed_fields && log.changed_fields.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Changed Fields</p>
                  <div className="flex flex-wrap gap-2">
                    {log.changed_fields.map((field) => (
                      <Badge key={field} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="changes" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="mt-4">
              {log.action === 'INSERT' ? (
                <div>
                  <h4 className="font-medium mb-2">New Values</h4>
                  <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                    {formatValue(log.new_values)}
                  </pre>
                </div>
              ) : log.action === 'DELETE' ? (
                <div>
                  <h4 className="font-medium mb-2">Deleted Values</h4>
                  <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                    {formatValue(log.old_values)}
                  </pre>
                </div>
              ) : (
                <DiffViewer
                  oldValues={log.old_values as Record<string, any>}
                  newValues={log.new_values as Record<string, any>}
                  changedFields={log.changed_fields || []}
                />
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(log, null, 2)}
              </pre>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Related Audit Logs</h4>
                {relatedLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No related logs found</p>
                ) : (
                  <div className="space-y-2">
                    {relatedLogs.map((relatedLog) => (
                      <div
                        key={relatedLog.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/audit-logs/${relatedLog.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={getActionBadgeVariant(relatedLog.action)}>
                            {relatedLog.action}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(relatedLog.created_at), 'PPp')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {relatedLog.user_email} • Version {relatedLog.version_after}
                            </p>
                          </div>
                        </div>
                        {relatedLog.changed_fields && relatedLog.changed_fields.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {relatedLog.changed_fields.length} field(s) changed
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}