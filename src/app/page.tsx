export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Midcurve API</h1>
      <p>RESTful API for Midcurve Finance - Concentrated Liquidity Position Management</p>
      <h2>Available Endpoints</h2>
      <ul>
        <li>
          <a href="/api/health">/api/health</a> - Health check endpoint
        </li>
      </ul>
    </main>
  );
}
