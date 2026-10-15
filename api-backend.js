// Cloudflare Pages Function - API Backend
// این فایل باید در مسیر functions/api/ قرار بگیرد
// نام فایل: [[path]].js (با براکت)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // API Routes
    if (path === '/api/users' && request.method === 'GET') {
      return handleGetUsers(env, corsHeaders);
    }

    if (path === '/api/users' && request.method === 'POST') {
      return handleAddUser(request, env, corsHeaders);
    }

    if (path.match(/^\/api\/users\/.+$/) && request.method === 'DELETE') {
      const userId = path.split('/')[3];
      return handleDeleteUser(userId, env, corsHeaders);
    }

    if (path === '/api/messages' && request.method === 'GET') {
      return handleGetMessages(env, corsHeaders);
    }

    if (path === '/api/messages' && request.method === 'POST') {
      return handleAddMessage(request, env, corsHeaders);
    }

    if (path.match(/^\/api\/messages\/.+$/) && request.method === 'PUT') {
      const msgId = path.split('/')[3];
      return handleUpdateMessage(msgId, request, env, corsHeaders);
    }

    if (path.match(/^\/api\/messages\/.+$/) && request.method === 'DELETE') {
      const msgId = path.split('/')[3];
      return handleDeleteMessage(msgId, env, corsHeaders);
    }

    if (path === '/api/init' && request.method === 'POST') {
      return handleInit(env, corsHeaders);
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// ============ HANDLERS ============

async function handleGetUsers(env, headers) {
  const data = await env.KV.get('users', 'json');
  return new Response(JSON.stringify(data || []), { headers });
}

async function handleAddUser(request, env, headers) {
  const user = await request.json();
  const users = (await env.KV.get('users', 'json')) || [];

  if (users.length >= 20) {
    return new Response(JSON.stringify({ error: 'حداکثر 20 کاربر مجاز است' }), {
      status: 400,
      headers,
    });
  }

  users.push(user);
  await env.KV.put('users', JSON.stringify(users));

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleDeleteUser(userId, env, headers) {
  let users = (await env.KV.get('users', 'json')) || [];
  let messages = (await env.KV.get('messages', 'json')) || [];

  users = users.filter(u => u.id !== userId);
  messages = messages.filter(m => m.recipientId !== userId);

  await env.KV.put('users', JSON.stringify(users));
  await env.KV.put('messages', JSON.stringify(messages));

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleGetMessages(env, headers) {
  const data = await env.KV.get('messages', 'json');
  return new Response(JSON.stringify(data || []), { headers });
}

async function handleAddMessage(request, env, headers) {
  const message = await request.json();
  const messages = (await env.KV.get('messages', 'json')) || [];

  messages.push(message);
  await env.KV.put('messages', JSON.stringify(messages));

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleUpdateMessage(msgId, request, env, headers) {
  const updates = await request.json();
  const messages = (await env.KV.get('messages', 'json')) || [];

  const index = messages.findIndex(m => m.id === msgId);
  if (index === -1) {
    return new Response(JSON.stringify({ error: 'پیام یافت نشد' }), {
      status: 404,
      headers,
    });
  }

  messages[index] = { ...messages[index], ...updates };
  await env.KV.put('messages', JSON.stringify(messages));

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleDeleteMessage(msgId, env, headers) {
  let messages = (await env.KV.get('messages', 'json')) || [];
  messages = messages.filter(m => m.id !== msgId);
  await env.KV.put('messages', JSON.stringify(messages));

  return new Response(JSON.stringify({ success: true }), { headers });
}

async function handleInit(env, headers) {
  const defaultUsers = [
    { id: 'admin', name: 'ادمین سیستم', role: 'معاون اجرایی', password: 'admin123', isAdmin: true },
    { id: 'modir', name: 'مدیر مدرسه', role: 'مدیر', password: 'modir123', isAdmin: false },
    { id: 'moaven_amuzesh', name: 'معاون آموزش', role: 'معاون آموزش', password: 'amuzesh123', isAdmin: false },
    { id: 'moaven_parvareshi', name: 'معاون پرورشی', role: 'معاون پرورشی', password: 'parvareshi123', isAdmin: false },
    { id: 'moaven_exec', name: 'معاون اجرایی', role: 'معاون اجرایی', password: 'exec123', isAdmin: false },
    { id: 'moshaver', name: 'مشاور مدرسه', role: 'مشاور', password: 'moshaver123', isAdmin: false },
    { id: 'morabbi_behdasht', name: 'مربی بهداشت', role: 'مربی بهداشت', password: 'behdasht123', isAdmin: false },
    { id: 'daftardar', name: 'دفتردار', role: 'دفتردار', password: 'daftardar123', isAdmin: false },
  ];

  await env.KV.put('users', JSON.stringify(defaultUsers));
  await env.KV.put('messages', JSON.stringify([]));

  return new Response(JSON.stringify({ success: true }), { headers });
}
