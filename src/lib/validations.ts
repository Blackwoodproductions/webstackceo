import { z } from 'zod';

/**
 * Centralized validation schemas for forms across the application.
 * Uses Zod for type-safe runtime validation with descriptive error messages.
 */

// Common field validators
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, { message: 'Please enter a valid phone number' })
  .max(20, { message: 'Phone number must be less than 20 characters' })
  .optional()
  .or(z.literal(''));

export const urlSchema = z
  .string()
  .trim()
  .url({ message: 'Please enter a valid URL' })
  .max(500, { message: 'URL must be less than 500 characters' })
  .optional()
  .or(z.literal(''));

export const domainSchema = z
  .string()
  .trim()
  .min(1, { message: 'Domain is required' })
  .regex(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: 'Please enter a valid domain (e.g., example.com)',
  })
  .max(253, { message: 'Domain must be less than 253 characters' });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name must be less than 100 characters' });

export const messageSchema = z
  .string()
  .trim()
  .min(1, { message: 'Message is required' })
  .max(5000, { message: 'Message must be less than 5000 characters' });

// Form schemas
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: messageSchema,
});

export const leadFormSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  domain: z.string().trim().optional(),
  full_name: nameSchema.optional().or(z.literal('')),
  company_employees: z.string().optional(),
  annual_revenue: z.string().optional(),
});

export const domainAuditSchema = z.object({
  domain: domainSchema,
  email: emailSchema.optional().or(z.literal('')),
});

export const directoryListingSchema = z.object({
  business_name: z.string().trim().min(1, 'Business name is required').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  contact_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  website_url: urlSchema,
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip_code: z.string().trim().max(20).optional(),
});

export const partnerApplicationSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  contact_name: nameSchema,
  contact_email: emailSchema,
  website_url: urlSchema,
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(2000),
  why_join: z.string().trim().max(2000).optional(),
});

export const apiKeySchema = z
  .string()
  .trim()
  .min(10, { message: 'API key must be at least 10 characters' })
  .max(500, { message: 'API key must be less than 500 characters' });

// Type exports
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type LeadFormData = z.infer<typeof leadFormSchema>;
export type DomainAuditData = z.infer<typeof domainAuditSchema>;
export type DirectoryListingData = z.infer<typeof directoryListingSchema>;
export type PartnerApplicationData = z.infer<typeof partnerApplicationSchema>;

// Utility function for sanitizing user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove any remaining angle brackets
};

// Validate and sanitize domain input
export const validateAndSanitizeDomain = (input: string): { valid: boolean; domain: string; error?: string } => {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0];

  const result = domainSchema.safeParse(cleaned);
  
  if (result.success) {
    return { valid: true, domain: cleaned };
  }
  
  return { valid: false, domain: cleaned, error: result.error.errors[0]?.message };
};
