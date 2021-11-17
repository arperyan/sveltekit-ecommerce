<script lang="ts">
    import Product from "$lib/components/Product.svelte";
    import DisplayError from "$lib/components/ErrorMessage.svelte";

    export let allProduct;
    $: ({ data, error } = allProduct);
    $: console.log(error);
</script>

<svelte:head>
    <title>Sick Fits</title>
</svelte:head>

{#if error}
    <DisplayError error={error.message} />
{:else}
    <div class="product-list">
        {#each data?.allProducts as product}
            <Product {product} />
        {/each}
    </div>
{/if}

<style>
    .product-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 60px;
    }
</style>
