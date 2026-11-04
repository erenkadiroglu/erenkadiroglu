/**
 * Single source of truth for everything the static README assets display.
 * Edit here, then run `npm run build` inside tools/ to regenerate the SVGs.
 */
export const profile = {
  name: 'Eren Kadiroğlu',
  handle: 'erenkadiroglu',
  host: 'kadiroglu',
  role: 'Computer Engineering Student · Mobile & Web Developer',
  facts: [
    ['education', 'Computer Engineering'],
    ['university', 'Kahramanmaraş Sütçü İmam Univ.'],
    ['focus', 'Android · REST APIs · Web'],
    ['primary', 'Kotlin · PHP · MySQL · C'],
    ['website', 'erenkadiroglu.com'],
    ['github', '@erenkadiroglu'],
  ],
};

/** `icon` refers to a key in icons.mjs; `glyph` entries render a built-in mark. */
export const stack = [
  {
    label: 'languages',
    items: [
      { name: 'C', icon: 'c' },
      { name: 'C++', icon: 'cplusplus' },
      { name: 'C#', icon: 'csharp' },
      { name: 'Python', icon: 'python' },
      { name: 'Kotlin', icon: 'kotlin' },
      { name: 'PHP', icon: 'php' },
      { name: 'SQL', glyph: 'database' },
    ],
  },
  {
    label: 'mobile',
    items: [
      { name: 'Android', icon: 'android' },
      { name: 'Android Studio', icon: 'androidstudio' },
      { name: 'Gradle', icon: 'gradle' },
    ],
    tags: ['MVVM', 'Room', 'Retrofit', 'OkHttp', 'Coroutines', 'LiveData'],
  },
  {
    label: 'backend & data',
    items: [
      { name: 'MySQL', icon: 'mysql' },
      { name: 'SQL Server', icon: 'sqlserver' },
      { name: 'Jupyter', icon: 'jupyter' },
      { name: 'pandas', icon: 'pandas' },
      { name: 'NumPy', icon: 'numpy' },
      { name: 'Matplotlib', icon: 'matplotlib' },
    ],
    tags: ['REST APIs', 'Seaborn'],
  },
  {
    label: 'web',
    items: [
      { name: 'HTML5', icon: 'html5' },
      { name: 'CSS3', icon: 'css3' },
    ],
  },
  {
    label: 'tooling',
    items: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'VS Code', icon: 'vscode' },
      { name: 'Visual Studio', icon: 'visualstudio' },
      { name: 'IntelliJ IDEA', icon: 'intellijidea' },
    ],
  },
];

export const featured = {
  slug: 'saharez',
  name: 'SahaRez',
  repo: 'erenkadiroglu/saharez-legacy',
  tagline: 'Offline-first booking platform for football pitches.',
  points: [
    'Role-based flows for pitch owners and players',
    'Room cache keeps the app usable without a network',
    'Waiting lists with instant booking confirmation',
    'Match ads to find opponents and rent equipment',
  ],
  tags: ['Kotlin', 'MVVM', 'Room', 'Retrofit', 'Coroutines', 'PHP', 'MySQL'],
  language: { name: 'Kotlin', color: '#A97BFF' },
};

export const projects = [
  {
    slug: 'minesweeper',
    name: 'minesweeper-c-project',
    repo: 'erenkadiroglu/minesweeper-c-project',
    description: 'Terminal Minesweeper in C with a user-defined board size, randomized mine placement and win/lose detection.',
    language: { name: 'C', color: '#555555' },
    tags: ['C', 'CLI', 'game logic'],
  },
  {
    slug: 'todo',
    name: 'Python-ToDoList',
    repo: 'erenkadiroglu/Python-ToDoList',
    description: 'Command-line task manager: priorities, keyword search, sorting, undo-delete and timestamped persistence.',
    language: { name: 'Python', color: '#3572A5' },
    tags: ['Python', 'CLI', 'file I/O'],
  },
  {
    slug: 'datascience',
    name: 'Veri Bilimine Giriş',
    repo: 'erenkadiroglu/TechCareer-Veri_Bilimine_Giris_Yaz_Kampi',
    description: 'Data analysis and visualization assignments from the TechCareer Introduction to Data Science camp.',
    language: { name: 'Jupyter Notebook', color: '#DA5B0B' },
    tags: ['pandas', 'NumPy', 'Seaborn'],
  },
  {
    slug: 'sql',
    name: 'SQL Yaz Kampı',
    repo: 'erenkadiroglu/TechCareer-SQL_Yaz_Kampi',
    description: 'Relational schema design, constraints and queries in T-SQL from the TechCareer SQL camp.',
    language: { name: 'TSQL', color: '#E38C00' },
    tags: ['T-SQL', 'schema design', 'constraints'],
  },
];

export const links = [
  { slug: 'website', label: 'erenkadiroglu.com', glyph: 'globe', href: 'https://erenkadiroglu.com' },
  { slug: 'linkedin', label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/erenkadiroglu' },
  { slug: 'email', label: 'Email', glyph: 'mail', href: 'mailto:erenkdroglu@gmail.com' },
  { slug: 'instagram', label: 'Instagram', icon: 'instagram', href: 'https://instagram.com/eren_kdroglu' },
];
