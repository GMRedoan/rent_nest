import { prisma } from "../../lib/prisma";

const allCategories = async () => {
    const categories = await prisma.category.findMany();
    return categories
}

export const categoriesService = {
    allCategories
}