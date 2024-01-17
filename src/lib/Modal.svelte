<svelte:options immutable={true} />

<script lang="ts">
	import { fade } from 'svelte/transition';

	export let closeable = false;
</script>

<div in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} id="modal-container">
	<svelte:element this={closeable ? 'a' : 'div'} href="?" id="modal-bg">
		<svg width="100%" height="100%">
			<filter id="pedroduarteisalegend">
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.80"
					numOctaves="4"
					stitchTiles="stitch"
				/>
			</filter>
			<rect width="100%" height="100%" filter="url(#pedroduarteisalegend)" />
		</svg>
	</svelte:element>
	<div id="modal" class="surface">
		<slot />
	</div>
</div>

>

<style>
	svg {
		opacity: 0.25;
		mix-blend-mode: soft-light;
		isolation: isolate;
		position: absolute;
		inset: 0;
	}
	#modal-container {
		display: grid;
		position: fixed;
		inset: 0;
		z-index: 9999;

		grid-template: 'container';
		place-items: stretch;
		place-content: center;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	#modal-bg {
		background: hsla(var(--color-bg-components), 0.6);
		backdrop-filter: blur(4px);
		position: absolute;
		inset: 0;
	}

	#modal {
		z-index: 1;
		place-self: center;
		grid-area: container;
		border-radius: 16px;
		padding: 16px;
		width: var(--card-width);
	}
</style>
