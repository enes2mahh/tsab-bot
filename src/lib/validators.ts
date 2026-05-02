import { z } from 'zod'

// ===== Phone Validation =====
const phoneRegex = /^[0-9+\-\s()]{7,20}$/

export const phoneSchema = z
  .string()
  .min(7, 'رقم الهاتف قصير جداً')
  .max(20, 'رقم الهاتف طويل جداً')
  .regex(phoneRegex, 'رقم الهاتف غير صحيح')

// ===== Contact Schema =====
export const contactSchema = z.object({
  name: z.string().max(100, 'الاسم طويل جداً').optional(),
  phone: phoneSchema,
  notes: z.string().max(500, 'الملاحظات طويلة جداً').optional(),
  tags: z.array(z.string()).optional(),
})
export type ContactFormData = z.infer<typeof contactSchema>

// ===== Campaign Schema =====
export const campaignSchema = z.object({
  name: z.string().min(2, 'اسم الحملة مطلوب (حرفان على الأقل)').max(100, 'الاسم طويل جداً'),
  device_id: z.string().min(1, 'يجب اختيار جهاز'),
  delay_seconds: z.number().min(1, 'التأخير لا يقل عن ثانية').max(300, 'التأخير لا يتجاوز 5 دقائق').default(3),
  message_type: z.enum(['text', 'image', 'document', 'video']).default('text'),
  message_text: z.string().max(4096, 'الرسالة طويلة جداً').optional(),
  schedule_at: z.string().optional(),
})
export type CampaignFormData = z.infer<typeof campaignSchema>

// ===== Template Schema =====
export const templateSchema = z.object({
  name: z.string().min(2, 'اسم القالب مطلوب').max(100, 'الاسم طويل جداً'),
  content: z.string().min(1, 'محتوى القالب مطلوب').max(4096, 'المحتوى طويل جداً'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
export type TemplateFormData = z.infer<typeof templateSchema>

// ===== AutoReply Schema =====
export const autoReplySchema = z.object({
  keyword: z.string().min(1, 'الكلمة المفتاحية مطلوبة').max(200, 'الكلمة طويلة جداً'),
  response: z.string().min(1, 'الرد مطلوب').max(4096, 'الرد طويل جداً'),
  match_type: z.enum(['exact', 'contains', 'starts_with', 'regex']).default('contains'),
  is_active: z.boolean().default(true),
  device_id: z.string().optional(),
})
export type AutoReplyFormData = z.infer<typeof autoReplySchema>

// ===== Ticket Schema =====
export const ticketSchema = z.object({
  subject: z.string().min(5, 'الموضوع يجب أن يكون 5 أحرف على الأقل').max(200, 'الموضوع طويل جداً'),
  body: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل').max(5000, 'الوصف طويل جداً'),
  department: z.enum(['general', 'technical', 'billing', 'other']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})
export type TicketFormData = z.infer<typeof ticketSchema>

// ===== Settings Schema =====
export const webhookSchema = z.object({
  url: z.string().url('رابط Webhook غير صحيح').optional().or(z.literal('')),
})

export const passwordSchema = z.object({
  current: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirm: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine(d => d.newPassword === d.confirm, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm'],
})

// ===== FAQ Schema =====
export const faqSchema = z.object({
  question: z.string().min(2, 'السؤال مطلوب').max(500, 'السؤال طويل جداً'),
  answer: z.string().min(2, 'الجواب مطلوب').max(4096, 'الجواب طويل جداً'),
  keywords: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
})
export type FAQFormData = z.infer<typeof faqSchema>

// ===== Utility: Format Zod errors into a simple map =====
export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {}
  for (const issue of errors.issues) {
    const key = issue.path.join('.') || 'root'
    if (!map[key]) map[key] = issue.message
  }
  return map
}

// ===== Utility: Validate and return errors or null =====
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { data: T; errors: null } | { data: null; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) return { data: result.data, errors: null }
  return { data: null, errors: formatZodErrors(result.error as z.ZodError) }
}
