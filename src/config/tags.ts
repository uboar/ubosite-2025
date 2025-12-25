// 定義済みタグの設定

export const predefinedTags = {
  blog: [
    'ニコニコメドレーシリーズ',
    'アドベントカレンダー',
  ],
  works: [
    '音楽',
    'ニコニコメドレー',
    '動画投稿',
    '同人即売会',
    'DJ',
    'シングル',
    'EP',
    'アルバム',
    '紡乃世詞音',
  ],
} as const;

export type BlogTag = typeof predefinedTags.blog[number];
export type WorksTag = typeof predefinedTags.works[number];