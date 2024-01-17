import client, { loManager } from '$lib/db.server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { iteratorToStream, nodeStreamToIterator, streamEndPromise, streamFinishPromise } from '$lib/streamhelper.server';

export const load: PageServerLoad = async({ params }) => {
	console.log(params.id)
	const id = Buffer.from(params.id, 'base64url')
	const rows = (await client.query('SELECT "filename", "content_type", "dataoid","salt","iv" FROM datainfo WHERE id=$1', [id])).rows
	if (rows.length == 0) {
		throw error(404)
	}
	const info = rows[0]
	

	try {
		await client.query('BEGIN')
		// TODO: switch to just open and dont open a stream
		const [size, stream] = await loManager.openAndReadableStreamAsync(info.dataoid)

		stream.on('error', (e) => {throw e})
			.on('finish', () => client.query('COMMIT'))

		return {id: params.id, fileName: info.filename, contentType: info.content_type , salt: info.salt.toString('base64'), iv: info.iv.toString('base64'), size}
	} catch (e) {
		await client.query('ROLLBACK')
		throw e
	}
};
