<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import { isLoggedIn } from "$lib/stores/auth";

    interface Recipe {
        name: string;
        ingredients: string;
        instructions: string;
        imageUrl?: string;
    }

    let recipe: Recipe = {
        name: "",
        ingredients: "",
        instructions: "",
        imageUrl: "",
    };

    let isLoading = false;
    let error = "";
    let success = false;
    let debugInfo = ""; // Aggiungiamo info di debug

    onMount(() => {
        if (browser && !$isLoggedIn) {
            goto("/login");
        }
    });

    // Funzione helper per il timeout
    function fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeout = 10000,
    ): Promise<Response> {
        return Promise.race([
            fetch(url, options),
            new Promise<Response>((_, reject) =>
                setTimeout(() => reject(new Error("Request timeout")), timeout),
            ),
        ]);
    }

    // Funzione submitRecipe aggiornata (nel tuo componente Svelte)

    async function submitRecipe() {
        console.log("=== INIZIO SUBMIT RECIPE ===");

        // Reset stati
        isLoading = true;
        error = "";
        success = false;
        debugInfo = "Inizio invio ricetta...\n";

        try {
            // Validazione
            if (
                !recipe.name.trim() ||
                !recipe.ingredients.trim() ||
                !recipe.instructions.trim()
            ) {
                throw new Error(
                    "Tutti i campi obbligatori devono essere compilati",
                );
            }

            debugInfo += "✓ Validazione completata\n";

            // Controlla token
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("Token di autenticazione mancante");
            }

            debugInfo += "✓ Token trovato\n";

            // Prepara payload (semplificato - il backend gestisce il creatore automaticamente)
            const payload = {
                name: recipe.name.trim(),
                ingredients: recipe.ingredients
                    .trim()
                    .split("\n")
                    .filter((i) => i.trim())
                    .map((ingredient) => {
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
                    }),
                instructions: recipe.instructions.trim().split("\n"),
                imageUrl: recipe.imageUrl?.trim() || null,
                // Rimosso createdBy - viene gestito automaticamente dal backend
            };

            debugInfo += `✓ Payload preparato: ${JSON.stringify(payload, null, 2)}\n`;

            const url = "http://localhost:3000/forked/recipes";
            debugInfo += `📡 Invio richiesta a: ${url}\n`;

            console.log("Sending request to:", url);
            console.log("Payload:", payload);

            const response = await fetchWithTimeout(
                url,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                },
                15000,
            );

            debugInfo += `📨 Risposta ricevuta - Status: ${response.status}\n`;
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = {
                        message: `HTTP ${response.status}: ${response.statusText}`,
                    };
                }

                debugInfo += `❌ Errore risposta: ${JSON.stringify(errorData)}\n`;
                console.log("Error data:", errorData);

                if (response.status === 404) {
                    throw new Error(
                        "Endpoint non trovato. Verifica che il server sia avviato e l'URL sia corretto.",
                    );
                } else if (response.status === 401) {
                    throw new Error(
                        "Token di autenticazione non valido. Effettua nuovamente il login.",
                    );
                } else if (response.status === 403) {
                    throw new Error("Non hai i permessi per creare ricette.");
                } else {
                    throw new Error(
                        errorData.message ||
                            `Errore ${response.status}: ${response.statusText}`,
                    );
                }
            }

            const responseData = await response.json();
            debugInfo += `✅ Successo: ${JSON.stringify(responseData)}\n`;
            console.log("Success response:", responseData);

            success = true;
            recipe = {
                name: "",
                ingredients: "",
                instructions: "",
                imageUrl: "",
            };

            setTimeout(() => goto("/recipes"), 2000);
        } catch (err) {
            debugInfo += `💥 ERRORE CATTURATO: ${err.message}\n`;
            debugInfo += `Stack trace: ${err.stack || "N/A"}\n`;

            console.error("Errore completo:", err);
            error = err.message || "Errore di connessione";

            if (err.message === "Request timeout") {
                error =
                    "Timeout: Il server non ha risposto entro 15 secondi. Verifica che sia in esecuzione.";
            }
        } finally {
            isLoading = false;
            debugInfo += "🏁 Fine elaborazione - isLoading impostato a false\n";
            console.log("=== FINE SUBMIT RECIPE ===");
            console.log("Final isLoading state:", isLoading);
        }
    }

    // Funzione per testare la connessione al server
    async function testConnection() {
        debugInfo = "Test connessione in corso...\n";

        // Test 1: Server base
        try {
            const response = await fetchWithTimeout(
                "http://localhost:3000",
                {},
                5000,
            );
            debugInfo += `✅ Server base raggiungibile - Status: ${response.status}\n`;
        } catch (err: any) {
            debugInfo += `❌ Server base NON raggiungibile: ${err.message}\n`;
        }

        // Test 2: Endpoint specifico GET
        try {
            const response = await fetchWithTimeout(
                "http://localhost:3000/forked/recipes",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
                5000,
            );
            debugInfo += `✅ Endpoint GET /forked/recipes raggiungibile - Status: ${response.status}\n`;
        } catch (err: any) {
            debugInfo += `❌ Endpoint GET /forked/recipes NON raggiungibile: ${err.message}\n`;
        }

        // Test 3: Test POST con payload vuoto
        const token = localStorage.getItem("authToken");
        if (token) {
            try {
                const testPayload = {
                    name: "Test Recipe",
                    ingredients: ["test ingredient"],
                    instructions: "test instructions",
                    imageUrl: null,
                };

                debugInfo += `📡 Testando POST con payload: ${JSON.stringify(testPayload)}\n`;

                const response = await fetchWithTimeout(
                    "http://localhost:3000/forked/recipes",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(testPayload),
                    },
                    8000,
                );

                debugInfo += `✅ POST funziona! Status: ${response.status}\n`;

                const responseText = await response.text();
                debugInfo += `Risposta: ${responseText.substring(0, 200)}\n`;
            } catch (err: any) {
                debugInfo += `❌ POST fallito: ${err.message}\n`;
                if (err.message === "Request timeout") {
                    debugInfo += `🚨 Il POST va in timeout - problema nel server backend!\n`;
                }
            }
        } else {
            debugInfo += `⚠️ Nessun token di autenticazione trovato\n`;
        }
    }
</script>

<svelte:head>
    <title>Aggiungi Ricetta</title>
</svelte:head>

{#if $isLoggedIn}
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-2xl mx-auto px-4">
            <!-- Debug Panel (rimuovi in produzione) -->
            {#if debugInfo}
                <div
                    class="bg-gray-100 border border-gray-300 rounded p-4 mb-4"
                >
                    <h3 class="font-bold mb-2">Debug Info:</h3>
                    <pre class="text-xs whitespace-pre-wrap">{debugInfo}</pre>
                    <button
                        type="button"
                        on:click={testConnection}
                        class="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm"
                    >
                        Test Connessione Server
                    </button>
                </div>
            {/if}

            <div class="bg-white shadow-lg rounded-lg p-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">
                    Aggiungi Nuova Ricetta
                </h1>

                {#if success}
                    <div
                        class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"
                    >
                        Ricetta creata con successo! Reindirizzamento in
                        corso...
                    </div>
                {/if}

                {#if error}
                    <div
                        class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
                    >
                        {error}
                    </div>
                {/if}

                <!-- Loading indicator migliorato -->
                {#if isLoading}
                    <div
                        class="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded"
                    >
                        <div class="flex items-center">
                            <svg
                                class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                            Invio in corso... (Loading: {isLoading})
                        </div>
                    </div>
                {/if}

                <form on:submit|preventDefault={submitRecipe} class="space-y-6">
                    <div>
                        <label
                            for="name"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Nome Ricetta *
                        </label>
                        <input
                            type="text"
                            id="name"
                            bind:value={recipe.name}
                            disabled={isLoading}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Inserisci il nome della ricetta"
                            required
                        />
                    </div>

                    <div>
                        <label
                            for="ingredients"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Ingredienti *
                        </label>
                        <textarea
                            id="ingredients"
                            bind:value={recipe.ingredients}
                            disabled={isLoading}
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Elenca gli ingredienti necessari (uno per riga)"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label
                            for="instructions"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Istruzioni *
                        </label>
                        <textarea
                            id="instructions"
                            bind:value={recipe.instructions}
                            disabled={isLoading}
                            rows="6"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="Descrivi i passaggi per preparare la ricetta"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label
                            for="imageUrl"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            URL Immagine (opzionale)
                        </label>
                        <input
                            type="url"
                            id="imageUrl"
                            bind:value={recipe.imageUrl}
                            disabled={isLoading}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            placeholder="https://esempio.com/immagine.jpg"
                        />
                    </div>

                    <div class="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                        >
                            {#if isLoading}
                                <svg
                                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                                Creazione...
                            {:else}
                                Crea Ricetta
                            {/if}
                        </button>

                        <button
                            type="button"
                            on:click={() => goto("/recipes")}
                            disabled={isLoading}
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 transition duration-200"
                        >
                            Annulla
                        </button>
                    </div>
                </form>

                <p class="text-sm text-gray-500 mt-4">
                    I campi contrassegnati con * sono obbligatori
                </p>
            </div>
        </div>
    </div>
{:else}
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Verifica autenticazione...</p>
        </div>
    </div>
{/if}
