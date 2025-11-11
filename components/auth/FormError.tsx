import { useTranslation } from "react-i18next"

export function FormError({
  error,
  flag,
  handleResendEmail,
  errorValues,
}: {
  error: string | null
  flag?: string | null
  handleResendEmail?: () => void
  errorValues?: Record<string, string | number>
}) {
  if (!error) return null

  const { t } = useTranslation()
  const translatedError = t(error, {
    defaultValue: error,
    ...(errorValues ?? {}),
  })

  return (
    <div className="my-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600">
      <p className="mt-1">{translatedError}</p>
      {flag?.includes("Email not confirmed") && (
        <button className="cursor-pointer pt-2 underline" onClick={handleResendEmail}>
          {t("auth.errors.resendVerification")}
        </button>
      )}
    </div>
  )
}
