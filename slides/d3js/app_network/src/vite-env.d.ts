/// <reference types="vite/client" />

// This reference teaches TypeScript about Vite's special imports.

// Session 3 reads one custom environment variable: the data service URL.
// Declaring it here keeps `import.meta.env.VITE_API_URL` type-safe.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
