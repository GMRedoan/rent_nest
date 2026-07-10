import { z } from 'zod';

const userRoleEnum = z.enum(['TENANT', 'ADMIN', 'LANDLORD']);

const createUserValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
        phone: z.string().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number'),
        password: z
            .string()
            .min(6, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
                'Password must contain uppercase, lowercase, number, and special character'
            ),        
        role: userRoleEnum.optional(),
    }),
});

export const UserValidation = {
    createUserValidationSchema,
};