/**
 * Created by rockyl on 2020/12/17.
 */

class MError extends Error {
	code: number;

	constructor(message, code?) {
		super(message);

		this.code = code;
	}
}

export function makeError(message, code?) {
	return new MError(message, code);
}
