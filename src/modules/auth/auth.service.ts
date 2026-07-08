import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { ILoginUser, IPostUser, IUpdateUserPayload } from "./auth.interface"
import config from "../../config"
import { jwtUtils } from "../../utils/jwt"
import { SignOptions } from "jsonwebtoken"

const postUserIntoDB = async (payload: IPostUser) => {
    const { name, email, phone, password, role } = payload
    const isExist = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if (isExist) {
        throw new Error("user already exist");
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bycrypt_salt_rounds))

    const createdUser = await prisma.user.create({
        data:{
            name,
            email,
            phone,
            role: role ?? 'TENANT',
            password: hashedPassword,
         },
         omit: {
            password: true
         }
    })

    return createdUser
}

const loginUser = async (payload: ILoginUser) => {
    const {email, password} = payload
    const user = await prisma.user.findUnique({
        where: {
            email
        },
    })
    if (!user) {
        throw new Error("user not found");
    }

    if(user.status === "BANNED"){
        throw new Error("user is banned, please contact support");
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password)
    if (!isPasswordMatched) {
        throw new Error("password not matched");
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
    }
    const accessToken = jwtUtils.createToken(jwtPayload, config.jwt_access_secret, config.jwt_access_expires_in as SignOptions);

    const refreshToken = jwtUtils.createToken(jwtPayload, config.jwt_refresh_secret, config.jwt_refresh_expires_in as SignOptions);

    return {
        accessToken,
        refreshToken
    }
}

const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId
        },
        omit: {
            password: true
        }
    });

    return user
}

const updateUser = async(payload: IUpdateUserPayload, userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })
    if (!user) {
        throw new Error("user not found");
    }
    if(user.status === "BANNED"){
        throw new Error("user is banned, please contact support");
    }
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        omit: {
            password: true
        },
        data: {
            ...payload
        }
    })
    return updatedUser

}

export const authService = {
    postUserIntoDB,
    loginUser,
    getMyProfile,
    updateUser
}