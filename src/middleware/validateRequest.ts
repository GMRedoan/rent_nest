import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';

const validateRequest = (schema: ZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (err: any) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errorDetails: err?.issues?.map((issue: any) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
    };
};

export default validateRequest;