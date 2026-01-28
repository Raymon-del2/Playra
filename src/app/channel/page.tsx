'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '@/app/actions/profile';

export default function ChannelPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToOwnChannel = async () => {
      const profile = await getActiveProfile();
      if (profile?.id) {
        router.replace(`/channel/${profile.id}`);
      } else {
        router.replace('/select-profile');
      }
    };
    redirectToOwnChannel();
  }, [router]);

  return null;
}
