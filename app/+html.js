import { ScrollViewStyleReset } from 'expo-router/html';

export default function RootHtml({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta
          name="description"
          content="BillGuard helps households track bills, payments, reminders, and printable monthly reports."
        />
        <meta name="theme-color" content="#111114" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BillGuard" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                margin: 0;
                padding: 0;
                background: #111114;
              }

              body {
                min-height: 100vh;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
