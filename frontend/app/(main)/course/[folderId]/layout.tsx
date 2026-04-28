"use client";

// ──────────────────────────────────────────────────────
// Course Layout — Strict flex container that sits inside
// the global (main)/layout.tsx and constrains height to
// prevent double scrollbars
// ──────────────────────────────────────────────────────

export default function CourseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full h-full overflow-hidden">
            {children}
        </div>
    );
}
