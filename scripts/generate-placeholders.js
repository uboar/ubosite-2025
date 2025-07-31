import sharp from 'sharp';
import satori from 'satori';
import fs from 'fs/promises';
import path from 'path';
import { readFileSync } from 'fs';
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
            width: 120,
            height: 120,
            viewBox: '0 0 120 120',
            style: {
              marginBottom: 40,
              opacity: 0.8
            },
            children: getIconForCategory(category, colors)
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 56,
              fontWeight: 'bold',
              marginBottom: 16,
              color: colors.primary,
              letterSpacing: '4px',
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
              fontSize: 20,
              color: '#a0a0a0',
              letterSpacing: '2px',
              opacity: 0.6
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
  // カテゴリーに応じたアイコンファイル名をマッピング
  const iconMap = {
    'PRIMITIVE': 'shape',
    'SERVICE': 'settings',
    'EVENT': 'calendar-event',
    'WORKS': 'briefcase'
  };
  
  const iconName = iconMap[category] || 'photo';
  
  try {
    // Tabler Iconsからアイコンを読み込み
    const iconPath = path.join(process.cwd(), 'node_modules', '@tabler', 'icons', 'icons', 'outline', `${iconName}.svg`);
    const iconSvg = readFileSync(iconPath, 'utf-8');
    
    // SVG文字列をパースして、必要な部分を抽出
    const pathMatch = iconSvg.match(/<path[^>]*d="([^"]+)"/g);
    const circleMatch = iconSvg.match(/<circle[^>]*>/g);
    const rectMatch = iconSvg.match(/<rect[^>]*>/g);
    const lineMatch = iconSvg.match(/<line[^>]*>/g);
    const polygonMatch = iconSvg.match(/<polygon[^>]*>/g);
    const polylineMatch = iconSvg.match(/<polyline[^>]*>/g);
    
    const elements = [];
    
    // パス要素を処理
    if (pathMatch) {
      pathMatch.forEach((path, index) => {
        const dMatch = path.match(/d="([^"]+)"/);
        if (dMatch) {
          elements.push({
            type: 'path',
            props: {
              d: dMatch[1],
              fill: 'none',
              stroke: index === 0 ? colors.primary : colors.secondary,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              transform: 'translate(60, 60) scale(3.5) translate(-12, -12)',  // 中央配置
              opacity: 1
            }
          });
        }
      });
    }
    
    // 円要素を処理
    if (circleMatch) {
      circleMatch.forEach((circle) => {
        const cxMatch = circle.match(/cx="([^"]+)"/);
        const cyMatch = circle.match(/cy="([^"]+)"/);
        const rMatch = circle.match(/r="([^"]+)"/);
        
        if (cxMatch && cyMatch && rMatch) {
          elements.push({
            type: 'circle',
            props: {
              cx: (parseFloat(cxMatch[1]) - 12) * 3.5 + 60,
              cy: (parseFloat(cyMatch[1]) - 12) * 3.5 + 60,
              r: parseFloat(rMatch[1]) * 3.5,
              fill: 'none',
              stroke: colors.accent,
              strokeWidth: 1.5,
              opacity: 1
            }
          });
        }
      });
    }
    
    // 矩形要素を処理
    if (rectMatch) {
      rectMatch.forEach((rect) => {
        const xMatch = rect.match(/x="([^"]+)"/);
        const yMatch = rect.match(/y="([^"]+)"/);
        const widthMatch = rect.match(/width="([^"]+)"/);
        const heightMatch = rect.match(/height="([^"]+)"/);
        const rxMatch = rect.match(/rx="([^"]+)"/);
        
        if (xMatch && yMatch && widthMatch && heightMatch) {
          elements.push({
            type: 'rect',
            props: {
              x: (parseFloat(xMatch[1]) - 12) * 3.5 + 60,
              y: (parseFloat(yMatch[1]) - 12) * 3.5 + 60,
              width: parseFloat(widthMatch[1]) * 3.5,
              height: parseFloat(heightMatch[1]) * 3.5,
              rx: rxMatch ? parseFloat(rxMatch[1]) * 3.5 : 0,
              fill: 'none',
              stroke: colors.primary,
              strokeWidth: 1.5,
              opacity: 1
            }
          });
        }
      });
    }
    
    // ライン要素を処理
    if (lineMatch) {
      lineMatch.forEach((line) => {
        const x1Match = line.match(/x1="([^"]+)"/);
        const y1Match = line.match(/y1="([^"]+)"/);
        const x2Match = line.match(/x2="([^"]+)"/);
        const y2Match = line.match(/y2="([^"]+)"/);
        
        if (x1Match && y1Match && x2Match && y2Match) {
          elements.push({
            type: 'line',
            props: {
              x1: (parseFloat(x1Match[1]) - 12) * 3.5 + 60,
              y1: (parseFloat(y1Match[1]) - 12) * 3.5 + 60,
              x2: (parseFloat(x2Match[1]) - 12) * 3.5 + 60,
              y2: (parseFloat(y2Match[1]) - 12) * 3.5 + 60,
              stroke: colors.secondary,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              opacity: 1
            }
          });
        }
      });
    }
    
    // ポリライン要素を処理
    if (polylineMatch) {
      polylineMatch.forEach((polyline) => {
        const pointsMatch = polyline.match(/points="([^"]+)"/);
        
        if (pointsMatch) {
          const scaledPoints = pointsMatch[1]
            .split(' ')
            .map(point => {
              const [x, y] = point.split(',');
              return `${(parseFloat(x) - 12) * 3.5 + 60},${(parseFloat(y) - 12) * 3.5 + 60}`;
            })
            .join(' ');
          
          elements.push({
            type: 'polyline',
            props: {
              points: scaledPoints,
              fill: 'none',
              stroke: colors.primary,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              opacity: 1
            }
          });
        }
      });
    }
    
    return elements;
  } catch (error) {
    console.warn(`Icon ${iconName} not found, using fallback`);
    // フォールバックアイコン
    return [{
      type: 'rect',
      props: {
        x: 70,
        y: 70,
        width: 80,
        height: 80,
        rx: 8,
        fill: 'none',
        stroke: colors.primary,
        strokeWidth: 3,
        opacity: 1
      }
    }];
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