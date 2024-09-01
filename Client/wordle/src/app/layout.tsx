import React from 'react';

export const metadata = {
  title: 'Wordle in Next.js',
  description: 'A Wordle clone built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}