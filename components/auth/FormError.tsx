export function FormError({
  error,
  handleResendEmail,
}: {
  error: string | null
  handleResendEmail: () => void
}) {
  if (!error) return null

  return (
    <div className="my-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600">
      <p className="mt-1">{error}</p>
      {error.includes("Email not confirmed") && (
        <button className="pt-2 underline" onClick={handleResendEmail}>
          Reenviar verificación
        </button>
      )}
    </div>
  )
}
