import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port, 10) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "see" },
      update: {},
      create: { name: "볼거리", slug: "see", icon: "🏛" },
    }),
    prisma.category.upsert({
      where: { slug: "eat" },
      update: {},
      create: { name: "먹거리", slug: "eat", icon: "🍽" },
    }),
    prisma.category.upsert({
      where: { slug: "play" },
      update: {},
      create: { name: "즐길거리", slug: "play", icon: "🎭" },
    }),
  ]);
  const [see, eat, play] = categories;

  // 2. Spots
  const spotsData = [
    // 볼거리 (see)
    {
      name: "코엑스 별마당 도서관",
      slug: "coex-starfield-library",
      description: "삼성동 · 문화공간",
      content:
        "코엑스몰 내 위치한 대형 개방형 도서관으로, 13m 높이의 거대 서가와 5만여 권의 도서가 인상적인 문화 복합 공간입니다.",
      address: "서울특별시 강남구 영동대로 513",
      phone: "02-6002-5300",
      website: "https://www.starfield.co.kr/coexmall",
      openingHours: "10:30 - 22:00",
      imageUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
      isHotPlace: true,
      timeSlot: "morning",
      categoryId: see.id,
    },
    {
      name: "봉은사 야경",
      slug: "bongeunsa-night",
      description: "삼성동 · 야경명소",
      content:
        "서울 강남 한복판에 위치한 천년 고찰. 특히 야간에 은은하게 밝혀지는 석등이 환상적인 분위기를 연출합니다.",
      address: "서울특별시 강남구 봉은사로 531",
      phone: "02-3218-4895",
      imageUrl:
        "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80",
      isHotPlace: true,
      timeSlot: "evening",
      categoryId: see.id,
    },
    {
      name: "삼성미술관 리움",
      slug: "leeum-museum",
      description: "한남동 · 미술관",
      content:
        "세계적인 건축가 3인이 설계한 미술관으로, 한국 전통미술부터 현대미술까지 아우르는 세계적 컬렉션을 만날 수 있습니다.",
      address: "서울특별시 용산구 이태원로55길 60-16",
      phone: "02-2014-6900",
      website: "https://www.leeum.org",
      openingHours: "10:00 - 18:00",
      imageUrl:
        "https://images.unsplash.com/photo-1537944434965-cf4679d1a598?w=800&q=80",
      timeSlot: "morning",
      categoryId: see.id,
    },
    {
      name: "양재시민의숲",
      slug: "yangjae-forest",
      description: "양재동 · 힐링",
      content:
        "도심 속 초록빛 힐링 공간으로, 산책로와 자전거길이 잘 조성되어 있어 아침 산책 코스로 인기입니다.",
      address: "서울특별시 서초구 양재동 228",
      imageUrl:
        "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&q=80",
      timeSlot: "morning",
      categoryId: see.id,
    },
    {
      name: "선정릉",
      slug: "seonjeongneung",
      description: "삼성동 · 유네스코",
      content:
        "도심 속 유네스코 세계문화유산으로, 조선 왕릉의 고즈넉한 분위기를 강남 한복판에서 경험할 수 있습니다.",
      address: "서울특별시 강남구 선릉로100길 1",
      phone: "02-568-1291",
      openingHours: "06:00 - 21:00",
      imageUrl:
        "https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&q=80",
      timeSlot: "afternoon",
      categoryId: see.id,
    },
    // 먹거리 (eat)
    {
      name: "청담동 한정식",
      slug: "cheongdam-hansik",
      description: "청담동 · 한식",
      content:
        "청담동의 정통 한정식 레스토랑. 계절 재료를 활용한 정갈한 코스 요리로 한국 미식의 정수를 선사합니다.",
      address: "서울특별시 강남구 청담동 118-17",
      phone: "02-3446-8850",
      openingHours: "11:30 - 22:00",
      priceRange: "₩₩₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80",
      isHotPlace: true,
      timeSlot: "afternoon",
      categoryId: eat.id,
    },
    {
      name: "가로수길 브런치 카페",
      slug: "garosugil-brunch",
      description: "신사동 · 카페",
      content:
        "가로수길의 인기 브런치 카페. 모닝 커피와 함께 여유로운 아침을 시작하기 완벽한 장소입니다.",
      address: "서울특별시 강남구 신사동 가로수길 33",
      openingHours: "08:00 - 22:00",
      priceRange: "₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
      timeSlot: "morning",
      categoryId: eat.id,
    },
    {
      name: "역삼동 고깃집",
      slug: "yeoksam-bbq",
      description: "역삼동 · 한우",
      content:
        "최상급 한우를 숯불에 구워 내는 강남 맛집. 직장인들의 저녁 회식 장소로도 인기가 높습니다.",
      address: "서울특별시 강남구 역삼동 823-4",
      phone: "02-555-1234",
      openingHours: "17:00 - 01:00",
      priceRange: "₩₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      timeSlot: "evening",
      categoryId: eat.id,
    },
    {
      name: "도산공원 이탈리안",
      slug: "dosan-italian",
      description: "신사동 · 양식",
      content:
        "도산공원 인근에 위치한 프리미엄 이탈리안 레스토랑. 정통 파스타와 와인 페어링이 일품입니다.",
      address: "서울특별시 강남구 도산대로 328",
      openingHours: "11:30 - 23:00",
      priceRange: "₩₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      timeSlot: "evening",
      categoryId: eat.id,
    },
    {
      name: "삼성동 스시 오마카세",
      slug: "samsung-sushi",
      description: "삼성동 · 일식",
      content:
        "정통 에도마에 스시를 선보이는 오마카세 레스토랑. 매일 아침 공수되는 신선한 재료로 만든 스시를 경험할 수 있습니다.",
      address: "서울특별시 강남구 삼성동 159-1",
      phone: "02-567-9000",
      openingHours: "12:00 - 22:00",
      priceRange: "₩₩₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80",
      timeSlot: "afternoon",
      categoryId: eat.id,
    },
    // 즐길거리 (play)
    {
      name: "압구정 로데오거리",
      slug: "apgujeong-rodeo",
      description: "압구정동 · 쇼핑",
      content:
        "강남의 대표적인 패션 & 쇼핑 거리. 최신 트렌드의 브랜드숍과 감각적인 카페가 즐비한 문화 거리입니다.",
      address: "서울특별시 강남구 압구정로 343",
      imageUrl:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      isHotPlace: true,
      timeSlot: "afternoon",
      categoryId: play.id,
    },
    {
      name: "강남 루프탑 바",
      slug: "gangnam-rooftop-bar",
      description: "역삼동 · 나이트라이프",
      content:
        "강남 스카이라인을 한눈에 담을 수 있는 루프탑 바. 석양부터 야경까지, 분위기 있는 저녁을 보내기 완벽한 장소입니다.",
      address: "서울특별시 강남구 역삼동 테헤란로 427",
      openingHours: "18:00 - 02:00",
      priceRange: "₩₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      timeSlot: "evening",
      categoryId: play.id,
    },
    {
      name: "코엑스 아쿠아리움",
      slug: "coex-aquarium",
      description: "삼성동 · 체험",
      content:
        "650여 종, 4만여 마리의 해양생물을 만날 수 있는 도심 속 아쿠아리움. 가족 나들이 명소입니다.",
      address: "서울특별시 강남구 영동대로 513 코엑스몰 B1",
      phone: "02-6002-6200",
      openingHours: "10:00 - 20:00",
      priceRange: "₩₩",
      imageUrl:
        "https://images.unsplash.com/photo-1546874177-9e664107314e?w=600&q=80",
      timeSlot: "afternoon",
      categoryId: play.id,
    },
    {
      name: "청담동 플래그십 스토어",
      slug: "cheongdam-flagship",
      description: "청담동 · 럭셔리",
      content:
        "글로벌 럭셔리 브랜드들의 플래그십 스토어가 밀집한 청담 명품거리. 건축미와 쇼핑을 동시에 즐길 수 있습니다.",
      address: "서울특별시 강남구 청담동 명품거리",
      openingHours: "10:30 - 21:00",
      imageUrl:
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
      timeSlot: "afternoon",
      categoryId: play.id,
    },
    {
      name: "SM엔터테인먼트",
      slug: "sm-entertainment",
      description: "압구정동 · 엔터",
      content:
        "K-POP 팬이라면 꼭 방문해야 할 SM엔터테인먼트 사옥. 주변에 아이돌 관련 카페와 굿즈샵이 모여있습니다.",
      address: "서울특별시 강남구 압구정로 423",
      imageUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
      timeSlot: "afternoon",
      categoryId: play.id,
    },
    {
      name: "JYP엔터테인먼트",
      slug: "jyp-entertainment",
      description: "청담동 · 엔터",
      content:
        "JYP엔터테인먼트 신사옥. 트와이스, 스트레이키즈 등 소속 아티스트 팬들의 성지순례 코스입니다.",
      address: "서울특별시 강남구 청담동 46-15",
      imageUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
      timeSlot: "afternoon",
      categoryId: play.id,
    },
  ];

  const spots: { id: number; slug: string }[] = [];
  for (const data of spotsData) {
    const spot = await prisma.spot.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    spots.push(spot);
  }

  // Helper: find spot by slug
  const spotBySlug = (slug: string) => spots.find((s) => s.slug === slug)!;

  // 3. Courses
  const coursesData = [
    {
      name: "K-POP 성지순례",
      slug: "kpop-pilgrimage",
      description: "K-POP 팬을 위한 강남 성지순례 코스",
      content:
        "강남은 K-POP의 심장부입니다. SM, JYP 등 대형 기획사부터 아이돌 맛집, 굿즈샵까지. 팬이라면 하루종일 즐길 수 있는 성지순례 코스를 소개합니다.",
      imageUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
      spotCount: 5,
      duration: "약 4시간",
      order: 1,
    },
    {
      name: "강남 미식 투어",
      slug: "gangnam-food-tour",
      description: "미식가를 위한 강남 맛집 투어",
      content:
        "청담 한정식부터 가로수길 브런치, 역삼 한우까지. 강남의 다채로운 미식을 하루에 만나보세요.",
      imageUrl:
        "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80",
      spotCount: 6,
      duration: "약 5시간",
      order: 2,
    },
    {
      name: "K-뷰티 체험 코스",
      slug: "k-beauty-experience",
      description: "K-뷰티 체험 코스",
      content:
        "청담동 플래그십 스토어부터 압구정 로데오 뷰티숍까지. K-뷰티의 최전선을 직접 체험해보세요.",
      imageUrl:
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
      spotCount: 4,
      duration: "약 3시간",
      order: 3,
    },
    {
      name: "강남 둘레길 트레킹",
      slug: "gangnam-trail-trekking",
      description: "도심 속 자연을 즐기는 강남 둘레길",
      content:
        "양재시민의숲에서 시작해 선정릉, 봉은사까지 이어지는 도심 트레킹 코스. 강남의 숨겨진 자연을 만나보세요.",
      imageUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
      spotCount: 8,
      duration: "약 6시간",
      order: 4,
    },
  ];

  const courses = [];
  for (const data of coursesData) {
    const course = await prisma.course.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    courses.push(course);
  }

  // 4. CourseSpots
  const courseSpotsData = [
    // K-POP 성지순례
    {
      courseId: courses[0].id,
      spotId: spotBySlug("sm-entertainment").id,
      order: 1,
      travelTime: null,
    },
    {
      courseId: courses[0].id,
      spotId: spotBySlug("jyp-entertainment").id,
      order: 2,
      travelTime: "도보 10분",
    },
    {
      courseId: courses[0].id,
      spotId: spotBySlug("apgujeong-rodeo").id,
      order: 3,
      travelTime: "도보 15분",
    },
    {
      courseId: courses[0].id,
      spotId: spotBySlug("coex-starfield-library").id,
      order: 4,
      travelTime: "지하철 20분",
    },
    // 강남 미식 투어
    {
      courseId: courses[1].id,
      spotId: spotBySlug("garosugil-brunch").id,
      order: 1,
      travelTime: null,
    },
    {
      courseId: courses[1].id,
      spotId: spotBySlug("cheongdam-hansik").id,
      order: 2,
      travelTime: "도보 20분",
    },
    {
      courseId: courses[1].id,
      spotId: spotBySlug("dosan-italian").id,
      order: 3,
      travelTime: "도보 10분",
    },
    {
      courseId: courses[1].id,
      spotId: spotBySlug("yeoksam-bbq").id,
      order: 4,
      travelTime: "지하철 15분",
    },
    // K-뷰티 체험 코스
    {
      courseId: courses[2].id,
      spotId: spotBySlug("cheongdam-flagship").id,
      order: 1,
      travelTime: null,
    },
    {
      courseId: courses[2].id,
      spotId: spotBySlug("apgujeong-rodeo").id,
      order: 2,
      travelTime: "도보 10분",
    },
    // 강남 둘레길
    {
      courseId: courses[3].id,
      spotId: spotBySlug("yangjae-forest").id,
      order: 1,
      travelTime: null,
    },
    {
      courseId: courses[3].id,
      spotId: spotBySlug("seonjeongneung").id,
      order: 2,
      travelTime: "도보 30분",
    },
    {
      courseId: courses[3].id,
      spotId: spotBySlug("bongeunsa-night").id,
      order: 3,
      travelTime: "도보 15분",
    },
    {
      courseId: courses[3].id,
      spotId: spotBySlug("coex-starfield-library").id,
      order: 4,
      travelTime: "도보 10분",
    },
  ];

  for (const data of courseSpotsData) {
    await prisma.courseSpot.upsert({
      where: {
        courseId_spotId: { courseId: data.courseId, spotId: data.spotId },
      },
      update: {},
      create: data,
    });
  }

  // 5. Festivals
  const festivalsData = [
    {
      name: "2026 GANGNAM FESTIVAL",
      slug: "2026-gangnam-festival",
      description: "강남구 최대 규모의 축제",
      content:
        "매년 봄, 강남을 대표하는 축제. 음악, 패션, 푸드, 문화가 어우러진 도심 속 페스티벌입니다.",
      imageUrl:
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-15"),
      venue: "코엑스 일대",
      isFeatured: true,
    },
    {
      name: "강남 K-POP 콘서트",
      slug: "gangnam-kpop-concert",
      description: "K-POP 스타들의 특별 콘서트",
      imageUrl:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-12"),
      venue: "코엑스 오디토리움",
      isFeatured: false,
    },
    {
      name: "아트 강남 2026",
      slug: "art-gangnam-2026",
      description: "현대미술과 함께하는 한 달",
      imageUrl:
        "https://images.unsplash.com/photo-1569863959165-56dae551d4fc?w=600&q=80",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
      venue: "강남구 일대 갤러리",
      isFeatured: false,
    },
    {
      name: "강남 미식 위크",
      slug: "gangnam-food-week",
      description: "강남의 맛을 한곳에",
      imageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-14"),
      venue: "가로수길 일대",
      isFeatured: false,
    },
  ];

  for (const data of festivalsData) {
    await prisma.festival.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  // 6. Influencers + Tags
  const influencersData = [
    {
      name: "김서현",
      handle: "@seohyun_eats",
      followers: "12.3만",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
      quote: '"압구정에서 보내는 완벽한 하루, 제가 직접 다녀왔어요"',
      description:
        "브런치 카페에서 시작해 숨겨진 맛집, 감성 쇼핑까지. 압구정의 매력을 하루에 담은 코스를 소개합니다.",
      imageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      order: 1,
      tags: ["맛집", "카페", "쇼핑"],
    },
    {
      name: "Alex Kim",
      handle: "@alexinseoul",
      followers: "98K",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
      quote: '"Gangnam Nights you\'ll never forget"',
      description:
        "From rooftop bars to neon-lit streets, experience the electric nightlife that makes Gangnam the heart of Seoul's entertainment scene.",
      imageUrl:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      order: 2,
      tags: ["Nightlife", "Rooftop", "K-Culture"],
    },
  ];

  for (const data of influencersData) {
    const { tags, ...influencerData } = data;
    const influencer = await prisma.influencer.create({
      data: {
        ...influencerData,
        tags: {
          create: tags.map((name) => ({ name })),
        },
      },
    });
  }

  // 7. Gallery Items
  const galleryData = [
    {
      type: "video",
      imageUrl:
        "https://images.unsplash.com/photo-1546636889-ba9fdd63583e?w=1000&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      gridClass: "gal-1",
      order: 1,
    },
    {
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1546874177-9e664107314e?w=600&q=80",
      gridClass: "gal-2",
      order: 2,
    },
    {
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&q=80",
      gridClass: "gal-3",
      order: 3,
    },
    {
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
      gridClass: "gal-4",
      order: 4,
    },
    {
      type: "image",
      imageUrl:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
      gridClass: "gal-5",
      order: 5,
    },
  ];

  for (const data of galleryData) {
    await prisma.galleryItem.create({ data });
  }

  console.log("Seed completed successfully!");
  console.log(
    `  Categories: ${categories.length}, Spots: ${spots.length}, Courses: ${courses.length}`
  );
  console.log(
    `  CourseSpots: ${courseSpotsData.length}, Festivals: ${festivalsData.length}`
  );
  console.log(
    `  Influencers: ${influencersData.length}, Gallery: ${galleryData.length}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
