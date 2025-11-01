import type { Proposal } from "@/interfaces/Proposal"

interface Props {
  proposal: Proposal
  rejectProposal: (id: string) => void
  acceptProposal: (
    id: string,
    freelancer_id: string,
    project_id: string
  ) => void
}

export const ProposalArticle = ({
  proposal,
  rejectProposal,
  acceptProposal,
}: Props) => {
  return (
    <article
      key={proposal.id}
      className="border border-gray-200 rounded-lg p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
            <i className="ri-user-line text-lg sm:text-xl text-primary"></i>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">
              {proposal.freelancer?.full_name}
            </h3>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="text-yellow-500 mr-1">
                {proposal.freelancer?.rating}★
              </span>
              <span>${proposal.freelancer?.hourly_rate}/hora</span>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg sm:text-2xl font-bold text-primary">
            ${proposal.proposed_budget}
          </div>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              proposal.status === "accepted"
                ? "bg-green-100 text-green-800"
                : proposal.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {proposal.status === "accepted"
              ? "Aceptada"
              : proposal.status === "rejected"
                ? "Rechazada"
                : "Pendiente"}
          </span>
        </div>
      </div>

      {proposal.freelancer?.skills && (
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
          {proposal.freelancer?.skills
            .slice(0, 4)
            .map((skill: string, idx: number) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
        </div>
      )}

      <p className="text-xs sm:text-sm text-gray-700 mb-4 leading-relaxed">
        {proposal.message}
      </p>

      <div className="text-xs sm:text-sm text-gray-500 mb-4">
        Enviado: {new Date(proposal.created_at).toLocaleDateString()}
      </div>

      {proposal.status === "pending" && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => rejectProposal(proposal.id)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            Rechazar
          </button>
          <button
            onClick={() =>
              acceptProposal(
                proposal.id,
                proposal.freelancer_id,
                proposal.project_id
              )
            }
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-check-line mr-1"></i>
            Aceptar Propuesta
          </button>
        </div>
      )}
    </article>
  )
}
