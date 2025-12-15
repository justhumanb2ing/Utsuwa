import { Metadata } from "next";

// TODO: i8n 적용 시, site url 변경 필요
export const siteConfig = {
  url: "https://utsuwaa.vercel.app",
  title: "Utsuwa",
  description: "A space to be who you are.",
  copyright: "Utsuwa © All rights reserved.",
  since: "2025",
  googleAnalyticsId: "",
  generator: "Next.js",
  applicationName: "Utsuwa",
  locale: "en-US",
  author: {
    name: "KINOMONGSANG",
    photo: "https://avatars.githubusercontent.com/u/101445377?v=4",
    bio: "Just human being",
    contacts: {
      email: "mailto:justhumanb2ing@gmail.com",
      github: "https://github.com/justhumanb2ing",
      bento: "https://bento.me/justhumanb2ing",
    },
  },
  menus: [
    {
      href: "/",
      label: "Home",
    },
  ],
};

// TODO: Opengraph, Twitter image 확인 후 변경 논의
export const metadataConfig: Metadata = {
  alternates: {
    // 페이지의 표준(canonical) URL을 지정하여, 여러 URL로 접근 가능한 경우에도
    // 검색 엔진이 이 URL을 원본으로 인식하게 합니다.
    canonical: siteConfig.url,
    // 특정 언어 버전에 대한 URL을 지정합니다.
    // 여기서는 한국어 버전에 대한 표준 URL을 설정합니다.
    languages: {
      "en-US": siteConfig.url,
      "ko-KR": siteConfig.url,
    },
  },
  // 브라우저 탭이나 검색 결과에 표시될 페이지의 제목입니다.
  title: {
    template: `%s | ${siteConfig.title}`,
    default: siteConfig.title + " — Be who you are",
  },
  // 검색 결과에 표시될 페이지의 간략한 설명입니다.
  description: siteConfig.description,
  // 검색 엔진이 페이지의 주제를 파악하는 데 사용되는 핵심 키워드 목록입니다.
  keywords: [
    // English – what users actually type
    "link in bio",
    "personal link page",
    "profile link page",
    "personal profile website",
    "link page for instagram",
    "link page for twitter",
    "personal homepage",
    "online profile page",
    "digital profile",
    "portfolio link",
    "freelancer portfolio website",
    "creator profile page",
    "artist portfolio website",
    "simple personal website",
    "minimal personal website",
    "profile website builder",
    "linktree alternative",
    "bento.me alternative",
    "share links in one page",
    "public profile page",
    "private profile page",

    // Korean – 실제 검색어 톤
    "링크 인 바이오",
    "개인 링크 페이지",
    "프로필 링크 페이지",
    "개인 프로필 사이트",
    "인스타 링크 페이지",
    "트위터 링크 모음",
    "개인 홈페이지",
    "온라인 프로필",
    "디지털 프로필",
    "포트폴리오 링크",
    "프리랜서 포트폴리오 사이트",
    "크리에이터 프로필",
    "아티스트 포트폴리오",
    "간단한 개인 웹사이트",
    "미니멀 개인 홈페이지",
    "프로필 사이트 만들기",
    "링크트리 대안",
    "벤토 대안",
    "링크 한 페이지에 모으기",
    "공개 프로필 페이지",
    "비공개 프로필 페이지",
  ],

  // 사이트 소유권을 확인하기 위한 다양한 검색 엔진 도구의 메타 태그를 설정합니다.
  verification: {
    // Google Search Console을 통한 소유권 확인 코드입니다.
    google: "",
    other: {
      // Naver Search Advisor 소유권 확인 코드입니다.
      "naver-site-verification": "",
      // Google Adsense 소유권 확인 코드입니다.
      "google-adsense-account": "",
    },
  },
  // 링크 공유 시 미리보기(썸네일) 정보를 제어합니다.
  openGraph: {
    // 콘텐츠 유형을 웹사이트로 지정합니다. (예: 'article', 'book')
    type: "website",
    // 콘텐츠의 언어 및 지역 설정을 지정합니다.
    locale: siteConfig.locale,
    // 콘텐츠의 표준 URL입니다.
    url: siteConfig.url,
    // 소셜 미디어 공유 시 표시될 제목입니다.
    title: { template: `%s | ${siteConfig.title}`, default: siteConfig.title },
    // 소셜 미디어 공유 시 표시될 설명입니다.
    description: siteConfig.description,
    // 웹사이트의 이름을 지정합니다.
    siteName: siteConfig.title,
    // 소셜 미디어 공유 시 표시될 이미지 목록입니다.
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
  // Twitter 카드 설정을 통해 트위터에서 링크 공유 시 미리보기 정보를 제어합니다.
  twitter: {
    // 트위터 카드의 유형을 'summary_large_image'로 지정합니다.
    // (제목, 설명, 큰 이미지 포함)
    card: "summary_large_image",
    // 트위터 카드에 표시될 제목입니다.
    title: { template: `%s | ${siteConfig.title}`, default: siteConfig.title },
    // 트위터 카드에 표시될 설명입니다.
    description: siteConfig.description,
    // 트위터 카드에 표시될 이미지 목록입니다.
    images: [{ url: siteConfig.author.photo, alt: siteConfig.title }],
  },
};
