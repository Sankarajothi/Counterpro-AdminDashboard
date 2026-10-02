import { redirect } from 'next/navigation';

export default function AccountDeletionRedirect() {
  redirect('/delete-account');
}
