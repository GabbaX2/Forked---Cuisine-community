import type { User, Recipe, ShoppingList, ApiResponse, PaginatedResponse } from;

const API_BASE_URL = 'https://forked-eight.vercel.app/forked';

// Helper per ottenere il token di auth
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}

// Helper per le chiamate API
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// User API
export const userApi = {
    async getProfile(): Promise<User> {
        return apiCall<User>('/user/profile');
    },

    async updateProfile(userData: Partial<User>): Promise<User> {
        return apiCall<User>('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },
};

// Recipe API
export const recipeApi = {
    async getUserRecipes(userId?: string): Promise<Recipe[]> {
        const endpoint = userId ? `/recipes/user/${userId}` : '/recipes/my-recipes';
        return apiCall<Recipe[]>(endpoint);
    },

    async getAllRecipes(page = 1, limit = 12): Promise<PaginatedResponse<Recipe>> {
        return apiCall<PaginatedResponse<Recipe>>(`/recipes?page=${page}&limit=${limit}`);
    },

    async getRecipeById(id: string): Promise<Recipe> {
        return apiCall<Recipe>(`/recipes/${id}`);
    },

    async createRecipe(recipeData: Omit<Recipe, 'id' | 'authorId' | 'author' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
        return apiCall<Recipe>('/recipes', {
            method: 'POST',
            body: JSON.stringify(recipeData),
        });
    },

    async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe> {
        return apiCall<Recipe>(`/recipes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(recipeData),
        });
    },

    async deleteRecipe(id: string): Promise<void> {
        return apiCall<void>(`/recipes/${id}`, {
            method: 'DELETE',
        });
    },

    async searchRecipes(query: string): Promise<Recipe[]> {
        return apiCall<Recipe[]>(`/recipes/search?q=${encodeURIComponent(query)}`);
    },
};

// Shopping List API
export const shoppingListApi = {
    async getUserShoppingLists(): Promise<ShoppingList[]> {
        return apiCall<ShoppingList[]>('/shopping-lists');
    },

    async getShoppingListById(id: string): Promise<ShoppingList> {
        return apiCall<ShoppingList>(`/shopping-lists/${id}`);
    },

    async createShoppingList(listData: Omit<ShoppingList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ShoppingList> {
        return apiCall<ShoppingList>('/shopping-lists', {
            method: 'POST',
            body: JSON.stringify(listData),
        });
    },

    async updateShoppingList(id: string, listData: Partial<ShoppingList>): Promise<ShoppingList> {
        return apiCall<ShoppingList>(`/shopping-lists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(listData),
        });
    },

    async deleteShoppingList(id: string): Promise<void> {
        return apiCall<void>(`/shopping-lists/${id}`, {
            method: 'DELETE',
        });
    },

    async createFromRecipe(recipeId: string, listName?: string): Promise<ShoppingList> {
        return apiCall<ShoppingList>('/shopping-lists/from-recipe', {
            method: 'POST',
            body: JSON.stringify({ recipeId, name: listName }),
        });
    },
};

// Auth API
export const authApi = {
    async login(email: string, password: string): Promise<{ token: string; user: User }> {
        return apiCall<{ token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async register(userData: { email: string; password: string; username: string; firstName?: string; lastName?: string }): Promise<{ token: string; user: User }> {
        return apiCall<{ token: string; user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async refreshToken(): Promise<{ token: string }> {
        return apiCall<{ token: string }>('/auth/refresh');
    },
};