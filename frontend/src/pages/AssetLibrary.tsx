import { useTranslation } from 'react-i18next'

export function AssetLibrary() {
    const { t } = useTranslation()

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 flex items-center justify-center">
            <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">library_books</span>
                <h2 className="text-xl font-bold text-white">{t('assetLibrary.title')}</h2>
                <p className="text-text-secondary mt-2">{t('assetLibrary.noAssetsDesc')}</p>
            </div>
        </div>
    )
}
