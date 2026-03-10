/**
 * Loading placeholder block.
 *
 * Use this when content is still loading but the page layout should stay
 * stable and easy to scan.
 */
export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`skeleton rounded-xl bg-black/5 ${className}`} />;
}
