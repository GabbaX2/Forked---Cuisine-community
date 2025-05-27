import { writable } from 'svelte/store';

export const isLoggedIn = writable(false);

// Verifica all'avvio se l'utente è loggato
if (typeof window !== 'undefined') {
    isLoggedIn.set(!!localStorage.getItem('authToken'));
}
