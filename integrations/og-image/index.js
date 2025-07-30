import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import satori from 'satori';
import matter from 'gray-matter';
import { readFile } from 'fs/promises';

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

export default function ogImageIntegration() {
  return {
    name: 'og-image-generator',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        console.log('🎨 Generating OG images...');
        
        // Google Fontsから日本語対応フォントを取得
        console.log('📥 Fetching fonts from Google Fonts...');
        const fontDataBold = await fetchGoogleFont('Noto+Sans+JP', 700);
        const fontDataRegular = await fetchGoogleFont('Noto+Sans+JP', 400);
        
        // favicon.svgを読み込み
        const faviconPath = path.join(process.cwd(), 'public', 'favicon.svg');
        const faviconSvg = await readFile(faviconPath, 'utf-8');
        
        // OG画像保存用ディレクトリの作成
        const ogDir = path.join(dir.pathname, 'og');
        await fs.mkdir(ogDir, { recursive: true });
        
        // ホームページのOG画像生成
        await generateOGImage({
          title: 'uboar.net',
          description: 'WRITE SOMETHING ANYWAY',
          type: 'home',
          output: path.join(ogDir, 'home.png'),
          fontDataBold,
          fontDataRegular,
          faviconSvg
        });
        
        // ブログ一覧ページのOG画像生成
        await generateOGImage({
          title: 'BLOG',
          description: 'WRITE SOMETHING ANYWAY',
          type: 'list',
          output: path.join(ogDir, 'blog.png'),
          fontDataBold,
          fontDataRegular
        });
        
        // Works一覧ページのOG画像生成
        await generateOGImage({
          title: 'WORKS',
          description: 'WRITE SOMETHING ANYWAY',
          type: 'list',
          output: path.join(ogDir, 'works.png'),
          fontDataBold,
          fontDataRegular
        });
        
        // LinkページのOG画像生成
        await generateOGImage({
          title: 'LINK',
          description: 'WRITE SOMETHING ANYWAY',
          type: 'list',
          output: path.join(ogDir, 'link.png'),
          fontDataBold,
          fontDataRegular
        });
        
        // 各ブログ記事のOG画像生成
        const blogOgDir = path.join(ogDir, 'blog');
        await fs.mkdir(blogOgDir, { recursive: true });
        
        // コンテンツディレクトリからブログ記事を読み込み
        const blogDir = path.join(process.cwd(), 'src/content/blog');
        const blogFiles = await fs.readdir(blogDir);
        
        for (const file of blogFiles) {
          if (file.endsWith('.md')) {
            const filePath = path.join(blogDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const { data } = matter(content);
            const slug = data.slug || file.replace('.md', '');
            
            await generateOGImage({
              title: data.title,
              description: data.description || '',
              type: 'article',
              category: 'Blog - uboar.net',
              date: data.pubDate,
              output: path.join(blogOgDir, `${slug}.png`),
              fontDataBold,
              fontDataRegular
            });
          }
        }
        
        // 各プロジェクトのOG画像生成
        const worksOgDir = path.join(ogDir, 'works');
        await fs.mkdir(worksOgDir, { recursive: true });
        
        // コンテンツディレクトリからワーク記事を読み込み
        const worksDir = path.join(process.cwd(), 'src/content/works');
        const worksFiles = await fs.readdir(worksDir);
        
        for (const file of worksFiles) {
          if (file.endsWith('.md')) {
            const filePath = path.join(worksDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const { data } = matter(content);
            const slug = data.slug || file.replace('.md', '');
            
            await generateOGImage({
              title: data.title,
              description: data.description || '',
              type: 'article',
              category: 'Works - uboar.net',
              tags: data.tags || [],
              output: path.join(worksOgDir, `${slug}.png`),
              fontDataBold,
              fontDataRegular
            });
          }
        }
        
        console.log('✅ OG images generated successfully!');
      }
    }
  };
}

async function generateOGImage({ title, description, type, category, date, tags, output, fontDataBold, fontDataRegular, faviconSvg }) {
  let svg;
  
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
  
  // タイプに応じてテンプレートを選択
  if (type === 'home') {
    svg = await satori(
      HomeTemplate({ title, description, faviconSvg }),
      {
        width: 1200,
        height: 630,
        fonts
      }
    );
  } else if (type === 'list') {
    svg = await satori(
      ListTemplate({ title, description }),
      {
        width: 1200,
        height: 630,
        fonts
      }
    );
  } else if (type === 'article') {
    svg = await satori(
      ArticleTemplate({ title, description, category, date, tags }),
      {
        width: 1200,
        height: 630,
        fonts
      }
    );
  }
  
  // SVGをPNGに変換
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(output, png);
}

// ホームページ用テンプレート
function HomeTemplate({ title, description, faviconSvg }) {
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
              border: '8px solid #ff6b35',
              boxSizing: 'border-box',
              pointerEvents: 'none'
            }
          }
        },
        // Faviconを中央に配置 (SVGをパスとして描画)
        {
          type: 'svg',
          props: {
            width: 120,
            height: 120,
            viewBox: '0 0 160 160',
            style: {
              marginBottom: 40,
            },
            children: {
              type: 'path',
              props: {
                fill: '#ffffff',
                d: 'M91.52,23.63v54.45h.08v.04h10.07c9.86-6.86,21.39-11.47,33.86-13.11-5.63-20.83-22.69-37.02-44.01-41.37ZM107.11,62.29v-14.98c4.77,4.19,8.72,9.27,11.62,14.98h-11.62Z M91.6,81.76v4.71c1.68-1.65,3.44-3.21,5.26-4.71h-5.26Z M88.36,136.91c.72-.1,1.44-.23,2.15-.36.11-.02.22-.04.32-.06.44-.08.88-.18,1.33-.28.22-.05.44-.09.65-.14.21-.05.43-.1.64-.15.37-.09.74-.19,1.1-.28.22-.06.44-.11.66-.17.3-.08.6-.17.9-.26.29-.08.57-.17.85-.26.22-.07.44-.13.65-.2.48-.16.96-.32,1.44-.49.09-.03.19-.06.28-.1.23-.08.46-.16.68-.25.74-.28,1.47-.56,2.19-.87.06-.03.13-.05.19-.08.84-.36,1.67-.73,2.48-1.12.02-.01.04-.02.07-.03.82-.4,1.63-.81,2.42-1.24,0,0,.02,0,.03-.01,8.13-4.42,15.07-10.75,20.24-18.38.04-.05.07-.11.11-.16.44-.66.87-1.33,1.29-2.01.1-.17.21-.34.31-.51.34-.57.67-1.14.99-1.72.13-.24.27-.49.4-.73.28-.51.54-1.04.8-1.56.15-.29.29-.58.43-.88.23-.49.45-.98.67-1.48.14-.33.29-.65.43-.98.21-.5.4-1,.59-1.5.11-.29.23-.57.34-.86.01-.04.03-.08.04-.11.12-.34.23-.68.35-1.02.15-.42.3-.84.43-1.27.01-.04.03-.08.04-.12.14-.43.26-.87.38-1.3.12-.4.24-.8.34-1.21.12-.45.23-.91.34-1.36.1-.42.2-.84.29-1.26.1-.44.18-.89.27-1.34.09-.45.17-.9.24-1.35.05-.32.1-.65.15-.98.03-.18.05-.36.08-.54.06-.42.11-.83.16-1.25.02-.17.04-.34.06-.51.03-.32.07-.65.1-.97.02-.2.03-.39.04-.59-5.34.78-10.5,2.31-15.35,4.51-4.47,14.9-15.72,26.86-30.17,32.31-1.84,4.94-3.01,10.14-3.44,15.47Z M137.53,80c0-.97-.03-1.92-.07-2.88-.02-.33-.05-.65-.07-.97-.04-.63-.08-1.26-.14-1.89-.03-.34-.08-.68-.12-1.02-.07-.61-.14-1.22-.23-1.83-.04-.3-.1-.6-.15-.89-.09-.54-.18-1.07-.29-1.6-15.79,2-30.61,9.17-42.04,20.41l-6.8,6.68v-13.92h-15.12v54.93s.06,0,.09.01c.69.09,1.3.17,1.91.23.27.03.55.04.82.06.11,0,.22.01.34.02l.44.04c.37.03.74.06,1.12.08.93.04,1.86.07,2.81.07s1.88-.03,2.82-.07c.49-.02,1.01-.07,1.52-.11.41-6.16,1.73-12.06,3.83-17.59.02-.04.03-.09.05-.13,2.04-5.35,4.8-10.33,8.17-14.85.02-.03.04-.05.06-.08,3.39-4.52,7.38-8.56,11.86-12,0,0,.01,0,.02-.01,4.5-3.45,9.48-6.28,14.84-8.39,0,0,0,0,0,0,4.54-1.79,9.35-3.05,14.35-3.72,0-.19.01-.38.01-.57Z M68.48,136.37V23.63c-26.22,5.35-46.01,28.59-46.01,56.37,0,11.36,3.32,21.95,9.03,30.88h21.46v19.88c4.81,2.57,10.02,4.49,15.52,5.61ZM39.99,95.12c-1.54-4.63-2.38-9.57-2.38-14.71,0-13.71,5.93-26.03,15.35-34.55v49.26h-12.97Z M72.48,3.13v74.63h15.04V3.13c-2.48-.24-4.98-.37-7.52-.37s-5.04.13-7.52.37Z M91.52,3.62v15.95c23.51,4.46,42.29,22.28,48.12,45.27.2.79.38,1.58.55,2.38.05.22.09.44.14.67.17.85.32,1.71.46,2.57.03.18.05.36.08.55.12.79.22,1.58.3,2.37.02.16.04.32.05.49.09.9.16,1.8.21,2.7.01.21.02.41.03.62.04.94.07,1.88.07,2.82,0,1-.03,2-.08,3-.02.33-.04.65-.07.97-.04.66-.09,1.33-.15,1.98-.04.39-.08.77-.13,1.15-.07.58-.14,1.17-.22,1.74-.02.11-.03.21-.04.32-.05.31-.1.61-.15.91-.09.53-.18,1.06-.28,1.59-.03.15-.05.31-.08.46-.06.28-.12.56-.18.84-.11.5-.22.99-.34,1.48-.05.2-.09.39-.14.59-.06.25-.13.51-.2.76-.12.47-.26.93-.39,1.39-.07.23-.13.47-.2.7-.07.23-.14.45-.21.67-.14.45-.3.89-.45,1.33-.09.26-.18.53-.27.79-.07.2-.13.39-.21.59-.16.44-.34.86-.51,1.29-.1.27-.21.53-.31.8-.06.16-.12.32-.19.48-.14.34-.3.67-.45,1.01-.06.13-.11.25-.17.38-.1.22-.2.45-.3.67-.08.17-.15.33-.23.5-.19.41-.4.8-.6,1.2-.06.12-.11.23-.17.35-.07.14-.14.29-.21.43-.09.17-.18.34-.27.51-.22.42-.46.84-.69,1.25-.22.39-.44.78-.67,1.17-.25.43-.51.85-.78,1.27-.13.21-.26.43-.4.64-.03.05-.07.11-.11.16-.06.09-.12.18-.18.27-.28.43-.57.86-.86,1.28-.13.18-.25.37-.38.55-.11.16-.23.31-.34.47-.3.42-.61.84-.92,1.25-.12.16-.24.31-.36.47-.14.18-.28.36-.43.54-.31.4-.63.79-.95,1.18-.09.11-.19.22-.28.33-.02.03-.05.05-.07.08-.16.19-.33.38-.5.58-.47.54-.94,1.07-1.43,1.59-.15.16-.3.32-.46.48-.51.54-1.03,1.07-1.57,1.59-.13.12-.26.25-.39.37-.14.13-.28.26-.41.39-.13.12-.25.24-.37.36-.31.29-.63.57-.94.85-.09.08-.19.16-.28.24-.1.09-.21.18-.31.27-.17.15-.34.29-.51.44-.37.31-.74.62-1.11.92-.04.03-.07.06-.11.09-.11.09-.23.18-.35.27-.18.14-.35.28-.53.42-.54.42-1.09.83-1.65,1.23-.16.12-.33.23-.49.35-.59.42-1.18.82-1.78,1.22-.11.07-.22.14-.33.21-3.59,2.32-7.43,4.28-11.47,5.83,0,0,0,0,0,0-.77.29-1.55.57-2.34.83-.09.03-.18.06-.27.09-.76.25-1.52.48-2.29.7-.11.03-.23.06-.34.1-.77.22-1.55.42-2.33.61-.09.02-.19.04-.28.06-.82.19-1.64.37-2.47.53h0s0,0,0,0c0,0,0,0,0,0-.93.18-1.86.34-2.81.47-.03,0-.06,0-.09.01-.92.13-1.85.25-2.79.34,0,0,0,0,0,0-.18.02-.36.03-.55.04,0,0,0,0,0,0-.39.03-.79.06-1.18.09,0,0,0,0,0,0-1.38.09-2.77.16-4.18.16-.98,0-1.96-.02-2.93-.07-.02,0-.04,0-.06,0-.77-.04-1.53-.1-2.3-.17-.18-.01-.36-.02-.53-.04-.02,0-.03,0-.05,0-1.91-.18-3.79-.46-5.65-.81,0,0,0,0,0,0-5.46-1.04-10.67-2.79-15.52-5.16,0,0,0,0,0,0-1.16-.57-2.3-1.18-3.42-1.82-.27-.16-.55-.31-.81-.47-.47-.28-.93-.56-1.39-.85-.26-.16-.52-.33-.78-.5-.47-.31-.94-.61-1.4-.93-.13-.09-.25-.18-.37-.27-1.02-.71-2.01-1.46-2.98-2.23-.13-.1-.26-.2-.39-.31-.48-.39-.95-.78-1.42-1.18-.16-.14-.32-.28-.48-.42-.48-.42-.95-.84-1.42-1.28-.05-.05-.1-.09-.14-.14-1.57-1.48-3.07-3.03-4.48-4.67-.06-.07-.11-.13-.17-.2-9.23-10.76-14.82-24.74-14.82-40.03,0-30.04,21.54-55.04,50.01-60.43V3.62C31.28,9.18,2.76,41.25,2.76,80c0,42.66,34.58,77.24,77.24,77.24s77.24-34.58,77.24-77.24c0-38.75-28.53-70.82-65.72-76.38Z'
              }
            }
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 72,
              fontWeight: 'bold',
              marginBottom: 20,
              color: '#ffffff',
              letterSpacing: '-2px'
            },
            children: title
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 32,
              color: '#e5e5e5',
              opacity: 0.9
            },
            children: description
          }
        }
      ]
    }
  };
}

// 一覧ページ用テンプレート
function ListTemplate({ title, description }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '100%',
        padding: '80px',
        backgroundColor: '#0f0f0f',
        fontFamily: 'Noto Sans JP',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      },
      children: [
        // 左端のアクセントライン
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: '100%',
              backgroundColor: '#ff6b35'
            }
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 80,
              fontWeight: 'bold',
              marginBottom: 30,
              letterSpacing: '-3px',
              color: '#ffffff',
            },
            children: title
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 28,
              color: '#a0a0a0',
              lineHeight: 1.5,
              maxWidth: 800
            },
            children: description
          }
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 40,
              left: 80,
              fontSize: 20,
              color: '#e5e5e5',
              opacity: 0.6
            },
            children: 'uboar.net'
          }
        }
      ]
    }
  };
}

// 記事用テンプレート
function ArticleTemplate({ title, description, category, date, tags }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '60px 80px',
        backgroundColor: '#0f0f0f',
        fontFamily: 'Noto Sans JP',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      },
      children: [
        // 左端のアクセントライン
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: '100%',
              backgroundColor: '#ff6b35'
            }
          }
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              zIndex: 1
            },
            children: [
              category && {
                type: 'div',
                props: {
                  style: {
                    fontSize: 20,
                    color: '#ff6b35',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: '600'
                  },
                  children: category
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 48,
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                    letterSpacing: '-1px',
                    marginBottom: 16,
                    color: '#ffffff',
                  },
                  children: title
                }
              },
              description && {
                type: 'div',
                props: {
                  style: {
                    fontSize: 24,
                    color: '#a0a0a0',
                    lineHeight: 1.4,
                    maxWidth: '800px'
                  },
                  children: description
                }
              }
            ].filter(Boolean)
          }
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              zIndex: 1
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap'
                  },
                  children: tags?.slice(0, 3).map(tag => ({
                    type: 'div',
                    props: {
                      style: {
                        padding: '6px 16px',
                        backgroundColor: 'rgba(255, 107, 53, 0.15)',
                        border: '1px solid rgba(255, 107, 53, 0.3)',
                        borderRadius: '4px',
                        fontSize: 16,
                        color: '#e5e5e5'
                      },
                      children: tag
                    }
                  })) || []
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 18,
                    color: '#a0a0a0'
                  },
                  children: date ? new Date(date).toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'uboar.net'
                }
              }
            ]
          }
        }
      ]
    }
  };
}