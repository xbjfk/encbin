<script lang="ts">
	import { enhance } from '$app/forms';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { base64ToBytes } from '$lib/base64.js';
	import { deriveDecryptionKey } from '$lib/cryptoUtil.js';
	export let data;

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	let dataRequestPromise: Promise<Response> | undefined;

	let decryptionError: Error | undefined;
	let mergedArray: Uint8Array | null = null

	let recievedBytes = 0
	let isLoading = false
	let blob: Blob | undefined
	let bloburl: Url | undefined

	function downloadBlob() {
		const a = document.createElement('a');
		a.hidden = true;
		a.href = bloburl;
		a.download = data.fileName ?? 'Unknown Filename.txt';
		a.click();
		a.remove();
	}
</script>

<div id="container">
	<form
		id="file-info"
		class="surface"
		method="POST"
		use:enhance={async ({ formElement, formData, action, cancel, submitter }) => {
			if (dataRequestPromise) {
				cancel()
				return
			}

			if (blob) {
				downloadBlob()
				cancel()
				return
			}

			decryptionError = undefined
			isLoading = true

			const password = formData.get('password');

			try {
				const decKey = await deriveDecryptionKey(password, base64ToBytes(data.salt));
				const dataRequest = await dataRequestPromise;

				if (!mergedArray) {
					dataRequestPromise = fetch(`/fileraw/${data.id}`);
					let encryptedStream = (await dataRequestPromise).body

					mergedArray = new Uint8Array(data.size)
					const reader = encryptedStream.getReader()

					while (true) {
						const {done, value} = await reader.read()
						if (done) break
						mergedArray.set(value, recievedBytes)
						recievedBytes += value.length
					}
				}

				const decryptedData = await window.crypto.subtle.decrypt(
					{ name: 'AES-GCM', iv: base64ToBytes(data.iv) },
					decKey,
					mergedArray
				);
				blob = new Blob([decryptedData], { type: 'application/octet-stream' });
				bloburl = URL.createObjectURL(blob)
				downloadBlob()
			} catch (e) {
				if (e instanceof Error) decryptionError = e;
				else throw e;
			} finally {
				isLoading = false
				dataRequestPromise = undefined;
				cancel();
			}
		}}
	>
		<div id="file-header">
			<svg
				id="doc-icon"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-file-lock-2"
			>
				<path d="M4 5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H4" />
				<polyline points="14 2 14 8 20 8" /><rect width="8" height="5" x="2" y="13" rx="1" />
				<path d="M8 13v-2a2 2 0 1 0-4 0v2" />
			</svg>
			<div id="headder-text">
				<!-- TODO: prevent very long filenames breaking everything -->
				<h2 id="filename">{data.fileName ?? 'Unknown Filename'}</h2>
				<div id="filesize">{formatBytes(data.size)}</div>
			</div>
		</div>
		<div id="actions-bar">
			<button type="button">Share</button>
			<button type="button">Copy link</button>
		</div>
		<input placeholder="Decryption Key" name="password" type="password" />
		{#if decryptionError}
			<!-- TODO: style -->
			<div id="error-msg">
				An error occured<br />
				Please ensure you typed the decryption key correctly.<br />
				{decryptionError.message}
			</div>
		{/if}
		{#if isLoading}
			<ProgressBar progress={recievedBytes} total={data.size}/>
		{/if}

		<button class="colored icon-button" id="decrypt-button">
			<div>Decrypt & Download</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-unlock"
				><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path
					d="M7 11V7a5 5 0 0 1 9.9-1"
				/>
			</svg>
		</button>
	</form>
</div>

<style>
	#container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
	}

	#file-info {
		width: fit-content;
		padding: 28px 28px 20px 28px;
		border-radius: 16px;
		width: var(--card-width);
		display: flex;
		flex-direction: column;
		justify-items: stretch;
		gap: 16px;
	}

	#filename {
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	#doc-icon {
		flex-shrink: 0;
	}

	#file-header {
		display: flex;
		flex-direction: row;
		gap: 12px;
		margin-bottom: 8px;
	}

	#actions-bar {
		height: 36px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		flex-direction: row;
		justify-items: stretch;
		gap: 12px;
		visibility: hidden;
		display: none;
	}

	#decrypt-button {
		justify-content: center;
		height: 36px;
	}

	input {
		height: 36px;
	}
</style>
