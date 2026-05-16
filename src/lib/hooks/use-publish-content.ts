'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishContent, type PublishContentInput } from '@/lib/api/content';

/**
 * Mutation hook for the /create publish flow. Invalidates the For You feed
 * and the user's own content lists so the new item shows up immediately
 * (PENDING/PROCESSING for audio submissions, READY for text-only ones).
 */
export function usePublishContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: PublishContentInput) => publishContent(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', 'foryou'] });
            queryClient.invalidateQueries({ queryKey: ['my-content'] });
        },
    });
}
