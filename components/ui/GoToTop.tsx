export const GoToTop = () => {
  const handleGoToTop = () => {
    window.scrollTo(0, 0)
  }

  return (
    <button
      id="go-top-btn"
      onClick={handleGoToTop}
      className="group bg-primary active:border-accent active:bg-main md:hover:border-accent md:hover:bg-main fixed right-6 bottom-20 z-30 flex size-10 cursor-pointer items-center justify-center rounded-full text-white transition duration-300 md:right-8 md:bottom-24 md:size-12"
    >
      <i className="ri-arrow-up-line text-2xl transition-transform group-hover:scale-110" />
    </button>
  )
}
