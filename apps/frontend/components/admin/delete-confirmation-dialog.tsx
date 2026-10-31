import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Delete this item?",
  description = "The item is removed from the list and can no longer be used.",
}: {
  open: boolean;
  onClose: () => void;

  onConfirm?: () => Promise<void>;
  defaultToast?: boolean;
  toastMessage?: string;
  /** Overrides the generic heading, e.g. `Delete "Kilogram"?`. */
  title?: string;
  /** Overrides the generic body copy with entity-specific consequences. */
  description?: string;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    await onConfirm();

    onClose();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={isPending ? "pointer-events-none" : ""}
            onClick={() => startTransition(handleConfirm)}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Deleting.." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
