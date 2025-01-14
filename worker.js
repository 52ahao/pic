addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 获取请求的 URL
  const url = new URL(request.url)
  
  // 构建 GitHub raw 链接
  const githubUrl = 'https://raw.githubusercontent.com/52ahao/pic/main' + url.pathname
  
  // 转发请求到 GitHub
  const response = await fetch(githubUrl, {
    headers: request.headers,
    method: request.method
  })
  
  // 修改响应头
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Cache-Control', 'public, max-age=86400')
  
  return newResponse
} 