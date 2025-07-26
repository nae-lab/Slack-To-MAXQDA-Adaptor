import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExportForm } from '@/components/ExportForm'

function App() {
  const { t, i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('i18nextLng') || 'en'
  })

  // Ensure language is properly loaded on startup
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng')
    if (savedLanguage && savedLanguage !== i18n.language) {
      console.log('Loading saved language:', savedLanguage)
      i18n.changeLanguage(savedLanguage)
      setCurrentLanguage(savedLanguage)
    } else if (savedLanguage) {
      console.log('Language already set to:', savedLanguage)
      setCurrentLanguage(savedLanguage)
    }
  }, [i18n])

  // Listen to language changes from i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng)
    }
    
    i18n.on('languageChanged', handleLanguageChanged)
    return () => i18n.off('languageChanged', handleLanguageChanged)
  }, [i18n])

  const handleLanguageChange = (lang: string) => {
    console.log('Changing language to:', lang)
    localStorage.setItem('i18nextLng', lang)
    setCurrentLanguage(lang)
    i18n.changeLanguage(lang).then(() => {
      console.log('Language changed successfully to:', lang)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("app.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("app.description")}</p>
          </div>

          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
              <SelectItem value="fi">Suomi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ExportForm />
        {/* <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('export.single')}</TabsTrigger>
            <TabsTrigger value="multiple" disabled>{t('export.multiple')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-6">
          </TabsContent>
          
          <TabsContent value="multiple" className="mt-6">
            <div className="text-center text-muted-foreground py-12">
              Multiple channel export coming soon...
            </div>
          </TabsContent>
        </Tabs> */}
      </div>
    </div>
  );
}

export default App