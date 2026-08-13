export interface IPostUser  {
    name: string
    email: string
    phone: string
    password: string
    role?: 'TENANT' | 'LANDLORD';
}

export interface IUpdateUserPayload{
    name?: string
    phone?: string
}

export interface ILoginUser {
    email: string
    password: string
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload{
    email: string
}

export interface IResetPasswordPayload{
    email: string
    newPassword: string
    otp: string
}