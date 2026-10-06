'use client';

import React from 'react';
import BillViewerPage from './[id]/page';

export default function BillRootPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const id = (searchParams?.id || searchParams?.billId || '') as string;
  return <BillViewerPage params={{ id }} searchParams={searchParams} />;
}
