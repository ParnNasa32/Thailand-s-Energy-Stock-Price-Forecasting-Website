# Stock Index

A modern, high-performance stock index dashboard built with Next.js 16, React 19, and Tailwind CSS v4. This application allows users to track stock metrics, view interactive charts, and maintain a search history.

## 🚀 Features

- **Authentication**: Secure login and registration powered by **NextAuth.js**, supporting Google, GitHub, and Email providers.
- **Stock Dashboard**: Real-time stock data fetching via **Yahoo Finance**.
- **Interactive Charts**: Visual representation of stock performance using **Recharts**.
- **Future Prediction**: Advanced metric cards and data visualization for trend analysis.
- **Search History**: Track and manage your recent stock searches.
- **Modern UI**: Polished, responsive design using **Radix UI** and **Lucide Icons**, with **Framer Motion** for smooth animations.
- **Themes**: Support for Light and Dark modes.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tabler-icons.io/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Robinz27/stock-index.git
   cd stock-index
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   DATABASE_URL="your_postgresql_url"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_secret"
   GOOGLE_CLIENT_ID="your_google_id"
   GOOGLE_CLIENT_SECRET="your_google_secret"
   GITHUB_ID="your_github_id"
   GITHUB_SECRET="your_github_secret"
   RESEND_API_KEY="your_resend_key"
   ```

4. Push the database schema:
   ```bash
   npx drizzle-kit push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components (Shadcn/UI and custom).
- `/lib`: Utility functions, database schema, and shared logic.
- `/hooks`: Custom React hooks.
- `/public`: Static assets.
- `/scripts`: Helper scripts for database or setup.

## 📄 License

This project is licensed under the MIT License.
