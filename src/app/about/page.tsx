export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">關於我們</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">我們的使命</h2>
          <p className="text-gray-600 mb-4">
            我們致力於為城市探索愛好者提供獨特的解謎尋寶體驗。通過結合劇本殺元素和城市探索，
            我們希望讓參與者以全新的視角發現城市的魅力。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">我們的特色</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>精心設計的解謎路線</li>
            <li>融合劇本殺元素的遊戲體驗</li>
            <li>專業的遊戲設計團隊</li>
            <li>豐富的城市探索經驗</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">聯絡我們</h2>
          <p className="text-gray-600">
            如果您有任何問題或建議，歡迎通過以下方式聯絡我們：
          </p>
          <div className="mt-4 text-gray-600">
            <p>📧 Email: contact@citytreasure.com</p>
            <p>📱 電話: (02) 1234-5678</p>
            <p>📍 地址: 台北市信義區信義路五段7號</p>
          </div>
        </div>
      </div>
    </div>
  );
} 