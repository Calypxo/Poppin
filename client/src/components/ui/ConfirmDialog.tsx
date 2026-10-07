import Modal from "./Modal";
import Button from "./Button";
export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Keep it",
  variant = "danger",
  onConfirm,
  onClose,
  loading = false,
}: ConfirmOptions & {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      size="sm"
      title={title}
      description={description}
      onClose={onClose}
      dismissible={!loading}
      footer={
        <>
          <Button
            variant="outline"
            autoFocus
            data-dialog-initial-focus
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
