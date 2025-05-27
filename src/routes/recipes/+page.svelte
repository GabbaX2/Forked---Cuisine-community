<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    interface Ingredient {
        nome: string;
        quantita: number;
        unita: string;
    }

    interface Creator {
        name: string;
        _id: string;
    }

    interface Recipe {
        _id: string;
        name: string;
        ingredients: Ingredient[];
        instructions: string;
        imageUrl?: string;
        createdAt: string;
        updatedAt: string;
        creatore: Creator;
    }

    let recipes: Recipe[] = [];
    let loading = true;
    let error = "";

    const API_BASE_URL = "http://localhost:3000";

    async function fetchRecipes() {
        try {
            loading = true;
            const response = await fetch(`${API_BASE_URL}/forked/recipes`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Normalizza i dati ricevuti per gestire entrambi i formati
            recipes = data.map((recipe) => ({
                ...recipe,
                ingredients: recipe.ingredients.map((ingredient) => {
                    // Se è già un oggetto, lascialo così
                    if (typeof ingredient === "object" && ingredient.nome) {
                        return ingredient;
                    }

                    // Se è una stringa, convertila
                    if (typeof ingredient === "string") {
                        const parts = ingredient.trim().split(" ");
                        if (parts.length >= 2 && /^\d+/.test(parts[0])) {
                            const quantitaMatch =
                                parts[0].match(/^(\d+)([a-zA-Z]*)$/);
                            if (quantitaMatch) {
                                return {
                                    nome: parts.slice(1).join(" "),
                                    quantita: parseInt(quantitaMatch[1]),
                                    unita: quantitaMatch[2] || "pz",
                                };
                            }
                        }
                        return {
                            nome: ingredient.trim(),
                            quantita: 1,
                            unita: "pz",
                        };
                    }

                    // Fallback
                    return {
                        nome: String(ingredient),
                        quantita: 1,
                        unita: "pz",
                    };
                }),
            }));

            error = "";
        } catch (err) {
            console.error("Error fetching recipes:", err);
            error = "Errore nel caricamento delle ricette. Riprova più tardi.";
        } finally {
            loading = false;
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("it-IT", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function getPlaceholderImage(): string {
        return "https://via.placeholder.com/400x300/f3f4f6/6b7280?text=Ricetta";
    }

    function viewRecipe(recipeName: string) {
        goto(`/recipes/${encodeURIComponent(recipeName)}`);
    }

    onMount(() => {
        fetchRecipes();
    });
</script>

<svelte:head>
    <title>Le Nostre Ricette - Forked</title>
    <meta
        name="description"
        content="Scopri tutte le ricette della community Forked"
    />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                🍴 Le Nostre Ricette
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                Scopri le deliziose ricette condivise dalla nostra community di
                chef appassionati
            </p>
        </div>

        <!-- Loading State -->
        {#if loading}
            <div class="flex justify-center items-center py-20">
                <div
                    class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500"
                >
                    <svg
                        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Caricamento ricette...
                </div>
            </div>
        {:else if error}
            <!-- Error State -->
            <div class="flex flex-col items-center justify-center py-20">
                <div
                    class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center"
                >
                    <div class="flex justify-center mb-4">
                        <svg
                            class="w-12 h-12 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-red-900 mb-2">
                        Oops! Qualcosa è andato storto
                    </h3>
                    <p class="text-red-700 mb-4">{error}</p>
                    <button
                        onclick={fetchRecipes}
                        class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Riprova
                    </button>
                </div>
            </div>
        {:else if recipes.length === 0}
            <!-- Empty State -->
            <div class="text-center py-20">
                <div class="mx-auto max-w-md">
                    <svg
                        class="mx-auto h-24 w-24 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                    </svg>
                    <h3 class="mt-6 text-lg font-medium text-gray-900">
                        Nessuna ricetta trovata
                    </h3>
                    <p class="mt-2 text-gray-500">
                        Non ci sono ancora ricette da mostrare. Torna più tardi!
                    </p>
                </div>
            </div>
        {:else}
            <!-- Recipes Grid -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {#each recipes as recipe (recipe._id)}
                    <div
                        class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer"
                        onclick={() => viewRecipe(recipe.name)}
                        onkeydown={(e) =>
                            e.key === "Enter" && viewRecipe(recipe.name)}
                        tabindex="0"
                        role="button"
                    >
                        <!-- Recipe Image -->
                        <div class="relative h-48 overflow-hidden">
                            <img
                                src={recipe.imageUrl || getPlaceholderImage()}
                                alt={recipe.name}
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            <div
                                class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"
                            ></div>
                        </div>

                        <!-- Recipe Content -->
                        <div class="p-6">
                            <div class="flex items-start justify-between mb-3">
                                <h3
                                    class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2"
                                >
                                    {recipe.name}
                                </h3>
                            </div>

                            <!-- Creator Info -->
                            <div class="flex items-center mb-4">
                                <div
                                    class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3"
                                >
                                    <span
                                        class="text-indigo-600 font-semibold text-sm"
                                    >
                                        {recipe.creatore.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        {recipe.creatore.name}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {formatDate(recipe.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <!-- Recipe Stats -->
                            <div
                                class="flex items-center justify-between text-sm text-gray-600 mb-4"
                            >
                                <div class="flex items-center">
                                    <svg
                                        class="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
                                        ></path>
                                    </svg>
                                    <span
                                        >{recipe.ingredients.length} ingredienti</span
                                    >
                                </div>
                                <div class="flex items-center">
                                    <svg
                                        class="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        ></path>
                                    </svg>
                                    <span
                                        >{recipe.instructions.length} passaggi</span
                                    >
                                </div>
                            </div>

                            <!-- Ingredients Preview -->
                            <div class="mb-4">
                                <div class="flex flex-wrap gap-1">
                                    {#each recipe.ingredients.slice(0, 3) as ingredient}
                                        <span
                                            class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                                        >
                                            {ingredient.nome}
                                        </span>
                                    {/each}
                                    {#if recipe.ingredients.length > 3}
                                        <span
                                            class="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full"
                                        >
                                            +{recipe.ingredients.length - 3} altri
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            <!-- View Recipe Button -->
                            <button
                                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 group-hover:bg-indigo-700"
                            >
                                Visualizza Ricetta
                            </button>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Results Summary -->
            <div class="mt-12 text-center">
                <p class="text-gray-600">
                    Mostrando <span class="font-semibold">{recipes.length}</span
                    >
                    {recipes.length === 1 ? "ricetta" : "ricette"}
                </p>
            </div>
        {/if}
    </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
