import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import * as XLSX from 'xlsx'

function formatAnswer(q: any, answerVal: any): string {
  if (answerVal === undefined || answerVal === null || answerVal === '') return ''
  let options = q.options
  if (typeof options === 'string') {
    try { options = JSON.parse(options) } catch { options = [] }
  }
  if (q.type === 'text' || q.type === 'textarea' || q.type === 'scale') return String(answerVal)
  if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'dropdown' || q.type === 'ranking') {
    let opts = Array.isArray(options) ? options : (options?.options || [])
    const findText = (id: string) => opts.find((o: any) => o.id === id)?.text || id
    if (Array.isArray(answerVal)) return answerVal.map(findText).join('، ')
    if (typeof answerVal === 'object' && answerVal !== null) {
      const optText = findText(answerVal.option_id || '')
      return answerVal.count ? `${optText} (×${answerVal.count})` : optText
    }
    return findText(String(answerVal))
  }
  if (q.type === 'matrix') {
    let rows = options?.matrix_rows || []
    let cols = options?.matrix_columns || []
    if (rows.length === 0 && Array.isArray(options) && options[0]?.sub_options) {
      rows = options; cols = options[0].sub_options
    }
    let res: string[] = []
    if (typeof answerVal === 'object' && answerVal !== null) {
      Object.keys(answerVal).forEach(rowId => {
        const rowText = rows.find((r: any) => r.id === rowId)?.text || rowId
        let colVals = answerVal[rowId]
        if (!Array.isArray(colVals)) colVals = [colVals]
        const colTexts = colVals.map((colId: string) => cols.find((c: any) => c.id === colId)?.text || colId)
        res.push(`${rowText}: ${colTexts.join('، ')}`)
      })
    }
    return res.join(' | ')
  }
  return String(answerVal)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { formId } = await params

    const { data: questions } = await supabase
      .from('questions')
      .select('id, text, type, options')
      .eq('form_id', formId)
      .order('order_index')

    const { data: responses } = await supabase
      .from('form_responses')
      .select('id, user_id, score, max_score, submitted_at, answers, profiles!inner(name, email)')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    if (!responses || !questions || responses.length === 0) {
      return NextResponse.json({ error: 'لا توجد تسجيلات' }, { status: 404 })
    }

    const headers: Record<string, string> = {}
    headers['#'] = '#'
    headers['name'] = 'اسم المستخدم'
    headers['email'] = 'البريد الإلكتروني'
    headers['score'] = 'النتيجة'
    headers['percentage'] = 'النسبة'
    headers['date'] = 'تاريخ التقديم'
    questions.forEach((q: any, idx: number) => {
      headers['q_' + q.id] = 'س' + (idx + 1) + ': ' + q.text
    })

    const rows = responses.map((r: any, idx: number) => {
      const percentage = r.max_score > 0 ? Math.round((r.score / r.max_score) * 100) : 0
      const row: any = {}
      row[headers['#']] = idx + 1
      row[headers['name']] = r.profiles?.name || ''
      row[headers['email']] = r.profiles?.email || ''
      row[headers['score']] = r.score + ' / ' + r.max_score
      row[headers['percentage']] = percentage + '%'
      row[headers['date']] = new Date(r.submitted_at).toLocaleString('ar-EG')
      questions.forEach((q: any) => {
        row[headers['q_' + q.id]] = formatAnswer(q, r.answers?.[q.id])
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'الردود')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="results-${formId}.xlsx"`,
      },
    })
  } catch (e) {
    console.error('Export error:', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء التصدير' }, { status: 500 })
  }
}
