'use client';

import { ScriptCard } from './ScriptCard';
import { Script } from '@/types';
import Link from 'next/link';

interface ScriptCardWrapperProps {
  script: Script;
  isLoggedIn?: boolean;
}

export function ScriptCardWrapper({ script, isLoggedIn = false }: ScriptCardWrapperProps) {
  const handleClick = () => {
    if (!isLoggedIn) {
      alert('請先登入以查看劇本詳情');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="group cursor-pointer" onClick={handleClick}>
        <ScriptCard script={script} />
      </div>
    );
  }

  return (
    <Link href={`/scripts/${script.id}`} className="group">
      <ScriptCard script={script} />
    </Link>
  );
} 