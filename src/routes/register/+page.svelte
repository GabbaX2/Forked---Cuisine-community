<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	interface RegisterResponse {
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

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;

	const API_BASE_URL = 'http://localhost:3000';

	async function handleSubmit() {
		// Reset error state
		error = '';
		
		// Validation
		if (!name.trim()) {
			error = 'Il nome è obbligatorio';
			return;
		}
		
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
		
		if (password.length < 6) {
			error = 'La password deve essere di almeno 6 caratteri';
			return;
		}
		
		if (password !== confirmPassword) {
			error = 'Le password non coincidono';
			return;
		}

		loading = true;

		try {
			const response = await fetch(`${API_BASE_URL}/forked/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim().toLowerCase(),
					password
				})
			});

			const data = await response.json();

			if (!response.ok) {
				const errorData = data as ErrorResponse;
				error = errorData.message || 'Errore durante la registrazione';
				return;
			}

			const registerData = data as RegisterResponse;
			
			// Salva il token nel localStorage (opzionale)
			if (typeof window !== 'undefined') {
				localStorage.setItem('authToken', registerData.token);
				localStorage.setItem('user', JSON.stringify(registerData.user));
			}
			
			success = true;
			
			// Redirect dopo 2 secondi o vai a una pagina di dashboard
			setTimeout(() => {
				goto('/login'); // Cambia con la tua rotta desiderata
			}, 2000);

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
		}
	});
</script>

<svelte:head>
	<title>Registrazione</title>
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
			Crea il tuo account
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Oppure
			<a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
				Accedi al tuo account esistente
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
								Registrazione completata!
							</h3>
							<div class="mt-2 text-sm text-green-700">
								<p>Account creato con successo. Verrai reindirizzato...</p>
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
					<label for="name" class="block text-sm font-medium text-gray-700">
						Nome completo
					</label>
					<div class="mt-1">
						<input
							id="name"
							name="name"
							type="text"
							bind:value={name}
							required
							disabled={loading}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Inserisci il tuo nome completo"
						/>
					</div>
				</div>

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
							autocomplete="new-password"
							bind:value={password}
							required
							disabled={loading}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Crea una password sicura"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						Almeno 6 caratteri
					</p>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
						Conferma password
					</label>
					<div class="mt-1">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autocomplete="new-password"
							bind:value={confirmPassword}
							required
							disabled={loading}
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Ripeti la password"
						/>
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
							Registrazione in corso...
						{:else}
							Registrati
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
						<span class="px-2 bg-white text-gray-500">Hai già un account?</span>
					</div>
				</div>

				<div class="mt-6">
					<a
						href="/login"
						class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
					>
						Accedi qui
					</a>
				</div>
			</div>
		</div>
	</div>
</div>