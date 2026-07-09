import { PropertyStatus, PropertyType } from "../../../generated/prisma/enums";

export interface IPropertyFilters {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: PropertyType;
    status?: PropertyStatus;
    sortBy?: "price" | "createdAt" | "title";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}
