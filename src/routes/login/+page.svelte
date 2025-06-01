<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isLoggedIn } from '$lib/stores/auth';
	
	interface LoginResponse {
		token: string;
		user: {
			id: string;
			name: string;
			email: string;
		};
	}

	interface ErrorResponse {
		message: string;
	}

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let success = false;
	let rememberMe = false;

	const API_BASE_URL = 'https://forked-backend-x4tb.onrender.com';

	async function handleSubmit() {
		// Reset error state
		error = '';
		
		// Validation
		if (!email.trim()) {
			error = 'L\'email è obbligatoria';
			return;
		}
		
		if (!email.includes('@')) {
			error = 'Inserisci un\'email valida';
			return;
		}
		
		if (!password) {
			error = 'La password è obbligatoria';
			return;
		}

		loading = true;

		try {
			const response = await fetch(`${API_BASE_URL}/forked/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					password
				})
			});

			const data = await response.json();

			if (!response.ok) {
				const errorData = data as ErrorResponse;
				error = errorData.message || 'Errore durante l\'accesso';
				return;
			}

			const loginData = data as LoginResponse;
			
			// Salva il token nel localStorage
			if (typeof window !== 'undefined') {
				localStorage.setItem('authToken', loginData.token);
				localStorage.setItem('user', JSON.stringify(loginData.user));
				
				// Se "Ricordami" è selezionato, salva anche l'email
				if (rememberMe) {
					localStorage.setItem('rememberedEmail', email.trim().toLowerCase());
				} else {
					localStorage.removeItem('rememberedEmail');
				}
			}
			
			// Aggiorna lo stato di login globale
			isLoggedIn.set(true);
			
			success = true;
			
			// Redirect dopo 1 secondo alla dashboard o home
            setTimeout(() => {
                goto("/recipes"); 
            }, 1000);

		} catch (err) {
			console.error('Errore di rete:', err);
			error = 'Errore di connessione. Riprova più tardi.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Inizializza Flowbite quando il componente è montato
		if (typeof window !== 'undefined') {
			import('flowbite').then(({ initFlowbite }) => {
				initFlowbite();
			});
			
			// Carica l'email salvata se presente
			const rememberedEmail = localStorage.getItem('rememberedEmail');
			if (rememberedEmail) {
				email = rememberedEmail;
				rememberMe = true;
			}
		}
	});
</script>

<svelte:head>
	<title>Accedi</title>
	<link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.css" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-gray-50 justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="mx-auto h-12 w-auto flex justify-center">
			<div class="bg-blue-600 rounded-lg p-3">
				<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
		</div>
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			Accedi al tuo account
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Oppure
			<a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
				Crea un nuovo account
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if success}
				<div class="rounded-md bg-green-50 p-4 mb-6">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">
								Accesso riuscito!
							</h3>
							<div class="mt-2 text-sm text-green-700">
								<p>Benvenuto! Verrai reindirizzato...</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="rounded-md bg-red-50 p-4 mb-6">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">
								Errore
							</h3>
							<div class="mt-2 text-sm text-red-700">
								<p>{error}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Indirizzo email
					</label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							required
							disabled={loading}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Inserisci la tua email"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							required
							disabled={loading}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Inserisci la tua password"
						/>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							bind:checked={rememberMe}
							disabled={loading}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-900">
							Ricordami
						</label>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Accesso in corso...
						{:else}
							Accedi
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300" />
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">Non hai un account?</span>
					</div>
				</div>

				<div class="mt-6">
					<a
						href="/register"
						class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
					>
						Registrati qui
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
