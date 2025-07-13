export const metadata = {
  title: 'Weather App',
  description: 'A modern weather app using OpenWeather API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Roboto, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
