export function FormInfo({
  info,
  handleResendEmail,
}: {
  info: string | null
  handleResendEmail?: () => void
}) {
  if (!info) return null

  return (
    <div className="my-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-600">
      <p className="mt-1">{info}</p>
      <button className="cursor-pointer pt-2 underline" onClick={handleResendEmail}>
        Reenviar verificación
      </button>
    </div>
  )
}
