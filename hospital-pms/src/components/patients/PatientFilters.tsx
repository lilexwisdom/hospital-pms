'use client';

import { useState, useEffect } from 'react';
import { PatientFilters as IPatientFilters } from '@/types/patient.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface PatientFiltersProps {
  filters: IPatientFilters;
  onFiltersChange: (filters: IPatientFilters) => void;
}

const diseaseOptions = [
  { value: 'hypertension', label: '고혈압' },
  { value: 'diabetes', label: '당뇨병' },
  { value: 'hyperlipidemia', label: '고지혈증' },
  { value: 'anticoagulant', label: '항응고제 복용' },
  { value: 'asthma', label: '천식' },
  { value: 'allergy', label: '알레르기' },
  { value: 'cardiovascular', label: '심혈관 질환' },
  { value: 'pregnancy', label: '임신' },
];

export const PatientFilters = ({ filters, onFiltersChange }: PatientFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch CS and BD users for assignee filter
  const { data: assignees } = useQuery({
    queryKey: ['assignees'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['cs', 'bd', 'admin'])
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as any });
  };

  const handleAssigneeChange = (value: string) => {
    onFiltersChange({ ...filters, assignedTo: value === 'all' ? undefined : value });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onFiltersChange({ ...filters, dateFrom: date });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onFiltersChange({ ...filters, dateTo: date });
  };

  const handleDiseaseFlagToggle = (disease: string) => {
    const currentFlags = filters.diseaseFlags || [];
    const newFlags = currentFlags.includes(disease)
      ? currentFlags.filter(f => f !== disease)
      : [...currentFlags, disease];
    onFiltersChange({ ...filters, diseaseFlags: newFlags });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const hasActiveFilters = searchInput || filters.status || filters.assignedTo || 
    filters.dateFrom || filters.dateTo || (filters.diseaseFlags && filters.diseaseFlags.length > 0);

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="이름, 전화번호, 이메일, 환자번호로 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label>상태</Label>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Filter */}
        <div className="space-y-2">
          <Label>담당자</Label>
          <Select value={filters.assignedTo || 'all'} onValueChange={handleAssigneeChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {assignees?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.role.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <Label>등록일 (시작)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={handleDateFromChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>등록일 (종료)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={handleDateToChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Disease Flags */}
      <div className="space-y-2">
        <Label>질병 필터</Label>
        <div className="flex flex-wrap gap-2">
          {diseaseOptions.map((disease) => (
            <button
              key={disease.value}
              onClick={() => handleDiseaseFlagToggle(disease.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.diseaseFlags?.includes(disease.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {disease.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            필터 초기화
          </Button>
        </div>
      )}
    </div>
  );
};