export interface IPostUser  {
    name: string
    email: string
    phone: string
    password: string
    role?: 'TENANT' | 'LANDLORD';
}

export interface ILoginUser {
    email: string
    password: string
}