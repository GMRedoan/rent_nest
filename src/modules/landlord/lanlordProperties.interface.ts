import { PropertyStatus, PropertyType } from "../../../generated/prisma/enums"

export interface IProperties {
    title: string
    description: string
    propertyType: PropertyType
    price: number
    location: string
    images: string[]
    status?: PropertyStatus
    categoryId?: string
}

export interface IUpdateProperties {
    title?: string
    description?: string
    propertyType?: PropertyType
    price?: number
    location?: string
    images?: string[]
    status?: PropertyStatus
}