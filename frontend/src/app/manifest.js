export default function manifest() {
  return {
    id: '/',
    name: 'VocabLearning',
    short_name: 'VocabLearning',
    description: 'Học từ vựng tiếng Anh thông minh với hệ thống SRS',
    lang: 'vi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#FCF1D6',
    theme_color: '#3549BB',
    icons: [
      { src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
