export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`poppin-status poppin-status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
