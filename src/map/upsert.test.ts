import { describe, expect, it } from "vitest"
import { upsert } from "@/src"

describe("upsert", () => {
	it("Empty map", () => {
		const map = new Map<string, string>()
		expect(upsert(map, "first", "1", (prev, value) => prev + value)).toEqual("1")
		expect(map.size).toBe(1)
	})
	it("Map with existing value", () => {
		const map = new Map<string, string>()
		map.set("first", "1")

		const fn = (prev: string, value: string) => prev + value

		expect(upsert(map, "first", "2", fn)).toEqual("12")
		expect(upsert(map, "second", "3", fn)).toEqual("3")
		expect(map.size).toBe(2)
	})
	it("Map with empty function", () => {
		const map = new Map<string, string>()
		map.set("first", "1")
		expect(upsert(map, "first", "2", () => "")).toEqual("")
		expect(map.size).toBe(1)
	})
	it("Map with custom logic", () => {
		const map = new Map<string, number>()
		map.set("first", 1)
		expect(map.get("first")).toEqual(1)
		expect(upsert(map, "first", 2, (prev, value) => (prev + (value % 2) === 1 ? 42 : 13))).toEqual(42)
		expect(map.size).toBe(1)
	})
	it("Map with multiple values upserting existing array", () => {
		const map = new Map<string, string[]>()
		map.set("first", ["1", "2"])
		map.set("second", ["3", "4"])

		expect(upsert(map, "first", ["5", "6"], (prev, value) => [...prev, ...value])).toEqual(["1", "2", "5", "6"])
		expect(map.get("second")).toStrictEqual(["3", "4"])
		expect(map.size).toBe(2)
	})
})
