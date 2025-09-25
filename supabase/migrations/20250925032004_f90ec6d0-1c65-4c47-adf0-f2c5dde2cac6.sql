-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'CANCELLED', 'OVERDUE')),
  description TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  receipt_number TEXT,
  receipt_url TEXT,
  pdf_url TEXT,
  qr_code_data TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = invoices.application_id 
    AND applications.applicant_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all invoices"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'reviewer', 'auditor')
  )
);

CREATE POLICY "System can manage invoices"
ON public.invoices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    date_suffix TEXT;
    sequence_num INTEGER;
    invoice_number TEXT;
BEGIN
    date_suffix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || date_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || date_suffix || '-%';
    
    invoice_number := 'INV-' || date_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$$;

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    date_suffix TEXT;
    sequence_num INTEGER;
    receipt_number TEXT;
BEGIN
    date_suffix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'REC-' || date_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE receipt_number LIKE 'REC-' || date_suffix || '-%';
    
    receipt_number := 'REC-' || date_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN receipt_number;
END;
$$;

-- Create function to create invoice from payment
CREATE OR REPLACE FUNCTION public.create_invoice_from_payment(p_payment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    invoice_id UUID;
    payment_data RECORD;
    app_data RECORD;
    description_text TEXT;
BEGIN
    -- Get payment data
    SELECT * INTO payment_data
    FROM payments
    WHERE id = p_payment_id;
    
    IF payment_data IS NULL THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;
    
    -- Get application data
    SELECT * INTO app_data
    FROM applications
    WHERE id = payment_data.application_id;
    
    -- Generate description based on milestone
    CASE payment_data.milestone
        WHEN 1 THEN description_text := 'ค่าตรวจสอบเอกสาร';
        WHEN 2 THEN description_text := 'ค่าประเมินออนไลน์';
        WHEN 3 THEN description_text := 'ค่าประเมินออนไซต์';
        WHEN 4 THEN description_text := 'ค่าออกใบรับรอง';
        ELSE description_text := 'ค่าธรรมเนียม GACP';
    END CASE;
    
    -- Create invoice
    INSERT INTO invoices (
        invoice_number,
        application_id,
        payment_id,
        amount,
        currency,
        description,
        due_date,
        qr_code_data
    ) VALUES (
        generate_invoice_number(),
        payment_data.application_id,
        p_payment_id,
        payment_data.amount,
        payment_data.currency,
        description_text,
        COALESCE(payment_data.payment_due_date, NOW() + INTERVAL '7 days'),
        jsonb_build_object(
            'amount', payment_data.amount,
            'currency', payment_data.currency,
            'description', description_text,
            'payment_id', p_payment_id
        )::TEXT
    ) RETURNING id INTO invoice_id;
    
    RETURN invoice_id;
END;
$$;

-- Create function to mark invoice as paid
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(p_invoice_id UUID, p_payment_method TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    invoice_record RECORD;
    applicant_user_id UUID;
BEGIN
    -- Get invoice data and applicant id separately
    SELECT i.* INTO invoice_record
    FROM invoices i
    WHERE i.id = p_invoice_id;
    
    IF invoice_record IS NULL THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    -- Get applicant id
    SELECT a.applicant_id INTO applicant_user_id
    FROM applications a
    WHERE a.id = invoice_record.application_id;
    
    -- Update invoice
    UPDATE invoices SET
        status = 'PAID',
        paid_at = NOW(),
        payment_method = p_payment_method,
        receipt_number = generate_receipt_number(),
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    -- Update related payment
    UPDATE payments SET
        status = 'COMPLETED',
        paid_at = NOW()
    WHERE id = invoice_record.payment_id;
    
    -- Create notification for applicant
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        action_url,
        action_label,
        related_id
    ) VALUES (
        applicant_user_id,
        'payment_confirmed',
        'การชำระเงินสำเร็จ',
        'การชำระเงิน ' || invoice_record.description || ' จำนวน ' || invoice_record.amount || ' ' || invoice_record.currency || ' สำเร็จแล้ว',
        'high',
        '/applicant/payments',
        'ดูใบเสร็จ',
        p_invoice_id
    );
    
    -- Create notification for reviewers
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        action_url,
        action_label,
        related_id
    )
    SELECT 
        p.id,
        'payment_received',
        'มีคำขอใหม่ที่ชำระเงินแล้ว',
        'ใบสมัคร ' || COALESCE(a.application_number, 'ไม่ระบุ') || ' ได้ชำระ ' || invoice_record.description || ' เรียบร้อยแล้ว',
        'medium',
        '/reviewer/queue',
        'ตรวจสอบคำขอ',
        invoice_record.application_id
    FROM profiles p
    JOIN applications a ON a.id = invoice_record.application_id
    WHERE p.role = 'reviewer' AND p.is_active = true;
    
    RETURN TRUE;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();