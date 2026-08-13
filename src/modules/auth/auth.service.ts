import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { IForgotPasswordPayload, IGoogleLoginPayload, ILoginUser, IPostUser, IResetPasswordPayload, IUpdateUserPayload } from "./auth.interface"
import config from "../../config"
import { jwtUtils } from "../../utils/jwt"
import { SignOptions } from "jsonwebtoken"
import { TokenPayload } from "google-auth-library"
import { googleClient } from "../../lib/googleAuth"
import { authProvider, Role } from "../../../generated/prisma/enums"
import crypto from "crypto";
import { redisClient } from "../../lib/redis"

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
    if(user.emailVerified === false){
        throw new Error("user is not verified, please verify your email");
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password as string);
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

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log("Error verifying Google ID token:", error);
		throw new Error("Invalid Google ID token");
	}
	if (!googleIdTokenPayload) {
		throw new Error("Invalid Google ID token");
	}
	if (!googleIdTokenPayload.email) {
		throw new Error("Invalid Google ID token");
	}
	if (!googleIdTokenPayload.name) {
		throw new Error("Invalid Google ID token");
	}
	let user = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
		},
	});

	if (!user) {
		user = await prisma.user.create({
			data: {
				email: googleIdTokenPayload.email,
				name: googleIdTokenPayload.name,
                profilePhoto: googleIdTokenPayload.picture,
				role: Role.TENANT,
				googleId: googleIdTokenPayload.sub,
				authProvider: authProvider.GOOGLE,
                emailVerified: true
 			},
		});
	}else if (!user.googleId) {
    user = await prisma.user.update({
        where: { id: user.id },
        data: {
            googleId: googleIdTokenPayload.sub,
            profilePhoto: user.profilePhoto ?? googleIdTokenPayload.picture,
        },
    });
}

	const jwtPayload = {
		id: user.id,
		name: user.name,
		email: user.email,
        phone: user.phone ?? null,
		role: user.role,
        emailVerified: user.emailVerified
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
    const {email} = payload;
    const isUserExists = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if(!isUserExists) {
        throw new Error("user not found");
    }
    if(!isUserExists.emailVerified){
        throw new Error("user email is not verified");
    }
    if(isUserExists.status === "BANNED"){
        throw new Error("user is banned, please contact support");
    }
    if(isUserExists.googleId && isUserExists.authProvider === "GOOGLE"){ 
        throw new Error("user is registered with google, please use google login");
    };
    const otp = crypto.randomInt(100000, 1000000).toString();
    const key = `forgot-password-otp:${isUserExists.email}`;

    await redisClient.set(key, otp, {
        expiration: {
            type: "EX",
            value: 2 * 60
        }
    });

}

const resetPassword = async (payload: IResetPasswordPayload) => {
    const {email, otp, newPassword} = payload;
    const isUserExists = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if(!isUserExists) {
        throw new Error("user not found");
    }
    if(!isUserExists.emailVerified){
        throw new Error("user email is not verified");
    }
    if(isUserExists.status === "BANNED"){
        throw new Error("user is banned, please contact support");
    }
    if(isUserExists.googleId && isUserExists.authProvider === "GOOGLE"){ 
        throw new Error("user is registered with google, please use google login");
    };

    const key = `forgot-password-otp:${isUserExists.email}`;
    const redisOtp = await redisClient.get(key);

    if(!redisOtp){
        throw new Error("otp not found");
    }
    if(redisOtp !== otp){
        throw new Error("invalid otp");
    }

    const newHashedPassword = await bcrypt.hash(newPassword, Number(config.bycrypt_salt_rounds));
    await prisma.user.update({
        where: {
            email : isUserExists.email
        },
        data: {
            password: newHashedPassword
        }
    })

    await redisClient.del([key]);

}

export const authService = {
    postUserIntoDB,
    loginUser,
    getMyProfile,
    updateUser,
    googleLogin,
    forgotPassword,
    resetPassword
}