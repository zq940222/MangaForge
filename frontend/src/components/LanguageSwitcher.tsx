import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'EN' },
  ]

  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  return (
    <div className="flex items-center gap-1 bg-surface-dark rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            currentLang === lang.code
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-white hover:bg-surface-dark'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
