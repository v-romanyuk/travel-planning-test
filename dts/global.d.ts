declare module '#app' {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- augments Nuxt's existing PageMeta interface
  interface PageMeta {
    pageLabel?: string
  }
}

// It is always important to ensure you import/export something when augmenting a type
export {}
