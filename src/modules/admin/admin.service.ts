import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const allUsers = async () => {
    const users = await prisma.user.findMany();
    return users
}

const updateUserStatus = async (userId: string, status: UserStatus) => {
    const isExist = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })
    if (!isExist) {
        throw new Error("user not found");
    }

    const user = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            status
        }
    })
    return user
}

const allProperties = async () => {
    const properties = await prisma.property.findMany();
    return properties
}

export const adminService = {
    allUsers,
    updateUserStatus,
    allProperties
}