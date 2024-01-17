<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import Modal from '$lib/Modal.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { bytesToBase64 } from '$lib/base64';
	import { deriveKey, getPasswordKey, enc, deriveDecryptionKey } from '$lib/cryptoUtil';
	import ProgressTransformStream from '$lib/progresstransformstream';
	import type { ActionResult } from '@sveltejs/kit';

	let isHoveringFiles: boolean = false;
	function dragStart(e: DragEvent) {
		isHoveringFiles = true;
	}
	function dragStop() {
		isHoveringFiles = false;
	}
	function dropFile(e: DragEvent) {
		dragStop();
	}
	let hasText: boolean = false;
	function textInput(e: Event & { currentTarget: HTMLTextAreaElement }) {
		hasText = e.currentTarget.value.length >= 1;
	}

	let textContent: string;

	// TODO: check for web crypto
	// TODO: encrypting... animation
	// TODO: max size for file names
	// TODO: custom file name
	// TODO: error checking/ disabled button
	// TODO: disable text input when file is selected - pure CSS?

	let started = false;
	let progress: { loaded: number; total: number } | undefined = undefined;

	async function handleSubmit(event: { currentTarget: EventTarget & HTMLFormElement }) {
		started = true;
		const tgt = event.currentTarget;
		console.log(event.currentTarget);
		const formData = new FormData(event.currentTarget);

		const text = formData.get('text');
		let data;
		let fileName;
		let contentType;
		if (!text) {
			const file = formData.get('file');
			fileName = file.name;
			contentType = file.type;
			data = await file.arrayBuffer();
		} else {
			data = enc.encode(text);
		}

		const salt = window.crypto.getRandomValues(new Uint8Array(16));
		const iv = window.crypto.getRandomValues(new Uint8Array(12));
		// TODO: check for error here as well
		const password = formData.get('password');
		const aesKey = await deriveKey(await getPasswordKey(password), salt, ['encrypt']);
		const encryptedData = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv },
			aesKey,
			data
		);

		/*


		const response = await fetch(event.currentTarget.action, {
			method: 'POST',
			body: stream,
			headers: {
				'content-type': 'application/octet-stream'
			}
		});
		*/

		//formData.delete('password');
		//formData.delete('file');
		//formData.set('data', new Blob([encryptedData]));
		//formData.set('iv', new Blob([iv]));
		//formData.set('salt', new Blob([salt]));
		//formData.set('filename', filename);

		const xhr = new XMLHttpRequest();
		xhr.upload.addEventListener('progress', (e) => {
			progress = { loaded: e.loaded, total: e.total };
		});
		xhr.addEventListener('load', async () => {
			const data = JSON.parse(xhr.responseText);
			goto(`/file/${data.id}`);
		});
		xhr.open('POST', '/fileraw/new', true);
		xhr.setRequestHeader('X-EncBin-IV', bytesToBase64(iv));
		xhr.setRequestHeader('X-EncBin-Salt', bytesToBase64(salt));
		if (fileName) xhr.setRequestHeader('X-EncBin-FileName', fileName);
		if (contentType) xhr.setRequestHeader('X-EncBin-ContentType', contentType);
		xhr.setRequestHeader('content-type', 'application/octet-stream');
		xhr.send(encryptedData);
	}
</script>

<form
	id="wrapper"
	method="POST"
	enctype="multipart/form-data"
	on:submit|preventDefault={handleSubmit}
>
	<noscript>
		<div id="nojs-header">BIG RED WARNING</div>
		<div id="nojs-message">
			<!--
			You have JavaScript disabled - encryption will be done server side (less secure). Make sure
			you trust the server owner and your connection. You will also not have any form of a loading
			screen and dropping files will not work. -->
			This website requires JavaScript to function, as encryption is done fully client side.
		</div>
	</noscript>
	<div id="top-bar" class="surface">
		<h1 id="title">EncBin.</h1>
		<input placeholder="Encryption Key" name="password" type="text" />
		<button class="colored icon-button" id="upload-button">
			<div>Create</div>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-upload"
				><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
					points="17 8 12 3 7 8"
				/><line x1="12" x2="12" y1="3" y2="15" /></svg
			>
		</button>
	</div>
	<!-- Screen reader users can use button instead -->
	<div
		data-hovering={isHoveringFiles}
		data-hasText={hasText}
		id="container"
		role="presentation"
		on:dragover|preventDefault|stopPropagation={dragStart}
		on:dragenter|preventDefault|stopPropagation={dragStart}
		on:dragleave|preventDefault|stopPropagation={dragStop}
		on:dragend|preventDefault|stopPropagation={dragStop}
		on:drop|preventDefault|stopPropagation={dropFile}
	>
		<!-- placeholder=" " is a hack so that :placeholder-shown can work -->
		<textarea
			placeholder=" "
			name="text"
			id="type-area"
			on:input={textInput}
			bind:value={textContent}
			autofocus
		/>
		<!-- this must be after the view so ~ selector can work -->
		<svg id="container-border">
			<rect
				id="container-border-rect"
				x="0%"
				y="0%"
				rx="8"
				width="100%"
				height="100%"
				fill="transparent"
				stroke-width="2px"
			/>
		</svg>
		<div id="drag-hint">
			Start typing, <!--drop a file, -->or
			<input name="file" type="file" class="colored icon-button" id="file-input" />
		</div>
	</div>
	<div id="footer">
		<div id="copyright">EncBin © 2023 Reagan Bohan</div>
		<a href="?login">Login</a>
	</div>
</form>
{#if started}
	<Modal>
		<h2 style:margin-bottom="16px">
			{#if progress}
				{#if progress.loaded == progress.total}
					Processing...
				{:else}
					Uploading ({((progress.loaded / progress.total) * 100).toFixed(2)}%)...
				{/if}
			{:else}
				Encrypting...
			{/if}
		</h2>
		<ProgressBar progress={progress?.loaded} total={progress?.total} />
	</Modal>
{/if}

<style>
	#top-bar {
		height: 36px;
		display: flex;
		flex-direction: row;
		gap: 16px;
		padding: 16px;
		border-radius: 8px;
		justify-content: flex-end;
		margin-bottom: 12px;
	}

	#copyright {
		margin-right: auto;
	}
	#footer {
		display: flex;
		flex-direction: row;
	}

	#file-input::file-selector-button {
		height: 36px;
	}

	#container-border {
		overflow: visible;
		z-index: -1;
	}

	button:disabled {
		background: rgba(33, 180, 73, 0.2);
		background: linear-gradient(90deg, rgba(33, 180, 73, 0.2) 0%, rgba(14, 136, 49, 0.2) 100%);
	}

	#upload-button:active {
		box-shadow: none;
	}

	#container {
		display: grid;
		grid-template: 'container';
		place-items: stretch;
		place-content: center;
		flex-grow: 1;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	#container-border-rect {
		rx: 8;
		stroke-dasharray: 12 8;
		stroke-dashoffset: 0;
		transition: stroke-dasharray 150ms, stroke-dashoffset 150ms, stroke 150ms, stroke-width 150ms,
			rx 150ms;
		stroke-width: 2;
		stroke: rgba(255, 255, 255, 0.3);
	}

	#container[data-hovering='true'] #container-border-rect,
	:is(#type-area:not(:placeholder-shown) ~ #container-border) #container-border-rect {
		stroke-dashoffset: 4;
		stroke-dasharray: 20 0;
	}

	:is(#type-area:not(:placeholder-shown) ~ #container-border) #container-border-rect {
		stroke-dashoffset: -4;
		rx: 0;
	}

	#container[data-hovering='true']
		#type-area:placeholder-shown
		~ #container-border
		#container-border-rect {
		stroke: rgba(255, 255, 255, 0.5);
		stroke-width: 3;
	}

	#container > * {
		grid-area: container;
	}

	textarea {
		background-color: #00000000;
		border: none;
		outline: none;
		resize: none;
		font-size: 14px;
	}

	#drag-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		place-self: center;
	}

	textarea:not(:placeholder-shown) ~ #drag-hint {
		display: none;
	}

	#wrapper {
		/* TODO: try better way */
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 16px;
		box-sizing: border-box;
		gap: 8px;
	}

	noscript {
		background-color: #a8230f;
		padding: 8px;
	}

	#nojs-header {
		font-size: 2em;
	}

	#title {
		margin-right: auto;
		font-weight: normal;
	}
</style>
