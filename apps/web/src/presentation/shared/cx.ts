/** Joins CSS classes, skipping falsy values. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
