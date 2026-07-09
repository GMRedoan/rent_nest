export interface ICreateRentalRequest {
    propertyId: string;
    message?: string;
    startDate: Date;
    endDate?: Date;
}