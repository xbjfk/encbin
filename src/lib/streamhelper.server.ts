import type { ReadStream, WriteStream } from "pg-large-object"

export function streamWritePromise(stream: WriteStream, chunk: any): Promise<void> {
	return new Promise((resolve, reject) => {
		stream.write(chunk, (err) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
}

export function streamEndPromise(stream: WriteStream): Promise<void> {
	return new Promise((resolve, reject) => {
		stream.end(resolve)
	})
}

export function streamFinishPromise(stream: WriteStream | ReadStream): Promise<void> {
	return new Promise((resolve, reject) => {
		stream.on('finish', resolve)
		stream.on('error', reject)
	})
}


export async function* nodeStreamToIterator(stream: ReadStream) {
	for await (const chunk of stream) {
		yield chunk;
	}
}

export function iteratorToStream(iterator) {
	return new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next()

			if (done) {
				controller.close()
			} else {

				controller.enqueue(new Uint8Array(value))
			}
		},
	})
}

export async function* streamAsyncIterator(stream: ReadableStream) {
	// Get a lock on the stream
	const reader = stream.getReader();

	try {
		while (true) {
			// Read from the stream
			console.log('about to read stream')
			const { done, value } = await reader.read();
			console.log('read stream')
			// Exit if we're done
			if (done) return;
			// Else yield the chunk
			yield value;
		}
	}
	finally {
		reader.releaseLock();
	}
}

