"use client"

import { SalesPartnerForm } from "@/components/admin/sales-partner/sales-partner-form"
import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AddSalesPartnerPage() {
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Sales Partner</CardTitle>
            <CardDescription>Create a new sales partner. Fill in all the required information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/sales-partner/sales-partner-list">Back to Sales Partners</Link>
          </Button>
        </div>
      </div>
      <div>
        <SalesPartnerForm mode="create" />
      </div>
    </div>
  )
}
