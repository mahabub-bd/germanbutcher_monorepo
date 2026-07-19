"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopEndpoint } from "@/utils/types";

interface TopEndpointsTableProps {
  data: TopEndpoint[];
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-100 text-green-800";
    case "POST":
      return "bg-blue-100 text-blue-800";
    case "PUT":
      return "bg-yellow-100 text-yellow-800";
    case "PATCH":
      return "bg-orange-100 text-orange-800";
    case "DELETE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function TopEndpointsTable({ data }: TopEndpointsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Top Endpoints</CardTitle>
        <CardDescription>Most frequently accessed API endpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Avg Time</TableHead>
              <TableHead className="text-right">Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((endpoint, index) => (
              <TableRow key={`${endpoint.endpoint}-${index}`}>
                <TableCell className="font-mono text-sm max-w-[200px] truncate">
                  {endpoint.endpoint}
                </TableCell>
                <TableCell>
                  <Badge className={getMethodColor(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {endpoint.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {endpoint.avgResponseTime.toFixed(0)}ms
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600">0</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
