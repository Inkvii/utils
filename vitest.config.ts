import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname),
			"~": path.resolve(__dirname, "src"),
		},
	},
	test: {
		// Run *.test-d.ts type tests as part of every `vitest run`, alongside the
		// runtime tests. Costs an extra ~0.5s per run (spawns tsc); set this back
		// to false (or remove the block) to keep runtime runs fast.
		typecheck: {
			enabled: true,
		},
	},
})
