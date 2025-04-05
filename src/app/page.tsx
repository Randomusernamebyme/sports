import { ScriptCard } from '@/components/ui/ScriptCard';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">城市尋寶遊戲</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleScripts.map((script) => (
          <Link href={`/scripts/${script.id}`} key={script.id}>
            <ScriptCard script={script} />
          </Link>
        ))}
      </div>
    </div>
  );
} 