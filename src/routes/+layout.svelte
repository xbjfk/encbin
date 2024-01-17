<script lang="ts">
	import '../style.css';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import Modal from '$lib/Modal.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	$: showLogin = $page.url.searchParams.has('login');
</script>

<slot />
{#if showLogin}
	<Modal closeable>
		<div style="display:flex; flex-direction: column;">
			<h1>Login.</h1>
			<div class="caption">
				Login is only used to authenticate extra features - it is never tied to your files.
			</div>
			<!--
			<div id="prgrs-cntnr">
				<ProgressBar />
			</div>
			-->
			<input id="login-pw" type="password" placeholder="Login Token" />
			<button id="login-btn" class="colored"> Login </button>
		</div>
	</Modal>
{/if}

<style>
	#login-pw {
		height: 36px;
	}
	.caption {
		margin-top: 4px;
		margin-bottom: 16px;
	}
	#prgrs-cntnr {
		margin-bottom: 8px;
	}
	#login-btn {
		margin-top: 8px;
		height: 32px;
		align-self: flex-end;
	}
</style>
