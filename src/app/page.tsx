'use client'
import useCreditCards from "@/app/cards/actions";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TransactionsList } from "@/components/transactions-list";
import { Button } from "@/components/ui/button";
import { Chart } from "react-google-charts";
import {useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

// Define types for the data
type ChartData = [string, number, number, number, number];

// Function to generate random dates
function generateRandomDates(startDate: Date, endDate: Date, numDates: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < numDates; i++) {
    const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  }
  return dates;
}

export default function HomePage() {
  const { cards, policies, transactions } = useCreditCards();

  // Use useMemo to generate random dates and data only once
  const { header, data } = useMemo(() => {
    const randomDates = generateRandomDates(new Date(2023, 0, 1), new Date(2023, 11, 31), 13);
    const header: [string, string, string, string, string] = ["Date", "Income", "Sales", "Expenses", "Profit"];
    const data: ChartData[] = randomDates.map((date): ChartData => [
      date,
      Math.floor(Math.random() * 100), // Income
      Math.floor(Math.random() * 100), // Sales
      Math.floor(Math.random() * 80),  // Expenses
      Math.floor(Math.random() * 60)   // Profit
    ]);
    return { header, data };
  }, []); // Empty dependency array ensures this runs only once

  const { balance, limit } = useMemo(() => {
    const { balance, limit } = policies.reduce((stats, policy) => {
      return {
        balance: stats.balance + policy.spent,
        limit: {
          used: stats.limit.used + policy.spent,
          total: stats.limit.total + policy.limit
        },
      }
    }, { balance: 0, limit: { used: 0, total: 0 } });
    const limitUsagePercentage = ((limit.used / limit.total) * 100);

    return {
      balance,
      limit: {
        total: limit.total,
        usagePercentage: limitUsagePercentage,
      }
    };
  }, [policies]);

  // Define a Copilot action for chart data
  useCopilotAction({
    name: "analyzeChartData",
    description: "Analyze the data in the chart and provide insights.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The specific question or insight requested about the chart data.",
        required: true,
      },
    ],
    handler: async () => {
      const maxIncome = Math.max(...data.map(([, income]) => income));
      const maxSales = Math.max(...data.map(([, , sales]) => sales));
      const maxExpenses = Math.max(...data.map(([, , , expenses]) => expenses));
      const maxProfit = Math.max(...data.map(([, , , , profit]) => profit));

      const incomeTrend = data[data.length - 1][1] - data[0][1];
      const salesTrend = data[data.length - 1][2] - data[0][2];
      const expensesTrend = data[data.length - 1][3] - data[0][3];
      const profitTrend = data[data.length - 1][4] - data[0][4];

      return `The maximum values are: Income: ${maxIncome}, Sales: ${maxSales}, Expenses: ${maxExpenses}, Profit: ${maxProfit}. Trends are: Income is ${incomeTrend > 0 ? 'increasing' : 'decreasing'}, Sales is ${salesTrend > 0 ? 'increasing' : 'decreasing'}, Expenses is ${expensesTrend > 0 ? 'increasing' : 'decreasing'}, Profit is ${profitTrend > 0 ? 'increasing' : 'decreasing'}.`;
    },
  });

  // Use Copilot readable to provide chart insights
  useCopilotReadable({
    description: "This chart shows the income, sales, expenses, and profit over random dates. It can be used to analyze trends and peaks in these metrics.",
    value: data,
  });

  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${balance}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credit Limit</CardTitle>
                  <CreditCard className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${limit.total}</div>
                  <Progress value={limit.usagePercentage} className="mt-2" />
                  <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">{limit.usagePercentage.toFixed(2)}% used</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <TransactionsList transactions={transactions} />
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Credit Cards</CardTitle>
                  <CardDescription>You have 2 active credit cards.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {cards.map((card, index) => (
                        <div key={index} className="flex items-center">
                          <div className={`${card.color} rounded-lg p-2 mr-4`}>
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{card.type} ending in {card.last4}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Expires {card.expiry}</p>
                          </div>
                          <Button variant="outline" asChild>
                            <a href="/cards">Manage</a>
                          </Button>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Line Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="300px"
                    data={[header, ...data]}
                    options={{
                      title: "Income Over Time",
                      hAxis: { title: "Date" },
                      vAxis: { title: "Income" },
                      legend: "none",
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pie Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <Chart
                    chartType="PieChart"
                    width="100%"
                    height="300px"
                    data={[
                      ["Metric", "Value"],
                      ["Income", data.reduce((sum, [, income]) => sum + income, 0)],
                      ["Sales", data.reduce((sum, [, , sales]) => sum + sales, 0)],
                      ["Expenses", data.reduce((sum, [, , , expenses]) => sum + expenses, 0)],
                      ["Profit", data.reduce((sum, [, , , , profit]) => sum + profit, 0)],
                    ]}
                    options={{
                      title: "Income, Sales, Expenses, and Profit Distribution",
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bar Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <Chart
                    chartType="BarChart"
                    width="100%"
                    height="300px"
                    data={[header, ...data]}
                    options={{
                      title: "Sales and Expenses Over Time",
                      hAxis: { title: "Date" },
                      vAxis: { title: "Amount" },
                      legend: { position: "top" },
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Area Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <Chart
                    chartType="AreaChart"
                    width="100%"
                    height="300px"
                    data={[header, ...data]}
                    options={{
                      title: "Profit Over Time",
                      hAxis: { title: "Date" },
                      vAxis: { title: "Profit" },
                      legend: "none",
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}