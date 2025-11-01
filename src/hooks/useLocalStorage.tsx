export function useLocalStorage(key: string) {
  const setValue = (keySet: string = key, value: unknown) => {
    try {
      window.localStorage.setItem(keySet, JSON.stringify(value))
    } catch (error) {
      console.error("Error setting localStorage key “" + keySet + "”:", error)
    }
  }

  const getValue = (keyGet: string = key) => {
    try {
      const item = window.localStorage.getItem(keyGet)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Error getting localStorage key “" + keyGet + "”:", error)
      return null
    }
  }

  const removeValue = (keyRemove: string = key) => {
    try {
      window.localStorage.removeItem(keyRemove)
    } catch (error) {
      console.error(
        "Error removing localStorage key “" + keyRemove + "”:",
        error
      )
    }
  }

  const checkKey = (keyCheck: string = key) => {
    try {
      return window.localStorage.getItem(keyCheck) !== null
    } catch (error) {
      console.error(
        "Error checking localStorage key “" + keyCheck + "”:",
        error
      )
    }

    return false
  }

  return { setValue, getValue, removeValue, checkKey }
}
