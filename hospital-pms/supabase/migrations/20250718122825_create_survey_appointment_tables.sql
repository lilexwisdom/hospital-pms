-- Create appointment status enum
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Create survey_tokens table for secure survey links
CREATE TABLE survey_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name VARCHAR(100) NOT NULL, -- Temporary name before patient creation
  patient_phone VARCHAR(20), -- Temporary phone before patient creation
  patient_email VARCHAR(255), -- Temporary email before patient creation
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL, -- Linked after survey completion
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  survey_data JSONB DEFAULT '{}', -- Store any pre-filled data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Role validation will be enforced by trigger instead
  CONSTRAINT token_not_expired CHECK (
    used_at IS NULL OR used_at <= expires_at
  )
);

-- Create trigger function to validate survey_tokens creator role
CREATE OR REPLACE FUNCTION validate_survey_token_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.created_by 
    AND role IN ('bd', 'admin')
  ) THEN
    RAISE EXCEPTION 'created_by must reference a user with BD or Admin role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce role constraint
CREATE TRIGGER check_survey_token_creator
  BEFORE INSERT OR UPDATE ON survey_tokens
  FOR EACH ROW
  EXECUTE FUNCTION validate_survey_token_creator();

-- Create survey_responses table for storing survey answers
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_token UUID NOT NULL REFERENCES survey_tokens(token) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  survey_type VARCHAR(50) NOT NULL DEFAULT 'pre_consultation',
  responses JSONB NOT NULL DEFAULT '{}', -- Flexible schema for different survey types
  metadata JSONB DEFAULT '{}', -- Browser info, completion time, etc.
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_completion CHECK (
    completed_at IS NULL OR completed_at >= started_at
  )
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
  status appointment_status NOT NULL DEFAULT 'pending',
  consultation_type VARCHAR(50) NOT NULL DEFAULT 'general',
  cs_notes TEXT,
  internal_notes TEXT, -- Only visible to staff
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_scheduling CHECK (scheduled_at > created_at)
  -- Role validations will be enforced by triggers instead
);

-- Create trigger functions to validate appointment roles
CREATE OR REPLACE FUNCTION validate_appointment_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.created_by 
    AND role IN ('cs', 'admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'created_by must reference a user with CS, Admin, or Manager role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_appointment_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.assigned_to 
      AND role IN ('cs', 'admin', 'manager')
    ) THEN
      RAISE EXCEPTION 'assigned_to must reference a user with CS, Admin, or Manager role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce role constraints
CREATE TRIGGER check_appointment_creator
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_creator();

CREATE TRIGGER check_appointment_assignee
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_assignee();

-- Create appointment_status_history table for audit trail
CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status appointment_status,
  to_status appointment_status NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Create function to automatically create status history
CREATE OR REPLACE FUNCTION record_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO appointment_status_history (
      appointment_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointment status changes
CREATE TRIGGER appointment_status_change_trigger
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION record_appointment_status_change();

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM survey_tokens
  WHERE expires_at < NOW()
  AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate and use survey token
CREATE OR REPLACE FUNCTION use_survey_token(
  token_uuid UUID,
  patient_data JSONB DEFAULT NULL
)
RETURNS survey_tokens AS $$
DECLARE
  token_record survey_tokens;
  new_patient_id UUID;
BEGIN
  -- Get and lock the token
  SELECT * INTO token_record
  FROM survey_tokens
  WHERE token = token_uuid
  FOR UPDATE;
  
  -- Validate token exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid survey token';
  END IF;
  
  -- Check if already used
  IF token_record.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Survey token already used';
  END IF;
  
  -- Check if expired
  IF token_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Survey token expired';
  END IF;
  
  -- If patient data provided, create patient
  IF patient_data IS NOT NULL AND token_record.patient_id IS NULL THEN
    -- Use the create_patient_with_ssn function from previous migration
    SELECT id INTO new_patient_id
    FROM create_patient_with_ssn(
      patient_data,
      patient_data->>'ssn'
    );
    
    -- Update token with patient_id
    UPDATE survey_tokens
    SET patient_id = new_patient_id
    WHERE token = token_uuid;
    
    token_record.patient_id := new_patient_id;
  END IF;
  
  -- Mark token as used
  UPDATE survey_tokens
  SET used_at = NOW(),
      updated_at = NOW()
  WHERE token = token_uuid;
  
  token_record.used_at := NOW();
  
  RETURN token_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available appointment slots
CREATE OR REPLACE FUNCTION get_available_slots(
  start_date DATE,
  end_date DATE,
  duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_date DATE,
  slot_time TIME,
  available BOOLEAN
) AS $$
BEGIN
  -- This is a simplified version. In production, you'd check against
  -- business hours, existing appointments, holidays, etc.
  RETURN QUERY
  WITH time_slots AS (
    SELECT 
      date_series::DATE as slot_date,
      time_series::TIME as slot_time
    FROM 
      generate_series(start_date, end_date, '1 day'::INTERVAL) date_series,
      generate_series('09:00'::TIME, '17:00'::TIME, (duration_minutes || ' minutes')::INTERVAL) time_series
    WHERE EXTRACT(DOW FROM date_series) BETWEEN 1 AND 5 -- Monday to Friday
  )
  SELECT 
    ts.slot_date,
    ts.slot_time,
    NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE DATE(a.scheduled_at) = ts.slot_date
      AND a.scheduled_at::TIME BETWEEN ts.slot_time 
      AND (ts.slot_time + (duration_minutes || ' minutes')::INTERVAL)
      AND a.status NOT IN ('cancelled')
    ) as available
  FROM time_slots ts
  ORDER BY ts.slot_date, ts.slot_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create updated_at triggers
CREATE TRIGGER update_survey_tokens_updated_at
  BEFORE UPDATE ON survey_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_survey_tokens_created_by ON survey_tokens(created_by);
CREATE INDEX idx_survey_tokens_patient_id ON survey_tokens(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_survey_tokens_expires_at ON survey_tokens(expires_at) WHERE used_at IS NULL;
CREATE INDEX idx_survey_tokens_used_at ON survey_tokens(used_at) WHERE used_at IS NOT NULL;

CREATE INDEX idx_survey_responses_token ON survey_responses(survey_token);
CREATE INDEX idx_survey_responses_patient_id ON survey_responses(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_survey_responses_completed_at ON survey_responses(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);
CREATE INDEX idx_appointments_assigned_to ON appointments(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX idx_appointment_history_appointment_id ON appointment_status_history(appointment_id);
CREATE INDEX idx_appointment_history_changed_at ON appointment_status_history(changed_at);

-- Enable RLS on all tables
ALTER TABLE survey_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_tokens
CREATE POLICY "BD can create and view survey tokens" ON survey_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bd', 'admin')
    )
    AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Patients can use their tokens" ON survey_tokens
  FOR SELECT
  USING (
    -- Allow anonymous access with valid token (for survey page)
    auth.uid() IS NULL OR 
    -- Allow authenticated users
    auth.uid() IS NOT NULL
  );

-- RLS Policies for survey_responses
CREATE POLICY "Users can view relevant survey responses" ON survey_responses
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin can see all
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
      OR
      -- BD can see responses from their tokens
      EXISTS (
        SELECT 1 FROM survey_tokens st
        WHERE st.token = survey_responses.survey_token
        AND st.created_by = auth.uid()
      )
      OR
      -- CS can see responses for their patients
      EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = survey_responses.patient_id
        AND p.cs_manager = auth.uid()
      )
    )
  );

CREATE POLICY "Anonymous can create survey responses" ON survey_responses
  FOR INSERT
  WITH CHECK (true); -- Token validation happens in function

-- RLS Policies for appointments
CREATE POLICY "Users can view relevant appointments" ON appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin/Manager can see all
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
      OR
      -- CS can see appointments they created or are assigned to
      created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR
      -- BD can see appointments for patients they created
      EXISTS (
        SELECT 1 FROM patients p
        WHERE p.id = appointments.patient_id
        AND p.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "CS can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cs', 'admin', 'manager')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "CS can update appointments" ON appointments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cs', 'admin', 'manager')
    )
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cs', 'admin', 'manager')
    )
  );

-- RLS Policies for appointment_status_history
CREATE POLICY "Users can view appointment history" ON appointment_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_status_history.appointment_id
      AND (
        -- Use same logic as appointments view policy
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
        OR a.created_by = auth.uid()
        OR a.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM patients p
          WHERE p.id = a.patient_id
          AND p.created_by = auth.uid()
        )
      )
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON survey_tokens TO authenticated;
GRANT SELECT, INSERT ON survey_responses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT ON appointment_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION use_survey_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens TO authenticated;