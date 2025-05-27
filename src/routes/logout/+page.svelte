<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let isLoggingOut = true;
    let showConfirmation = false;
    let user: { name: string; email: string } | null = null;

    // Funzione per effettuare il logout
    function performLogout() {
        if (browser) {
            // Rimuovi i dati dell'utente dal localStorage
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");

            // Pulisci eventuali altri dati di sessione
            sessionStorage.clear();

            // Opzionale: pulisci i cookies se ne usi
            document.cookie.split(";").forEach((c) => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie =
                    name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
        }

        isLoggingOut = false;

        // Redirect alla pagina di login dopo 2 secondi
        setTimeout(() => {
            goto("/login");
        }, 2000);
    }

    // Funzione per tornare indietro
    function goBack() {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
        } else {
            goto("/"); 
        }
    }

    onMount(() => {
        if (browser) {
            const token = localStorage.getItem("authToken");
            const userData = localStorage.getItem("user");

            if (!token) {
                goto("/login");
                return;
            }

            if (userData) {
                try {
                    user = JSON.parse(userData);
                } catch (error) {
                    console.error("Errore nel parsing dei dati utente:", error);
                }
            }

            showConfirmation = true;
            isLoggingOut = false;
        }

        if (browser) {
            import("flowbite").then(({ initFlowbite }) => {
                initFlowbite();
            });
        }
    });
</script>

<svelte:head>
    <title>Logout</title>
    <link
        href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.css"
        rel="stylesheet"
    />
</svelte:head>

<div
    class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
>
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {#if isLoggingOut}
                <!-- Stato di logout in corso -->
                <div class="text-center">
                    <div
                        class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
                    >
                        <svg
                            class="animate-spin h-8 w-8 text-blue-600"
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
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        Disconnessione in corso...
                    </h2>
                    <p class="text-gray-600">
                        Ti stiamo disconnettendo dal sistema.
                    </p>
                </div>
            {:else if showConfirmation}
                <!-- Conferma di logout -->
                <div class="text-center">
                    <div
                        class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
                    >
                        <svg
                            class="h-8 w-8 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </div>

                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        Conferma logout
                    </h2>

                    {#if user}
                        <p class="text-gray-600 mb-6">
                            Ciao <span class="font-semibold">{user.name}</span>,
                            sei sicuro di voler uscire dal tuo account?
                        </p>
                    {:else}
                        <p class="text-gray-600 mb-6">
                            Sei sicuro di voler uscire dal tuo account?
                        </p>
                    {/if}

                    <div class="space-y-3">
                        <button
                            on:click={performLogout}
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Sì, disconnettimi
                        </button>

                        <button
                            on:click={goBack}
                            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            {:else}
                <!-- Logout completato -->
                <div class="text-center">
                    <div
                        class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                    >
                        <svg
                            class="h-8 w-8 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        Logout completato
                    </h2>

                    <p class="text-gray-600 mb-6">
                        Sei stato disconnesso con successo. Verrai reindirizzato
                        alla pagina di login.
                    </p>

                    <div
                        class="bg-yellow-50 border border-yellow-200 rounded-md p-4"
                    >
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg
                                    class="h-5 w-5 text-yellow-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-yellow-800">
                                    Sessione terminata
                                </h3>
                                <div class="mt-2 text-sm text-yellow-700">
                                    <p>
                                        Per motivi di sicurezza, tutti i tuoi
                                        dati di sessione sono stati rimossi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6">
                        <a
                            href="/login"
                            class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Vai al login
                        </a>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

