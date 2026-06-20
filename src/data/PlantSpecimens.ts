import { PlantSpecimen } from '../types/GameTypes';

export const PlantSpecimens: Record<number, PlantSpecimen> = {
  1: {
    id: 1,
    name: '银杏',
    aliases: ['白果', '公孙树', '鸭脚树', '蒲扇'],
    family: '银杏科',
    genus: '银杏属',
    description: '银杏科银杏属落叶乔木，被誉为植物界的"活化石"。叶片呈扇形，秋季变为金黄色，具有极高的观赏和药用价值。',
    distribution: ['中国', '日本', '韩国', '北美', '欧洲'],
    habitat: '喜光树种，深根性，对气候、土壤的适应性较宽，能在高温多雨及雨量稀少、冬季寒冷的地区生长',
    careKnowledge: {
      light: '喜充足阳光，每天至少6小时直射光照',
      water: '耐旱性较强，生长期保持土壤湿润即可，忌积水',
      temperature: '耐寒性强，可耐-30℃低温，适宜生长温度15-25℃',
      soil: '喜深厚、肥沃、排水良好的酸性或中性土壤',
      fertilizer: '春秋季各施一次腐熟有机肥，生长期可追施复合肥',
      tips: '银杏生长缓慢，寿命极长，被誉为"公孙树"，意指公公种树孙子得果'
    },
    primaryColor: 0xffd700,
    secondaryColor: 0xffa500,
    leafColor: 0x4caf50,
    stemColor: 0x8b4513,
    shape: 'ginkgo'
  },
  2: {
    id: 2,
    name: '玫瑰',
    aliases: ['刺玫花', '徘徊花', '刺客', '穿心玫瑰'],
    family: '蔷薇科',
    genus: '蔷薇属',
    description: '蔷薇科蔷薇属植物，象征爱情与美丽。花瓣层叠排列，香气浓郁，是世界上最受欢迎的花卉之一。',
    distribution: ['中国华北', '日本', '朝鲜', '欧洲', '北美'],
    habitat: '喜阳光充足、通风良好的环境，耐寒耐旱，对土壤要求不严',
    careKnowledge: {
      light: '每天至少6小时直射阳光，光照不足会导致开花稀少',
      water: '见干见湿，避免积水，雨季注意排水',
      temperature: '适宜生长温度15-25℃，耐寒性强，可耐-15℃低温',
      soil: '喜疏松肥沃、排水良好的壤土或轻壤土',
      fertilizer: '开花期每10天施一次磷钾肥，秋冬季施基肥',
      tips: '玫瑰花瓣可食用、可提取精油，具有很高的经济价值'
    },
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    leafColor: 0x2e7d32,
    stemColor: 0x5d4037,
    shape: 'rose'
  },
  3: {
    id: 3,
    name: '向日葵',
    aliases: ['太阳花', '朝阳花', '转日莲', '望日莲'],
    family: '菊科',
    genus: '向日葵属',
    description: '菊科向日葵属一年生草本，因花序随太阳转动而得名。种子富含油脂，是重要的油料作物。',
    distribution: ['原产北美洲', '世界各地广泛栽培', '中国东北', '华北', '西北'],
    habitat: '喜温暖向阳的环境，耐旱，对土壤要求不严格',
    careKnowledge: {
      light: '需充足阳光，每天至少8小时直射光照',
      water: '耐旱性强，生长期适量浇水，开花期需水量增加',
      temperature: '喜温暖，适宜生长温度20-30℃，不耐寒',
      soil: '对土壤要求不严，在各类土壤中均能生长',
      fertilizer: '生长期施氮肥，现蕾后增施磷钾肥',
      tips: '向日葵从发芽到花盘盛开之前，叶子和花盘会追随太阳转动'
    },
    primaryColor: 0xffc107,
    secondaryColor: 0xffeb3b,
    leafColor: 0x388e3c,
    stemColor: 0x6d4c41,
    shape: 'sunflower'
  },
  4: {
    id: 4,
    name: '薰衣草',
    aliases: ['灵香草', '香草', '黄香草', '拉文德'],
    family: '唇形科',
    genus: '薰衣草属',
    description: '唇形科薰衣草属半灌木或矮灌木，具有特殊的芳香气味。常用于制作香料、精油和装饰。',
    distribution: ['原产地中海沿岸', '欧洲各地', '中国新疆', '日本北海道'],
    habitat: '喜干燥凉爽气候，耐寒耐旱，怕高温高湿',
    careKnowledge: {
      light: '需充足阳光，全日照环境最佳',
      water: '耐旱怕涝，浇水遵循"见干见湿"原则',
      temperature: '喜凉爽，适宜生长温度15-25℃，可耐-20℃低温',
      soil: '喜疏松、肥沃、排水良好的中性或微碱性土壤',
      fertilizer: '生长期每月施一次稀薄液肥，花期停肥',
      tips: '薰衣草精油具有舒缓神经、帮助睡眠的功效'
    },
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    leafColor: 0x689f38,
    stemColor: 0x558b2f,
    shape: 'lavender'
  },
  5: {
    id: 5,
    name: '兰花',
    aliases: ['中国兰', '幽兰', '芝兰', '兰草'],
    family: '兰科',
    genus: '兰属',
    description: '兰科兰属多年生草本，中国十大名花之一。以高洁典雅著称，与梅、竹、菊并称"四君子"。',
    distribution: ['中国长江流域以南', '日本', '朝鲜半岛', '东南亚'],
    habitat: '多生于林下、沟边或岩壁上，喜温暖湿润、通风良好的半阴环境',
    careKnowledge: {
      light: '喜半阴环境，避免强光直射，散射光最佳',
      water: '喜湿润，保持土壤微湿，空气湿度保持60-80%',
      temperature: '适宜生长温度18-25℃，冬季不低于5℃',
      soil: '喜疏松、透气、排水良好的腐殖质土壤',
      fertilizer: '生长期每两周施一次稀薄兰花专用肥',
      tips: '兰花是中国传统名花，象征高洁典雅，与梅、竹、菊并称"四君子"'
    },
    primaryColor: 0x00bcd4,
    secondaryColor: 0x80deea,
    leafColor: 0x2e7d32,
    stemColor: 0x4e342e,
    shape: 'orchid'
  },
  6: {
    id: 6,
    name: '多肉植物',
    aliases: ['肉肉', '多浆植物', '肉质植物', '景天'],
    family: '景天科',
    genus: '景天属',
    description: '景天科多肉植物，叶片肥厚多汁，具有极强的耐旱能力。形态各异，是近年来广受欢迎的观赏植物。',
    distribution: ['世界各地均有分布', '非洲南部', '美洲', '中国西南'],
    habitat: '多生长在干旱、半干旱地区，耐旱性极强',
    careKnowledge: {
      light: '喜充足阳光，大部分品种需要全日照',
      water: '耐旱性强，浇水遵循"宁干勿湿"原则',
      temperature: '喜温暖，适宜温度15-28℃，部分品种耐寒',
      soil: '喜疏松透气、排水良好的颗粒土',
      fertilizer: '生长期每月施一次稀薄多肉专用肥',
      tips: '多肉植物叶片肥厚多汁，能储存大量水分，非常适合新手养护'
    },
    primaryColor: 0x66bb6a,
    secondaryColor: 0xa5d6a7,
    leafColor: 0x81c784,
    stemColor: 0x795548,
    shape: 'succulent'
  },
  101: {
    id: 101,
    name: '樱花',
    aliases: ['山樱花', '福岛樱', '青肤樱', '荆桃'],
    family: '蔷薇科',
    genus: '樱属',
    description: '【活动限定】蔷薇科樱亚属植物，春日的象征。花瓣粉嫩柔美，花期虽短却绽放极致之美，是春天最浪漫的约定。',
    distribution: ['中国', '日本', '韩国', '朝鲜'],
    habitat: '喜温暖湿润、阳光充足的环境，耐寒耐旱',
    careKnowledge: {
      light: '喜充足阳光，每天至少6小时直射光照',
      water: '喜湿润，生长期保持土壤湿润，忌积水',
      temperature: '喜温暖，适宜温度15-20℃，耐寒性较强',
      soil: '喜深厚肥沃、排水良好的微酸性土壤',
      fertilizer: '每年施肥两次，以酸性肥料为主',
      tips: '樱花花期很短，通常只有7-10天，被誉为"七日之花"'
    },
    primaryColor: 0xffb7c5,
    secondaryColor: 0xf8bbd9,
    leafColor: 0x81c784,
    stemColor: 0x795548,
    shape: 'rose'
  },
  102: {
    id: 102,
    name: '睡莲',
    aliases: ['子午莲', '水芹花', '瑞莲', '水洋花'],
    family: '睡莲科',
    genus: '睡莲属',
    description: '【活动限定】睡莲科睡莲属多年生水生草本。花朵浮于水面，昼开夜合，被誉为"水中女神"，象征纯洁与优雅。',
    distribution: ['中国', '日本', '朝鲜', '印度', '俄罗斯', '欧洲', '北美'],
    habitat: '生于池沼、湖泊中，喜温暖、水湿和阳光充足的环境',
    careKnowledge: {
      light: '需充足阳光，每天至少6小时直射光照',
      water: '必须生长在水中，水深以30-60厘米为宜',
      temperature: '喜温暖，适宜温度20-30℃，冬季需防寒',
      soil: '喜富含有机质的壤土',
      fertilizer: '生长期可施用缓释肥或水生植物专用肥',
      tips: '睡莲的花白天开放夜晚闭合，因此得名"睡莲"'
    },
    primaryColor: 0xe1bee7,
    secondaryColor: 0xce93d8,
    leafColor: 0x4caf50,
    stemColor: 0x558b2f,
    shape: 'orchid'
  },
  103: {
    id: 103,
    name: '彼岸花',
    aliases: ['曼珠沙华', '石蒜', '龙爪花', '红花石蒜'],
    family: '石蒜科',
    genus: '石蒜属',
    description: '【活动限定】石蒜科石蒜属多年生草本。花如龙爪，红艳奇特，花开叶落永不相见，蕴含着神秘的传说与诗意。',
    distribution: ['中国长江流域', '日本', '朝鲜', '越南', '马来西亚'],
    habitat: '生于阴湿山坡、溪旁、林缘，喜阴湿环境',
    careKnowledge: {
      light: '喜半阴环境，避免强光直射',
      water: '喜湿润，生长期保持土壤湿润，休眠期减少浇水',
      temperature: '喜温暖，适宜温度15-25℃，较耐寒',
      soil: '喜疏松、肥沃、排水良好的沙质壤土',
      fertilizer: '生长期每月施一次稀薄液肥',
      tips: '彼岸花开花时叶子已经枯萎，长叶时花已凋谢，因此有"花叶永不相见"的说法'
    },
    primaryColor: 0xff1744,
    secondaryColor: 0xff5252,
    leafColor: 0x2e7d32,
    stemColor: 0x5d4037,
    shape: 'sunflower'
  },
  104: {
    id: 104,
    name: '昙花',
    aliases: ['琼花', '月下美人', '夜会草', '鬼仔花'],
    family: '仙人掌科',
    genus: '昙花属',
    description: '【活动限定】仙人掌科昙花属附生肉质灌木。只在夜间绽放，花期极短，洁白如雪，被誉为"月下美人"，象征刹那间的永恒。',
    distribution: ['原产墨西哥', '危地马拉', '世界各地广泛栽培', '中国南方'],
    habitat: '喜温暖湿润、半阴的环境，不耐霜冻',
    careKnowledge: {
      light: '喜半阴环境，避免强光直射，散射光最佳',
      water: '喜湿润，生长期保持土壤微湿，冬季减少浇水',
      temperature: '喜温暖，适宜温度15-25℃，冬季不低于5℃',
      soil: '喜疏松、肥沃、排水良好的微酸性沙质壤土',
      fertilizer: '生长期每两周施一次腐熟液肥',
      tips: '昙花一般在晚上8-9点开放，盛开时间只有3-4小时，因此有"昙花一现"的说法'
    },
    primaryColor: 0xfafafa,
    secondaryColor: 0xe0e0e0,
    leafColor: 0x66bb6a,
    stemColor: 0x8bc34a,
    shape: 'ginkgo'
  },
  105: {
    id: 105,
    name: '雪莲',
    aliases: ['雪莲花', '大苞雪莲', '荷莲', '优钵罗花'],
    family: '菊科',
    genus: '风毛菊属',
    description: '【活动限定】菊科风毛菊属多年生草本。生长于高山严寒之地，花朵似莲座洁白如玉，是珍稀的高山药用植物，象征坚韧与纯洁。',
    distribution: ['中国新疆天山', '青藏高原', '俄罗斯西伯利亚', '蒙古'],
    habitat: '生于海拔2400-4000米的高山冰碛岩缝、砾石坡和沙质地',
    careKnowledge: {
      light: '需充足阳光，高山强紫外线环境',
      water: '耐旱性强，靠雪水融化滋润',
      temperature: '极耐寒，可在-20℃至-30℃的低温下存活',
      soil: '喜贫瘠的砾石质土壤，排水性极好',
      fertilizer: '耐贫瘠，对肥料需求极低',
      tips: '雪莲生长在海拔几千米的高山雪线附近，是国家二级保护植物'
    },
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
