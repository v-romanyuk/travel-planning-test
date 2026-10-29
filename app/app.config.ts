export default defineAppConfig({
  ui: {
    colors: {
      primary: 'forest',
      neutral: 'moss',
      rule: 'ember',
      success: 'forest',
      error: 'red'
    },

    button: {
      slots: {
        base: 'rounded-xl font-semibold'
      }
    },

    badge: {
      slots: {
        base: 'rounded-full font-semibold'
      }
    },

    card: {
      slots: {
        root: 'rounded-2xl'
      }
    },

    alert: {
      slots: {
        root: 'rounded-xl'
      }
    },

    // Every field reserves one line under the control; help and error render inside it, so validation never shifts the form
    formField: {
      slots: {
        root: 'relative pb-4.5',
        container: 'static',
        error: 'absolute inset-x-0 bottom-0 mt-0 truncate text-xs leading-4',
        help: 'absolute inset-x-0 bottom-0 mt-0 truncate text-xs leading-4'
      }
    },

    input: {
      slots: {
        base: 'rounded-xl'
      }
    },

    textarea: {
      slots: {
        base: 'rounded-xl'
      }
    },

    select: {
      slots: {
        base: 'rounded-xl'
      }
    }
  }
})
