-- First, ensure the handle_new_user function exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'applicant'),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for existing user
INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES (
    '55be5615-4db7-4b28-aae1-0ebb835afa79',
    'jonmaxmore@gmail.com',
    'jj',
    'applicant',
    '0888888888'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();