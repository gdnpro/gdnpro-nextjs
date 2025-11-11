import { useTranslation } from "react-i18next"

export function FormInfo({
  info,
  handleResendEmail,
}: {
  info: string | null
  handleResendEmail?: () => void
}) {
  if (!info) return null

  const { t } = useTranslation()

  return (
    <div className="my-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-600">
      <p className="mt-1">{info}</p>
      <button className="cursor-pointer pt-2 underline" onClick={handleResendEmail}>
        {t("auth.errors.resendVerification")}
      </button>
    </div>
  )
}
