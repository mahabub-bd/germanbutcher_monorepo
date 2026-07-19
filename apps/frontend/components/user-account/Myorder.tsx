"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/utils/types";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PayNow from "../payment/pay-now";

interface MyOrderProps {
  orders: Order[];
}

const OrderTable = ({ orders }: MyOrderProps) => {
  const params = useParams();
  const userId = params.id as string;

  // Sort orders by date (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  return (
    <div className="w-full  ">
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>

      <div className="rounded-md  overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Payment Actions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNo}</TableCell>

                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusColor(order.orderStatus)}>
                      {formatStatus(order.orderStatus)}
                    </Badge>
                  </TableCell>

                  <TableCell>৳{formatCurrency(order.totalValue)}</TableCell>

                  <TableCell>
                    <Badge className={getStatusColor(order.paymentStatus)}>
                      {formatStatus(order.paymentStatus)}
                    </Badge>
                  </TableCell>

                  <TableCell>{order.paymentMethod.name}</TableCell>
                  <TableCell>
                    {order.paymentStatus === "pending" && (
                      <PayNow order={order} className="inline-flex" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <Link href={`/user/${userId}/order/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderTable;
