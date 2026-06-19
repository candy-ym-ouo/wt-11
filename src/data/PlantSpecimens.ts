import { PlantSpecimen } from '../types/GameTypes';

export const PlantSpecimens: Record<number, PlantSpecimen> = {
  1: {
    id: 1,
    name: '银杏',
    family: '银杏科',
    description: '银杏科银杏属落叶乔木，被誉为植物界的"活化石"。叶片呈扇形，秋季变为金黄色，具有极高的观赏和药用价值。',
    primaryColor: 0xffd700,
    secondaryColor: 0xffa500,
    leafColor: 0x4caf50,
    stemColor: 0x8b4513,
    shape: 'ginkgo'
  },
  2: {
    id: 2,
    name: '玫瑰',
    family: '蔷薇科',
    description: '蔷薇科蔷薇属植物，象征爱情与美丽。花瓣层叠排列，香气浓郁，是世界上最受欢迎的花卉之一。',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    leafColor: 0x2e7d32,
    stemColor: 0x5d4037,
    shape: 'rose'
  },
  3: {
    id: 3,
    name: '向日葵',
    family: '菊科',
    description: '菊科向日葵属一年生草本，因花序随太阳转动而得名。种子富含油脂，是重要的油料作物。',
    primaryColor: 0xffc107,
    secondaryColor: 0xffeb3b,
    leafColor: 0x388e3c,
    stemColor: 0x6d4c41,
    shape: 'sunflower'
  },
  4: {
    id: 4,
    name: '薰衣草',
    family: '唇形科',
    description: '唇形科薰衣草属半灌木或矮灌木，具有特殊的芳香气味。常用于制作香料、精油和装饰。',
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    leafColor: 0x689f38,
    stemColor: 0x558b2f,
    shape: 'lavender'
  },
  5: {
    id: 5,
    name: '兰花',
    family: '兰科',
    description: '兰科兰属多年生草本，中国十大名花之一。以高洁典雅著称，与梅、竹、菊并称"四君子"。',
    primaryColor: 0x00bcd4,
    secondaryColor: 0x80deea,
    leafColor: 0x2e7d32,
    stemColor: 0x4e342e,
    shape: 'orchid'
  },
  6: {
    id: 6,
    name: '多肉植物',
    family: '景天科',
    description: '景天科多肉植物，叶片肥厚多汁，具有极强的耐旱能力。形态各异，是近年来广受欢迎的观赏植物。',
    primaryColor: 0x66bb6a,
    secondaryColor: 0xa5d6a7,
    leafColor: 0x81c784,
    stemColor: 0x795548,
    shape: 'succulent'
  },
  101: {
    id: 101,
    name: '樱花',
    family: '蔷薇科',
    description: '【活动限定】蔷薇科樱亚属植物，春日的象征。花瓣粉嫩柔美，花期虽短却绽放极致之美，是春天最浪漫的约定。',
    primaryColor: 0xffb7c5,
    secondaryColor: 0xf8bbd9,
    leafColor: 0x81c784,
    stemColor: 0x795548,
    shape: 'rose'
  },
  102: {
    id: 102,
    name: '睡莲',
    family: '睡莲科',
    description: '【活动限定】睡莲科睡莲属多年生水生草本。花朵浮于水面，昼开夜合，被誉为"水中女神"，象征纯洁与优雅。',
    primaryColor: 0xe1bee7,
    secondaryColor: 0xce93d8,
    leafColor: 0x4caf50,
    stemColor: 0x558b2f,
    shape: 'orchid'
  },
  103: {
    id: 103,
    name: '彼岸花',
    family: '石蒜科',
    description: '【活动限定】石蒜科石蒜属多年生草本。花如龙爪，红艳奇特，花开叶落永不相见，蕴含着神秘的传说与诗意。',
    primaryColor: 0xff1744,
    secondaryColor: 0xff5252,
    leafColor: 0x2e7d32,
    stemColor: 0x5d4037,
    shape: 'sunflower'
  },
  104: {
    id: 104,
    name: '昙花',
    family: '仙人掌科',
    description: '【活动限定】仙人掌科昙花属附生肉质灌木。只在夜间绽放，花期极短，洁白如雪，被誉为"月下美人"，象征刹那间的永恒。',
    primaryColor: 0xfafafa,
    secondaryColor: 0xe0e0e0,
    leafColor: 0x66bb6a,
    stemColor: 0x8bc34a,
    shape: 'ginkgo'
  },
  105: {
    id: 105,
    name: '雪莲',
    family: '菊科',
    description: '【活动限定】菊科风毛菊属多年生草本。生长于高山严寒之地，花朵似莲座洁白如玉，是珍稀的高山药用植物，象征坚韧与纯洁。',
    primaryColor: 0xe3f2fd,
    secondaryColor: 0xbbdefb,
    leafColor: 0x607d8b,
    stemColor: 0x78909c,
    shape: 'succulent'
  }
};

export function getPlantSpecimen(id: number): PlantSpecimen | undefined {
  return PlantSpecimens[id];
}
