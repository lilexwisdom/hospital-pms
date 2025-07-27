import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Patient, PatientFilters } from '@/types/patient.types';

interface UsePatientTableProps {
  filters?: PatientFilters;
  pageSize?: number;
}

const fetchPatients = async (
  pagination: PaginationState,
  sorting: SortingState,
  filters: PatientFilters
) => {
  const supabase = createClient();
  const { pageIndex, pageSize } = pagination;
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,patient_number.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.assignedTo) {
    query = query.or(`cs_manager.eq.${filters.assignedTo},assigned_bd_id.eq.${filters.assignedTo}`);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo.toISOString());
  }

  // Apply disease flag filters
  if (filters.diseaseFlags && filters.diseaseFlags.length > 0) {
    filters.diseaseFlags.forEach(flag => {
      query = query.eq(`flag_${flag}`, true);
    });
  }

  // Apply sorting
  if (sorting.length > 0) {
    const sort = sorting[0];
    query = query.order(sort.id, { ascending: !sort.desc });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data: patients, error, count } = await query;

  if (error) {
    throw error;
  }

  // Fetch related profiles separately
  if (patients && patients.length > 0) {
    const profileIds = [
      ...new Set([
        ...patients.map(p => p.created_by).filter(Boolean),
        ...patients.map(p => p.cs_manager).filter(Boolean),
        ...patients.map(p => p.assigned_bd_id).filter(Boolean),
      ])
    ];

    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', profileIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Attach profiles to patients
      const patientsWithProfiles = patients.map(patient => ({
        ...patient,
        created_by_profile: patient.created_by ? profilesMap.get(patient.created_by) || null : null,
        cs_manager_profile: patient.cs_manager ? profilesMap.get(patient.cs_manager) || null : null,
        assigned_bd_profile: patient.assigned_bd_id ? profilesMap.get(patient.assigned_bd_id) || null : null,
      }));

      return {
        data: patientsWithProfiles,
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: pageIndex + 1,
      };
    }
  }

  return {
    data: patients || [],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: pageIndex + 1,
  };
};

export const usePatientTable = ({ filters = {}, pageSize = 10 }: UsePatientTableProps = {}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', pagination, sorting, filters],
    queryFn: () => fetchPatients(pagination, sorting, filters),
  });

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="rounded border-gray-300"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'patient_number',
        header: '환자번호',
        cell: ({ row }) => row.getValue('patient_number') || '-',
      },
      {
        accessorKey: 'name',
        header: '이름',
      },
      {
        accessorKey: 'phone',
        header: '전화번호',
        cell: ({ row }) => row.getValue('phone') || '-',
      },
      {
        accessorKey: 'email',
        header: '이메일',
        cell: ({ row }) => row.getValue('email') || '-',
      },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
          };
          const statusLabels = {
            pending: '대기중',
            active: '활성',
            inactive: '비활성',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
              {statusLabels[status as keyof typeof statusLabels]}
            </span>
          );
        },
      },
      {
        accessorKey: 'cs_manager_profile',
        header: 'CS 담당자',
        cell: ({ row }) => {
          const profile = row.getValue('cs_manager_profile') as any;
          return profile?.name || '-';
        },
      },
      {
        accessorKey: 'created_at',
        header: '등록일',
        cell: ({ row }) => {
          const date = new Date(row.getValue('created_at') as string);
          return date.toLocaleDateString('ko-KR');
        },
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <button
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => {
              // Navigate to patient detail page
              window.location.href = `/patients/${row.original.id}`;
            }}
          >
            상세보기
          </button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: data?.totalPages || -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return {
    table,
    isLoading,
    error,
    refetch,
    totalCount: data?.count || 0,
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
  };
};