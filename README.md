# HCare Frontend

This is the Next.js frontend application for the HCare SaaS platform, providing interfaces for hospital administrators, doctors, nurses, and caretakers.

## Tech Stack
- **Framework:** Next.js (App / Pages Router based on setup)
- **Styling:** TailwindCSS
- **State/Fetching:** React, Axios
- **Authentication:** JWT stored in cookies (`js-cookie`)

## Prerequisites
- Node.js (v18+ recommended)
- The [HCare Backend (Node.js API)](../hcare) must be running.

## Installation
1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd hcare-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
*(Ensure the port matches where your Node.js backend is running)*

## Running the Application

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To build the application for production deployment:
```bash
npm run build
npm start
```

## Project Structure
- `app/` - Next.js App Router structure (pages and layouts).
- `components/` - Reusable React components (UI elements, forms, modals).
- `lib/` - Utility functions, axios interceptors, and helpers.
- `public/` - Static assets like images and icons.
- `styles/` - Global CSS files and Tailwind configuration.
