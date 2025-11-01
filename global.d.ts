interface Window {
  toast: (ToastOptions: ToastOptions) => void
}

declare global {
  interface Window {
    toast: function
  }
}

export {}
