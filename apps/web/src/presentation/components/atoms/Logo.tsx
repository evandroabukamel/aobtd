/** Map pin with a plane inside. Decorative: the text next to it names the site. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path className="logo-pin" d="M12 1.5C7.3 1.5 3.5 5.1 3.5 9.7 3.5 15.6 12 22.5 12 22.5s8.5-6.9 8.5-12.8c0-4.6-3.8-8.2-8.5-8.2z" />
      <path
        className="logo-plane"
        transform="translate(6.6 4.2) scale(0.45)"
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </svg>
  );
}
