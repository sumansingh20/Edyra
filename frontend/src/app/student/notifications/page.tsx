'use client';

// Notifications re-use the communication page's notification tab
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentNotificationsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/communication'); }, [router]);
  return null;
}
