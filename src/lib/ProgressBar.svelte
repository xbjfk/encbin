<script lang="ts">
	export let progress: number | undefined = undefined;
	export let total: number | undefined = undefined;
	$: indeterminate = progress === undefined || total === undefined;
</script>

<!-- TODO: aria -->
<div id="progress">
	<div id="progress-inner" class:indeterminate style:width={`${(progress / total) * 100}%`} />
</div>

<style>
	#progress {
		overflow: hidden;
	}

	#progress-inner {
		height: 4px;
		border-radius: 4px;
		background: rgba(33, 180, 73, 1);
		background: linear-gradient(90deg, rgba(33, 180, 73, 1) 0%, rgba(14, 136, 49, 1) 100%);
		transform-origin: 0% 50%;
	}

	#progress-inner.indeterminate {
		animation: indeterminateAnimation 1.5s infinite linear;
		width: 20%;
	}

	@keyframes indeterminateAnimation {
		0% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(400%);
		}
		100% {
			transform: translateX(0);
		}
	}
</style>
