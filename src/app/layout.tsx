export const metadata = {
  title: 'Midcurve API',
  description: 'RESTful API for Midcurve Finance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
