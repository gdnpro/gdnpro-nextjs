import "./globals.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>Hola</title>
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
