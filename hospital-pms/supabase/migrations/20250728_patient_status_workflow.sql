-- Add new patient status enum values
ALTER TYPE public.patient_status ADD VALUE IF NOT EXISTS 'consulted';
ALTER TYPE public.patient_status ADD VALUE IF NOT EXISTS 'treatment_in_progress';
ALTER TYPE public.patient_status ADD VALUE IF NOT EXISTS 'treatment_completed';
ALTER TYPE public.patient_status ADD VALUE IF NOT EXISTS 'follow_up';
ALTER TYPE public.patient_status ADD VALUE IF NOT EXISTS 'discharged';

-- Create patient status history table
CREATE TABLE IF NOT EXISTS public.patient_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_patient_status_history_patient_id ON public.patient_status_history(patient_id);
CREATE INDEX idx_patient_status_history_changed_by ON public.patient_status_history(changed_by);
CREATE INDEX idx_patient_status_history_changed_at ON public.patient_status_history(changed_at DESC);

-- Enable RLS on patient_status_history
ALTER TABLE public.patient_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_status_history
-- View policy: users can view history for patients they have access to
CREATE POLICY "Users can view patient status history based on patient access"
    ON public.patient_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = patient_status_history.patient_id
            AND (
                -- Admin and Manager can see all
                auth.uid() IN (
                    SELECT id FROM public.profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'manager')
                )
                -- BD can see their created patients
                OR p.created_by = auth.uid()
                -- CS can see assigned patients
                OR p.cs_manager = auth.uid()
                -- Users can see patients they're assigned to
                OR p.assigned_bd_id = auth.uid()
            )
        )
    );

-- Insert policy: users with appropriate permissions can add history
CREATE POLICY "Users can add patient status history with permissions"
    ON public.patient_status_history
    FOR INSERT
    WITH CHECK (
        -- Must be the user making the change
        changed_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = patient_status_history.patient_id
            AND (
                -- Admin and Manager can change any patient
                auth.uid() IN (
                    SELECT id FROM public.profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'manager')
                )
                -- BD can change their created patients
                OR p.created_by = auth.uid()
                -- CS can change assigned patients
                OR p.cs_manager = auth.uid()
            )
        )
    );

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION validate_patient_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role TEXT;
    v_old_status TEXT;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Get old status for updates
    IF TG_OP = 'UPDATE' THEN
        v_old_status := OLD.status;
    END IF;

    -- Add any additional validation logic here
    -- For now, we'll handle validation in the application layer
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for patient status validation
CREATE TRIGGER validate_patient_status_before_update
    BEFORE UPDATE OF status ON public.patients
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_patient_status_transition();

-- Function to auto-create status history on patient status change
CREATE OR REPLACE FUNCTION create_patient_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.patient_status_history (
            patient_id,
            from_status,
            to_status,
            changed_by,
            changed_at,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            NOW(),
            jsonb_build_object(
                'trigger_created', true,
                'old_cs_manager', OLD.cs_manager,
                'new_cs_manager', NEW.cs_manager
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-record status history
CREATE TRIGGER auto_create_patient_status_history
    AFTER UPDATE OF status ON public.patients
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_patient_status_history();

-- Grant permissions
GRANT ALL ON public.patient_status_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;