export const GoToTop = () => {
  const handleGoToTop = () => {
    window.scrollTo(0, 0)
  }

  return (
    <button
      id="go-top-btn"
      onClick={handleGoToTop}
      className="group fixed md:bottom-24 md:right-8 right-6 bottom-20 z-30 flex size-10 md:size-12 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition duration-300 active:border-accent active:bg-main md:hover:border-accent md:hover:bg-main"
    >
      <i className="ri-arrow-up-line text-2xl group-hover:scale-110 transition-transform" />
    </button>
  )
}
