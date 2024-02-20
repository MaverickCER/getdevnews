'use client';
import { getVisitors, updateVisitors } from '@/lib/visitors';
import { useEffect, useState } from 'react';

/**
 * React component representing the number of visitors. In addition to fetching
 * the most recent count of visitors, it also updates the visitor count. This data
 * is displayed further down the page so that the number can load in before the
 * user is able to scroll down.
 */
export default function Visitors() {
  const [visitors, setVisitors] = useState(0);

  const handleVisitors = async () => {
    if (!window) return;
    await updateVisitors();
    const visitors = await getVisitors();
    setVisitors(typeof visitors === 'number' ? visitors : 0);
  };

  useEffect(() => {
    handleVisitors();
  }, []);

  return visitors;
}