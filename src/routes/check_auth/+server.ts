import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { tokens } from "$lib/auth.server";

export const GET: RequestHandler = async (event) => {
	const key = await event.request.text()
	if (!tokens.includes(key)) {
		return json(false)
	}
	return json(true)
}
