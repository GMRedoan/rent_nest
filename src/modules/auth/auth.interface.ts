export interface IPostUser  {
    name: string
    email: string
    phone: string
    password: string
    profilePhoto?: string;
    bio?: string
}

export interface ILoginUser {
    email: string
    password: string
}