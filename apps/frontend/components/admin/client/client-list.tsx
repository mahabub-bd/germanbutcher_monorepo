"use client"

import { PaginationComponent } from "@/components/common/pagination"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import { deleteData, fetchDataPagination, patchData } from "@/utils/api-utils"
import type { Client, PaginatedResponse } from "@/utils/types"
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import DeleteConfirmationDialog from "../delete-confirmation-dialog"
import { LoadingIndicator } from "../loading-indicator"
import { PageHeader } from "../page-header"

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const response = await fetchDataPagination<PaginatedResponse<Client>>(
        `clients?page=${currentPage}&limit=${limit}`
      )
      setClients(response.data)
      setTotalItems(response.total)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients. Please try again.")
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = async (client: Client) => {
    setTogglingId(client.Id)
    const nextActive = !client.isActive
    // Optimistic flip; revert if the API call fails.
    setClients((prev) =>
      prev.map((c) => (c.Id === client.Id ? { ...c, isActive: nextActive } : c))
    )
    try {
      const response = await patchData(`clients/${client.Id}`, {
        isActive: nextActive,
      })
      if (response?.statusCode !== 200 && response?.statusCode !== 201) {
        throw new Error(response?.message || "Failed to update status")
      }
      toast.success(
        `"${client.name}" is now ${nextActive ? "active" : "inactive"}`
      )
    } catch (error) {
      // Revert the optimistic update
      setClients((prev) =>
        prev.map((c) =>
          c.Id === client.Id ? { ...c, isActive: client.isActive } : c
        )
      )
      console.error("Error updating client status:", error)
      toast.error("Failed to update client status. Please try again.")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedClient) return

    try {
      await deleteData("clients", selectedClient.Id)
      fetchClients()
      toast.success("Client deleted successfully")
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client. Please try again.")
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Users className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No clients found</h3>
      <p className="text-sm text-muted-foreground mt-2">Get started by adding your first client.</p>
      <Button asChild className="mt-4">
        <Link href="/admin/client/add">
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Link>
      </Button>
    </div>
  )

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Order</TableHead>


            <TableHead>CreateAt</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients
            .map((client: Client) => (
              <TableRow key={client.Id}>
                <TableCell>
                  <div className="overflow-hidden">
                    <Image
                      src={client?.Image?.url || "/placeholder.svg"}
                      alt={client.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.order}</TableCell>

                <TableCell className="hidden md:table-cell">
                  {formatDateTime(client?.createdAt ?? "")}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={client.isActive}
                      disabled={togglingId === client.Id}
                      onCheckedChange={() => handleToggleActive(client)}
                      aria-label={`Toggle ${client.name} active status`}
                      className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                    />
                    <span
                      className={`text-xs ${client.isActive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                        }`}
                    >
                      {client.isActive ? "Active" : "Inactive"}
                      {togglingId === client.Id && "…"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/client/${client.Id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(client)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Clients"
          description="Manage your clients"
          actionLabel="Add Client"
          actionHref="/admin/client/add"
        />

        {isLoading ? (
          <LoadingIndicator message="Loading Clients..." />
        ) : clients.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {`Showing ${clients.length} client${clients.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {renderTableView()}
            <div className="flex flex-row justify-between items-center p-4 border-t">
              <div className="text-xs text-muted-foreground">
                Showing{" "}
                {totalItems === 0
                  ? 0
                  : Math.min((currentPage - 1) * limit + 1, totalItems)}{" "}
                to {Math.min(currentPage * limit, totalItems)} of {totalItems}{" "}
                clients
              </div>
              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="#"
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
