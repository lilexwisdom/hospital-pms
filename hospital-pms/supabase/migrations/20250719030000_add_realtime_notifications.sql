-- Enable realtime for survey-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE survey_tokens;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  realtime_notifications BOOLEAN DEFAULT true,
  reminder_frequency TEXT DEFAULT 'daily' CHECK (reminder_frequency IN ('never', 'daily', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create survey reminders table
CREATE TABLE IF NOT EXISTS survey_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES survey_tokens(token) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_survey_reminders_scheduled_at ON survey_reminders(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_survey_reminders_token_id ON survey_reminders(token_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- RLS policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_reminders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification preferences
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- BD and admin can view reminders
CREATE POLICY "BD and admin can view reminders" ON survey_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM survey_tokens st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.token = survey_reminders.token_id
      AND (st.created_by = auth.uid() OR p.role IN ('admin', 'manager'))
    )
  );

-- Function to schedule survey reminder
CREATE OR REPLACE FUNCTION schedule_survey_reminder(
  p_token_id UUID,
  p_reminder_type TEXT,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_reminder_id UUID;
BEGIN
  -- Check if token exists and is not used
  IF NOT EXISTS (
    SELECT 1 FROM survey_tokens 
    WHERE token = p_token_id 
    AND used_at IS NULL
    AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;
  
  -- Cancel any existing pending reminders for this token
  UPDATE survey_reminders
  SET status = 'cancelled'
  WHERE token_id = p_token_id
  AND status = 'pending';
  
  -- Create new reminder
  INSERT INTO survey_reminders (
    token_id,
    reminder_type,
    scheduled_at,
    metadata
  )
  VALUES (
    p_token_id,
    p_reminder_type,
    p_scheduled_at,
    p_metadata
  )
  RETURNING id INTO v_reminder_id;
  
  RETURN v_reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification when survey is submitted
CREATE OR REPLACE FUNCTION notify_survey_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_bd_user_id UUID;
BEGIN
  -- Get patient name
  SELECT name INTO v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get BD user who created the token
  SELECT created_by INTO v_bd_user_id
  FROM survey_tokens
  WHERE token = NEW.survey_token;
  
  -- Send notification through Supabase Realtime
  PERFORM pg_notify(
    'survey_submission',
    json_build_object(
      'bd_user_id', v_bd_user_id,
      'patient_id', NEW.patient_id,
      'patient_name', v_patient_name,
      'response_id', NEW.id,
      'completed_at', NEW.completed_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for survey submission notifications
CREATE TRIGGER trigger_notify_survey_submission
  AFTER INSERT ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_survey_submission();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT ON survey_reminders TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_survey_reminder TO authenticated;