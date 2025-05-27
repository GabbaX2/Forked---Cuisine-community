<script lang="ts">
    import {
        Button,
        Card,
        Carousel,
        Spinner,
        Badge,
        Input,
        Heading,
        P,
        Avatar,
        Rating,
    } from "flowbite-svelte";
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    interface Recipe {
        _id: string;
        name: string;
        ingredients: Array<{
            nome: string;
            quantita: number;
            unita: string;
        }>;
        instructions: string[];
        imageUrl?: string;
        createdAt: string;
        updatedAt: string;
        creatore: {
            _id: string;
            name: string;
        };
    }

    interface ApiResponse {
        message: string;
        docs: string;
    }

    let recipes: Recipe[] = [];
    let featuredRecipes: Recipe[] = [];
    let isLoading = true;
    let error: string | null = null;
    let searchQuery = "";
    let currentSlide = 0;

    const quotes = [
        "Cucinare è un atto d'amore verso se stessi e gli altri",
        "Il segreto del successo? Burro. Molto burro.",
        "La cucina è il cuore della casa",
        "Ogni ricetta racconta una storia",
    ];

    let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const categories = [
        { name: "Antipasti", icon: "🥗", count: 0, color: "green" },
        { name: "Primi Piatti", icon: "🍝", count: 0, color: "yellow" },
        { name: "Secondi", icon: "🥩", count: 0, color: "red" },
        { name: "Dolci", icon: "🍰", count: 0, color: "pink" },
        { name: "Contorni", icon: "🥕", count: 0, color: "orange" },
        { name: "Bevande", icon: "🥤", count: 0, color: "blue" },
    ];

    const heroImages = [
        "https://www.dissapore.com/wp-content/uploads/2016/12/L-PICCIONE-VIAGGIATORE-da-vittorio-cerea.jpg",
        "https://wips.plug.it/cips/buonissimo.org/cms/2024/09/primi-piatti-stellati-buonissimo.jpg",
        "https://romaeternalcity.com/assets/w=1500&h=740&fit=fill&f=center___images.ctfassets.net_7dc7gq8ix1ml_4xvJc1qvEGVDDJl686YkO6_3cadc2a93cae5a871bef5d92b3102ac5_Marco_Martini_Restaurant_2.jpg",
    ];

    // Fetch ricette dal backend
    async function loadRecipes() {
        try {
            isLoading = true;

            // Prima verifichiamo che l'API sia online
            const healthCheck = await fetch("http://localhost:3000/");
            if (!healthCheck.ok) {
                throw new Error("Server non disponibile");
            }

            // Poi carichiamo le ricette
            const recipesResponse = await fetch(
                "http://localhost:3000/forked/recipes",
            );
            if (!recipesResponse.ok) {
                throw new Error(
                    `HTTP error! status: ${recipesResponse.status}`,
                );
            }

            const recipesData: Recipe[] = await recipesResponse.json();
            recipes = recipesData;

            // Seleziona le ricette in evidenza (le più recenti)
            featuredRecipes = recipesData
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                )
                .slice(0, 6);
        } catch (err) {
            console.error("Errore nel caricamento:", err);
            error =
                err instanceof Error
                    ? err.message
                    : "Errore sconosciuto nel caricamento delle ricette";
        } finally {
            isLoading = false;
        }
    }

    function handleSearch() {
        if (searchQuery.trim()) {
            goto(`/ricette?search=${encodeURIComponent(searchQuery)}`);
        }
    }

    function getRecipeImage(recipe: Recipe): string {
        return (
            recipe.imageUrl ||
            `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`
        );
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function getPreparationTime(): string {
        return `${Math.floor(Math.random() * 60) + 15} min`;
    }

    function getDifficulty(): number {
        return Math.floor(Math.random() * 3) + 1;
    }

    onMount(() => {
        loadRecipes();

        // Auto-slide per l'hero carousel
        const interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % heroImages.length;
        }, 5000);

        return () => clearInterval(interval);
    });
</script>

<svelte:head>
    <title>Forked - Le tue ricette preferite</title>
    <meta
        name="description"
        content="Scopri, condividi e organizza le tue ricette preferite su Forked - la community italiana della cucina"
    />
</svelte:head>

<!-- Hero Section -->
<section class="relative h-96 lg:h-[500px] overflow-hidden">
    <!-- Sfondo più scuro per migliorare il contrasto -->
    <div
        class="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50 z-10"
    ></div>

    {#each heroImages as image, index}
        <div
            class="absolute inset-0 transition-opacity duration-1000 {index ===
            currentSlide
                ? 'opacity-100'
                : 'opacity-0'}"
            style="background-image: url('{image}'); background-size: cover; background-position: center;"
        ></div>
    {/each}

    <div
        class="relative z-20 h-full flex items-center justify-center text-center px-4"
    >
        <div class="max-w-4xl mx-auto text-white">
            <Heading
                tag="h1"
                class="text-4xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg"
            >
                Benvenuto su <span class="text-amber-300">Forked</span>
            </Heading>
            <P
                class="text-xl lg:text-2xl mb-8 text-gray-100 italic drop-shadow-md"
            >
                "{randomQuote}"
            </P>
            <div
                class="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
            >
                <Input
                    bind:value={searchQuery}
                    placeholder="Cerca una ricetta..."
                    class="flex-1 bg-white/90 text-gray-800 placeholder-gray-500"
                    onkeypress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                    color="yellow"
                    onclick={handleSearch}
                    class="w-full sm:w-auto shadow-md hover:shadow-lg"
                >
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                    </svg>
                    Cerca
                </Button>
            </div>
        </div>
    </div>
</section>

<!-- Stats Section -->
<section class="py-12 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
                <div class="text-3xl font-bold text-amber-600">
                    {recipes.length}
                </div>
                <div class="text-gray-600">Ricette</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-amber-600">
                    {new Set(recipes.map((r) => r.creatore._id)).size}
                </div>
                <div class="text-gray-600">Chef</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-amber-600">
                    {categories.reduce((sum, cat) => sum + cat.count, 0) ||
                        recipes.length}
                </div>
                <div class="text-gray-600">Ingredienti</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-amber-600">⭐⭐⭐⭐⭐</div>
                <div class="text-gray-600">Qualità</div>
            </div>
        </div>
    </div>
</section>

<!-- Categories Section -->
<section class="py-16 px-4 max-w-6xl mx-auto">
    <div class="text-center mb-12">
        <Heading tag="h2" class="text-3xl font-bold mb-4"
            >Esplora per Categoria</Heading
        >
        <P class="text-gray-600 text-lg text-center mb-4"
            >Trova la ricetta perfetta per ogni occasione</P
        >
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {#each categories as category}
            <Card
                class="text-center hover:shadow-lg transition-shadow cursor-pointer group"
            >
                <div
                    class="text-4xl mb-3 group-hover:scale-110 transition-transform"
                >
                    {category.icon}
                </div>
                <Heading tag="h3" class="text-lg font-semibold mb-2"
                    >{category.name}</Heading
                >
                <Badge color={category.color}
                    >{category.count || Math.floor(Math.random() * 15) + 1} ricette</Badge
                >
            </Card>
        {/each}
    </div>
</section>

<!-- Featured Recipes Section -->
<section class="py-16 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-12">
            <Heading tag="h2" class="text-3xl font-bold mb-4 mt-6"
                >Ricette in Evidenza</Heading
            >
            <P class="text-gray-600 text-lg text-center mb-10"
                >Le creazioni più amate dalla nostra community</P
            >
        </div>

        {#if isLoading}
            <div class="flex justify-center py-12">
                <Spinner size="8" color="yellow" />
                <span class="ml-3 text-gray-600">Caricamento ricette...</span>
            </div>
        {:else if error}
            <div class="text-center py-12">
                <div class="text-red-600 mb-4">⚠️ {error}</div>
                <Button color="yellow" onclick={loadRecipes}>Riprova</Button>
            </div>
        {:else if featuredRecipes.length === 0}
            <div class="text-center py-12">
                <div class="text-gray-600 mb-4">
                    Nessuna ricetta disponibile al momento
                </div>
                <Button color="yellow" href="/add-recipe">
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                        ></path>
                    </svg>
                    Aggiungi la prima ricetta
                </Button>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each featuredRecipes as recipe}
                    <Card
                        class="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        <a
                            href="/ricette/{encodeURIComponent(recipe.name)}"
                            class="block"
                        >
                            <div class="relative h-48 overflow-hidden">
                                <img
                                    src={getRecipeImage(recipe)}
                                    alt={recipe.name}
                                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div class="absolute top-4 right-4">
                                    <Badge
                                        color="yellow"
                                        class="bg-white/90 text-gray-800"
                                    >
                                        <svg
                                            class="w-3 h-3 mr-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                            ></path>
                                        </svg>
                                        {(Math.random() * 2 + 3).toFixed(1)}
                                    </Badge>
                                </div>
                                <div class="absolute bottom-4 left-4">
                                    <div
                                        class="flex items-center space-x-4 text-white text-sm"
                                    >
                                        <div
                                            class="flex items-center bg-black/50 rounded-full px-2 py-1"
                                        >
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
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                ></path>
                                            </svg>
                                            {getPreparationTime()}
                                        </div>
                                        <div
                                            class="flex items-center bg-black/50 rounded-full px-2 py-1"
                                        >
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
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                ></path>
                                            </svg>
                                            4-6 persone
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-6">
                                <Heading
                                    tag="h3"
                                    class="text-xl font-bold mb-3 group-hover:text-amber-600 transition-colors line-clamp-2"
                                >
                                    {recipe.name}
                                </Heading>

                                <div class="flex items-center mb-4">
                                    <Avatar size="sm" class="mr-3" />
                                    <div>
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {recipe.creatore.name}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {formatDate(recipe.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <Rating
                                            rating={getDifficulty()}
                                            max={3}
                                            size="16"
                                        >
                                            <svelte:fragment
                                                slot="item"
                                                let:item
                                                let:index
                                            >
                                                <svg
                                                    class="w-4 h-4 text-amber-400 fill-current"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                    />
                                                </svg>
                                            </svelte:fragment>
                                        </Rating>
                                        <span
                                            class="text-sm text-gray-500 ml-2"
                                        >
                                            {getDifficulty() === 1
                                                ? "Facile"
                                                : getDifficulty() === 2
                                                  ? "Medio"
                                                  : "Difficile"}
                                        </span>
                                    </div>
                                    <Badge color="green" class="text-xs">
                                        {recipe.ingredients.length} ingredienti
                                    </Badge>
                                </div>
                            </div>
                        </a>
                    </Card>
                {/each}
            </div>

            <div class="text-center mt-10">
                <Button size="lg" color="yellow" href="/recipes">
                    Vedi tutte le ricette
                    <svg
                        class="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                        ></path>
                    </svg>
                </Button>
            </div>
        {/if}
    </div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-gradient-to-r from-amber-500 to-orange-500">
    <div class="max-w-4xl mx-auto text-center px-4">
        <Heading tag="h2" class="text-3xl font-bold text-black mb-6 mt-10">
            Pronto a condividere le tue ricette?
        </Heading>
        <P class="text-xl text-amber-100 mb-8">
            Unisciti alla community di Forked e condividi le tue creazioni
            culinarie con migliaia di appassionati
        </P>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" color="light" href="/register">
                <svg
                    class="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                </svg>
                Registrati Gratis
            </Button>
            <Button size="lg" outline color="light" href="/add-recipe">
                <svg
                    class="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    ></path>
                </svg>
                Aggiungi Ricetta
            </Button>
        </div>
    </div>
</section>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
