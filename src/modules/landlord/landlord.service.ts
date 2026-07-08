import { prisma } from "../../lib/prisma"
import { IProperties } from "./lanlordProperties.interface"

const createProperties = async (payload: IProperties, landlordId: string) => {
    const createdProperty = await prisma.property.create({
        data: {
             ...payload,
             landlordId: landlordId
        }
    })

    return createdProperty;
}

export const landlordService ={
    createProperties
}