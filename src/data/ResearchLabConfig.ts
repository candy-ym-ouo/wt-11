import {
  PlantCategoryInfo,
  PlantCategory,
  KnowledgeEntry,
  ResearchLevelConfig
} from '../types/GameTypes';
import { PlantSpecimens } from './PlantSpecimens';

export const PlantCategories: PlantCategoryInfo[] = [
  {
    id: 'gymnosperm',
    name: '裸子植物',
    description: '种子裸露，无果皮包被的古老植物类群',
    icon: '🌲',
    color: 0x4caf50
  },
  {
    id: 'angiosperm_dicot',
    name: '双子叶植物',
    description: '具有两片子叶，叶脉网状的开花植物',
    icon: '🌸',
    color: 0xe91e63
  },
  {
    id: 'angiosperm_monocot',
    name: '单子叶植物',
    description: '具有一片子叶，叶脉平行的开花植物',
    icon: '🌾',
    color: 0xffc107
  },
  {
    id: 'succulent',
    name: '多肉植物',
    description: '叶片或茎肥厚多汁，能储存水分的耐旱植物',
    icon: '🌵',
    color: 0x66bb6a
  },
  {
    id: 'aquatic',
    name: '水生植物',
    description: '生长在水中或水边的植物类群',
    icon: '🪷',
    color: 0x00bcd4
  },
  {
    id: 'alpine',
    name: '高山植物',
    description: '生长在高海拔严酷环境中的耐寒植物',
    icon: '🏔️',
    color: 0x90caf9
  }
];

export const SpecimenCategoryMap: Record<number, PlantCategory> = {
  1: 'gymnosperm',
  2: 'angiosperm_dicot',
  3: 'angiosperm_dicot',
  4: 'angiosperm_dicot',
  5: 'angiosperm_monocot',
  6: 'succulent',
  101: 'angiosperm_dicot',
  102: 'aquatic',
  103: 'angiosperm_monocot',
  104: 'succulent',
  105: 'alpine'
};

export const KnowledgeCategoryInfo = {
  biology: { name: '形态特征', icon: '🔬', color: 0x2196f3 },
  ecology: { name: '生态习性', icon: '🌍', color: 0x4caf50 },
  culture: { name: '文化意义', icon: '📜', color: 0x9c27b0 },
  usage: { name: '实用价值', icon: '💊', color: 0xff9800 }
};

export const KnowledgeEntries: KnowledgeEntry[] = [
  // 银杏
  {
    id: 'ginkgo-1',
    specimenId: 1,
    title: '扇形叶片',
    content: '银杏的叶片呈独特的扇形，顶端有波状缺刻，叶脉从叶柄顶端射出呈二叉状分枝，这在现代植物中极为罕见。秋季叶片会因叶绿素分解而呈现灿烂的金黄色。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'ginkgo-2',
    specimenId: 1,
    title: '活化石',
    content: '银杏是现存最古老的裸子植物之一，起源于2.7亿年前的二叠纪。在第四纪冰川时期，大部分地区的银杏灭绝，仅在中国部分地区幸存，因此被誉为"植物界的大熊猫"。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'ginkgo-3',
    specimenId: 1,
    title: '银杏树与中国文化',
    content: '银杏在中国传统文化中象征长寿与坚韧。许多古刹名寺中都有千年古银杏，被人们视为神树。山东省莒县浮来山定林寺的古银杏已有4000多年树龄，相传为周公所植。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'ginkgo-4',
    specimenId: 1,
    title: '药用价值',
    content: '银杏叶提取物富含黄酮类和萜内酯类化合物，可改善血液循环、保护神经细胞，是治疗心脑血管疾病的常用药材。但需注意银杏种子（白果）含有微量毒素，不可过量食用。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 玫瑰
  {
    id: 'rose-1',
    specimenId: 2,
    title: '层叠花瓣',
    content: '玫瑰的花由多层花瓣组成，从外向内逐层排列，形成饱满的杯状花冠。花瓣边缘常呈波浪状卷曲，表面有细密的绒毛，赋予其独特的质感。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'rose-2',
    specimenId: 2,
    title: '带刺的藤蔓',
    content: '玫瑰属于蔷薇科蔷薇属，为落叶灌木。茎干上密布尖刺，这是植物的自我保护机制，可防止草食动物啃食。这些刺其实是表皮的突起物，而非真正的刺。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'rose-3',
    specimenId: 2,
    title: '爱情之花',
    content: '在古希腊神话中，玫瑰是爱神阿芙洛狄忒的圣花。红玫瑰象征热烈的爱情，粉玫瑰代表初恋，白玫瑰寓意纯洁。情人节赠送玫瑰的传统已延续数百年。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'rose-4',
    specimenId: 2,
    title: '玫瑰精油',
    content: '玫瑰精油被誉为"精油之王"，约3000-5000公斤玫瑰花瓣才能提取1公斤精油。其香气能舒缓情绪、调节内分泌，广泛用于高级香水、护肤品和芳香疗法。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 向日葵
  {
    id: 'sunflower-1',
    specimenId: 3,
    title: '头状花序',
    content: '向日葵的"花朵"实际上是由上千朵小花组成的头状花序。外围的舌状花负责吸引传粉者，中央的管状花则能产生种子，这些小花呈完美的斐波那契螺旋排列。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'sunflower-2',
    specimenId: 3,
    title: '向日性',
    content: '向日葵的花盘会随着太阳从东向西转动，这种现象称为"向日性"。研究发现这是由茎部两侧的生长速率差异造成的。不过，当花朵完全开放后，花盘通常会固定朝向东方。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'sunflower-3',
    specimenId: 3,
    title: '太阳神的象征',
    content: '在古希腊神话中，向日葵是爱慕太阳神阿波罗的水泽仙女克丽泰所化。印加帝国将向日葵奉为太阳神的象征，其黄金饰品中常有向日葵的图案。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'sunflower-4',
    specimenId: 3,
    title: '油料作物之王',
    content: '葵花籽含油量高达40%-50%，富含不饱和脂肪酸和维生素E，是世界四大油料作物之一。向日葵还能吸收土壤中的重金属，用于修复污染土地。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 薰衣草
  {
    id: 'lavender-1',
    specimenId: 4,
    title: '穗状花序',
    content: '薰衣草的花由多朵小花组成轮伞花序，密集排列成穗状。小花通常为淡紫色或蓝紫色，花冠呈二唇形，是唇形科植物的典型特征。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'lavender-2',
    specimenId: 4,
    title: '地中海故乡',
    content: '薰衣草原产于地中海沿岸，喜欢阳光充足、排水良好的环境。其叶片表面有蜡质层，可减少水分蒸发，是适应夏季干燥气候的特征。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'lavender-3',
    specimenId: 4,
    title: '普罗旺斯的紫色',
    content: '法国普罗旺斯的薰衣草田举世闻名，每年6-8月紫色花海连绵起伏。薰衣草(Lavender)一词源自拉丁语"Lavare"，意为"洗涤"，因为古罗马人常用它来沐浴熏香。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'lavender-4',
    specimenId: 4,
    title: '芳香疗法',
    content: '薰衣草精油是最常用的芳香精油之一，具有镇静安神、改善睡眠、缓解焦虑的功效。将薰衣草花制作成香囊，放入衣柜可防虫留香，是欧洲传统的生活智慧。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 兰花
  {
    id: 'orchid-1',
    specimenId: 5,
    title: '独特的唇瓣',
    content: '兰花的花朵结构高度特化，其中一片花瓣特化为唇瓣（唇形花瓣），形状各异，是吸引特定传粉昆虫的"停机坪"。雄蕊和雌蕊合生成蕊柱，这是兰科植物独有的结构。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'orchid-2',
    specimenId: 5,
    title: '菌根共生',
    content: '兰花种子极其微小，不含胚乳，在自然条件下必须与特定真菌共生才能萌发。兰花一生都依赖菌根真菌提供养分，这种共生关系已延续数千万年。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'orchid-3',
    specimenId: 5,
    title: '君子之花',
    content: '中国兰花栽培历史超过2000年，与梅、竹、菊并称"四君子"，象征高洁典雅。孔子曾赞兰为"王者香"，文人墨客常以画兰、写兰来表达品格追求。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'orchid-4',
    specimenId: 5,
    title: '香料之王-香荚兰',
    content: '香荚兰（Vanilla）是兰科植物中最重要的经济作物，其豆荚提取物是世界上最受欢迎的食用香料之一。墨西哥阿兹特克人早在数百年前就用香荚兰调配巧克力饮品。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 多肉植物
  {
    id: 'succulent-1',
    specimenId: 6,
    title: '肉质叶片',
    content: '多肉植物的叶片肥厚多汁，由特殊的储水组织构成。叶表有厚厚的角质层和蜡质白粉，气孔数量少且常下陷，这些特征都是为了最大限度地减少水分蒸发。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'succulent-2',
    specimenId: 6,
    title: 'CAM光合作用',
    content: '多肉植物多采用景天酸代谢(CAM)途径进行光合作用：夜间打开气孔吸收二氧化碳并储存为有机酸，白天气孔关闭以保水，再利用储存的碳进行光合作用。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'succulent-3',
    specimenId: 6,
    title: '多肉文化热潮',
    content: '近年来多肉植物因其小巧可爱、造型多变而风靡全球。韩国和日本是多肉培育的重镇，培育出众多色彩斑斓的园艺品种。多肉爱好者社区被称为"肉坑"。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'succulent-4',
    specimenId: 6,
    title: '芦荟与药用',
    content: '芦荟是最知名的药用多肉植物，其胶状汁液含有75种以上的活性成分，可用于治疗烧伤、促进伤口愈合、滋润皮肤。库拉索芦荟是应用最广泛的品种。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 樱花
  {
    id: 'sakura-1',
    specimenId: 101,
    title: '柔美花瓣',
    content: '樱花花瓣通常为淡粉红色，每朵花有5枚花瓣，瓣尖常有小缺口。花蕾时颜色较深，开放后逐渐变浅，花瓣质感极薄，轻盈如纱，微风中便会纷纷飘落。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'sakura-2',
    specimenId: 101,
    title: '短暂花期',
    content: '樱花的花期极短，单朵花仅开放约7天就会凋谢，整棵树从初开到凋零不过两周。这种"瞬间绽放即凋零"的生命轨迹，深刻影响了日本的美学意识。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'sakura-3',
    specimenId: 101,
    title: '花见传统',
    content: '"花见"（赏花）是日本延续千年的春日习俗，人们在樱花树下设宴聚会，一边赏樱一边吟诗作乐。上野公园、新宿御苑、京都哲学之道都是著名的赏樱名所。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'sakura-4',
    specimenId: 101,
    title: '樱花与饮食',
    content: '樱花不仅可观赏，还能入馔。盐渍樱花用于制作樱花饼、樱花茶；樱花叶可包裹日式点心。不过需注意，野生樱花含有微量氰苷，只有经过特殊处理才能食用。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 睡莲
  {
    id: 'waterlily-1',
    specimenId: 102,
    title: '漂浮叶片',
    content: '睡莲的叶片呈圆形或卵圆形，表面有蜡质层使水形成水珠滚落。叶片背面有特殊的通气组织，通过叶柄将空气输送至水下的根系，是水生植物的典型适应特征。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'waterlily-2',
    specimenId: 102,
    title: '昼开夜合',
    content: '大多数睡莲品种在白天开花、夜晚闭合，这种节律由光照和温度共同控制。科学家研究发现，睡莲花瓣的开闭是由花瓣两侧细胞的生长速率差异驱动的。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'waterlily-3',
    specimenId: 102,
    title: '莲与睡莲',
    content: '睡莲常被误称为"莲花"，但两者属于不同科属。睡莲（睡莲科）的叶片漂浮在水面，而莲（莲科）的叶片和花朵都挺出水面。古埃及壁画中的"莲"实际上是睡莲。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'waterlily-4',
    specimenId: 102,
    title: '古埃及圣花',
    content: '蓝色睡莲是古埃及的神圣植物，象征太阳与重生。壁画和雕塑中经常可见法老手持睡莲的形象。睡莲根茎富含淀粉，在部分地区可作为食物食用。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 彼岸花
  {
    id: 'spiderlily-1',
    specimenId: 103,
    title: '龙爪花序',
    content: '彼岸花的花被片极度向后反卷，形如龙爪，雄蕊和雌蕊细长突出，使得整朵花看起来像蜘蛛的长腿，这也是其英文名"Spider Lily"的由来。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'spiderlily-2',
    specimenId: 103,
    title: '花叶不相见',
    content: '彼岸花有一个奇特的习性：花先叶开放，花谢后叶子才从鳞茎抽出；叶子在夏季枯萎后，花葶再从地面长出。因此被称作"花开叶落，叶生花谢，永不得相见"。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'spiderlily-3',
    specimenId: 103,
    title: '冥界的接引之花',
    content: '彼岸花在日本被称为"曼珠沙华"，是《法华经》中四华之一。传说此花生长在三途河畔，是冥界唯一的花朵，花香能唤起死者生前的记忆，引导灵魂往生。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'spiderlily-4',
    specimenId: 103,
    title: '有毒但有用',
    content: '彼岸花的鳞茎含有多种生物碱（如石蒜碱），有剧毒，误食可导致呕吐、腹泻甚至休克。但经过严格炮制后，可作为祛痰、利尿的中药材，也用于稻田防虫。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 昙花
  {
    id: 'epiphyllum-1',
    specimenId: 104,
    title: '巨大白色花冠',
    content: '昙花的花是仙人掌科中最大的花之一，直径可达30厘米。纯白色的花瓣层层叠叠如白纱，开放时会散发出浓郁的芳香，以吸引夜间活动的蛾类传粉。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'epiphyllum-2',
    specimenId: 104,
    title: '月下美人',
    content: '昙花原产于墨西哥的热带沙漠，白天酷热干燥，选择在凉爽的夜间开花是为了适应环境。从开放到凋谢仅约4-5小时，因此有"昙花一现"之说。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'epiphyllum-3',
    specimenId: 104,
    title: '韦陀花的传说',
    content: '相传昙花原是花神，因爱慕照顾自己的青年韦陀而触犯天条。玉帝罚她每年只能开花一瞬，让她永远无法再见心上人。因此昙花又称"韦陀花"，寓意永恒的守候。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'epiphyllum-4',
    specimenId: 104,
    title: '昙花入膳',
    content: '昙花不仅是观赏名花，还可食用。新鲜昙花可煮汤、清炒或凉拌，口感滑嫩，据说有清热润肺、化痰止咳的功效，是岭南地区的特色时令食材。',
    requiredLevel: 4,
    category: 'usage'
  },
  // 雪莲
  {
    id: 'snowlotus-1',
    specimenId: 105,
    title: '莲座状株形',
    content: '雪莲的叶片密集排列成莲座状，紧贴地面生长，这种形态可以在强风环境中减少水分蒸发并获得更多热量。植株表面密被白色绵毛，如白雪覆盖。',
    requiredLevel: 1,
    category: 'biology'
  },
  {
    id: 'snowlotus-2',
    specimenId: 105,
    title: '极端环境适应者',
    content: '雪莲生长在海拔3000-5000米的高山流石滩，那里紫外线强烈、昼夜温差大、氧气稀薄。雪莲体内含有大量的可溶性糖和脯氨酸，可保护细胞免受冻害。',
    requiredLevel: 2,
    category: 'ecology'
  },
  {
    id: 'snowlotus-3',
    specimenId: 105,
    title: '高山神草',
    content: '雪莲在藏医药中被誉为"百草之王"，是象征圣洁吉祥的神草。传说王母娘娘在天山瑶池沐浴时，撒下的花瓣化作了雪莲，守护着雪域高原。',
    requiredLevel: 3,
    category: 'culture'
  },
  {
    id: 'snowlotus-4',
    specimenId: 105,
    title: '珍贵药材',
    content: '雪莲含有多种黄酮类、生物碱和多糖类活性成分，传统医学中用于治疗风湿性关节炎、痛经等症。但由于过度采挖，野生雪莲已濒临灭绝，现已被列为国家二级保护植物。',
    requiredLevel: 4,
    category: 'usage'
  }
];

export const ResearchLevels: ResearchLevelConfig[] = [
  { level: 1, expRequired: 0, title: '见习研究员', researchPointBonus: 1, unlockMessage: '欢迎加入植物图鉴研究室！' },
  { level: 2, expRequired: 100, title: '初级研究员', researchPointBonus: 1.2, unlockMessage: '解锁基础研究能力！' },
  { level: 3, expRequired: 300, title: '中级研究员', researchPointBonus: 1.5, unlockMessage: '可深入研究生态习性了！' },
  { level: 4, expRequired: 700, title: '高级研究员', researchPointBonus: 2, unlockMessage: '解锁文化与实用知识！' },
  { level: 5, expRequired: 1500, title: '植物学专家', researchPointBonus: 2.5, unlockMessage: '恭喜成为植物学专家！' }
];

export function getCategoryById(id: PlantCategory): PlantCategoryInfo | undefined {
  return PlantCategories.find(c => c.id === id);
}

export function getSpecimenCategory(specimenId: number): PlantCategoryInfo | undefined {
  const categoryId = SpecimenCategoryMap[specimenId];
  return categoryId ? getCategoryById(categoryId) : undefined;
}

export function getKnowledgeBySpecimen(specimenId: number): KnowledgeEntry[] {
  return KnowledgeEntries.filter(k => k.specimenId === specimenId);
}

export function getResearchLevel(totalExp: number): ResearchLevelConfig {
  let level = ResearchLevels[0];
  for (const config of ResearchLevels) {
    if (totalExp >= config.expRequired) {
      level = config;
    }
  }
  return level;
}

export function getNextResearchLevel(totalExp: number): ResearchLevelConfig | undefined {
  for (const config of ResearchLevels) {
    if (totalExp < config.expRequired) {
      return config;
    }
  }
  return undefined;
}

export function getExpToNextLevel(totalExp: number): { current: number; required: number; progress: number } {
  const currentLevel = getResearchLevel(totalExp);
  const nextLevel = getNextResearchLevel(totalExp);
  
  if (!nextLevel) {
    return { current: totalExp, required: totalExp, progress: 1 };
  }
  
  const baseExp = currentLevel.expRequired;
  const requiredDiff = nextLevel.expRequired - baseExp;
  const currentDiff = totalExp - baseExp;
  
  return {
    current: currentDiff,
    required: requiredDiff,
    progress: Math.min(1, currentDiff / requiredDiff)
  };
}

export function getSpecimenKnowledgeUnlockedCount(specimenId: number, unlockedIds: string[]): number {
  const all = getKnowledgeBySpecimen(specimenId);
  return all.filter(k => unlockedIds.includes(k.id)).length;
}

export function getAllSpecimenIds(): number[] {
  return Object.keys(PlantSpecimens).map(Number);
}
