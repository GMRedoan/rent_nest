import { prisma } from "../../lib/prisma"
import { IProperties, IUpdateProperties } from "./lanlordProperties.interface"

const createProperties = async (payload: IProperties, landlordId: string) => {
    const createdProperty = await prisma.property.create({
        data: {
             ...payload,
             landlordId: landlordId
        }
    })

    return createdProperty;
}

const updateProperties = async (payload: IUpdateProperties, propertiesId: string, landlordId: string) => {
    const property = await prisma.property.findUnique({
        where: {
            id: propertiesId
        }
    })
    if (!property) {
        throw new Error("property not found");
    }
    if (property?.landlordId !== landlordId) {
        throw new Error("you are not authorized to update this property");
    }
    const createdProperty = await prisma.property.update({
        where: {
            id: propertiesId
        },
        data: {
             ...payload,
        }
    })

    return createdProperty;
}

const deleteProperty = async (propertiesId: string, landlordId: string) => {
    const property = await prisma.property.findUnique({
        where: {
            id: propertiesId
        }
    })
    if (!property) {
        throw new Error("property not found");
    }
    if (property?.landlordId !== landlordId) {
        throw new Error("you are not authorized to delete this property");
    }
    await prisma.property.delete({
        where: {
            id: propertiesId
        }
    })
}

export const landlordService ={
    createProperties,
    updateProperties,
    deleteProperty
}