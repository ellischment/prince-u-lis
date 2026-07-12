import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/ContentEditor'

export default async function ContentPage() {
  const texts = await db.contentText.findMany({ orderBy: { key: 'asc' } })

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-forum), serif',
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: '#1a2233',
          marginBottom: 8,
        }}
      >
        Контент
      </h1>
      <p style={{ color: '#5a6478', fontSize: '0.875rem', marginBottom: 24 }}>
        Тексты сайта, которые можно редактировать без разработчика.
      </p>

      {texts.length === 0 ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: '#5a6478',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e3ddcf',
          }}
        >
          Записей контента нет. Добавьте записи в таблицу ContentText через seed.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {texts.map((t) => (
            <ContentEditor key={t.key} contentKey={t.key} label={t.label} defaultValue={t.value} />
          ))}
        </div>
      )}
    </div>
  )
}
