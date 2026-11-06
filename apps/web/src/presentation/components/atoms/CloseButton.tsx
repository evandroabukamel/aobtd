export function CloseButton({ onClick, label = 'Fechar' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="close" onClick={onClick} aria-label={label}>
      ×
    </button>
  );
}
