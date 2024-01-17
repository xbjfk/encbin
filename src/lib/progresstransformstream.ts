const transformContent = {
	start() { }, // required.
	async transform(chunk, controller) {
		chunk = await chunk;
		console.log("cunk here")
		console.log(typeof chunk)
		controller.enqueue(chunk)
	},
	flush() {
		/* do any destructor work here */
	},
};

export default class ProgressTransformStream extends TransformStream {
	constructor() {
		super(transformContent);
	}
}
