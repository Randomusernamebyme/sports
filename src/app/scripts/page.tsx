import { ScriptCard } from '@/components/ui/ScriptCard';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';

export default function ScriptsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">所有劇本</h1>
        <div className="flex gap-4">
          <select className="px-4 py-2 border rounded-lg">
            <option value="all">所有難度</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
          <select className="px-4 py-2 border rounded-lg">
            <option value="newest">最新上架</option>
            <option value="popular">最受歡迎</option>
            <option value="price-asc">價格由低到高</option>
            <option value="price-desc">價格由高到低</option>
          </select>
        </div>
      </div>

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