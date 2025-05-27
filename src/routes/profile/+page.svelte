<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { isLoggedIn } from "$lib/stores/auth";
    import {
        Button,
        Input,
        Label,
        Alert,
        Spinner,
        Modal,
    } from "flowbite-svelte";

    interface User {
        _id: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt?: string;
    }

    let user: User | null = null;
    let loading = true;
    let error = "";

    const API_BASE = "http://localhost:3000";

    onMount(async () => {
        // Verifica se l'utente è loggato
        if (!$isLoggedIn) {
            goto("/login");
            return;
        }

        await fetchUserProfile();
    });

    async function fetchUserProfile() {
        try {
            loading = true;
            error = "";

            const token = localStorage.getItem("authToken");
            if (!token) {
                goto("/login");
                return;
            }

            const response = await fetch(`${API_BASE}/forked/users/profile`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token scaduto o non valido
                    localStorage.removeItem("authToken");
                    isLoggedIn.set(false);
                    goto("/login");
                    return;
                }
                throw new Error(
                    `Errore ${response.status}: ${response.statusText}`,
                );
            }

            user = await response.json();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Errore nel caricamento del profilo";
            console.error("Errore fetch profilo:", err);
        } finally {
            loading = false;
        }
    }

    function formatDate(dateString: string): string {
        try {
            return new Date(dateString).toLocaleDateString("it-IT", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    }
</script>

<svelte:head>
    <title>Il Mio Profilo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
                <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <svg
                        class="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Il Mio Profilo
                </h1>
            </div>
        </div>

        <!-- Messaggi di errore/successo -->
        {#if error}
            <Alert color="red" class="mb-4">
                <span class="font-medium">Errore!</span>
                {error}
            </Alert>
        {/if}

        <!-- Loading -->
        {#if loading}
            <div class="flex justify-center items-center py-12">
                <Spinner class="mr-3" size="6" />
                <span class="text-gray-600 dark:text-gray-400"
                    >Caricamento profilo...</span
                >
            </div>
        {:else if user}
            <!-- Visualizzazione profilo -->
            <div class="space-y-6">
                <div>
                    <Label
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                    >
                        Nome completo
                    </Label>
                    <div
                        class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                    >
                        <span class="text-gray-900 dark:text-white font-medium"
                            >{user.name}</span
                        >
                    </div>
                </div>

                <div>
                    <Label
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                    >
                        Indirizzo email
                    </Label>
                    <div
                        class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                    >
                        <span class="text-gray-900 dark:text-white"
                            >{user.email}</span
                        >
                    </div>
                </div>

                <div>
                    <Label
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                    >
                        Data registrazione
                    </Label>
                    <div
                        class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                    >
                        <span class="text-gray-600 dark:text-gray-400"
                            >{formatDate(user.createdAt)}</span
                        >
                    </div>
                </div>

                {#if user.updatedAt}
                    <div>
                        <Label
                            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                        >
                            Ultimo aggiornamento
                        </Label>
                        <div
                            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                        >
                            <span class="text-gray-600 dark:text-gray-400"
                                >{formatDate(user.updatedAt)}</span
                            >
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Errore nel caricamento -->
            <div class="text-center py-12">
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Impossibile caricare il profilo utente
                </p>
                <Button onclick={fetchUserProfile} color="blue">Riprova</Button>
            </div>
        {/if}
    </div>
</div>
