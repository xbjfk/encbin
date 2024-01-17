import type { RequestHandler } from "./$types"
import client, { loManager } from '$lib/db.server';
import { error } from "@sveltejs/kit"
import { iteratorToStream, nodeStreamToIterator } from "$lib/streamhelper.server";
import { Readable } from 'node:stream'

export const GET: RequestHandler = async ({ url, params }) => {
	console.log(params.id)
	const id = Buffer.from(params.id, 'base64url')
	const rows = (await client.query('SELECT "filename","dataoid","salt","iv" FROM datainfo WHERE id=$1', [id])).rows
	if (rows.length == 0) {
		throw error(404)
	}
	const info = rows[0]


	try {
		await client.query('BEGIN')
		// TODO: switch to just open and dont open a stream
		const [size, stream] = await loManager.openAndReadableStreamAsync(info.dataoid)

		stream.on('error', (e) => { throw e })
			.on('finish', () => client.query('COMMIT'))

		const webStream = Readable.toWeb(stream, {
			strategy: new CountQueuingStrategy({ highWaterMark: 100 }),
		});
		return new Response(webStream)
	} catch (e) {
		await client.query('ROLLBACK')
		throw e
	}
}
