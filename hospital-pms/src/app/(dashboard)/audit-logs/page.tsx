'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Search, Filter, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
type AuditSummary = Database['public']['Views']['audit_activity_summary']['Row'];

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    table_name: '',
    user_email: '',
    date_from: undefined as Date | undefined,
    date_to: undefined as Date | undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_activity_summary')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,record_name.ilike.%${filters.search}%`);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }
      if (filters.date_to) {
        const endOfDay = new Date(filters.date_to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      // Pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setLogs(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all data for export
      let query = supabase
        .from('audit_activity_summary')
        .select('*');

      // Apply same filters
      if (filters.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,record_name.ilike.%${filters.search}%`);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }
      if (filters.date_to) {
        const endOfDay = new Date(filters.date_to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Convert to CSV
      const csv = convertToCSV(data || []);
      downloadCSV(csv, `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const convertToCSV = (data: AuditSummary[]) => {
    const headers = [
      'Date',
      'User Email',
      'User Role',
      'Action',
      'Table',
      'Record Name',
      'Changed Fields',
      'Version Before',
      'Version After',
    ];

    const rows = data.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_email || '',
      log.user_role || '',
      log.action,
      log.table_name,
      log.record_name || '',
      log.changed_fields?.join(', ') || '',
      log.version_before?.toString() || '',
      log.version_after?.toString() || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleViewDetails = (log: AuditSummary) => {
    router.push(`/audit-logs/${log.id}`);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audit Logs</CardTitle>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email or record name"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="INSERT">Insert</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="table">Table</Label>
              <Select
                value={filters.table_name}
                onValueChange={(value) => setFilters({ ...filters, table_name: value })}
              >
                <SelectTrigger id="table">
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tables</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                  <SelectItem value="medical_records">Medical Records</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="profiles">Profiles</SelectItem>
                  <SelectItem value="survey_responses">Survey Responses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user">User Email</Label>
              <Input
                id="user"
                placeholder="Filter by user"
                value={filters.user_email}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
              />
            </div>

            <div>
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.date_from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.date_from ? format(filters.date_from, 'PP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.date_from}
                    onSelect={(date) => setFilters({ ...filters, date_from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.date_to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.date_to ? format(filters.date_to, 'PP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.date_to}
                    onSelect={(date) => setFilters({ ...filters, date_to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    action: '',
                    table_name: '',
                    user_email: '',
                    date_from: undefined,
                    date_to: undefined,
                  });
                  setPagination({ ...pagination, page: 1 });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Changed Fields</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_email}</div>
                          <div className="text-sm text-muted-foreground">{log.user_role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.record_name || log.record_id}</TableCell>
                      <TableCell>
                        {log.changed_fields && log.changed_fields.length > 0 ? (
                          <div className="text-sm">
                            {log.changed_fields.slice(0, 3).join(', ')}
                            {log.changed_fields.length > 3 && ` +${log.changed_fields.length - 3} more`}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {log.version_before && log.version_after ? (
                          <div className="text-sm">
                            {log.version_before} → {log.version_after}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span>...</span>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}