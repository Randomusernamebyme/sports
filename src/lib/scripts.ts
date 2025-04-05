import { Script } from '@/types';

export const sampleScripts: Script[] = [
  {
    id: '1',
    title: '銅鑼灣尋寶記',
    description: '探索香港最繁華的購物天堂，穿梭於時尚與傳統之間，解開都市謎題，尋找隱藏的寶藏。這是一段充滿驚喜的冒險之旅！',
    difficulty: 'medium',
    duration: 150,
    price: 299,
    coverImage: '/images/scripts/causeway-bay.jpg',
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
        clues: [],
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
        clues: [],
        order: 2
      }
    ],
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-04-05')
  }
]; 