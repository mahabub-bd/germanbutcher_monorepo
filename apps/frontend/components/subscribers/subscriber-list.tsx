'use client';

import { PaginationComponent } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { deleteData, fetchDataPagination } from '@/utils/api-utils';
import type { Subscriber } from '@/utils/types';
import { Mail, MoreHorizontal, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import DeleteConfirmationDialog from '../admin/delete-confirmation-dialog';
import { LoadingIndicator } from '../admin/loading-indicator';

interface SubscriberListProps {
  initialPage: number;
  initialLimit: number;
}

export function SubscriberList({
  initialPage,
  initialLimit,
}: SubscriberListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<Subscriber | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit]);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await fetchDataPagination<{
        data: Subscriber[];
        total: number;
        totalPages: number;
      }>(`subscribers?${params.toString()}`);
      setSubscribers(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers. Please try again.');
      setSubscribers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSubscriber) return;

    try {
      await deleteData('subscribers', selectedSubscriber.id);
      fetchSubscribers();
      toast.success('Subscriber deleted successfully');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber. Please try again.');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Mail className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No subscribers found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by adding your first subscriber.
      </p>
    </div>
  );

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>

            <TableHead className="hidden md:table-cell">
              Subscribed Date
            </TableHead>

            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers?.map((subscriber: Subscriber) => (
            <TableRow key={subscriber.id}>
              <TableCell className="font-medium">{subscriber.email}</TableCell>

              <TableCell className="hidden md:table-cell">
                {subscriber.createdAt
                  ? formatDateTime(subscriber.createdAt)
                  : 'N/A'}
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
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(subscriber)}
                    >
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
  );

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading Subscribers..." />
          ) : subscribers.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${subscribers.length} of ${totalItems} subscribers`}
            </p>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
