import { createRoot } from "react-dom/client";

function TestApp() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#4f46e5' }}>DeliverConnect Test Page</h1>
      <p>If you can see this page, React is working correctly.</p>
      <p>The application is running but there might be an issue with routing or components.</p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem'
      }}>
        <code>React version working!</code>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);