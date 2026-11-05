/**
 * Profile copy in both languages — the single source for README.md,
 * README.tr.md and the About / Projects / Experience panels.
 * `**bold**` marks emphasis; technology and project names are never translated.
 */
export const copy = {
  en: {
    about: {
      title: 'ABOUT.ME',
      meta: 'Eskişehir · Türkiye',
      paragraphs: [
        'Final-year Computer Engineering student at **Kahramanmaraş Sütçü İmam University**. I build mobile and web products end to end: React Native apps, React and Next.js frontends, and the TypeScript and Python services behind them.',
        "I care about clear architecture, privacy and software that keeps working when the network doesn't — and I use AI tooling as an everyday part of my engineering workflow.",
      ],
      principlesTitle: 'PRINCIPLES',
      principles: ['Clear, documented architecture', 'Privacy by default', 'Offline-first where it matters', 'Tested before it ships', 'AI-assisted, human-reviewed'],
      open: 'Open to internships, collaborations and new opportunities',
    },
    projects: {
      title: 'PROJECT.INDEX',
      meta: (n, p) => `${n} projects · ${p} private`,
      status: { private: 'private · in development', live: 'live', public: 'open source' },
      cta: { live: 'Visit site', public: 'View on GitHub' },
      highlightsTitle: 'MODULES',
      highlights: ['Player web app', 'Facility management panel', 'AI demand forecasting', 'Live booking & payments'],
      items: [
        {
          slug: 'saharez',
          name: 'SahaRez',
          status: 'private',
          desc: 'Booking and matchmaking platform for sports facilities: a player web app, a facility management panel and an AI service for demand forecasting and price suggestions. Graduation project, piloting in Eskişehir.',
          stack: ['NestJS', 'Next.js', 'React', 'FastAPI', 'PostgreSQL', 'PostGIS', 'Redis', 'Socket.IO'],
        },
        {
          slug: 'fileconvert',
          name: 'FileConvert',
          status: 'private',
          desc: 'Free, privacy-first mobile app that converts, merges, edits and compresses PDFs entirely on the device — no server, no account, no tracking.',
          stack: ['React Native', 'Expo', 'TypeScript', 'Kotlin', 'Skia'],
        },
        {
          slug: 'pathwords',
          name: 'PathWords',
          status: 'private',
          desc: 'Path-tracing word puzzle that teaches English–Turkish vocabulary, with a procedural generator for endless levels.',
          stack: ['React Native', 'Expo', 'TypeScript'],
        },
        {
          slug: 'portfolio',
          name: 'erenkadiroglu.com',
          status: 'live',
          link: 'https://erenkadiroglu.com',
          linkLabel: 'erenkadiroglu.com',
          desc: 'Personal portfolio with a JSON-driven content model and an admin panel; static and fast on GitHub Pages.',
          stack: ['JavaScript', 'Node.js', 'Express', 'GitHub Pages'],
        },
        {
          slug: 'minesweeper',
          name: 'Minesweeper',
          status: 'public',
          link: 'https://github.com/erenkadiroglu/minesweeper-c-project',
          linkLabel: 'minesweeper-c-project',
          desc: "Console strategy game in C: steer a path across a minefield while tracking each mine's zone of influence.",
          stack: ['C'],
        },
      ],
    },
    contact: [
      { slug: 'linkedin', label: 'LinkedIn', sub: 'in/erenkadiroglu', href: 'https://www.linkedin.com/in/erenkadiroglu', icon: 'linkedin' },
      { slug: 'portfolio', label: 'Portfolio', sub: 'erenkadiroglu.com', href: 'https://erenkadiroglu.com', glyph: 'globe' },
      { slug: 'email', label: 'Email', sub: 'erenkdroglu@gmail.com', href: 'mailto:erenkdroglu@gmail.com', glyph: 'mail' },
      { slug: 'instagram', label: 'Instagram', sub: '@eren_kdroglu', href: 'https://www.instagram.com/eren_kdroglu', icon: 'instagram' },
    ],
    experience: {
      title: 'EXPERIENCE.LOG',
      meta: (n) => `${n} internships`,
      items: [
        {
          period: 'Aug – Sep 2026',
          where: 'Eskişehir · On-site',
          role: 'Software Engineering Intern',
          org: 'Anadolu University · BAUM',
          points: [
            'Built accessible, responsive interfaces for the Eskişehir Encyclopedia digital library',
            'Worked on REST API integration and PostgreSQL data management in an Agile team',
          ],
        },
        {
          period: 'Feb – Apr 2026',
          where: 'Belgrade · Hybrid',
          role: 'International Project Management Intern',
          org: 'TNC Group & Human Ports',
          points: [
            'Owned a brand launch end to end, from the strategy document to the live website',
            'Earned the International Project Management Certificate after a 6-week programme',
          ],
        },
        {
          period: 'Jul – Aug 2025',
          where: 'Remote',
          role: 'IT Intern',
          org: 'TNC Group',
          points: [
            'Built a Python task manager and dynamic Excel sales dashboards',
            'Selected for the international internship programme in Belgrade',
          ],
        },
      ],
    },
  },
  tr: {
    about: {
      title: 'HAKKIMDA',
      meta: 'Eskişehir · Türkiye',
      paragraphs: [
        '**Kahramanmaraş Sütçü İmam Üniversitesi** Bilgisayar Mühendisliği 4. sınıf öğrencisiyim. Mobil ve web ürünlerini uçtan uca geliştiriyorum: React Native uygulamaları, React ve Next.js arayüzleri ve bunların arkasındaki TypeScript ve Python servisleri.',
        'Anlaşılır mimariye, gizliliğe ve ağ olmadığında da çalışmaya devam eden yazılıma önem veriyorum; yapay zekâ araçlarını mühendislik akışımın günlük bir parçası olarak kullanıyorum.',
      ],
      principlesTitle: 'İLKELER',
      principles: ['Anlaşılır, belgelenmiş mimari', 'Varsayılan olarak gizlilik', 'Gereken yerde önce çevrimdışı', 'Yayından önce test', 'Yapay zekâ destekli, insan denetimli'],
      open: 'Staj, iş birliği ve yeni fırsatlara açığım',
    },
    projects: {
      title: 'PROJE.DİZİNİ',
      meta: (n, p) => `${n} proje · ${p} özel`,
      status: { private: 'özel · geliştiriliyor', live: 'yayında', public: 'açık kaynak' },
      cta: { live: 'Siteyi aç', public: "GitHub'da incele" },
      highlightsTitle: 'MODÜLLER',
      highlights: ['Oyuncu web sitesi', 'Tesis yönetim paneli', 'Yapay zekâ talep tahmini', 'Canlı rezervasyon ve ödeme'],
      items: [
        {
          slug: 'saharez',
          name: 'SahaRez',
          status: 'private',
          desc: 'Spor tesisleri ile oyuncuları buluşturan rezervasyon ve eşleştirme platformu: oyuncu web sitesi, tesis yönetim paneli ve talep tahmini ile fiyat önerisi yapan bir yapay zekâ servisi. Bitirme projesi, pilot şehir Eskişehir.',
          stack: ['NestJS', 'Next.js', 'React', 'FastAPI', 'PostgreSQL', 'PostGIS', 'Redis', 'Socket.IO'],
        },
        {
          slug: 'fileconvert',
          name: 'FileConvert',
          status: 'private',
          desc: "PDF'leri cihazdan çıkarmadan dönüştüren, birleştiren, düzenleyen ve sıkıştıran ücretsiz mobil uygulama — sunucu, hesap ve takip yok.",
          stack: ['React Native', 'Expo', 'TypeScript', 'Kotlin', 'Skia'],
        },
        {
          slug: 'pathwords',
          name: 'PathWords',
          status: 'private',
          desc: 'İngilizce–Türkçe kelime öğreten, patika çizerek oynanan kelime bulmacası; sonsuz seviye üreten prosedürel bir motorla.',
          stack: ['React Native', 'Expo', 'TypeScript'],
        },
        {
          slug: 'portfolio',
          name: 'erenkadiroglu.com',
          status: 'live',
          link: 'https://erenkadiroglu.com',
          linkLabel: 'erenkadiroglu.com',
          desc: "İçeriği JSON'dan yönetilen, yönetim panelli kişisel portföy; GitHub Pages'te statik ve hızlı.",
          stack: ['JavaScript', 'Node.js', 'Express', 'GitHub Pages'],
        },
        {
          slug: 'minesweeper',
          name: 'Mayın Tarlası',
          status: 'public',
          link: 'https://github.com/erenkadiroglu/minesweeper-c-project',
          linkLabel: 'minesweeper-c-project',
          desc: 'C ile yazılmış konsol tabanlı strateji oyunu: mayınların etki alanlarını takip ederek tarlada yol bulma.',
          stack: ['C'],
        },
      ],
    },
    contact: [
      { slug: 'linkedin', label: 'LinkedIn', sub: 'in/erenkadiroglu', href: 'https://www.linkedin.com/in/erenkadiroglu', icon: 'linkedin' },
      { slug: 'portfolio', label: 'Portfolyo', sub: 'erenkadiroglu.com', href: 'https://erenkadiroglu.com', glyph: 'globe' },
      { slug: 'email', label: 'E-posta', sub: 'erenkdroglu@gmail.com', href: 'mailto:erenkdroglu@gmail.com', glyph: 'mail' },
      { slug: 'instagram', label: 'Instagram', sub: '@eren_kdroglu', href: 'https://www.instagram.com/eren_kdroglu', icon: 'instagram' },
    ],
    experience: {
      title: 'DENEYİM.KAYDI',
      meta: (n) => `${n} staj`,
      items: [
        {
          period: 'Ağu – Eyl 2026',
          where: 'Eskişehir · Yerinde',
          role: 'Yazılım Mühendisliği Stajyeri',
          org: 'Anadolu Üniversitesi · BAUM',
          points: [
            'Eskişehir Ansiklopedisi dijital kütüphanesi için erişilebilir, duyarlı arayüzler geliştirdim',
            'Çevik bir ekipte REST API entegrasyonu ve PostgreSQL veri yönetimi üzerinde çalıştım',
          ],
        },
        {
          period: 'Şub – Nis 2026',
          where: 'Belgrad · Hibrit',
          role: 'Uluslararası Proje Yönetimi Stajyeri',
          org: 'TNC Group & Human Ports',
          points: [
            'Bir marka lansmanını strateji belgesinden yayındaki web sitesine kadar uçtan uca yönettim',
            '6 haftalık programın sonunda Uluslararası Proje Yönetimi Sertifikası aldım',
          ],
        },
        {
          period: 'Tem – Ağu 2025',
          where: 'Uzaktan',
          role: 'Bilgi Teknolojileri Stajyeri',
          org: 'TNC Group',
          points: [
            'Python ile görev yönetimi uygulaması ve dinamik Excel satış panoları geliştirdim',
            "Belgrad'daki uluslararası staj programına seçildim",
          ],
        },
      ],
    },
  },
};
