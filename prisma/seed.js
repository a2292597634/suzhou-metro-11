/**
 * 数据种子脚本 - 将默认数据导入 PostgreSQL
 * 运行: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultStations = [
  { id: 'weiting', name: '唯亭站', grade: 'C',
    shops: [{ no: 1, shortNo: 'S11-1', name: 'A商铺', type: '商铺', area: 18.69, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 80, y: 480, pos: 'top', transfer: false },
  { id: 'caoxieshan', name: '草鞋山站', grade: 'C',
    shops: [{ no: 2, shortNo: 'S11-2', name: 'A商铺（2号出口）', type: '商铺', area: 13.88, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 3, shortNo: 'S11-3', name: 'B商铺（4号出口）', type: '商铺', area: 24.38, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 170, y: 480, pos: 'bottom', transfer: false },
  { id: 'yangchenghudong', name: '阳澄湖东站', grade: 'A',
    shops: [{ no: 4, shortNo: 'S11-4', name: 'A商铺（3号出口）', type: '商铺', area: 25.72, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 5, shortNo: 'S11-5', name: 'B1商铺（4号出口）', type: '商铺', area: 11.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 6, shortNo: 'S11-6', name: 'B2商铺（4号出口）', type: '商铺', area: 15.4, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 260, y: 480, pos: 'top', transfer: false },
  { id: 'zhengyi', name: '正仪站', grade: 'B',
    shops: [{ no: 7, shortNo: 'S11-7', name: 'A商铺（3号出口）', type: '商铺', area: 20.46, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 8, shortNo: 'S11-8', name: 'B商铺（4号出口）', type: '商铺', area: 20.66, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 350, y: 480, pos: 'bottom', transfer: false },
  { id: 'lianhuagongyuan', name: '莲湖公园站', grade: 'A',
    shops: [{ no: 9, shortNo: 'S11-9', name: 'A商铺（2号出口）', type: '商铺', area: 15.14, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 10, shortNo: 'S11-10', name: 'B商铺（3号出口）', type: '商铺', area: 11.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 11, shortNo: 'S11-11', name: 'C商铺（4号出口）', type: '商铺', area: 13.4, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 440, y: 480, pos: 'top', transfer: false },
  { id: 'zuchongzhi', name: '祖冲之公园站', grade: 'C',
    shops: [{ no: 12, shortNo: 'S11-12', name: 'A商铺（3号出口）', type: '商铺', area: 14.69, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 13, shortNo: 'S11-13', name: 'B商铺（4号出口）', type: '商铺', area: 19.11, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 14, shortNo: '待定', name: '多经点位1', type: '多经点位', area: 17.28, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 15, shortNo: '待定', name: '多经点位2', type: '多经点位', area: 17.28, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 530, y: 480, pos: 'bottom', transfer: false },
  { id: 'kunshanwenhua', name: '昆山文化艺术中心站', grade: 'S',
    shops: [{ no: 16, shortNo: 'S11-14', name: 'A商铺（3号出口）', type: '商铺', area: 29.23, tenant: '昆山有礼', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 17, shortNo: 'S11-15', name: 'B商铺（4号出口）', type: '商铺', area: 28.27, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 620, y: 480, pos: 'top', transfer: false },
  { id: 'gongqing', name: '共青站', grade: 'B',
    shops: [{ no: 18, shortNo: 'S11-16', name: 'A商铺（1号出口）', type: '商铺', area: 14.63, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 19, shortNo: 'S11-17', name: 'B商铺（2号出口）', type: '商铺', area: 25.12, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 710, y: 480, pos: 'bottom', transfer: false },
  { id: 'jiangpu', name: '江浦站', grade: 'C',
    shops: [{ no: 20, shortNo: 'S11-18', name: 'A商铺（4号出口）', type: '商铺', area: 12.68, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 21, shortNo: 'S11-19', name: 'A1商铺（4号出口）', type: '商铺', area: 13.04, tenant: '包一切馅饼', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 22, shortNo: 'S11-18-1', name: '多经点位', type: '多经点位', area: 7.44, tenant: '手机维修店', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 800, y: 480, pos: 'top', transfer: false },
  { id: 'baimajing', name: '白马泾路站', grade: 'B',
    shops: [{ no: 23, shortNo: 'S11-20', name: 'A商铺（1号出口）', type: '商铺', area: 28.8, tenant: '怀旧零食店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 24, shortNo: 'S11-21', name: 'B商铺（3号出口）', type: '商铺', area: 27.69, tenant: '有一家便利店', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 890, y: 480, pos: 'bottom', transfer: false },
  { id: 'yushanguangchang', name: '玉山广场站', grade: 'S',
    shops: [{ no: 25, shortNo: 'S11-22', name: 'A商铺（3号出口）', type: '商铺', area: 32.0, tenant: '11号便利店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 26, shortNo: 'S11-23', name: 'B商铺（3号出口）', type: '商铺', area: 15.0, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 27, shortNo: 'S11-24', name: 'C商铺（1号2号出口）', type: '商铺', area: 20.9, tenant: '包一切馅饼', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 28, shortNo: 'S11-18-2', name: '多经点位1', type: '多经点位', area: 15.12, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 29, shortNo: '待定', name: '多经点位2', type: '多经点位', area: 15.12, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 980, y: 480, pos: 'top', transfer: false },
  { id: 'xiuyi', name: '绣衣站', grade: 'B',
    shops: [{ no: 30, shortNo: 'S11-25', name: 'A商铺', type: '商铺', area: 17.5, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 31, shortNo: '待定', name: '多经点位', type: '多经点位', area: 18.9, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1070, y: 480, pos: 'bottom', transfer: false },
  { id: 'kunshanchengshi', name: '昆山城市广场站', grade: 'S',
    shops: [{ no: 32, shortNo: 'S11-26', name: 'A商铺（1号出口）', type: '商铺', area: 13.72, tenant: '昆山有礼', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 33, shortNo: 'S11-27', name: 'B商铺（2号出口）', type: '商铺', area: 23.2, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 34, shortNo: 'S11-28', name: 'C商铺（4号出口）', type: '商铺', area: 14.53, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 1160, y: 480, pos: 'top', transfer: false },
  { id: 'jinpudaqiao', name: '金浦大桥东站', grade: 'A',
    shops: [{ no: 35, shortNo: 'S11-29', name: 'A商铺（1号出口）', type: '商铺', area: 14.04, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 36, shortNo: 'S11-30', name: 'B商铺（3号出口）', type: '商铺', area: 12.74, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 37, shortNo: 'S11-31', name: 'C商铺（2号出口）', type: '商铺', area: 10.88, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1250, y: 480, pos: 'bottom', transfer: false },
  { id: 'shunfanbei', name: '顺帆北路站', grade: 'C',
    shops: [{ no: 38, shortNo: 'S11-32', name: 'A商铺（1号出口）', type: '商铺', area: 14.03, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 39, shortNo: 'S11-33', name: 'B商铺（3号出口）', type: '商铺', area: 14.8, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1340, y: 480, pos: 'top', transfer: false },
  { id: 'yuchijing', name: '鱼池泾站', grade: 'C',
    shops: [{ no: 40, shortNo: 'S11-34', name: 'A商铺（2号出口）', type: '商铺', area: 17.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 41, shortNo: 'S11-35', name: 'B商铺（4号出口）', type: '商铺', area: 12.97, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1430, y: 480, pos: 'bottom', transfer: false },
  { id: 'baihetan', name: '白河潭站', grade: 'C',
    shops: [{ no: 42, shortNo: 'S11-36', name: 'A商铺（1号出口）', type: '商铺', area: 24.8, tenant: '汇城房产', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 43, shortNo: 'S11-37', name: 'B商铺（3号出口）', type: '商铺', area: 21.09, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 44, shortNo: '待定', name: '多经点位', type: '多经点位', area: 22.68, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1520, y: 480, pos: 'top', transfer: false },
  { id: 'bingxi', name: '兵希站', grade: 'C',
    shops: [{ no: 45, shortNo: 'S11-38', name: 'A商铺（1号出口）', type: '商铺', area: 21.16, tenant: '全家便利店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 46, shortNo: 'S11-39', name: 'A1商铺（1号出口）', type: '商铺', area: 16.65, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 47, shortNo: 'S11-40', name: 'A2商铺（1号出口）', type: '商铺', area: 22.55, tenant: '咖啡店', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 1610, y: 480, pos: 'bottom', transfer: false },
  { id: 'xiajiahe', name: '夏驾河公园站', grade: 'B',
    shops: [{ no: 48, shortNo: 'S11-41', name: 'A商铺（1号出口）', type: '商铺', area: 29.86, tenant: '美宜佳超市', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 1700, y: 480, pos: 'top', transfer: false },
  { id: 'shengzhuang', name: '盛庄站', grade: 'C',
    shops: [{ no: 49, shortNo: 'S11-43', name: 'A商铺（3号出口）', type: '商铺', area: 13.53, tenant: '自习室', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 50, shortNo: 'S11-44', name: 'B商铺（4号出口）', type: '商铺', area: 12.18, tenant: '自习室', contact: '', openDate: '', status: '营业中', remark: '' }],
    x: 1700, y: 580, pos: 'right', transfer: false },
  { id: 'zhangjilu', name: '章基路南站', grade: 'C',
    shops: [{ no: 51, shortNo: 'S11-45', name: 'A商铺（1号出口）', type: '商铺', area: 10.12, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 52, shortNo: 'S11-46', name: 'B商铺（3号出口）', type: '商铺', area: 29.66, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1700, y: 720, pos: 'left', transfer: false },
  { id: 'xiaqiao', name: '夏桥站', grade: 'C',
    shops: [{ no: 53, shortNo: 'S11-47', name: 'A商铺（1号出口）', type: '商铺', area: 12.75, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1700, y: 780, pos: 'right', transfer: false },
  { id: 'shentongjing', name: '神童泾站', grade: 'B',
    shops: [{ no: 54, shortNo: 'S11-48', name: 'A商铺（3号出口）', type: '商铺', area: 19.46, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1810, y: 800, pos: 'bottom', transfer: false },
  { id: 'lujia', name: '菉葭站', grade: 'C',
    shops: [{ no: 55, shortNo: 'S11-49', name: 'A商铺（1号出口）', type: '商铺', area: 18.36, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 56, shortNo: 'S11-50', name: 'B商铺（3号出口）', type: '商铺', area: 23.74, tenant: '便利店', contact: '', openDate: '', status: '营业中', remark: '' },
    { no: 57, shortNo: 'S11-51', name: 'C商铺（5号出口）', type: '商铺', area: 18.21, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 1920, y: 820, pos: 'top', transfer: false },
  { id: 'huaqiaobolan', name: '花桥博览中心站', grade: 'A',
    shops: [{ no: 58, shortNo: 'S11-52', name: 'A商铺（1号出口）', type: '商铺', area: 11.2, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 59, shortNo: 'S11-53', name: 'B商铺（2号出口）', type: '商铺', area: 14.98, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 60, shortNo: 'S11-54', name: 'C商铺（3号出口）', type: '商铺', area: 12.57, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 61, shortNo: 'S11-55', name: 'D商铺（4号出口）', type: '商铺', area: 16.59, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 2040, y: 840, pos: 'bottom', transfer: false },
  { id: 'jishan', name: '集善站', grade: 'C',
    shops: [{ no: 62, shortNo: 'S11-56', name: 'A商铺（1号出口)', type: '商铺', area: 17.01, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 63, shortNo: 'S11-57', name: 'B商铺（2号出口)', type: '商铺', area: 15.67, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 2150, y: 840, pos: 'top', transfer: false },
  { id: 'huaxigongyuan', name: '花溪公园站', grade: 'B',
    shops: [{ no: 64, shortNo: 'S11-58', name: 'A商铺（1号出口）', type: '商铺', area: 14.88, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 65, shortNo: 'S11-59', name: 'B商铺（2号出口）', type: '商铺', area: 24.64, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
    { no: 66, shortNo: 'S11-60', name: 'C商铺（3号出口）', type: '商铺', area: 24.64, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
    x: 2270, y: 840, pos: 'bottom', transfer: false },
  { id: 'huaqiao', name: '花桥站', grade: 'S',
    shops: [{ no: 67, shortNo: '待定', name: 'A号商铺', type: '商铺', area: 19.81, tenant: '蜜雪冰城', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
    { no: 68, shortNo: '待定', name: 'B号商铺', type: '商铺', area: 27.14, tenant: '', contact: '', openDate: '', status: '装修中', remark: '上海花桥站' },
    { no: 69, shortNo: '待定', name: 'C号商铺', type: '商铺', area: 21.3, tenant: '全家', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
    { no: 70, shortNo: '待定', name: 'D号商铺', type: '商铺', area: 34.14, tenant: '喜士多', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
    { no: 71, shortNo: '待定', name: 'E号商铺', type: '商铺', area: 28.23, tenant: '', contact: '', openDate: '', status: '装修中', remark: '苏州花桥站' },
    { no: 72, shortNo: '待定', name: 'F号商铺', type: '商铺', area: 10.54, tenant: '苏燕记', contact: '', openDate: '', status: '营业中', remark: '苏州花桥站' },
    { no: 73, shortNo: '待定', name: 'G号商铺', type: '商铺', area: 14.09, tenant: '牙博士', contact: '', openDate: '', status: '营业中', remark: '苏州花桥站' }],
    x: 2380, y: 840, pos: 'top', transfer: true, transferLine: '上海11号线' },
];

const defaultGlobalStats = {
  statsDate: '2024年5月20日',
  totalShops: 66,
  rentedShops: 33,
  vacantShops: 33,
  rentRate: '50.0%'
};

const defaultGradeInfo = {
  S: { name: 'S级（核心商圈/换乘）', desc: '', color: '#d4380d' },
  A: { name: 'A级（重点发展站）', desc: '', color: '#fa8c16' },
  B: { name: 'B级（潜力提升站）', desc: '', color: '#facc14' },
  C: { name: 'C级（培育优化站）', desc: '', color: '#52c41a' }
};

async function main() {
  console.log('开始导入默认数据...');

  // 1. 导入站点和商铺
  for (const s of defaultStations) {
    await prisma.station.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        grade: s.grade,
        x: s.x,
        y: s.y,
        pos: s.pos,
        transfer: s.transfer,
        transferLine: s.transferLine || null
      },
      create: {
        id: s.id,
        name: s.name,
        grade: s.grade,
        x: s.x,
        y: s.y,
        pos: s.pos,
        transfer: s.transfer,
        transferLine: s.transferLine || null,
        shops: {
          create: s.shops.map(shop => ({
            no: shop.no,
            shortNo: shop.shortNo,
            name: shop.name,
            type: shop.type,
            area: shop.area,
            tenant: shop.tenant || '',
            contact: shop.contact || '',
            openDate: shop.openDate || '',
            status: shop.status,
            remark: shop.remark || ''
          }))
        }
      }
    });
  }
  console.log(`✅ 已导入 ${defaultStations.length} 个站点`);

  // 2. 导入全局统计
  await prisma.globalStats.upsert({
    where: { id: 1 },
    update: {
      statsDate: defaultGlobalStats.statsDate,
      totalShops: defaultGlobalStats.totalShops,
      rentedShops: defaultGlobalStats.rentedShops,
      vacantShops: defaultGlobalStats.vacantShops,
      rentRate: defaultGlobalStats.rentRate
    },
    create: {
      id: 1,
      statsDate: defaultGlobalStats.statsDate,
      totalShops: defaultGlobalStats.totalShops,
      rentedShops: defaultGlobalStats.rentedShops,
      vacantShops: defaultGlobalStats.vacantShops,
      rentRate: defaultGlobalStats.rentRate
    }
  });
  console.log('✅ 已导入全局统计');

  // 3. 导入分级信息
  for (const [key, info] of Object.entries(defaultGradeInfo)) {
    await prisma.gradeInfo.upsert({
      where: { id: key },
      update: {
        name: info.name,
        desc: info.desc,
        color: info.color
      },
      create: {
        id: key,
        name: info.name,
        desc: info.desc,
        color: info.color
      }
    });
  }
  console.log('✅ 已导入商业价值分级');

  console.log('\n数据导入完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
