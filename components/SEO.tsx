import { Preload } from "@/interfaces/Preload"

interface Props {
  title: string
  description: string
  preload?: Array<Preload>
  canonical?: string
  image?: string
}

export default function SEO({
  title = "GDN Pro",
  description = "GDN Pro es una plataforma en la desarrolladores freelancers y clientes en búsqueda de trabajadores se encuentran y llegan a acuerdos corporativos. En GDN PRO creamos soluciones digitales innovadoras. Desarrollo web, apps móviles y marketing digital de clase mundial.",
  canonical = "https://gdnpro.com/",
  image = "https://gdnpro.com/images/embedded-img.webp",
  preload,
}: Props) {
  const imageUrl = new URL(image, canonical).toString()

  return (
    <>
      <title>{title}</title>

      <meta charSet="UTF-8" />
      <meta name="description" content={description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
      />
      <meta name="theme-color" content="#0891b2" />

      <link rel="canonical" href={canonical} />
      <link rel="author" href="https://www.linkedin.com/in/rikirilis" />
      <meta name="robots" content="index, follow"></meta>

      {preload?.map((p, i) => (
        <link
          key={i}
          rel={p.rel ?? "preload"}
          href={p.href}
          {...(p.as ? { as: p.as } : {})}
          {...(p.type ? { type: p.type } : {})}
          {...(p.crossorigin ? { crossOrigin: p.crossorigin } : {})}
        />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.webmanifest" />

      <link
        href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
        rel="stylesheet"
      ></link>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      ></link>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css"
      ></link>
    </>
  )
}
