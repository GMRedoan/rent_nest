import { z } from 'zod';

const userRoleEnum = z.enum(['TENANT', 'ADMIN', 'LANDLORD']);

const createUserValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
        phone: z.string().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number').optional(),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
                'Password must contain uppercase, lowercase, number, and special character'
            ).optional(),        
        role: userRoleEnum.optional(),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        newPassword: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
                'Password must contain uppercase, lowercase, number, and special character'
            ),
        otp: z.string().length(6, 'OTP must be 6 digits'),
    }),
});

export const UserValidation = {
    createUserValidationSchema,
    resetPasswordSchema
};