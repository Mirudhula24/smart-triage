-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'healthcare_staff');

-- Create enum for urgency levels
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create patient_intake table
CREATE TABLE public.patient_intake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    age INTEGER,
    gender TEXT,
    symptoms TEXT[],
    symptom_duration TEXT,
    existing_conditions TEXT[],
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_intake ENABLE ROW LEVEL SECURITY;

-- Create triage_results table
CREATE TABLE public.triage_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    intake_id UUID REFERENCES public.patient_intake(id) ON DELETE SET NULL,
    chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    urgency urgency_level NOT NULL DEFAULT 'low',
    recommended_action TEXT,
    clinician_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.triage_results ENABLE ROW LEVEL SECURITY;

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    triage_result_id UUID REFERENCES public.triage_results(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Enable realtime for triage_results
ALTER PUBLICATION supabase_realtime ADD TABLE public.triage_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Healthcare staff can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'healthcare_staff'));

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
ON public.chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
ON public.chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Healthcare staff can view all chat sessions"
ON public.chat_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'healthcare_staff'));

-- RLS Policies for patient_intake
CREATE POLICY "Users can view their own intake"
ON public.patient_intake FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intake"
ON public.patient_intake FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Healthcare staff can view all intakes"
ON public.patient_intake FOR SELECT
USING (public.has_role(auth.uid(), 'healthcare_staff'));

-- RLS Policies for triage_results
CREATE POLICY "Users can view their own triage results"
ON public.triage_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own triage results"
ON public.triage_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Healthcare staff can view all triage results"
ON public.triage_results FOR SELECT
USING (public.has_role(auth.uid(), 'healthcare_staff'));

CREATE POLICY "Healthcare staff can update triage results"
ON public.triage_results FOR UPDATE
USING (public.has_role(auth.uid(), 'healthcare_staff'));

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts"
ON public.alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Healthcare staff can view all alerts"
ON public.alerts FOR SELECT
USING (public.has_role(auth.uid(), 'healthcare_staff'));

CREATE POLICY "Healthcare staff can insert alerts"
ON public.alerts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'healthcare_staff'));

CREATE POLICY "Healthcare staff can update alerts"
ON public.alerts FOR UPDATE
USING (public.has_role(auth.uid(), 'healthcare_staff'));

-- Trigger to create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();