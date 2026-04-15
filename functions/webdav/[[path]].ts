// functions/webdav/[[path]].ts

export async function onRequest(context: { request: Request; params: any }) {
  const { request } = context;

  try {
    const url = new URL(request.url);
    const targetPath = url.pathname.replace(/^\/webdav/, '');
    const targetUrl = `https://dav.jianguoyun.com${targetPath}${url.search}`;

    // 关键修复：正确处理请求体
    let requestBody = null;
    const method = request.method;

    // 对于 PROPFIND 和 PUT/POST 等方法，需要读取 body
    if (method !== 'GET' && method !== 'HEAD') {
      // 克隆请求以读取 body（避免消耗原始流）
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.text();

      console.log('Request body length:', requestBody?.length);
      console.log('Request body preview:', requestBody?.substring(0, 200));
    }

    // 构建转发请求的 headers
    const headers = new Headers();

    // 复制所有原始 headers，但修改关键的几个
    request.headers.forEach((value, key) => {
      // 跳过会导致问题的 headers
      if (
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'connection' &&
        key.toLowerCase() !== 'content-length' // 让 fetch 自动计算
      ) {
        headers.set(key, value);
      }
    });

    // 设置正确的目标服务器 headers
    headers.set('Host', 'dav.jianguoyun.com');
    headers.set('Origin', 'https://dav.jianguoyun.com');

    // PROPFIND 必须的 headers
    if (method === 'PROPFIND') {
      headers.set('Content-Type', 'application/xml; charset="utf-8"');
      // 确保 Depth header 被正确传递
      if (!headers.has('Depth')) {
        headers.set('Depth', '0');
      }
    }

    // 删除可能导致压缩问题的 header
    headers.delete('accept-encoding');

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method: method,
      headers: headers,
    };

    // 只有在有 body 时才添加
    if (requestBody && requestBody.length > 0) {
      fetchOptions.body = requestBody;
    }

    console.log('Sending to:', targetUrl);
    console.log('Method:', method);
    console.log('Headers:', Object.fromEntries(headers.entries()));

    // 发送请求，设置更长的超时时间
    const response = await fetch(targetUrl, fetchOptions);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // 读取响应体以便调试
    const responseText = await response.text();
    console.log('Response body length:', responseText.length);
    console.log('Response body preview:', responseText.substring(0, 500));

    // 返回响应
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', 'https://baby-3qp.pages.dev');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    // 如果是 520 或错误状态，返回更详细的信息
    if (response.status === 520 || !response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Upstream error',
          status: response.status,
          upstreamBody: responseText.substring(0, 500)
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://baby-3qp.pages.dev',
          },
        }
      );
    }

    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Proxy failed',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://baby-3qp.pages.dev',
        },
      }
    );
  }
}

// 处理 OPTIONS 预检
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://baby-3qp.pages.dev',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}