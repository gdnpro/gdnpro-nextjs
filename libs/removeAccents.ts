export const removeAccents = (text: string | undefined): string | undefined => {
  if (text) return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}
