import { Metadata } from "next";
import { FinanceClient } from "@/components/finance/FinanceClient";

export const metadata: Metadata = {
  title: "Personal & Studio Finance — IRIS",
  description: "Executive cashflow, category budgets, and financial goals",
};

export default function FinancePage() {
  return <FinanceClient />;
}
