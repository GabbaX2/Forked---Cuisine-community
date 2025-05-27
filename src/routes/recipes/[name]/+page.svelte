<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { isLoggedIn } from "$lib/stores/auth";

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
        _id: string | { $oid: string };
        name: string;
        ingredients: Ingredient[];
        instructions: string[];
        imageUrl?: string;
        createdAt: string;
        updatedAt: string;
        creatore: Creator;
    }

    interface Comment {
        _id: string;
        testo: string;
        createdAt: string;
        user: {
            _id: string;
            name: string;
        };
    }

    interface User {
        id: string;
        name: string;
        email: string;
    }

    interface ShoppingListItem {
        nome: string;
        quantita: number;
        unita: string;
    }

    interface ShoppingListResponse {
        ricette: string[];
        listaSpesa: ShoppingListItem[];
        persone: number;
        createdAt: string;
    }

    let recipe = $state<Recipe | null>(null);
    let comments = $state<Comment[]>([]);
    let loading = $state(true);
    let loadingComments = $state(false);
    let error = $state("");
    let commentError = $state("");
    let user = $state<User | null>(null);
    let newComment = $state("");
    let submittingComment = $state(false);

    // Shopping list states
    let showShoppingModal = $state(false);
    let numPersone = $state(1);
    let generatingShoppingList = $state(false);
    let shoppingListError = $state("");
    let shoppingList = $state<ShoppingListResponse | null>(null);
    let showShoppingList = $state(false);

    const API_BASE_URL = "http://localhost:3000";

    // Ottieni il nome della ricetta dai parametri URL
    const recipeName = $derived(decodeURIComponent($page.params.name));

    // Controlla se l'utente è loggato
    function checkAuth(): void {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("authToken"); // Cambiato da "token" a "authToken"
        const userData = localStorage.getItem("user");

        if (token && userData) {
            try {
                user = JSON.parse(userData);
                isLoggedIn.set(true); // Aggiorna lo store
            } catch (e) {
                console.error("Error parsing user data:", e);
                user = null;
                isLoggedIn.set(false);
            }
        } else {
            user = null;
            isLoggedIn.set(false);
        }
    }

    async function fetchRecipe(): Promise<void> {
        try {
            loading = true;
            error = "";

            console.log("Fetching recipe with name:", recipeName);

            const response = await fetch(`${API_BASE_URL}/forked/recipes`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const recipes = (await response.json()) as Recipe[];
            console.log("All recipes:", recipes);

            recipe = recipes.find((r: Recipe) => r.name === recipeName) || null;

            if (!recipe) {
                error = "Ricetta non trovata";
            } else {
                console.log("Found recipe:", recipe);
                console.log("Recipe ID type:", typeof recipe._id);
                console.log("Recipe ID value:", recipe._id);
            }
        } catch (err) {
            console.error("Error fetching recipe:", err);
            error = "Errore nel caricamento della ricetta";
        } finally {
            loading = false;
        }
    }

    async function fetchComments(): Promise<void> {
        if (!recipe) return;

        try {
            loadingComments = true;
            const response = await fetch(
                `${API_BASE_URL}/forked/ricette/${encodeURIComponent(recipe.name)}/commenti`,
            );

            if (response.ok) {
                comments = (await response.json()) as Comment[];
            } else {
                console.error("Error fetching comments");
                comments = [];
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
            comments = [];
        } finally {
            loadingComments = false;
        }
    }

    async function submitComment(): Promise<void> {
        if (!user || !recipe || !newComment.trim()) return;

        try {
            submittingComment = true;
            commentError = "";

            const token = localStorage.getItem("authToken"); // Cambiato da "token" a "authToken"
            const response = await fetch(
                `${API_BASE_URL}/forked/ricette/${encodeURIComponent(recipe.name)}/commenti`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        testo: newComment.trim(),
                    }),
                },
            );

            if (response.ok) {
                const comment = (await response.json()) as Comment;
                comments = [comment, ...comments];
                newComment = "";
            } else {
                const errorData = await response.json();
                commentError =
                    errorData.message || "Errore nell'invio del commento";
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
            commentError = "Errore nell'invio del commento";
        } finally {
            submittingComment = false;
        }
    }

    async function deleteComment(commentId: string): Promise<void> {
        if (!user || !recipe) return;

        if (!confirm("Sei sicuro di voler eliminare questo commento?")) return;

        try {
            const token = localStorage.getItem("authToken"); // Cambiato da "token" a "authToken"
            const response = await fetch(
                `${API_BASE_URL}/forked/ricette/${encodeURIComponent(recipe.name)}/commenti/${commentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.ok) {
                comments = comments.filter((c) => c._id !== commentId);
            } else {
                alert("Errore nell'eliminazione del commento");
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
            alert("Errore nell'eliminazione del commento");
        }
    }

    // Shopping list functions
    function openShoppingModal(): void {
        if (!$isLoggedIn || !user) {
            // Usa lo store isLoggedIn
            alert("Devi essere loggato per creare una lista della spesa");
            return;
        }
        showShoppingModal = true;
        shoppingListError = "";
    }

    function closeShoppingModal(): void {
        showShoppingModal = false;
        numPersone = 1;
        shoppingListError = "";
    }

    async function generateShoppingList(): Promise<void> {
        if (!recipe || !user) return;

        try {
            generatingShoppingList = true;
            shoppingListError = "";

            console.log("Recipe object:", recipe);

            const requestBody = {
                ricette: [recipe.name],
                persone: numPersone,
            };

            console.log("Request body:", requestBody);

            const postResponse = await fetch(
                `${API_BASE_URL}/forked/lista-spesa`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(requestBody),
                },
            );

            console.log("POST Response status:", postResponse.status);

            const responseText = await postResponse.text();
            console.log("Raw response:", responseText);

            if (postResponse.ok) {
                const data = JSON.parse(responseText);
                console.log("POST Response data:", data);

                // Chiudi il modale e reindirizza alla pagina della lista della spesa
                showShoppingModal = false;
                goto("/shopping-list");
            } else {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = {
                        message: "Errore sconosciuto",
                        details: responseText,
                    };
                }
                console.error("Error response:", errorData);
                shoppingListError =
                    errorData.message ||
                    "Errore nella generazione della lista della spesa";
            }
        } catch (err) {
            console.error("Error generating shopping list:", err);
            shoppingListError =
                "Errore nella generazione della lista della spesa. Controlla la console per i dettagli.";
        } finally {
            generatingShoppingList = false;
        }
    }

    function closeShoppingList(): void {
        showShoppingList = false;
        shoppingList = null;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("it-IT", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getPlaceholderImage(): string {
        return "https://via.placeholder.com/800x400/f3f4f6/6b7280?text=Ricetta";
    }

    function goBack(): void {
        goto("/recipes");
    }

    onMount(() => {
        checkAuth();
        fetchRecipe().then(() => {
            if (recipe) {
                fetchComments();
            }
        });
    });
</script>

<svelte:head>
    <title>{recipe?.name || "Ricetta"} - Forked</title>
    <meta
        name="description"
        content={recipe
            ? `Ricetta: ${recipe.name} by ${recipe.creatore.name}`
            : "Dettagli ricetta"}
    />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    {#if loading}
        <!-- Loading Spinner -->
        <div class="flex justify-center items-center py-20">
            <div role="status">
                <svg
                    aria-hidden="true"
                    class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                    />
                </svg>
                <span class="sr-only">Caricamento...</span>
            </div>
        </div>
    {:else if error}
        <!-- Error Alert - Flowbite Alert Component -->
        <div class="max-w-4xl mx-auto px-4 py-20">
            <div
                class="flex items-center p-4 mb-4 text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 border border-red-300 dark:border-red-800"
                role="alert"
            >
                <svg
                    class="flex-shrink-0 w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                    />
                </svg>
                <span class="sr-only">Errore</span>
                <div class="ms-3 text-sm font-medium">
                    {error}
                </div>
            </div>
            <button
                onclick={goBack}
                type="button"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
                Torna alle ricette
            </button>
        </div>
    {:else if recipe}
        <!-- Recipe Content -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <!-- Breadcrumb - Flowbite Breadcrumb Component -->
            <nav class="flex mb-8" aria-label="Breadcrumb">
                <ol
                    class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse"
                >
                    <li class="inline-flex items-center">
                        <button
                            onclick={goBack}
                            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                        >
                            <svg
                                class="w-3 h-3 me-2.5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"
                                />
                            </svg>
                            Ricette
                        </button>
                    </li>
                    <li>
                        <div class="flex items-center">
                            <svg
                                class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 6 10"
                            >
                                <path
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="m1 9 4-4-4-4"
                                />
                            </svg>
                            <span
                                class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400"
                                >{recipe.name}</span
                            >
                        </div>
                    </li>
                </ol>
            </nav>

            <!-- Recipe Card - Flowbite Card Component -->
            <div
                class="max-w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 mb-8"
            >
                <img
                    class="rounded-t-lg w-full h-64 md:h-80 object-cover"
                    src={recipe.imageUrl || getPlaceholderImage()}
                    alt={recipe.name}
                />
                <div class="p-6 md:p-8">
                    <div
                        class="flex flex-col md:flex-row md:items-start md:justify-between mb-6"
                    >
                        <div class="mb-4 md:mb-0">
                            <h1
                                class="mb-2 text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
                            >
                                {recipe.name}
                            </h1>
                            <div class="flex items-center mt-4">
                                <div
                                    class="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600"
                                >
                                    <img
                                        src="https://ui-avatars.com/api/?name={encodeURIComponent(
                                            recipe.creatore.name,
                                        )}&background=random"
                                        alt={`Avatar di ${recipe.creatore.name}`}
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                <div class="ms-4">
                                    <p
                                        class="text-sm font-medium text-gray-900 dark:text-white"
                                    >
                                        {recipe.creatore.name}
                                    </p>
                                    <p
                                        class="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {formatDate(recipe.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <div class="text-center">
                                <!-- Flowbite Badge Component -->
                                <span
                                    class="bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                                >
                                    {recipe.ingredients.length} Ingredienti
                                </span>
                            </div>
                            <div class="text-center">
                                <span
                                    class="bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
                                >
                                    {recipe.instructions.length} Passaggi
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shopping List Button - Mostra solo se loggato -->
            {#if $isLoggedIn && user}
                <button
                    onclick={openShoppingModal}
                    type="button"
                    class="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center mb-10"
                >
                    <svg
                        class="w-4 h-4 me-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 20"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 0h8m-8 0-1-4m9 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-9-4h10l2-7H3m2 7L3 4m0 0-.792-3H1"
                        />
                    </svg>
                    Lista Spesa
                </button>
            {/if}

            <!-- Recipe Details -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Ingredients Card -->
                <div
                    class="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                >
                    <div class="p-6">
                        <h2
                            class="mb-4 text-2xl font-bold text-gray-900 dark:text-white flex items-center"
                        >
                            <svg
                                class="w-6 h-6 me-2 text-blue-600"
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
                            Ingredienti
                        </h2>

                        <!-- Debug: Mostra informazioni sugli ingredienti -->
                        {#if !recipe.ingredients || recipe.ingredients.length === 0}
                            <div class="text-center py-8">
                                <p class="text-gray-500 dark:text-gray-400">
                                    Nessun ingrediente disponibile
                                </p>
                                <p class="text-xs text-gray-400 mt-2">
                                    Debug: ingredients array = {JSON.stringify(
                                        recipe.ingredients,
                                    )}
                                </p>
                            </div>
                        {:else}
                            <div class="space-y-3">
                                {#each recipe.ingredients as ingredient, index}
                                    <div
                                        class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <span
                                            class="flex-1 text-gray-900 dark:text-white font-medium"
                                        >
                                            {ingredient.nome ||
                                                "Nome non disponibile"}
                                        </span>
                                        <span
                                            class="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                        >
                                            {ingredient.quantita}
                                            {ingredient.unita || ""}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Instructions Card -->
                <div
                    class="max-w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                >
                    <div class="p-6">
                        <h2
                            class="mb-4 text-2xl font-bold text-gray-900 dark:text-white flex items-center"
                        >
                            <svg
                                class="w-6 h-6 me-2 text-green-600"
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
                            Preparazione
                        </h2>
                        <div class="space-y-4">
                            {#each recipe.instructions as instruction, index}
                                <div class="flex">
                                    <!-- Flowbite Number Badge -->
                                    <span
                                        class="flex items-center justify-center w-8 h-8 me-3 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300"
                                    >
                                        {index + 1}
                                    </span>
                                    <p
                                        class="text-sm text-gray-700 dark:text-gray-400 pt-1"
                                    >
                                        {instruction}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            {#if showShoppingModal}
                <dialog
                    open
                    class="fixed inset-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-50"
                    onclick={closeShoppingModal}
                    onkeydown={(e) =>
                        e.key === "Escape" && closeShoppingModal()}
                >
                    <div
                        class="relative p-4 w-full max-w-md max-h-full"
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="shopping-modal-title"
                        aria-modal="true"
                    >
                        <!-- Modal content -->
                        <div
                            class="relative bg-white rounded-lg shadow dark:bg-gray-700"
                        >
                            <!-- Modal header -->
                            <div
                                class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600"
                            >
                                <h3
                                    id="shopping-modal-title"
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Crea Lista della Spesa
                                </h3>
                                <button
                                    type="button"
                                    onclick={closeShoppingModal}
                                    class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                    aria-label="Chiudi modale"
                                >
                                    <svg
                                        class="w-3 h-3"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 14 14"
                                    >
                                        <path
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                        />
                                    </svg>
                                    <span class="sr-only">Chiudi modale</span>
                                </button>
                            </div>
                            <!-- Modal body -->
                            <form
                                class="p-4 md:p-5"
                                onsubmit={generateShoppingList}
                            >
                                <div class="grid gap-4 mb-4 grid-cols-2">
                                    <div class="col-span-2">
                                        <label
                                            for="numPersone"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Numero di persone
                                        </label>
                                        <input
                                            type="number"
                                            id="numPersone"
                                            bind:value={numPersone}
                                            min="1"
                                            max="20"
                                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            placeholder="1"
                                            required
                                        />
                                    </div>
                                </div>

                                {#if shoppingListError}
                                    <div
                                        class="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                                        role="alert"
                                    >
                                        <svg
                                            class="flex-shrink-0 inline w-4 h-4 me-3"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                                            />
                                        </svg>
                                        <span class="sr-only">Errore</span>
                                        <div>
                                            <span class="font-medium"
                                                >Errore!</span
                                            >
                                            {shoppingListError}
                                        </div>
                                    </div>
                                {/if}

                                <div class="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onclick={closeShoppingModal}
                                        class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={generatingShoppingList}
                                        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {#if generatingShoppingList}
                                            <svg
                                                aria-hidden="true"
                                                role="status"
                                                class="inline w-4 h-4 me-3 text-white animate-spin"
                                                viewBox="0 0 100 101"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                    fill="#E5E7EB"
                                                />
                                                <path
                                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            Generando...
                                        {:else}
                                            Genera Lista
                                        {/if}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </dialog>
            {/if}

            <!-- Shopping List Modal -->
            {#if showShoppingList && shoppingList}
                <dialog
                    open
                    class="fixed inset-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-50"
                    onclick={closeShoppingList}
                    onkeydown={(e) => e.key === "Escape" && closeShoppingList()}
                >
                    <div
                        class="relative p-4 w-full max-w-2xl max-h-full"
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="shopping-list-title"
                        aria-modal="true"
                    >
                        <div
                            class="relative bg-white rounded-lg shadow dark:bg-gray-700 max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <!-- Modal header -->
                            <div
                                class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600"
                            >
                                <h3
                                    id="shopping-list-title"
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    Lista della Spesa - {shoppingList.persone} persone
                                </h3>
                                <button
                                    type="button"
                                    onclick={closeShoppingList}
                                    class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                    aria-label="Chiudi lista spesa"
                                >
                                    <svg
                                        class="w-3 h-3"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 14 14"
                                    >
                                        <path
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <!-- Modal body -->
                            <div class="p-4 md:p-5 overflow-y-auto flex-1">
                                <div class="space-y-4">
                                    {#each shoppingList.listaSpesa as item}
                                        <div
                                            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500"
                                        >
                                            <span
                                                class="font-medium text-gray-900 dark:text-white"
                                            >
                                                {item.nome}
                                            </span>
                                            <span
                                                class="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-500"
                                            >
                                                {item.quantita}
                                                {item.unita}
                                            </span>
                                        </div>
                                    {/each}
                                </div>

                                <div
                                    class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600"
                                >
                                    <p
                                        class="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        Generata il {formatDate(
                                            shoppingList.createdAt,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </dialog>
            {/if}

            <!-- Comments Section -->
            <div
                class="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
            >
                <div class="p-6">
                    <h2
                        class="mb-6 text-2xl font-bold text-gray-900 dark:text-white flex items-center"
                    >
                        <svg
                            class="w-6 h-6 me-2 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            ></path>
                        </svg>
                        Commenti ({comments.length})
                    </h2>

                    <!-- Add Comment Form - Solo se loggato -->
                    {#if $isLoggedIn && user}
                        <form class="mb-6" onsubmit={submitComment}>
                            <div class="mb-4">
                                <label
                                    for="comment"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Aggiungi un commento
                                </label>
                                <textarea
                                    id="comment"
                                    bind:value={newComment}
                                    rows="3"
                                    class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Scrivi il tuo commento..."
                                    disabled={submittingComment}
                                ></textarea>
                            </div>

                            {#if commentError}
                                <div
                                    class="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                                    role="alert"
                                >
                                    <svg
                                        class="flex-shrink-0 inline w-4 h-4 me-3"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                                        />
                                    </svg>
                                    <span class="sr-only">Errore</span>
                                    <div>{commentError}</div>
                                </div>
                            {/if}

                            <button
                                type="submit"
                                disabled={submittingComment ||
                                    !newComment.trim()}
                                class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if submittingComment}
                                    <svg
                                        aria-hidden="true"
                                        role="status"
                                        class="inline w-4 h-4 me-3 text-white animate-spin"
                                        viewBox="0 0 100 101"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                            fill="#E5E7EB"
                                        />
                                        <path
                                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Pubblicando...
                                {:else}
                                    Pubblica commento
                                {/if}
                            </button>
                        </form>
                    {:else}
                        <div
                            class="flex items-center p-4 mb-6 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
                            role="alert"
                        >
                            <svg
                                class="flex-shrink-0 inline w-4 h-4 me-3"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
                                />
                            </svg>
                            <span class="sr-only">Info</span>
                            <div>
                                <span class="font-medium">Accedi</span> per lasciare
                                un commento.
                            </div>
                        </div>
                    {/if}

                    <!-- Comments List -->
                    {#if loadingComments}
                        <div class="flex justify-center py-8">
                            <div role="status">
                                <svg
                                    aria-hidden="true"
                                    class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span class="sr-only"
                                    >Caricamento commenti...</span
                                >
                            </div>
                        </div>
                    {:else if comments.length === 0}
                        <div class="text-center py-8">
                            <svg
                                class="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <h3
                                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Nessun commento
                            </h3>
                            <p
                                class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                            >
                                Inizia la conversazione lasciando il primo
                                commento.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-6">
                            {#each comments as comment}
                                <div
                                    class="p-4 border border-gray-200 rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                >
                                    <div
                                        class="flex items-start justify-between mb-3"
                                    >
                                        <div class="flex items-center">
                                            <div
                                                class="relative w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 mr-3"
                                            >
                                                <img
                                                    src="https://ui-avatars.com/api/?name={encodeURIComponent(
                                                        comment.user.name,
                                                    )}&background=random"
                                                    alt={`Avatar di ${comment.user.name}`}
                                                    class="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p
                                                    class="text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                    {comment.user.name}
                                                </p>
                                                <p
                                                    class="text-xs text-gray-500 dark:text-gray-400"
                                                >
                                                    {formatDate(
                                                        comment.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {#if user && comment.user._id === user.id}
                                            <button
                                                onclick={() =>
                                                    deleteComment(comment._id)}
                                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                aria-label="Elimina commento"
                                                title="Elimina commento"
                                            >
                                                <svg
                                                    class="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                    <p
                                        class="text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {comment.testo}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
