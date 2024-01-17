import client, { loManager } from '$lib/db.server';
import { ReadStream, type WriteStream } from 'pg-large-object';
import type { RequestHandler } from './$types';
import { error, fail, json, redirect } from '@sveltejs/kit';
import { streamAsyncIterator, streamEndPromise, streamFinishPromise, streamWritePromise } from '$lib/streamhelper.server'
import { Readable } from "node:stream"

export const POST: RequestHandler = async (event) => {

	const ivinit = event.request.headers.get("X-EncBin-IV")
	const saltinit = event.request.headers.get("X-EncBin-Salt")

	const iv = ivinit ? Buffer.from(ivinit, 'base64url') : null
	const salt = saltinit ? Buffer.from(saltinit, 'base64url') : null

	if (!iv || !salt || !event.request.body) {
		throw error(400)
	}

	const fileName = event.request.headers.get("X-EncBin-FileName")
	const contentType = event.request.headers.get("X-EncBin-ContentType")

	try {
		await client.query('BEGIN')
		const [oid, stream] = await loManager.createAndWritableStreamAsync()
		/*
		for await (const chunk of streamAsyncIterator(readstream)) {
			console.log("writing chunk of size %d", chunk.length)
			await streamWritePromise(stream, chunk)
			console.log("wrote chunk")
		}
		*/
		const nodeStream = Readable.fromWeb(event.request.body)
		nodeStream.pipe(stream)
		//const fbuf = await f.arrayBuffer()
		// Writing all at once crashes
		// using Blob.stream() hangs
		// this works :)
		// TODO: ask on discord server why
		/*
		for (let i = 0; i < f.size / 65535; i++) {
			const chunk = fbuf.slice(i * 65535, (i+1) * 65535)
			await streamWritePromise(stream, Buffer.from(chunk))
		}
		*/

		console.log("finished")
		await streamFinishPromise(stream).catch(e => { throw error(500) })
		const result = await client.query('INSERT INTO datainfo(dataoid, filename, content_type, iv, salt) VALUES($1, $2, $3, $4, $5) RETURNING "id"', [oid, fileName, contentType, iv, salt])
		await client.query('COMMIT')

		return json({id: result.rows[0].id.toString('base64url')})
	} catch (e) {
		await client.query('ROLLBACK')
		throw e
	}
}
