import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling to help debug issues
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Cannot find element with id "root". Please check your HTML structure.');
  
  // Create a fallback element to display error
  const errorElement = document.createElement('div');
  errorElement.style.padding = '20px';
  errorElement.style.color = 'red';
  errorElement.style.backgroundColor = '#fff8f8';
  errorElement.style.border = '1px solid red';
  errorElement.style.borderRadius = '8px';
  errorElement.style.margin = '20px';
  errorElement.style.fontFamily = 'Arial, sans-serif';
  
  errorElement.innerHTML = `
    <h2>React Rendering Error</h2>
    <p>Could not find the root element to render the React application.</p>
    <p>Please check the HTML structure and ensure there's an element with id="root".</p>
  `;
  
  document.body.appendChild(errorElement);
} else {
  try {
    console.log('Found root element, attempting to render React app');
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React application:', error);
    
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; background-color: #fff8f8; border: 1px solid red; border-radius: 8px;">
        <h2>React Rendering Error</h2>
        <p>An error occurred while rendering the React application:</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}
