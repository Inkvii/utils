import eslint from "@eslint/js"
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"
import prettier from "eslint-config-prettier"

export default defineConfig([
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	prettier,
	{
		ignores: ["**/*", "!src/", "!src/**"],
	},
	{
		files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
	},
	{
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-misused-promises": [
				"error",
				{
					checksVoidReturn: {
						attributes: false, // to allow <Button onClick={async () => { await doStuff() }}/>
					},
				},
			],
			"@typescript-eslint/no-empty-object-type": "warn",
		},
	},
])
