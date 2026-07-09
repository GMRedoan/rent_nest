import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateCategory, IUpdateCategory } from "./admin.interface";

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

const allRentalRequests = async () => {
    const requests = await prisma.rentalRequest.findMany({
        include: { property: true, tenant: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" }
    });
    return requests
}

const createCategory = async (payload: ICreateCategory) => {
    const category = await prisma.category.create({
        data: payload
    })
    return category
}

const updateCategory = async (id: string, payload: IUpdateCategory) => {
    const isExist = await prisma.category.findUnique({
        where: {
            id
        }
    })
    if (!isExist) {
        throw new Error("category not found");
    }
    const isExistName = await prisma.category.findUnique({
        where: {
            name: payload.name
        }
    })
    if (isExistName) {
        throw new Error("category name already exist");
    }
    const UpdatedCategory = await prisma.category.update({
        where: {
            id
        },
        data: payload
    })
    return UpdatedCategory
}

const deleteCategory = async (id: string) => {
    const isExist = await prisma.category.findUnique({
        where: {
            id
        }
    })
    if (!isExist) {
        throw new Error("category not found");
    }
    await prisma.category.delete({
        where: {
            id
        }
    })
 }

export const adminService = {
    allUsers,
    updateUserStatus,
    allProperties,
    allRentalRequests,
    createCategory,
    updateCategory,
    deleteCategory
}