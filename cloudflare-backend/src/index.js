// worker.js — Cloudflare Worker API untuk Portal Pengumuman Etos ID
// Menggunakan Cloudflare D1 Database binding 'DB'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS, status: 204 })
    }

    // 2. GET /api/announcement (Publik)
    if (url.pathname === '/api/announcement' && request.method === 'GET') {
      try {
        const row = await env.DB.prepare(
          'SELECT * FROM announcements WHERE id = ? LIMIT 1'
        ).bind('main').first()

        if (!row) {
          return jsonResponse({
            success: true,
            data: {
              announcementDate: '2026-09-15T10:00:00+07:00',
              title: 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026',
              subtitle: 'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung',
              message: 'Terima kasih atas partisipasi seluruh peserta.',
              skDocumentUrl: '',
              skDocumentTitle: 'SK_Kelulusan_Etos_ID_2026.pdf',
              isPublished: false,
            },
          })
        }

        return jsonResponse({
          success: true,
          data: {
            announcementDate: row.announcement_date,
            title: row.title,
            subtitle: row.subtitle,
            message: row.message,
            skDocumentUrl: row.sk_document_url,
            skDocumentTitle: row.sk_document_title,
            isPublished: Boolean(row.is_published),
            updatedAt: row.updated_at,
          },
        })
      } catch (err) {
        return jsonResponse({ error: 'Gagal mengambil data dari database D1: ' + err.message }, 500)
      }
    }

    // 3. POST /api/admin/login
    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { username, password } = body

        if (username === 'Admin' && password === 'etospusat') {
          // Token session sederhana untuk admin
          const token = 'etos_auth_' + btoa(`Admin:${Date.now()}`)
          return jsonResponse({ success: true, token })
        }

        return jsonResponse({ error: 'Username atau password salah.' }, 401)
      } catch {
        return jsonResponse({ error: 'Payload tidak valid.' }, 400)
      }
    }

    // 4. POST /api/admin/announcement (Simpan pengaturan pengumuman)
    if (url.pathname === '/api/admin/announcement' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') || ''
      if (!authHeader.startsWith('Bearer etos_auth_') && !authHeader.includes('mock_admin_token')) {
        return jsonResponse({ error: 'Unauthorized: Akses ditolak.' }, 401)
      }

      try {
        const body = await request.json()
        const {
          announcementDate,
          title,
          subtitle,
          message,
          skDocumentUrl,
          skDocumentTitle,
          isPublished,
        } = body

        await env.DB.prepare(`
          INSERT INTO announcements (id, announcement_date, title, subtitle, message, sk_document_url, sk_document_title, is_published, updated_at)
          VALUES ('main', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            announcement_date = excluded.announcement_date,
            title = excluded.title,
            subtitle = excluded.subtitle,
            message = excluded.message,
            sk_document_url = excluded.sk_document_url,
            sk_document_title = excluded.sk_document_title,
            is_published = excluded.is_published,
            updated_at = datetime('now')
        `).bind(
          announcementDate || '2026-09-15T10:00:00+07:00',
          title || 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026',
          subtitle || '',
          message || '',
          skDocumentUrl || '',
          skDocumentTitle || 'SK_Kelulusan_Etos_ID_2026.pdf',
          isPublished ? 1 : 0
        ).run()

        return jsonResponse({ success: true, message: 'Konfigurasi berhasil disimpan ke Cloudflare D1.' })
      } catch (err) {
        return jsonResponse({ error: 'Gagal menyimpan ke D1: ' + err.message }, 500)
      }
    }

    // 404 Not Found
    return jsonResponse({ error: 'Endpoint tidak ditemukan.' }, 404)
  },
}
