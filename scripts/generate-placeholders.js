import sharp from 'sharp';
import satori from 'satori';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Google Fontsからフォントを取得する関数
async function fetchGoogleFont(fontFamily, fontWeight = 400) {
  const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${fontWeight}&display=swap`;
  const cssResponse = await fetch(url);
  const css = await cssResponse.text();
  
  // CSSからフォントURLを抽出
  const fontUrlMatch = css.match(/url\(([^)]+)\)/);
  if (!fontUrlMatch) throw new Error('Font URL not found');
  
  const fontUrl = fontUrlMatch[1].replace(/['"]/g, '');
  const fontResponse = await fetch(fontUrl);
  const fontBuffer = await fontResponse.arrayBuffer();
  
  return Buffer.from(fontBuffer);
}

// カテゴリー別の色設定
const categoryColors = {
  PRIMITIVE: {
    primary: '#ff6b35',
    secondary: '#ff8a65',
    accent: '#ffab40'
  },
  SERVICE: {
    primary: '#ff6b35',
    secondary: '#ff8a65',
    accent: '#ffab40'
  },
  EVENT: {
    primary: '#ff6b35',
    secondary: '#ff8a65',
    accent: '#ffab40'
  },
  WORKS: {
    primary: '#ff6b35',
    secondary: '#ff8a65',
    accent: '#ffab40'
  }
};

// プレースホルダーテンプレート
function PlaceholderTemplate({ category }) {
  const colors = categoryColors[category];
  
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0f0f0f',
        fontFamily: 'Noto Sans JP',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      },
      children: [
        // 背景のグラデーション効果
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle at 30% 30%, ${colors.primary}15 0%, transparent 50%)`,
              transform: 'rotate(45deg)'
            }
          }
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle at 70% 70%, ${colors.accent}10 0%, transparent 50%)`,
              transform: 'rotate(-45deg)'
            }
          }
        },
        // 枠線
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: `3px solid ${colors.primary}30`,
              boxSizing: 'border-box',
              pointerEvents: 'none'
            }
          }
        },
        // カテゴリー別のアイコン
        {
          type: 'svg',
          props: {
            width: 160,
            height: 160,
            viewBox: '0 0 160 160',
            style: {
              marginBottom: 50,
              opacity: 0.7
            },
            children: getIconForCategory(category, colors)
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 64,
              fontWeight: 'bold',
              marginBottom: 20,
              color: colors.primary,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              opacity: 0.9
            },
            children: category
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 24,
              color: '#a0a0a0',
              letterSpacing: '3px',
              opacity: 0.7,
              marginBottom: 10
            },
            children: 'uboar.net'
          }
        }
      ]
    }
  };
}

// カテゴリー別のアイコンを返す関数
function getIconForCategory(category, colors) {
  switch (category) {
    case 'PRIMITIVE':
      // 基本的な幾何学図形
      return [
        {
          type: 'circle',
          props: {
            cx: 80,
            cy: 80,
            r: 70,
            fill: 'none',
            stroke: colors.primary,
            strokeWidth: 3,
            opacity: 0.5
          }
        },
        {
          type: 'polygon',
          props: {
            points: '80,30 130,110 30,110',
            fill: 'none',
            stroke: colors.secondary,
            strokeWidth: 3,
            opacity: 0.7
          }
        },
        {
          type: 'rect',
          props: {
            x: 60,
            y: 60,
            width: 40,
            height: 40,
            fill: colors.accent,
            opacity: 0.3
          }
        }
      ];
    
    case 'SERVICE':
      // ギアアイコン
      return [
        {
          type: 'path',
          props: {
            d: 'M80 50 L80 30 M80 130 L80 110 M110 80 L130 80 M30 80 L50 80 M103 57 L117 43 M43 117 L57 103 M103 103 L117 117 M43 43 L57 57',
            stroke: colors.primary,
            strokeWidth: 3,
            strokeLinecap: 'round',
            fill: 'none',
            opacity: 0.7
          }
        },
        {
          type: 'circle',
          props: {
            cx: 80,
            cy: 80,
            r: 30,
            fill: 'none',
            stroke: colors.secondary,
            strokeWidth: 3,
            opacity: 0.8
          }
        },
        {
          type: 'circle',
          props: {
            cx: 80,
            cy: 80,
            r: 15,
            fill: colors.accent,
            opacity: 0.4
          }
        }
      ];
    
    case 'EVENT':
      // カレンダーアイコン
      return [
        {
          type: 'rect',
          props: {
            x: 40,
            y: 50,
            width: 80,
            height: 80,
            rx: 8,
            fill: 'none',
            stroke: colors.primary,
            strokeWidth: 3,
            opacity: 0.7
          }
        },
        {
          type: 'line',
          props: {
            x1: 40,
            y1: 70,
            x2: 120,
            y2: 70,
            stroke: colors.secondary,
            strokeWidth: 3,
            opacity: 0.6
          }
        },
        {
          type: 'line',
          props: {
            x1: 55,
            y1: 40,
            x2: 55,
            y2: 60,
            stroke: colors.primary,
            strokeWidth: 3,
            strokeLinecap: 'round',
            opacity: 0.8
          }
        },
        {
          type: 'line',
          props: {
            x1: 105,
            y1: 40,
            x2: 105,
            y2: 60,
            stroke: colors.primary,
            strokeWidth: 3,
            strokeLinecap: 'round',
            opacity: 0.8
          }
        },
        {
          type: 'circle',
          props: {
            cx: 80,
            cy: 100,
            r: 8,
            fill: colors.accent,
            opacity: 0.6
          }
        }
      ];
    
    default:
      // デフォルトアイコン
      return [
        {
          type: 'circle',
          props: {
            cx: 80,
            cy: 80,
            r: 70,
            fill: 'none',
            stroke: colors.primary,
            strokeWidth: 3,
            opacity: 0.5
          }
        }
      ];
  }
}

async function generatePlaceholders() {
  console.log('🎨 Generating placeholder images...');
  
  // Google Fontsから日本語対応フォントを取得
  console.log('📥 Fetching fonts from Google Fonts...');
  const fontDataBold = await fetchGoogleFont('Noto+Sans+JP', 700);
  const fontDataRegular = await fetchGoogleFont('Noto+Sans+JP', 400);
  
  const fonts = [
    {
      name: 'Noto Sans JP',
      data: fontDataBold,
      weight: 700,
      style: 'normal'
    },
    {
      name: 'Noto Sans JP',
      data: fontDataRegular,
      weight: 400,
      style: 'normal'
    }
  ];
  
  // 各カテゴリーの画像を生成
  const categories = ['PRIMITIVE', 'SERVICE', 'EVENT'];
  
  for (const category of categories) {
    console.log(`📸 Generating ${category} placeholder...`);
    
    // SVGを生成
    const svg = await satori(
      PlaceholderTemplate({ category }),
      {
        width: 1200,
        height: 630,
        fonts
      }
    );
    
    // SVGをPNGに変換
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    
    // publicフォルダに保存
    const outputPath = path.join(process.cwd(), 'public', `placeholder-${category.toLowerCase()}.png`);
    await fs.writeFile(outputPath, png);
    
    console.log(`✅ ${category} placeholder generated at:`, outputPath);
  }
  
  // 汎用プレースホルダーも更新（文字を大きく）
  console.log('📸 Updating general placeholder...');
  const generalSvg = await satori(
    PlaceholderTemplate({ category: 'WORKS' }),
    {
      width: 1200,
      height: 630,
      fonts
    }
  );
  
  const generalPng = await sharp(Buffer.from(generalSvg)).png().toBuffer();
  const generalPath = path.join(process.cwd(), 'public', 'placeholder-works.png');
  await fs.writeFile(generalPath, generalPng);
  
  console.log('✅ All placeholder images generated successfully!');
}

// 実行
generatePlaceholders().catch(console.error);