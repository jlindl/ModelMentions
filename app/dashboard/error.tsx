'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center text-white">
            <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="text-gray-400 max-w-md">
                We encountered an unexpected error while loading this dashboard page.
            </p>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-6 py-2 bg-brand-yellow text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
