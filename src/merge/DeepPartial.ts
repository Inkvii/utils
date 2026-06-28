/**
 * Expects json object. Walks through the children and makes all keys optional
 */
export type DeepPartial<T> =
	T extends Array<infer U>
		? Array<DeepPartial<U>>
		: T extends ReadonlyArray<infer U>
			? ReadonlyArray<DeepPartial<U>>
			: T extends object
				? { [K in keyof T]?: DeepPartial<T[K]> }
				: T
