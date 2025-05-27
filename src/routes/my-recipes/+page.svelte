<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { isLoggedIn } from "$lib/stores/auth";
    import { get } from "svelte/store";

    interface Recipe {
        _id: string;
        name: string;
        ingredients: string[];
        instructions: string;
        imageUrl?: string;
        createdAt: string;
        updatedAt: string;
    }

    let recipes: Recipe[] = [];
    let loading = true;
    let error = "";

    async function fetchMyRecipes() {
        try {
            const token = localStorage.getItem("authToken");

            if (!token) {
                goto("/login");
                return;
            }

            console.log("🔍 Tentativo di recupero ricette utente...");

            // PROVA 1: Prova prima /myrecipes (originale)
            let response;
            let endpoint = "http://localhost:3000/forked/myrecipes";

            try {
                console.log(`📡 Chiamando: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                console.log(
                    `📨 Risposta /myrecipes - Status: ${response.status}`,
                );
            } catch (err) {
                console.log("❌ /myrecipes fallito, provo /recipes");

                // PROVA 2: Se /myrecipes fallisce, prova /recipes
                endpoint = "http://localhost:3000/forked/recipes";
                console.log(`📡 Chiamando: ${endpoint}`);

                response = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                console.log(
                    `📨 Risposta /recipes - Status: ${response.status}`,
                );
            }

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("authToken");
                    isLoggedIn.set(false);
                    goto("/login");
                    return;
                }

                // Prova a leggere l'errore dal server
                let errorMsg = `Errore ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}

                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log("✅ Ricette ricevute:", data);
            console.log(
                "📊 Numero ricette:",
                Array.isArray(data) ? data.length : "Non è un array",
            );

            // Assicurati che data sia un array
            recipes = Array.isArray(data) ? data : [];
        } catch (err) {
            error = err instanceof Error ? err.message : "Errore sconosciuto";
            console.error("💥 Errore completo:", err);
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

    // E aggiungi questa funzione helper nel tuo script:
    function getInstructionsPreview(instructions) {
        // Se instructions è un array, uniscilo in una stringa
        const instructionsText = Array.isArray(instructions)
            ? instructions.join(" ")
            : instructions || "";

        // Tronca a 120 caratteri
        return instructionsText.length > 120
            ? instructionsText.substring(0, 120) + "..."
            : instructionsText;
    }

    onMount(() => {
        // Verifica se l'utente è loggato
        if (!get(isLoggedIn)) {
            goto("/login");
            return;
        }

        fetchMyRecipes();
    });
</script>

<svelte:head>
    <title>Le Mie Ricette</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Le Mie Ricette
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
            Tutte le ricette che hai creato
        </p>
    </div>

    {#if loading}
        <div class="flex justify-center items-center min-h-64">
            <div class="text-center">
                <div role="status" class="inline-block">
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
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                    Caricamento ricette...
                </p>
            </div>
        </div>
    {:else if error}
        <div
            class="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
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
                    d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 0 1 3 0v4a1.5 1.5 0 0 1-3 0V4Zm0 10a1.5 1.5 0 0 1 3 0v.5a1.5 1.5 0 0 1-3 0V14Z"
                />
            </svg>
            <span class="font-medium">Errore!</span>
            {error}
        </div>
    {:else if recipes.length === 0}
        <div class="text-center py-12">
            <svg
                class="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nessuna ricetta trovata
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
                Non hai ancora creato nessuna ricetta. Inizia creando la tua
                prima ricetta!
            </p>
            <button
                type="button"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                onclick={() => goto("/recipes/create")}
            >
                Crea la tua prima ricetta
            </button>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each recipes as recipe}
                <div
                    class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                >
                    {#if recipe.imageUrl}
                        <img
                            class="rounded-t-lg h-48 w-full object-cover"
                            src={recipe.imageUrl}
                            alt={recipe.name}
                        />
                    {:else}
                        <div
                            class="rounded-t-lg h-48 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                        >
                            <svg
                                class="w-12 h-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    {/if}
                    <div class="p-5">
                        <h5
                            class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            {recipe.name}
                        </h5>

                        <div class="mb-3">
                            <h6
                                class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
                            >
                                Ingredienti:
                            </h6>
                            <ul
                                class="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside"
                            >
                                {#each recipe.ingredients.slice(0, 3) as ingredient}
                                    <li class="truncate">
                                        {ingredient.quantita} - {ingredient.nome}  
                                    </li>
                                {/each}
                                {#if recipe.ingredients.length > 3}
                                    <li
                                        class="text-gray-500 dark:text-gray-500"
                                    >
                                        ... e altri {recipe.ingredients.length -
                                            3} ingredienti
                                    </li>
                                {/if}
                            </ul>
                        </div>

                        <div class="mb-3">
                            <p
                                class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
                            >
                                {getInstructionsPreview(recipe.instructions)}
                            </p>
                        </div>

                        <div
                            class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4"
                        >
                            <span>Creata: {formatDate(recipe.createdAt)}</span>
                            {#if recipe.updatedAt !== recipe.createdAt}
                                <span
                                    >Modificata: {formatDate(
                                        recipe.updatedAt,
                                    )}</span
                                >
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Statistiche -->
        <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Le tue statistiche
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <span
                        class="block text-2xl font-bold text-blue-600 dark:text-blue-400"
                    >
                        {recipes.length}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Ricette totali
                    </span>
                </div>
                <div>
                    <span
                        class="block text-2xl font-bold text-green-600 dark:text-green-400"
                    >
                        {recipes.filter((r) => r.imageUrl).length}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Con immagine
                    </span>
                </div>
                <div>
                    <span
                        class="block text-2xl font-bold text-purple-600 dark:text-purple-400"
                    >
                        {Math.round(
                            recipes.reduce(
                                (acc, r) => acc + r.ingredients.length,
                                0,
                            ) / recipes.length,
                        ) || 0}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Ingredienti medi
                    </span>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Bottone floating per aggiungere nuova ricetta -->
<button
    type="button"
    class="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
    onclick={() => goto("/add-recipe")}
    title="Aggiungi nuova ricetta"
>
    <svg
        class="w-6 h-6 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
        />
    </svg>
</button>
