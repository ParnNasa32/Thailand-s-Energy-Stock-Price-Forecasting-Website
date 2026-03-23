import { StockDashboard } from "@/components/stock-dashboard";

export default async function StockPage({
    params,
}: {
    params: Promise<{ symbol: string }>;
}) {
    const { symbol } = await params;
    return <StockDashboard symbol={decodeURIComponent(symbol)} />;
}
