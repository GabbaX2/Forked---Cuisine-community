<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Dropdown, Avatar } from "flowbite-svelte";
  import { isLoggedIn } from "$lib/stores/auth";
  import { onMount } from "svelte";

  onMount(() => {
    const mobileMenuButton = document.querySelector(
      '[data-collapse-toggle="mobile-menu"]',
    );
    const mobileMenu = document.getElementById("mobile-menu");

    mobileMenuButton?.addEventListener("click", () => {
      mobileMenu?.classList.toggle("hidden");
    });
  });
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Navbar -->
  <nav
    class="bg-white border-b border-gray-200 px-4 py-3 dark:bg-gray-800 dark:border-gray-700"
  >
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
      <!-- Logo e link principali -->
      <div class="flex items-center space-x-4">
        <a href="/" class="flex items-center">
          <span class="text-2xl font-bold text-amber-600 dark:text-amber-400"
            >Forked</span
          >
        </a>

        <!-- Link desktop -->
        <div class="hidden md:flex space-x-1">
          <Button
            href="/"
            color="transparent"
            class={`px-3 ${$page.url.pathname === "/" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
          >
            Home
          </Button>
          <Button
            href="/recipes"
            color="transparent"
            class={`px-3 ${$page.url.pathname === "/recipes" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
          >
            Visualizza Ricette
          </Button>
          {#if $isLoggedIn}
            <Button
              href="/add-recipe"
              color="transparent"
              class={`px-3 ${$page.url.pathname === "/add-recipe" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
            >
              Aggiungi Ricetta
            </Button>
            <Button
              href="/profile"
              color="transparent"
              class={`px-3 ${$page.url.pathname === "/profile" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
            >
              Profilo
            </Button>
            <Button
              href="/logout"
              color="transparent"
              class={`px-3 ${$page.url.pathname === "/logout" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
            >
              Logout
            </Button>
            <Button
              href="/my-recipes"
              color="transparent"
              class={`px-3 ${$page.url.pathname === "/my-recipes" ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
            >
              Le mie ricette
            </Button>
          {/if}
        </div>
      </div>

      <!-- Pulsanti autenticazione/profilo -->
      <div class="flex items-center space-x-3">
        {#if !$isLoggedIn}
          <Button href="/login" color="alternative" class="hidden md:block">
            Accedi
          </Button>
          <Button href="/register" color="dark" class="hidden md:block">
            Registrati
          </Button>
        {:else}
          <Dropdown>
            <Button slot="trigger" color="transparent" class="p-1">
              <Avatar
                src="/user-placeholder.jpg"
                alt="User menu"
                size="sm"
                rounded
              />
              <span class="ml-2 hidden md:inline">Profilo</span>
            </Button>
            <Dropdown.Item href="/profile">Il mio profilo</Dropdown.Item>
            <Dropdown.Item href="/my-recipes">Le mie ricette</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="/logout">Esci</Dropdown.Item>
          </Dropdown>
        {/if}

        <!-- Mobile menu button -->
        <Button
          data-collapse-toggle="mobile-menu"
          color="transparent"
          class="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="mobile-menu"
          aria-expanded="false"
        >
          <span class="sr-only">Apri menu</span>
          <svg
            class="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </Button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div class="hidden md:hidden" id="mobile-menu">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <a
          href="/"
          class={`block px-3 py-2 rounded-md text-base font-medium ${$page.url.pathname === "/" ? "bg-amber-50 text-amber-600" : "text-gray-700 hover:bg-gray-50"}`}
        >
          Home
        </a>
        <a
          href="/recipes"
          class={`block px-3 py-2 rounded-md text-base font-medium ${$page.url.pathname === "/recipes" ? "bg-amber-50 text-amber-600" : "text-gray-700 hover:bg-gray-50"}`}
        >
          Visualizza Ricette
        </a>
        {#if $isLoggedIn}
          <a
            href="/add-recipe"
            class={`block px-3 py-2 rounded-md text-base font-medium ${$page.url.pathname === "/add-recipe" ? "bg-amber-50 text-amber-600" : "text-gray-700 hover:bg-gray-50"}`}
          >
            Aggiungi Ricetta
          </a>
        {/if}
      </div>
      <div class="pt-4 pb-3 border-t border-gray-200">
        {#if !$isLoggedIn}
          <div class="mt-3 space-y-1">
            <a
              href="/login"
              class="block w-full px-4 py-2 text-base font-medium text-center text-gray-700 hover:bg-gray-50"
            >
              Accedi
            </a>
            <a
              href="/register"
              class="block w-full px-4 py-2 text-base font-medium text-center text-white bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              Registrati
            </a>
          </div>
        {:else}
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <Avatar
                src="/user-placeholder.jpg"
                alt="User"
                size="sm"
                rounded
              />
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800 dark:text-white">
                Nome Utente
              </div>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <a
              href="/profile"
              class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Il tuo profilo
            </a>
            <a
              href="/logout"
              class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Esci
            </a>
          </div>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Contenuto principale -->
  <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <slot />
  </main>
</div>
