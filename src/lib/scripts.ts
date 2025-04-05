import { Event } from '@/types';

export const sampleEvents: Event[] = [
  {
    id: '1',
    title: '銅鑼灣尋寶記',
    description: '探索香港最繁華的購物天堂，穿梭於時尚與傳統之間，解開都市謎題，尋找隱藏的寶藏。這是一段充滿驚喜的冒險之旅！',
    difficulty: 'medium',
    duration: 150,
    maxPlayers: 6,
    price: 299,
    imageUrl: '/images/scripts/causeway-bay.jpg',
    rating: 4.5,
    reviewCount: 128,
    isNew: true,
    isPopular: true,
    tags: ['城市探索', '解謎', '團隊合作'],
    locations: [
      {
        id: 'loc1',
        name: '時代廣場',
        description: '銅鑼灣的地標建築，集購物、娛樂於一身的綜合商場。',
        address: '香港銅鑼灣勿地臣街1號',
        coordinates: {
          latitude: 22.2783,
          longitude: 114.1827
        },
        clues: ['在一樓找到特定的店鋪標誌', '解開電子螢幕上的密碼'],
        order: 1
      },
      {
        id: 'loc2',
        name: '希慎廣場',
        description: '現代化的購物中心，融合了藝術與商業元素。',
        address: '香港銅鑼灣軒尼詩道500號',
        coordinates: {
          latitude: 22.2778,
          longitude: 114.1833
        },
        clues: ['找到藝術裝置背後的線索', '完成互動遊戲獲取密碼'],
        order: 2
      }
    ],
    authorId: 'admin',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-04-05')
  }
]; 