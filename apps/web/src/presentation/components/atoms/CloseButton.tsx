export function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="close" onClick={onClick} aria-label={label}>
      ×
    </button>
  );
}
