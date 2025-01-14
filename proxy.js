// 代理服务配置
const CONFIG = {
    GITHUB_RAW: 'https://raw.githubusercontent.com/52ahao/pic/main/',
    ALLOWED_ORIGINS: ['*'], // 允许的域名，'*' 表示允许所有
    CACHE_TIME: 86400 // 缓存时间（秒）
};

// 处理图片请求
async function handleImageRequest(path) {
    try {
        // 构建原始图片URL
        const imageUrl = CONFIG.GITHUB_RAW + path;
        
        // 获取图片
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // 获取原始响应的headers
        const headers = new Headers({
            'Content-Type': response.headers.get('Content-Type'),
            'Cache-Control': `public, max-age=${CONFIG.CACHE_TIME}`,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Max-Age': '86400',
        });

        // 返回代理的响应
        return new Response(response.body, {
            status: 200,
            headers: headers
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理请求
async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.substring(1); // 移除开头的 '/'

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    // 如果是图片请求
    if (path) {
        return handleImageRequest(path);
    }

    // 默认响应
    return new Response('Image proxy service is running', {
        headers: { 'Content-Type': 'text/plain' }
    });
}

// 监听所有请求
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
}); 