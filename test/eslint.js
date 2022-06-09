import lint from "mocha-eslint"

lint(["lib/*.js","test/*.js"], { contextName: "ESLint" })
