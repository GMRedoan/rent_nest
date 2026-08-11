import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { IGoogleLoginPayload, ILoginUser, IPostUser, IUpdateUserPayload } from "./auth.interface"
import config from "../../config"
import { jwtUtils } from "../../utils/jwt"
import { SignOptions } from "jsonwebtoken"
import { TokenPayload } from "google-auth-library"
import { googleClient } from "../../lib/googleAuth"
import { authProvider, Role } from "../../../generated/prisma/enums"

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
	let user = await prisma.user.findFirst({
		where: {
			email: googleIdTokenPayload.email,
			role: Role.TENANT,
			googleId: googleIdTokenPayload.sub,
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
 			},
		});
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
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

export const authService = {
    postUserIntoDB,
    loginUser,
    getMyProfile,
    updateUser,
    googleLogin
}