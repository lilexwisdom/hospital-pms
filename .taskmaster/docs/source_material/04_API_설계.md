# API 설계 문서

## 개요

본 문서는 NextJS/Supabase 기반 병원 환자 관리 시스템의 API 설계를 상세히 설명합니다. RESTful 원칙을 따르며, NextJS App Router의 Route Handlers와 Server Actions를 활용합니다.

## API 아키텍처

### 1. API 계층 구조

```
├── app/
│   ├── api/                    # Route Handlers
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── consultations/
│   │   ├── medical-records/
│   │   ├── surveys/
│   │   ├── stats/
│   │   └── audit/
│   └── actions/               # Server Actions
│       ├── patient.actions.ts
│       ├── appointment.actions.ts
│       └── survey.actions.ts
```

### 2. API 응답 형식

#### 성공 응답
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

#### 에러 응답
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## 인증 API

### 1. 로그인
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  requirePasswordChange?: boolean;
}

// Route Handler 구현
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'auth');
    if (rateLimitResult) return rateLimitResult;
    
    // 인증 처리
    const result = await loginUser(email, password);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### 2. 로그아웃
```typescript
// POST /api/auth/logout
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      throw new UnauthorizedError('No active session');
    }
    
    await supabase.auth.signOut();
    
    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### 3. 세션 갱신
```typescript
// POST /api/auth/refresh
export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: {
        session: data.session,
        user: data.user,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
```

## 환자 관리 API

### 1. 환자 목록 조회
```typescript
// GET /api/patients
interface PatientsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  hasDisease?: string[];
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const query: PatientsQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      hasDisease: searchParams.getAll('hasDisease'),
    };
    
    // 권한 기반 필터링
    let baseQuery = supabase
      .from('patients')
      .select('*, assigned_bd_user:users!assigned_bd_user_id(*), assigned_cs_user:users!assigned_cs_user_id(*)', { count: 'exact' });
    
    // 역할별 필터링
    if (session.user.role === 'bd') {
      baseQuery = baseQuery.eq('assigned_bd_user_id', session.user.id);
    } else if (session.user.role === 'cs') {
      baseQuery = baseQuery.in('status', ['CS팀인계', '예약조율중', '예약확정']);
    }
    
    // 검색 조건 적용
    if (query.search) {
      baseQuery = baseQuery.or(`name.ilike.%${query.search}%,phone.ilike.%${query.search}%,patient_number.ilike.%${query.search}%`);
    }
    
    if (query.status) {
      baseQuery = baseQuery.eq('status', query.status);
    }
    
    // 질환 필터
    if (query.hasDisease?.length) {
      query.hasDisease.forEach(disease => {
        baseQuery = baseQuery.eq(`has_${disease}`, true);
      });
    }
    
    // 날짜 필터
    if (query.dateFrom) {
      baseQuery = baseQuery.gte('created_at', query.dateFrom);
    }
    if (query.dateTo) {
      baseQuery = baseQuery.lte('created_at', query.dateTo);
    }
    
    // 페이지네이션
    const offset = (query.page - 1) * query.limit;
    baseQuery = baseQuery
      .range(offset, offset + query.limit - 1)
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await baseQuery;
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        hasMore: offset + query.limit < (count || 0),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### 2. 환자 상세 조회
```typescript
// GET /api/patients/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    const patientId = params.id;
    
    // 환자 기본 정보 조회
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        assigned_bd_user:users!assigned_bd_user_id(*),
        assigned_cs_user:users!assigned_cs_user_id(*),
        medical_records(*),
        consultations(*, user:users(*)),
        appointments(*)
      `)
      .eq('id', patientId)
      .single();
    
    if (error) throw error;
    
    // 권한 확인
    const canAccess = await checkPatientAccess(session.user, patient);
    if (!canAccess) {
      throw new ForbiddenError('환자 정보에 접근할 권한이 없습니다');
    }
    
    // 민감정보 접근 로깅
    await AuditLogger.logSensitiveDataAccess(
      session.user.id,
      patientId,
      'MEDICAL_RECORD',
      { ip: request.headers.get('x-forwarded-for') || '127.0.0.1' }
    );
    
    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### 3. 환자 등록
```typescript
// POST /api/patients
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    await requirePermission(session.user, 'PATIENT_CREATE');
    
    const body = await request.json();
    const validatedData = patientSchema.parse(body);
    
    // 주민등록번호 암호화
    const encryptedSSN = EncryptionService.encrypt(validatedData.ssn);
    
    // 환자 생성
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...validatedData,
        encrypted_ssn: encryptedSSN,
        assigned_bd_user_id: session.user.id,
        status: '신규접수',
        source_channel: '대외협력',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 감사 로그
    await AuditLogger.log({
      userId: session.user.id,
      action: 'CREATE_PATIENT',
      resource: 'patients',
      resourceId: data.id,
      details: { patientName: data.name },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    });
    
    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### 4. 환자 정보 수정
```typescript
// PATCH /api/patients/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    const patientId = params.id;
    const body = await request.json();
    
    // 기존 데이터 조회
    const { data: currentPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();
    
    // 권한 확인
    const canUpdate = await checkPatientAccess(session.user, currentPatient);
    if (!canUpdate) {
      throw new ForbiddenError('환자 정보를 수정할 권한이 없습니다');
    }
    
    // 수정 가능한 필드만 필터링
    const allowedFields = ['status', 'phone', 'address', 'assigned_cs_user_id'];
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {});
    
    // 업데이트 실행
    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .select()
      .single();
    
    if (error) throw error;
    
    // 상태 변경 시 특별 처리
    if (updateData.status && updateData.status !== currentPatient.status) {
      await handleStatusChange(patientId, currentPatient.status, updateData.status, session.user.id);
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

## 의료정보 API

### 1. 의료정보 추가
```typescript
// POST /api/medical-records
interface MedicalRecordRequest {
  patientId: string;
  recordType: 'past_history' | 'family_history' | 'medication' | 'surgery' | 'allergy';
  content: string;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { patientId, recordType, content } = medicalRecordSchema.parse(body);
    
    // 환자 접근 권한 확인
    await requirePatientAccess(session.user, patientId);
    
    // 의료정보 생성
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: patientId,
        record_type: recordType,
        content,
        created_by: session.user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 질환 플래그 자동 업데이트
    await updateDiseaseFlags(patientId, recordType, content);
    
    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// 질환 플래그 자동 업데이트 함수
async function updateDiseaseFlags(
  patientId: string,
  recordType: string,
  content: string
) {
  const diseaseKeywords = {
    hypertension: ['고혈압', '혈압약', 'hypertension'],
    diabetes: ['당뇨', '당뇨병', '인슐린', 'diabetes'],
    hyperlipidemia: ['고지혈증', '콜레스테롤', 'hyperlipidemia'],
    anticoagulant: ['아스피린', '와파린', '항응고제', '항혈소판제'],
    asthma: ['천식', 'asthma'],
    allergy: ['알러지', '알레르기', 'allergy'],
    brain_heart_disease: ['뇌졸중', '심장질환', '부정맥', '협심증'],
  };
  
  const updates: Record<string, boolean> = {};
  
  Object.entries(diseaseKeywords).forEach(([disease, keywords]) => {
    if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
      updates[`has_${disease}`] = true;
    }
  });
  
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId);
  }
}
```

## 상담기록 API

### 1. 상담기록 생성
```typescript
// POST /api/consultations
interface ConsultationRequest {
  patientId: string;
  consultationType: 'phone' | 'text' | 'kakao' | 'visit';
  content: string;
  followUpRequired?: string;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validatedData = consultationSchema.parse(body);
    
    // 환자 접근 권한 확인
    await requirePatientAccess(session.user, validatedData.patientId);
    
    // 상담기록 생성
    const { data, error } = await supabase
      .from('consultations')
      .insert({
        patient_id: validatedData.patientId,
        user_id: session.user.id,
        consultation_type: validatedData.consultationType,
        content: validatedData.content,
        follow_up_required: validatedData.followUpRequired,
        consultation_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 환자의 최근 상담일 업데이트
    await supabase
      .from('patients')
      .update({ last_consultation_at: new Date().toISOString() })
      .eq('id', validatedData.patientId);
    
    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## 예약 관리 API

### 1. 예약 생성
```typescript
// POST /api/appointments
interface AppointmentRequest {
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  examItems: string[];
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    await requirePermission(session.user, 'APPOINTMENT_CREATE');
    
    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);
    
    // 예약 가능 시간 확인
    const isAvailable = await checkTimeSlotAvailability(
      validatedData.appointmentDate,
      validatedData.appointmentTime
    );
    
    if (!isAvailable) {
      throw new ConflictError('선택한 시간은 이미 예약되어 있습니다');
    }
    
    // 예약 생성
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: validatedData.patientId,
        appointment_date: validatedData.appointmentDate,
        appointment_time: validatedData.appointmentTime,
        exam_items: validatedData.examItems,
        status: '예정',
        confirmed_by: session.user.id,
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 환자 상태 업데이트
    await supabase
      .from('patients')
      .update({ 
        status: '예약확정',
        final_appointment_date: validatedData.appointmentDate,
      })
      .eq('id', validatedData.patientId);
    
    // 예약 확인 알림 발송 (비동기)
    sendAppointmentNotification(data.id).catch(console.error);
    
    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### 2. 예약 변경
```typescript
// PATCH /api/appointments/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    const appointmentId = params.id;
    const body = await request.json();
    
    // 기존 예약 조회
    const { data: currentAppointment } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('id', appointmentId)
      .single();
    
    if (!currentAppointment) {
      throw new NotFoundError('예약을 찾을 수 없습니다');
    }
    
    // 권한 확인
    await requirePatientAccess(session.user, currentAppointment.patient_id);
    
    // 예약 변경 이력 저장
    await supabase
      .from('appointment_history')
      .insert({
        appointment_id: appointmentId,
        action: 'UPDATE',
        previous_data: currentAppointment,
        new_data: body,
        performed_by: session.user.id,
      });
    
    // 예약 업데이트
    const { data, error } = await supabase
      .from('appointments')
      .update(body)
      .eq('id', appointmentId)
      .select()
      .single();
    
    if (error) throw error;
    
    // 변경 알림 발송
    if (body.appointment_date || body.appointment_time) {
      sendAppointmentChangeNotification(appointmentId).catch(console.error);
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
```

## 설문 API

### Validation Schemas
```typescript
// lib/validation/survey.schemas.ts
import { z } from 'zod';

export const surveyFormSchema = z.object({
  // 기본 정보
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone: z.string().regex(/^01[016789]\d{7,8}$/, '올바른 휴대폰 번호를 입력해주세요'),
  ssn: z.string().regex(/^\d{6}-\d{7}$/, '올바른 주민등록번호 형식을 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  
  // 건강 정보
  healthConditions: z.array(z.string()).min(1, '최소 1개 이상 선택해주세요'),
  additionalMedicalInfo: z.string().optional(),
  currentMedications: z.string().optional(),
  
  // 희망 검사
  desiredExams: z.array(z.string()).optional(),
  otherExam: z.string().optional(),
  
  // 개인정보 동의
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용에 동의해주세요',
  }),
});

export type SurveyFormData = z.infer<typeof surveyFormSchema>;
```

### 1. 설문 토큰 생성
```typescript
// POST /api/surveys/tokens
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    await requirePermission(session.user, 'PATIENT_CREATE');
    
    // 토큰 생성
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const { data, error } = await supabase
      .from('survey_tokens')
      .insert({
        token,
        created_by: session.user.id,
        status: '미사용',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 설문 URL 생성
    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/survey/${token}`;
    
    return NextResponse.json({
      success: true,
      data: {
        token: data.token,
        url: surveyUrl,
        expiresAt: data.expires_at,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### 2. 설문 제출
```typescript
// POST /api/surveys/submit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, formData } = surveySubmitSchema.parse(body);
    
    // 토큰 유효성 확인
    const { data: tokenData, error: tokenError } = await supabase
      .from('survey_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (tokenError || !tokenData) {
      throw new UnauthorizedError('유효하지 않은 토큰입니다');
    }
    
    if (tokenData.status !== '미사용') {
      throw new ConflictError('이미 사용된 토큰입니다');
    }
    
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new UnauthorizedError('만료된 토큰입니다');
    }
    
    // 건강정보 체크박스를 boolean 필드로 매핑
    const healthFlags = {
      has_hypertension: formData.healthConditions?.includes('고혈압') || false,
      has_diabetes: formData.healthConditions?.includes('당뇨') || false,
      has_hyperlipidemia: formData.healthConditions?.includes('고지혈증') || false,
      has_anticoagulant: formData.healthConditions?.includes('항응고제/항혈소판제 복용') || false,
      has_asthma: formData.healthConditions?.includes('천식') || false,
      has_allergy: formData.healthConditions?.includes('특정 약물/음식 알러지') || false,
      has_brain_heart_disease: formData.healthConditions?.includes('뇌/심장 질환') || false,
      has_pregnancy_possibility: formData.healthConditions?.includes('임신 가능성') || false,
    };
    
    // 트랜잭션 시작 - 설문 제출과 환자 생성을 원자적으로 처리
    const { data: patient, error } = await supabase.rpc('submit_survey', {
      p_token_id: tokenData.id,
      p_form_data: {
        ...formData,
        ...healthFlags,
      },
      p_created_by: tokenData.created_by,
    });
    
    if (error) throw error;
    
    // 대외협력이사에게 실시간 알림 전송
    await supabase
      .from('notifications')
      .insert({
        user_id: tokenData.created_by,
        type: 'new_survey_submission',
        title: '새로운 설문이 제출되었습니다',
        content: `${formData.name}님이 설문을 제출했습니다.`,
        related_patient_id: patient.id,
      });
    
    return NextResponse.json({
      success: true,
      data: {
        message: '설문이 성공적으로 제출되었습니다',
        patientNumber: patient.patient_number,
        patientId: patient.id,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### 3. 설문 제출 데이터베이스 함수 (submit_survey)
```sql
-- Supabase RPC 함수: 설문 제출 시 환자 자동 생성
CREATE OR REPLACE FUNCTION submit_survey(
  p_token_id UUID,
  p_form_data JSONB,
  p_created_by UUID
) RETURNS TABLE (
  id UUID,
  patient_number VARCHAR,
  name VARCHAR
) AS $$
DECLARE
  v_patient_id UUID;
  v_patient_number VARCHAR;
  v_response_id UUID;
BEGIN
  -- 1. 토큰 상태를 '사용완료'로 변경
  UPDATE survey_tokens 
  SET status = '사용완료', used_at = CURRENT_TIMESTAMP
  WHERE id = p_token_id;
  
  -- 2. 환자 번호 생성 (P + 날짜 + 일련번호)
  SELECT 'P' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || 
         LPAD(NEXTVAL('patient_number_seq')::TEXT, 4, '0')
  INTO v_patient_number;
  
  -- 3. 환자 정보 생성
  INSERT INTO patients (
    patient_number,
    name,
    phone,
    encrypted_ssn,
    address,
    status,
    source_channel,
    has_hypertension,
    has_diabetes,
    has_hyperlipidemia,
    has_anticoagulant,
    has_asthma,
    has_allergy,
    has_brain_heart_disease,
    has_pregnancy_possibility,
    assigned_bd_user_id,
    first_contact_at
  ) VALUES (
    v_patient_number,
    p_form_data->>'name',
    p_form_data->>'phone',
    p_form_data->>'encrypted_ssn',
    p_form_data->>'address',
    '신규접수',
    '대외협력',
    COALESCE((p_form_data->>'has_hypertension')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_diabetes')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_hyperlipidemia')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_anticoagulant')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_asthma')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_allergy')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_brain_heart_disease')::BOOLEAN, false),
    COALESCE((p_form_data->>'has_pregnancy_possibility')::BOOLEAN, false),
    p_created_by,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_patient_id;
  
  -- 4. 설문 응답 저장
  INSERT INTO survey_responses (
    token_id,
    patient_id,
    form_data,
    ip_address,
    user_agent
  ) VALUES (
    p_token_id,
    v_patient_id,
    p_form_data,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  ) RETURNING id INTO v_response_id;
  
  -- 5. 추가 의료정보가 있다면 medical_records에 저장
  IF p_form_data->>'additionalMedicalInfo' IS NOT NULL AND 
     LENGTH(p_form_data->>'additionalMedicalInfo') > 0 THEN
    INSERT INTO medical_records (
      patient_id,
      record_type,
      content,
      created_by
    ) VALUES (
      v_patient_id,
      'past_history',
      p_form_data->>'additionalMedicalInfo',
      p_created_by
    );
  END IF;
  
  -- 6. 복용 약물 정보가 있다면 저장
  IF p_form_data->>'currentMedications' IS NOT NULL AND 
     LENGTH(p_form_data->>'currentMedications') > 0 THEN
    INSERT INTO medical_records (
      patient_id,
      record_type,
      content,
      created_by
    ) VALUES (
      v_patient_id,
      'medication',
      p_form_data->>'currentMedications',
      p_created_by
    );
  END IF;
  
  -- 7. 결과 반환
  RETURN QUERY
  SELECT v_patient_id, v_patient_number, p_form_data->>'name';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## 통계 API

### 1. 대시보드 통계
```typescript
// GET /api/stats/dashboard
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    let stats = {};
    
    // 역할별 통계 조회
    switch (session.user.role) {
      case 'admin':
      case 'manager':
        stats = await getCompanyWideStats(period);
        break;
      case 'bd':
        stats = await getBDStats(session.user.id, period);
        break;
      case 'cs':
        stats = await getCSStats(session.user.id, period);
        break;
    }
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 전사 통계
async function getCompanyWideStats(period: string) {
  const dateFrom = getDateFrom(period);
  
  const [
    totalPatients,
    newPatients,
    appointments,
    completedExams,
    conversionRate,
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', dateFrom),
    supabase.from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', '예정'),
    supabase.from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', '완료')
      .gte('appointment_date', dateFrom),
    calculateConversionRate(dateFrom),
  ]);
  
  return {
    totalPatients: totalPatients.count,
    newPatients: newPatients.count,
    upcomingAppointments: appointments.count,
    completedExams: completedExams.count,
    conversionRate,
    period,
  };
}
```

## Server Actions

### 1. 환자 빠른 상태 변경
```typescript
// app/actions/patient.actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updatePatientStatus(
  patientId: string,
  newStatus: string
) {
  try {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');
    
    const { error } = await supabase
      .from('patients')
      .update({ 
        status: newStatus,
        cs_handover_at: newStatus === 'CS팀인계' ? new Date().toISOString() : undefined,
      })
      .eq('id', patientId);
    
    if (error) throw error;
    
    revalidatePath('/patients');
    revalidatePath(`/patients/${patientId}`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 2. 실시간 검색
```typescript
// app/actions/search.actions.ts
'use server';

export async function searchPatients(query: string) {
  try {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');
    
    let searchQuery = supabase
      .from('patients')
      .select('id, patient_number, name, phone, status')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,patient_number.ilike.%${query}%`)
      .limit(10);
    
    // 역할별 필터링
    if (session.user.role === 'bd') {
      searchQuery = searchQuery.eq('assigned_bd_user_id', session.user.id);
    }
    
    const { data, error } = await searchQuery;
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 에러 처리

### 1. 전역 에러 핸들러
```typescript
// lib/api/error-handler.ts
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다',
        details: error.errors,
      },
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }
  
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }, { status: 401 });
  }
  
  if (error instanceof ForbiddenError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }, { status: 403 });
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }, { status: 404 });
  }
  
  if (error instanceof ConflictError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }, { status: 409 });
  }
  
  // 기본 서버 에러
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다',
    },
    timestamp: new Date().toISOString(),
  }, { status: 500 });
}
```

## API 문서화

### 1. OpenAPI 스펙 생성
```typescript
// lib/openapi/generator.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

// 환자 API 등록
registry.registerPath({
  method: 'get',
  path: '/api/patients',
  description: '환자 목록 조회',
  summary: '권한에 따라 필터링된 환자 목록을 조회합니다',
  request: {
    query: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: '성공',
      content: {
        'application/json': {
          schema: PatientsResponseSchema,
        },
      },
    },
    401: {
      description: '인증 필요',
    },
  },
});
```

### 2. API 테스트
```typescript
// __tests__/api/patients.test.ts
describe('Patients API', () => {
  it('should return patients list for authorized user', async () => {
    const response = await fetch('/api/patients', {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
  
  it('should return 401 for unauthorized request', async () => {
    const response = await fetch('/api/patients');
    expect(response.status).toBe(401);
  });
});
```

## API 보안 체크리스트

- [ ] 모든 엔드포인트에 인증 확인
- [ ] 역할 기반 권한 검증
- [ ] 입력 데이터 검증 (Zod schemas)
- [ ] Rate limiting 적용
- [ ] SQL injection 방지
- [ ] XSS 방지
- [ ] CORS 설정
- [ ] API 키 관리
- [ ] 감사 로깅
- [ ] 에러 메시지 정보 노출 최소화

---

본 문서는 병원 환자 관리 시스템의 RESTful API 설계를 상세히 설명합니다. 모든 API는 보안, 성능, 확장성을 고려하여 설계되었습니다.