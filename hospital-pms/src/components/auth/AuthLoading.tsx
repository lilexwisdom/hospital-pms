import { Skeleton } from "@/components/ui/skeleton";

/**
 * 인증 확인 중 표시되는 로딩 컴포넌트
 */
export function AuthLoading() {
  return (
    <div className="flex flex-col space-y-3 p-6">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

/**
 * 페이지 전체 로딩 스켈레톤
 */
export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 대시보드 로딩 스켈레톤
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <Skeleton className="h-10 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="border rounded-lg p-4">
          <Skeleton className="h-8 w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}