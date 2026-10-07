import { useRef, useState } from "react";
import { uploadImage } from "../../services/uploadService";
import { errorMessage } from "../../hooks/useResource";
import { ImagePlus, Upload } from "lucide-react";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { useUI } from "../ui/context";
export default function ImageUploader({
  value,
  onChange,
  label,
  onBusy,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  onBusy?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { confirm, toast } = useUI();
  return (
    <div className="poppin-image-uploader">
      <strong className="flex items-center gap-2">
        <ImagePlus size={18} aria-hidden="true" />
        {label}
      </strong>
      {value && (
        <div className="poppin-upload-preview">
          <img src={value} alt={`${label} preview`} />
        </div>
      )}
      <div className="poppin-actions">
        <Button
          type="button"
          disabled={busy}
          loading={busy}
          icon={<Upload size={16} aria-hidden="true" />}
          onClick={() => input.current?.click()}
        >
          {busy ? "Uploading…" : value ? "Change image" : "Choose image"}
        </Button>
        {value && (
          <Button
            variant="outline"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (
                await confirm({
                  title: "Remove this image?",
                  description:
                    "The image will be removed from this form. Save your changes to update the record.",
                  confirmLabel: "Remove image",
                  cancelLabel: "Keep image",
                })
              ) {
                onChange("");
                toast.info("Image removed from this form.");
              }
            }}
          >
            Remove image
          </Button>
        )}
      </div>
      <input
        aria-label={`Choose ${label}`}
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 5 * 1024 * 1024
          ) {
            setError("Choose a JPG, PNG or WEBP image of 5 MB or less.");
            return;
          }
          setBusy(true);
          onBusy?.(true);
          try {
            onChange((await uploadImage(file)).secureUrl);
            toast.success(
              "Image uploaded. Save your changes when you’re ready.",
            );
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
            onBusy?.(false);
          }
        }}
      />
      <small>JPG, PNG or WEBP · Maximum 5 MB</small>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
