export interface Ingredient {
    nome: string;
    quantita: number;
    unita: string;
}

export interface RecipeCreator {
    id: string;
    name: string;
    email: string;
}

export interface Recipe {
    _id: string;
    name: string;
    ingredients: Ingredient[];
    instructions: string[];
    imageUrl?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    creatore: RecipeCreator;
}