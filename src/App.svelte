<script lang="ts">
  export let name = 'world';
</script>

<h1>hello {name}!</h1>
<button on:click={() => { name = Math.random().toString(); }}>Randomize</button>
