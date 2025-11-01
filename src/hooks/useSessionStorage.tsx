export function useSessionStorage(key: string) {
  const setValue = (keySet: string = key, value: unknown) => {
    try {
      window.sessionStorage.setItem(keySet, JSON.stringify(value))
    } catch (error) {
      console.error("Error setting sessionStorage key “" + keySet + "”:", error)
    }
  }

  const getValue = (keyGet: string = key) => {
    try {
      const item = window.sessionStorage.getItem(keyGet)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Error getting sessionStorage key “" + keyGet + "”:", error)
      return null
    }
  }

  const removeValue = (keyRemove: string = key) => {
    try {
      window.sessionStorage.removeItem(keyRemove)
    } catch (error) {
      console.error(
        "Error removing sessionStorage key “" + keyRemove + "”:",
        error
      )
    }
  }

  const checkKey = (keyCheck: string = key) => {
    try {
      return window.sessionStorage.getItem(keyCheck) !== null
    } catch (error) {
      console.error(
        "Error checking sessionStorage key “" + keyCheck + "”:",
        error
      )
    }

    return false
  }

  return { setValue, getValue, removeValue, checkKey }
}
