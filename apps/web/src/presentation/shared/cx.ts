/** Junta classes CSS ignorando valores falsos. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
