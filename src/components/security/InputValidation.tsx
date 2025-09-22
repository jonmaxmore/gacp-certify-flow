import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .email('รูปแบบอีเมลไม่ถูกต้อง')
  .min(1, 'กรุณาป้อนอีเมล');

// Password validation schema with strong requirements
export const passwordSchema = z.string()
  .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
  .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
  .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
  .regex(/[^A-Za-z0-9]/, 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');

// Phone number validation for Thai format
export const phoneSchema = z.string()
  .regex(/^(\+66|0)[0-9]{8,9}$/, 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง')
  .optional();

// Thai ID number validation
export const thaiIdSchema = z.string()
  .regex(/^[0-9]{13}$/, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก')
  .optional();

// Name validation
export const nameSchema = z.string()
  .min(1, 'กรุณาป้อนชื่อ')
  .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร')
  .regex(/^[ก-๙a-zA-Z\s\-\.]+$/, 'ชื่อสามารถมีตัวอักษร ช่องว่าง เครื่องหมาย - และ . เท่านั้น');

// Organization name validation
export const organizationSchema = z.string()
  .min(1, 'กรุณาป้อนชื่อองค์กร')
  .max(200, 'ชื่อองค์กรต้องไม่เกิน 200 ตัวอักษร')
  .optional();

// Certificate number validation
export const certificateNumberSchema = z.string()
  .regex(/^CERT-\d{6}-\d{4}$/, 'รูปแบบหมายเลขใบรับรองไม่ถูกต้อง (เช่น CERT-000001-2025)');

// Application number validation
export const applicationNumberSchema = z.string()
  .regex(/^GACP-\d{4}-\d{4}$/, 'รูปแบบหมายเลขใบสมัครไม่ถูกต้อง (เช่น GACP-0001-2568)');

// Address validation
export const addressSchema = z.string()
  .min(10, 'ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร')
  .max(500, 'ที่อยู่ต้องไม่เกิน 500 ตัวอักษร');

// Farm area validation (rai, ngan, wah)
export const farmAreaSchema = z.object({
  rai: z.number().min(0, 'จำนวนไร่ต้องเป็นจำนวนเต็มบวก').max(10000, 'จำนวนไร่ไม่ควรเกิน 10,000'),
  ngan: z.number().min(0, 'จำนวนงานต้องเป็นจำนวนเต็มบวก').max(3, 'จำนวนงานไม่ควรเกิน 3'),
  wah: z.number().min(0, 'จำนวนตารางวาต้องเป็นจำนวนเต็มบวก').max(99, 'จำนวนตารางวาไม่ควรเกิน 99')
});

// Registration form validation schema
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
  phone: phoneSchema,
  thaiId: thaiIdSchema,
  organization: organizationSchema,
  role: z.enum(['applicant', 'reviewer', 'auditor', 'admin'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'กรุณาป้อนรหัสผ่าน')
});

// Application form validation schema
export const applicationSchema = z.object({
  farmName: nameSchema,
  farmAddress: addressSchema,
  farmArea: farmAreaSchema,
  cropTypes: z.array(z.string()).min(1, 'กรุณาเลือกประเภทพืชอย่างน้อย 1 ชนิด'),
  cultivationMethods: z.array(z.string()).min(1, 'กรุณาเลือกวิธีการเพาะปลูกอย่างน้อย 1 วิธี'),
  staffCount: z.number().min(1, 'จำนวนพนักงานต้องอย่างน้อย 1 คน').max(1000, 'จำนวนพนักงานไม่ควรเกิน 1,000 คน'),
  expectedYield: z.string().min(1, 'กรุณาระบุผลผลิตที่คาดหวัง')
});

// Input sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, ''); // Keep only digits and plus sign
};

// Rate limiting helper
export const isRateLimited = (attempts: number, maxAttempts: number = 5): boolean => {
  return attempts >= maxAttempts;
};

export const getRemainingTime = (lastAttempt: Date, windowMinutes: number = 15): number => {
  const now = new Date();
  const timeDiff = now.getTime() - lastAttempt.getTime();
  const remainingMs = (windowMinutes * 60 * 1000) - timeDiff;
  return Math.max(0, Math.ceil(remainingMs / 1000 / 60)); // Return remaining minutes
};