export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">城市尋寶遊戲</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 這裡之後會放劇本卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">示例劇本</h2>
          <p className="text-gray-600">這是一個示例劇本描述</p>
        </div>
      </div>
    </div>
  )
} 