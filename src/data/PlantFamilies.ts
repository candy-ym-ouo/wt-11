import { PlantFamily, FamilyReward } from '../types/GameTypes';

export const PlantFamilies: PlantFamily[] = [
  {
    id: 'ginkgoaceae-ginkgo',
    familyName: '银杏科',
    genusName: '银杏属',
    description: '银杏科是裸子植物中最古老的孑遗植物，被誉为植物界的"活化石"。',
    featureDescription: '落叶乔木，叶片呈扇形，秋季变为金黄色。雌雄异株，种子核果状。',
    primaryColor: 0xffd700,
    secondaryColor: 0xffa500,
    accentColor: 0x4caf50,
    icon: '🍂',
    specimenIds: [1],
    rewards: [
      {
        type: 'score',
        id: 301,
        name: '活化石发现者',
        description: '解锁银杏科家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 401,
        name: '银杏守护者',
        description: '完整收集银杏科家族所有植物',
        icon: '🍂',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-ginkgo',
    illustrationTitle: '金秋银杏图',
    illustrationDescription: '秋日暖阳下，金黄的银杏叶随风飘落，铺满古寺庭院。这是来自亿万年前的生命礼赞，见证了地球的沧海桑田。'
  },
  {
    id: 'rosaceae-rosa',
    familyName: '蔷薇科',
    genusName: '蔷薇属',
    description: '蔷薇科蔷薇属植物是世界著名的观赏花卉，象征着爱情与美丽。',
    featureDescription: '灌木，茎部常有皮刺。奇数羽状复叶，花单生或成伞房花序，花瓣层叠排列，香气浓郁。',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    accentColor: 0x2e7d32,
    icon: '🌹',
    specimenIds: [2],
    rewards: [
      {
        type: 'score',
        id: 302,
        name: '浪漫园丁',
        description: '解锁蔷薇科蔷薇属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 402,
        name: '玫瑰使者',
        description: '完整收集蔷薇科蔷薇属家族所有植物',
        icon: '🌹',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-rosa',
    illustrationTitle: '玫瑰花园',
    illustrationDescription: '晨曦中的玫瑰花园，露珠在花瓣上闪烁。玫瑰的芳香弥漫在空气中，这是大自然最浪漫的馈赠。'
  },
  {
    id: 'rosaceae-cerasus',
    familyName: '蔷薇科',
    genusName: '樱属',
    description: '蔷薇科樱亚属植物，是春日的象征，深受人们喜爱。',
    featureDescription: '落叶乔木，花先叶开放或同时开放。花瓣粉嫩柔美，常为白色或粉色，花期虽短却绽放极致之美。',
    primaryColor: 0xffb7c5,
    secondaryColor: 0xf8bbd9,
    accentColor: 0x81c784,
    icon: '🌸',
    specimenIds: [101],
    isLimited: true,
    rewards: [
      {
        type: 'score',
        id: 303,
        name: '春日限定',
        description: '解锁樱属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'rare',
        requiredProgress: 100,
        value: 800
      },
      {
        type: 'badge',
        id: 403,
        name: '樱花赏客',
        description: '完整收集樱属家族所有植物',
        icon: '🌸',
        rarity: 'epic',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-cerasus',
    illustrationTitle: '樱花吹雪',
    illustrationDescription: '春风轻拂，樱花瓣如雪般飘落。漫步在樱花道上，仿佛置身于粉色的梦幻世界，这是春天最浪漫的约定。'
  },
  {
    id: 'asteraceae-helianthus',
    familyName: '菊科',
    genusName: '向日葵属',
    description: '菊科向日葵属植物，因花序随太阳转动而得名，是光明与希望的象征。',
    featureDescription: '一年生高大草本。茎直立，叶互生。头状花序极大，单生于茎顶或枝端。种子富含油脂，是重要的油料作物。',
    primaryColor: 0xffc107,
    secondaryColor: 0xffeb3b,
    accentColor: 0x388e3c,
    icon: '🌻',
    specimenIds: [3],
    rewards: [
      {
        type: 'score',
        id: 304,
        name: '阳光使者',
        description: '解锁向日葵属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 404,
        name: '向阳而生',
        description: '完整收集向日葵属家族所有植物',
        icon: '🌻',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-helianthus',
    illustrationTitle: '向日葵花海',
    illustrationDescription: '金色的向日葵花海在阳光下熠熠生辉。每一朵花都坚定地朝向太阳，这是对光明最执着的追求，是生命力的极致展现。'
  },
  {
    id: 'asteraceae-saussurea',
    familyName: '菊科',
    genusName: '风毛菊属',
    description: '菊科风毛菊属植物，多生长于高海拔严寒之地，具有极强的生命力。',
    featureDescription: '多年生草本。根状茎粗壮，颈部被褐色纤维状撕裂的叶柄残迹。叶密集，叶片椭圆形。头状花序多数，在茎顶密集成伞房花序或总状花序。',
    primaryColor: 0xe3f2fd,
    secondaryColor: 0xbbdefb,
    accentColor: 0x607d8b,
    icon: '❄️',
    specimenIds: [105],
    isLimited: true,
    rewards: [
      {
        type: 'score',
        id: 305,
        name: '高山探险家',
        description: '解锁风毛菊属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'rare',
        requiredProgress: 100,
        value: 800
      },
      {
        type: 'badge',
        id: 405,
        name: '雪莲守护人',
        description: '完整收集风毛菊属家族所有植物',
        icon: '❄️',
        rarity: 'epic',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-saussurea',
    illustrationTitle: '雪山雪莲',
    illustrationDescription: '在皑皑白雪的高山之巅，一朵雪莲傲然绽放。它历经严寒，却依然纯洁如玉，这是生命力在极端环境下的奇迹。'
  },
  {
    id: 'lamiaceae-lavandula',
    familyName: '唇形科',
    genusName: '薰衣草属',
    description: '唇形科薰衣草属植物，具有特殊的芳香气味，被誉为"芳香之王"。',
    featureDescription: '半灌木或矮灌木。茎直立，被星状绒毛。叶条形或披针状条形，被灰白色星状绒毛。轮伞花序，花紫蓝色，具有强烈的芳香。',
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    accentColor: 0x689f38,
    icon: '💜',
    specimenIds: [4],
    rewards: [
      {
        type: 'score',
        id: 306,
        name: '芳香收藏家',
        description: '解锁薰衣草属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 406,
        name: '薰衣草骑士',
        description: '完整收集薰衣草属家族所有植物',
        icon: '💜',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-lavandula',
    illustrationTitle: '紫色花田',
    illustrationDescription: '一望无际的薰衣草花田在微风中轻轻摇曳，紫色的花海与蓝天相接。空气中弥漫着迷人的芳香，这是普罗旺斯最浪漫的色彩。'
  },
  {
    id: 'orchidaceae-cymbidium',
    familyName: '兰科',
    genusName: '兰属',
    description: '兰科兰属植物，中国十大名花之一，以高洁典雅著称。',
    featureDescription: '多年生草本。根状茎粗壮，叶常绿，带状或狭椭圆形。花葶从假鳞茎基部发出，直立或外弯。花色泽变化较大，常为淡黄绿色，有香气。',
    primaryColor: 0x00bcd4,
    secondaryColor: 0x80deea,
    accentColor: 0x2e7d32,
    icon: '🪻',
    specimenIds: [5],
    rewards: [
      {
        type: 'score',
        id: 307,
        name: '君子收藏家',
        description: '解锁兰属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 407,
        name: '兰心蕙质',
        description: '完整收集兰属家族所有植物',
        icon: '🪻',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-cymbidium',
    illustrationTitle: '幽谷兰香',
    illustrationDescription: '在幽静的山谷中，一丛兰花悄然绽放。它不与群芳争艳，却以其高洁典雅的气质，成为文人墨客笔下的"四君子"之一。'
  },
  {
    id: 'crassulaceae-sedum',
    familyName: '景天科',
    genusName: '景天属',
    description: '景天科多肉植物，叶片肥厚多汁，具有极强的耐旱能力。',
    featureDescription: '一年生或多年生草本，少有半灌木。叶互生、对生或轮生，常为肉质，全缘或有锯齿。花序通常聚伞状，花两性，辐射对称。',
    primaryColor: 0x66bb6a,
    secondaryColor: 0xa5d6a7,
    accentColor: 0x81c784,
    icon: '🌵',
    specimenIds: [6],
    rewards: [
      {
        type: 'score',
        id: 308,
        name: '多肉爱好者',
        description: '解锁景天属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'common',
        requiredProgress: 100,
        value: 500
      },
      {
        type: 'badge',
        id: 408,
        name: '景天守护',
        description: '完整收集景天属家族所有植物',
        icon: '🌵',
        rarity: 'rare',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-sedum',
    illustrationTitle: '多肉植物园',
    illustrationDescription: '阳光洒落在形态各异的多肉植物上，圆润饱满的叶片闪耀着生命的光泽。这些来自沙漠的精灵，用它们独特的方式诠释着生命的坚韧。'
  },
  {
    id: 'nymphaeaceae-nymphaea',
    familyName: '睡莲科',
    genusName: '睡莲属',
    description: '睡莲科睡莲属多年生水生草本，被誉为"水中女神"。',
    featureDescription: '多年生水生草本。根状茎肥厚。叶二型：浮水叶圆形或卵形，基部具弯缺；沉水叶薄膜质，脆弱。花大形、美丽，浮在或高出水面，昼开夜合。',
    primaryColor: 0xe1bee7,
    secondaryColor: 0xce93d8,
    accentColor: 0x4caf50,
    icon: '🪷',
    specimenIds: [102],
    isLimited: true,
    rewards: [
      {
        type: 'score',
        id: 309,
        name: '水域精灵',
        description: '解锁睡莲属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'rare',
        requiredProgress: 100,
        value: 800
      },
      {
        type: 'badge',
        id: 409,
        name: '荷塘月色',
        description: '完整收集睡莲属家族所有植物',
        icon: '🪷',
        rarity: 'epic',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-nymphaea',
    illustrationTitle: '荷塘月色',
    illustrationDescription: '月光下的池塘，睡莲悄然绽放。花瓣如玉，浮于水面，与倒影相映成趣。这是夜色中最温柔的风景，象征着纯洁与优雅。'
  },
  {
    id: 'amaryllidaceae-lycoris',
    familyName: '石蒜科',
    genusName: '石蒜属',
    description: '石蒜科石蒜属多年生草本，花如龙爪，红艳奇特，蕴含着神秘的传说与诗意。',
    featureDescription: '多年生草本。鳞茎近球形。秋季出叶，叶狭带状。花茎先叶抽出，顶生伞形花序，花被裂片狭倒披针形，强度皱缩和反卷。花开叶落，永不相见。',
    primaryColor: 0xff1744,
    secondaryColor: 0xff5252,
    accentColor: 0x2e7d32,
    icon: '🌺',
    specimenIds: [103],
    isLimited: true,
    rewards: [
      {
        type: 'score',
        id: 310,
        name: '彼岸寻花人',
        description: '解锁石蒜属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'rare',
        requiredProgress: 100,
        value: 800
      },
      {
        type: 'badge',
        id: 410,
        name: '曼珠沙华',
        description: '完整收集石蒜属家族所有植物',
        icon: '🌺',
        rarity: 'epic',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-lycoris',
    illustrationTitle: '彼岸花开',
    illustrationDescription: '在通往彼岸的路上，成片的彼岸花如火红的海洋。花开叶落，永不相见，这是生命中最凄美动人的传说，承载着无尽的思念。'
  },
  {
    id: 'cactaceae-epiphyllum',
    familyName: '仙人掌科',
    genusName: '昙花属',
    description: '仙人掌科昙花属附生肉质灌木，只在夜间绽放，花期极短，被誉为"月下美人"。',
    featureDescription: '附生肉质灌木，茎上具有节。老茎圆柱状，木质化。花单生于枝侧的小窠，漏斗状，于夜间开放，芳香，洁白如雪，花期仅数小时。',
    primaryColor: 0xfafafa,
    secondaryColor: 0xe0e0e0,
    accentColor: 0x8bc34a,
    icon: '🌙',
    specimenIds: [104],
    isLimited: true,
    rewards: [
      {
        type: 'score',
        id: 311,
        name: '月下赏花人',
        description: '解锁昙花属家族获得的奖励积分',
        icon: '🏆',
        rarity: 'rare',
        requiredProgress: 100,
        value: 800
      },
      {
        type: 'badge',
        id: 411,
        name: '刹那永恒',
        description: '完整收集昙花属家族所有植物',
        icon: '🌙',
        rarity: 'epic',
        requiredProgress: 100
      }
    ],
    illustrationKey: 'family-illustration-epiphyllum',
    illustrationTitle: '昙花一现',
    illustrationDescription: '在静谧的月夜，昙花悄然绽放。洁白的花瓣如雪般纯净，芳香四溢。虽然只有短短数小时，却将生命的美丽演绎到极致，这是刹那间的永恒。'
  }
];

export const FamilyBadgeIds = [401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411];

export function getPlantFamilyById(id: string): PlantFamily | undefined {
  return PlantFamilies.find(f => f.id === id);
}

export function getPlantFamilyBySpecimenId(specimenId: number): PlantFamily | undefined {
  return PlantFamilies.find(f => f.specimenIds.includes(specimenId));
}

export function getPlantFamiliesByFamilyName(familyName: string): PlantFamily[] {
  return PlantFamilies.filter(f => f.familyName === familyName);
}

export function getAllFamilyRewards(): FamilyReward[] {
  return PlantFamilies.flatMap(f => f.rewards);
}

export function getFamilyRewardById(rewardId: number): FamilyReward | undefined {
  return getAllFamilyRewards().find(r => r.id === rewardId);
}

export function getUnlockedFamilyProgress(
  family: PlantFamily,
  unlockedSpecimenIds: number[]
): number {
  if (family.specimenIds.length === 0) return 0;
  const unlockedCount = family.specimenIds.filter(id => unlockedSpecimenIds.includes(id)).length;
  return Math.round((unlockedCount / family.specimenIds.length) * 100);
}

export function isFamilyComplete(
  family: PlantFamily,
  unlockedSpecimenIds: number[]
): boolean {
  return family.specimenIds.every(id => unlockedSpecimenIds.includes(id));
}
