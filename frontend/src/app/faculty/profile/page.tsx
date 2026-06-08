'use client';
export const dynamic = 'force-dynamic';

// Faculty profile re-uses the student profile component
import ProfilePage from '@/app/student/profile/page';

export default function FacultyProfilePage() {
  return <ProfilePage />;
}
