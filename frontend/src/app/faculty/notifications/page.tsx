'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyNotificationsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/communication'); }, [router]);
  return null;
}
